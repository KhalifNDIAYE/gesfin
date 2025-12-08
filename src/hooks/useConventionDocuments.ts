import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ConventionDocument {
  id: string;
  convention_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
  uploader?: {
    full_name: string | null;
    email: string;
  };
}

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const getFileType = (mimeType: string): string => {
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType === 'application/msword' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'Word';
  if (mimeType === 'application/vnd.ms-excel' || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'Excel';
  return 'Document';
};

export function useConventionDocuments(conventionId: string | undefined) {
  return useQuery({
    queryKey: ["convention-documents", conventionId],
    queryFn: async () => {
      if (!conventionId) return [];
      
      const { data, error } = await supabase
        .from("convention_documents")
        .select(`*`)
        .eq("convention_id", conventionId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Fetch uploader info separately
      const uploaderIds = [...new Set(data.map(d => d.uploaded_by).filter(Boolean))];
      let uploaders: Record<string, { full_name: string | null; email: string }> = {};
      
      if (uploaderIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", uploaderIds);
        
        if (profiles) {
          uploaders = profiles.reduce((acc, p) => {
            acc[p.id] = { full_name: p.full_name, email: p.email };
            return acc;
          }, {} as Record<string, { full_name: string | null; email: string }>);
        }
      }
      
      return data.map(doc => ({
        ...doc,
        uploader: doc.uploaded_by ? uploaders[doc.uploaded_by] : undefined,
      })) as ConventionDocument[];
    },
    enabled: !!conventionId,
  });
}

export function useUploadConventionDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ conventionId, files }: { conventionId: string; files: File[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const uploadedDocs: ConventionDocument[] = [];

      for (const file of files) {
        // Validate file
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          throw new Error(`Type de fichier non autorisé: ${file.name}. Seuls PDF, Word et Excel sont acceptés.`);
        }
        
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`Fichier trop volumineux: ${file.name}. Maximum 20 Mo.`);
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${conventionId}/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('convention-documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Create metadata record
        const { data: docData, error: dbError } = await supabase
          .from('convention_documents')
          .insert({
            convention_id: conventionId,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: getFileType(file.type),
            mime_type: file.type,
            uploaded_by: user.id,
          })
          .select()
          .single();

        if (dbError) {
          // Rollback storage upload
          await supabase.storage.from('convention-documents').remove([filePath]);
          throw dbError;
        }

        uploadedDocs.push(docData as ConventionDocument);
      }

      return uploadedDocs;
    },
    onSuccess: (_, { conventionId }) => {
      queryClient.invalidateQueries({ queryKey: ["convention-documents", conventionId] });
      toast.success("Document(s) ajouté(s) avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeleteConventionDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, conventionId, filePath }: { id: string; conventionId: string; filePath: string }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('convention-documents')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete metadata record (trigger will log the action)
      const { error: dbError } = await supabase
        .from('convention_documents')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;
    },
    onSuccess: (_, { conventionId }) => {
      queryClient.invalidateQueries({ queryKey: ["convention-documents", conventionId] });
      toast.success("Document supprimé avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDownloadConventionDocument() {
  return useMutation({
    mutationFn: async ({ filePath, fileName }: { filePath: string; fileName: string }) => {
      const { data, error } = await supabase.storage
        .from('convention-documents')
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Log download (optional - ignore errors)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.rpc('log_document_action', {
            _action: 'document_downloaded',
            _document_id: null,
            _convention_id: filePath.split('/')[0],
            _file_name: fileName,
            _user_id: user.id,
          });
        }
      } catch {
        // Ignore logging errors
      }

      return true;
    },
    onError: (error: Error) => {
      toast.error(`Erreur de téléchargement: ${error.message}`);
    },
  });
}

export function validateFiles(files: FileList | File[]): { valid: File[]; errors: string[] } {
  const valid: File[] = [];
  const errors: string[] = [];
  
  Array.from(files).forEach(file => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      errors.push(`${file.name}: Type non autorisé. Seuls PDF, Word et Excel sont acceptés.`);
    } else if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: Fichier trop volumineux (max 20 Mo).`);
    } else {
      valid.push(file);
    }
  });
  
  return { valid, errors };
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Octets';
  const k = 1024;
  const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
