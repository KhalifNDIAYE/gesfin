import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProjectDocument {
  id: string;
  project_id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
  uploader?: { id: string; full_name: string; email: string } | null;
}

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/webp'
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export const useProjectDocuments = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['project-documents', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_documents')
        .select(`
          *,
          uploader:profiles!project_documents_uploaded_by_fkey(id, full_name, email)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProjectDocument[];
    },
    enabled: !!projectId,
  });
};

export const useUploadProjectDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, files }: { projectId: string; files: File[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const uploadedDocs = [];

      for (const file of files) {
        // Validate file
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          throw new Error(`Type de fichier non autorisé: ${file.name}`);
        }
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`Fichier trop volumineux: ${file.name} (max 20 Mo)`);
        }

        // Upload to storage
        const timestamp = Date.now();
        const filePath = `projects/${projectId}/documents/${timestamp}-${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('project-documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Determine file type for display
        let fileType = 'other';
        if (file.type.includes('pdf')) fileType = 'pdf';
        else if (file.type.includes('word') || file.type.includes('document')) fileType = 'word';
        else if (file.type.includes('excel') || file.type.includes('spreadsheet')) fileType = 'excel';
        else if (file.type.includes('image')) fileType = 'image';

        // Create record in database
        const { data, error } = await supabase
          .from('project_documents')
          .insert({
            project_id: projectId,
            name: file.name,
            file_path: filePath,
            file_type: fileType,
            file_size: file.size,
            mime_type: file.type,
            uploaded_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        uploadedDocs.push(data);
      }

      return uploadedDocs;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-documents', variables.projectId] });
      toast.success('Document(s) uploadé(s) avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
};

export const useDeleteProjectDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ document }: { document: ProjectDocument }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('project-documents')
        .remove([document.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error } = await supabase
        .from('project_documents')
        .delete()
        .eq('id', document.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-documents', variables.document.project_id] });
      toast.success('Document supprimé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
};

export const useDownloadProjectDocument = () => {
  return useMutation({
    mutationFn: async (doc: ProjectDocument) => {
      const { data, error } = await supabase.storage
        .from('project-documents')
        .download(doc.file_path);

      if (error) throw error;

      // Trigger download
      const url = URL.createObjectURL(data);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = doc.name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    onError: (error: Error) => {
      toast.error(`Erreur de téléchargement: ${error.message}`);
    },
  });
};

export const validateFiles = (files: FileList | File[]): { validFiles: File[]; errors: string[] } => {
  const validFiles: File[] = [];
  const errors: string[] = [];
  const fileArray = Array.from(files);

  for (const file of fileArray) {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      errors.push(`Type non autorisé: ${file.name}`);
      continue;
    }
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`Trop volumineux (max 20 Mo): ${file.name}`);
      continue;
    }
    validFiles.push(file);
  }

  return { validFiles, errors };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
