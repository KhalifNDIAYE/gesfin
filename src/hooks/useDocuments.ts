import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Types centralisés pour le moteur documentaire
export type DocumentEntityType = 'project' | 'convention' | 'contract' | 'budget' | 'expense' | 'asset';
export type DocumentCategory = 'contract' | 'budget' | 'annex' | 'report' | 'invoice' | 'correspondence' | 'other';

export interface Document {
  id: string;
  entity_type: DocumentEntityType;
  entity_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  category: DocumentCategory;
  description: string | null;
  checksum: string | null;
  is_active: boolean;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
  uploader?: {
    full_name: string | null;
    email: string;
  };
}

// Types de fichiers autorisés
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

// Mapper les chemins de stockage par type d'entité
const STORAGE_PATHS: Record<DocumentEntityType, string> = {
  project: 'projects',
  convention: 'conventions',
  contract: 'markets',
  budget: 'budgets',
  expense: 'expenses',
  asset: 'assets'
};

// Détecter le type de fichier
export const getFileType = (mimeType: string): string => {
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType.includes('word')) return 'Word';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Excel';
  return 'Document';
};

// Formater la taille du fichier
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Octets';
  const k = 1024;
  const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Valider les fichiers
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

// Hook pour récupérer les documents d'une entité
export function useDocuments(entityType: DocumentEntityType | undefined, entityId: string | undefined) {
  return useQuery({
    queryKey: ["documents", entityType, entityId],
    queryFn: async () => {
      if (!entityType || !entityId) return [];
      
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Récupérer les infos des uploaders
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
      })) as Document[];
    },
    enabled: !!entityType && !!entityId,
  });
}

// Hook pour uploader des documents
export function useUploadDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      entityType, 
      entityId, 
      files, 
      category = 'other' as DocumentCategory,
      description 
    }: { 
      entityType: DocumentEntityType; 
      entityId: string; 
      files: File[];
      category?: DocumentCategory;
      description?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const uploadedDocs: Document[] = [];
      const storagePath = STORAGE_PATHS[entityType];

      for (const file of files) {
        // Valider le fichier
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          throw new Error(`Type de fichier non autorisé: ${file.name}`);
        }
        
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`Fichier trop volumineux: ${file.name} (max 20 Mo)`);
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${storagePath}/${entityId}/${fileName}`;

        // Upload vers le storage
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Créer l'enregistrement dans la table documents
        const { data: docData, error: dbError } = await supabase
          .from('documents')
          .insert({
            entity_type: entityType,
            entity_id: entityId,
            file_name: file.name,
            file_type: getFileType(file.type),
            file_size: file.size,
            mime_type: file.type,
            storage_path: filePath,
            category: category,
            description: description || null,
            uploaded_by: user.id,
          })
          .select()
          .single();

        if (dbError) {
          // Rollback du fichier uploadé
          await supabase.storage.from('documents').remove([filePath]);
          throw dbError;
        }

        // Journaliser l'action
        try {
          await supabase.rpc('log_document_action_unified', {
            p_action: 'document_uploaded',
            p_document_id: docData.id,
            p_entity_type: entityType,
            p_entity_id: entityId,
            p_file_name: file.name,
            p_user_id: user.id,
          });
        } catch {
          // Ignorer les erreurs de journalisation
        }

        uploadedDocs.push(docData as Document);
      }

      return uploadedDocs;
    },
    onSuccess: (_, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ["documents", entityType, entityId] });
      toast.success("Document(s) ajouté(s) avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Hook pour supprimer un document
export function useDeleteDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      entityType, 
      entityId, 
      storagePath,
      fileName 
    }: { 
      id: string; 
      entityType: DocumentEntityType;
      entityId: string; 
      storagePath: string;
      fileName: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Supprimer du storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([storagePath]);

      if (storageError) throw storageError;

      // Soft delete dans la base (marquer comme inactif)
      const { error: dbError } = await supabase
        .from('documents')
        .update({ is_active: false })
        .eq('id', id);

      if (dbError) throw dbError;

      // Journaliser l'action
      if (user) {
        try {
          await supabase.rpc('log_document_action_unified', {
            p_action: 'document_deleted',
            p_document_id: id,
            p_entity_type: entityType,
            p_entity_id: entityId,
            p_file_name: fileName,
            p_user_id: user.id,
          });
        } catch {
          // Ignorer les erreurs de journalisation
        }
      }
    },
    onSuccess: (_, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ["documents", entityType, entityId] });
      toast.success("Document supprimé avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Hook pour télécharger un document
export function useDownloadDocument() {
  return useMutation({
    mutationFn: async ({ 
      storagePath, 
      fileName,
      entityType,
      entityId,
      documentId
    }: { 
      storagePath: string; 
      fileName: string;
      entityType: DocumentEntityType;
      entityId: string;
      documentId: string;
    }) => {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(storagePath);

      if (error) throw error;

      // Créer le lien de téléchargement
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Journaliser le téléchargement (optionnel)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.rpc('log_document_action_unified', {
            p_action: 'document_downloaded',
            p_document_id: documentId,
            p_entity_type: entityType,
            p_entity_id: entityId,
            p_file_name: fileName,
            p_user_id: user.id,
          });
        }
      } catch {
        // Ignorer les erreurs de journalisation
      }

      return true;
    },
    onError: (error: Error) => {
      toast.error(`Erreur de téléchargement: ${error.message}`);
    },
  });
}

// Labels pour les catégories
export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  contract: 'Contrat',
  budget: 'Budget',
  annex: 'Annexe',
  report: 'Rapport',
  invoice: 'Facture',
  correspondence: 'Correspondance',
  other: 'Autre'
};
