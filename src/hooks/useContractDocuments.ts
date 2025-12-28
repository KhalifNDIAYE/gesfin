import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ContractDocument {
  id: string;
  contract_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  description: string | null;
  uploaded_by: string | null;
  created_at: string;
  uploader?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

// File validation constants
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 Mo

export function validateFiles(files: File[]): { valid: File[]; errors: string[] } {
  const valid: File[] = [];
  const errors: string[] = [];

  files.forEach(file => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_MIME_TYPES.includes(file.type)) {
      errors.push(`${file.name}: Type de fichier non autorisé`);
      return;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: Fichier trop volumineux (max 20 Mo)`);
      return;
    }
    
    valid.push(file);
  });

  return { valid, errors };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Fetch documents for a contract
export function useContractDocuments(contractId: string | undefined) {
  return useQuery({
    queryKey: ['contract-documents', contractId],
    queryFn: async () => {
      if (!contractId) return [];
      
      // Fetch documents
      const { data: documents, error } = await supabase
        .from('contract_documents')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (!documents) return [];
      
      // Fetch uploader info separately
      const uploaderIds = [...new Set(documents.map(d => d.uploaded_by).filter(Boolean))];
      let uploaders: Record<string, { full_name: string | null; email: string | null }> = {};
      
      if (uploaderIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', uploaderIds);
        
        if (profiles) {
          uploaders = profiles.reduce((acc, p) => {
            acc[p.id] = { full_name: p.full_name, email: p.email };
            return acc;
          }, {} as Record<string, { full_name: string | null; email: string | null }>);
        }
      }
      
      // Map documents with uploader info
      return documents.map(doc => ({
        ...doc,
        uploader: doc.uploaded_by ? uploaders[doc.uploaded_by] || null : null
      })) as ContractDocument[];
    },
    enabled: !!contractId
  });
}

// Upload documents
export function useUploadContractDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      contractId, 
      files, 
      description 
    }: { 
      contractId: string; 
      files: File[];
      description?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");
      
      const uploadedDocs: ContractDocument[] = [];
      
      for (const file of files) {
        // Generate unique file path
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `marches/${contractId}/documents/${timestamp}_${sanitizedName}`;
        
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('contract-documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Erreur lors de l'upload de ${file.name}: ${uploadError.message}`);
        }
        
        // Create database record
        const { data: docData, error: dbError } = await supabase
          .from('contract_documents')
          .insert({
            contract_id: contractId,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: file.type || 'application/octet-stream',
            description: description || null,
            uploaded_by: user.id
          })
          .select()
          .single();
        
        if (dbError) {
          // Rollback: delete uploaded file
          await supabase.storage
            .from('contract-documents')
            .remove([filePath]);
          throw dbError;
        }
        
        uploadedDocs.push(docData);
        
        // Log audit
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          user_email: user.email,
          action: 'document_upload',
          module: 'marches',
          resource_type: 'contract_document',
          resource_id: docData.id,
          new_values: {
            contract_id: contractId,
            file_name: file.name,
            file_size: file.size
          }
        });
      }
      
      return uploadedDocs;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contract-documents', variables.contractId] });
      toast.success('Document(s) téléversé(s) avec succès');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors du téléversement');
    }
  });
}

// Delete document
export function useDeleteContractDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      documentId, 
      filePath, 
      contractId 
    }: { 
      documentId: string; 
      filePath: string;
      contractId: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('contract-documents')
        .remove([filePath]);
      
      if (storageError) {
        console.error('Storage delete error:', storageError);
        // Continue anyway, file might not exist
      }
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('contract_documents')
        .delete()
        .eq('id', documentId);
      
      if (dbError) throw dbError;
      
      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        user_email: user.email,
        action: 'document_delete',
        module: 'marches',
        resource_type: 'contract_document',
        resource_id: documentId,
        old_values: {
          contract_id: contractId,
          file_path: filePath
        }
      });
      
      return documentId;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contract-documents', variables.contractId] });
      toast.success('Document supprimé');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  });
}

// Download document
export function useDownloadContractDocument() {
  return useMutation({
    mutationFn: async ({ 
      filePath, 
      fileName,
      documentId
    }: { 
      filePath: string; 
      fileName: string;
      documentId: string;
    }) => {
      const { data, error } = await supabase.storage
        .from('contract-documents')
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
      
      // Optional: Log download
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          user_email: user.email,
          action: 'document_download',
          module: 'marches',
          resource_type: 'contract_document',
          resource_id: documentId,
          new_values: { file_name: fileName }
        });
      }
      
      return true;
    },
    onError: (error: Error) => {
      toast.error('Erreur lors du téléchargement');
      console.error(error);
    }
  });
}

// Delete all documents for a contract (used when deleting contract)
export async function deleteAllContractDocuments(contractId: string): Promise<void> {
  // Get all documents
  const { data: documents, error: fetchError } = await supabase
    .from('contract_documents')
    .select('file_path')
    .eq('contract_id', contractId);
  
  if (fetchError) throw fetchError;
  
  if (documents && documents.length > 0) {
    // Delete from storage
    const filePaths = documents.map(d => d.file_path);
    await supabase.storage
      .from('contract-documents')
      .remove(filePaths);
  }
  
  // Delete from database (will cascade delete anyway)
  await supabase
    .from('contract_documents')
    .delete()
    .eq('contract_id', contractId);
}
