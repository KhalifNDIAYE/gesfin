import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export type SignatureStatus = 'pending' | 'signed' | 'rejected' | 'cancelled';

export interface DocumentSignature {
  id: string;
  document_type: string;
  document_id: string;
  document_ref: string | null;
  document_hash: string;
  user_id: string | null;
  signer_name: string;
  signer_role: string;
  signer_email: string | null;
  signature_status: SignatureStatus;
  signed_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  signature_image_url: string | null;
  legal_consent: boolean;
  consent_text: string | null;
  signature_order: number;
  is_required: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface SignatureWorkflow {
  id: string;
  document_type: string;
  name: string;
  description: string | null;
  required_roles: string[];
  signature_order_type: 'sequential' | 'parallel';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSignatureRequest {
  document_type: string;
  document_id: string;
  document_ref?: string;
  document_hash: string;
  user_id: string;
  signer_name: string;
  signer_role: string;
  signer_email?: string;
  signature_order?: number;
  is_required?: boolean;
}

export interface SignDocumentParams {
  signatureId: string;
  legalConsent: boolean;
  consentText?: string;
  signatureImageUrl?: string;
}

// Generate SHA-256 hash of content
export async function generateDocumentHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Get client IP address (basic - for full IP tracking, use edge function)
async function getClientInfo(): Promise<{ ip: string | null; userAgent: string }> {
  const userAgent = navigator.userAgent;
  // For real IP, you'd need a server-side solution
  return { ip: null, userAgent };
}

export function useDocumentSignatures(documentType: string, documentId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch signatures for a document
  const signaturesQuery = useQuery({
    queryKey: ['document-signatures', documentType, documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_signatures')
        .select('*')
        .eq('document_type', documentType)
        .eq('document_id', documentId)
        .order('signature_order', { ascending: true });

      if (error) throw error;
      return data as DocumentSignature[];
    },
    enabled: !!documentType && !!documentId,
  });

  // Get current user's pending signature
  const pendingSignatureQuery = useQuery({
    queryKey: ['pending-signature', documentType, documentId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('document_signatures')
        .select('*')
        .eq('document_type', documentType)
        .eq('document_id', documentId)
        .eq('user_id', user.id)
        .eq('signature_status', 'pending')
        .maybeSingle();

      if (error) throw error;
      return data as DocumentSignature | null;
    },
    enabled: !!documentType && !!documentId && !!user?.id,
  });

  // Create signature request
  const createSignatureMutation = useMutation({
    mutationFn: async (request: CreateSignatureRequest) => {
      const { data, error } = await supabase
        .from('document_signatures')
        .insert({
          ...request,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-signatures', documentType, documentId] });
      toast.success('Demande de signature créée');
    },
    onError: (error) => {
      console.error('Error creating signature request:', error);
      toast.error('Erreur lors de la création de la demande de signature');
    },
  });

  // Sign document
  const signDocumentMutation = useMutation({
    mutationFn: async ({ signatureId, legalConsent, consentText, signatureImageUrl }: SignDocumentParams) => {
      const clientInfo = await getClientInfo();
      
      const { data, error } = await supabase
        .from('document_signatures')
        .update({
          signature_status: 'signed' as SignatureStatus,
          signed_at: new Date().toISOString(),
          legal_consent: legalConsent,
          consent_text: consentText || 'Je confirme avoir lu et approuvé ce document.',
          signature_image_url: signatureImageUrl,
          ip_address: clientInfo.ip,
          user_agent: clientInfo.userAgent,
        })
        .eq('id', signatureId)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      // Log to audit
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        user_email: user?.email,
        action: 'document_signed',
        resource_type: 'document_signature',
        resource_id: signatureId,
        new_values: { 
          document_type: documentType,
          document_id: documentId,
          signed_at: new Date().toISOString(),
        },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-signatures', documentType, documentId] });
      queryClient.invalidateQueries({ queryKey: ['pending-signature', documentType, documentId] });
      toast.success('Document signé avec succès');
    },
    onError: (error) => {
      console.error('Error signing document:', error);
      toast.error('Erreur lors de la signature du document');
    },
  });

  // Reject signature
  const rejectSignatureMutation = useMutation({
    mutationFn: async ({ signatureId, reason }: { signatureId: string; reason: string }) => {
      const clientInfo = await getClientInfo();
      
      const { data, error } = await supabase
        .from('document_signatures')
        .update({
          signature_status: 'rejected' as SignatureStatus,
          rejected_at: new Date().toISOString(),
          rejection_reason: reason,
          ip_address: clientInfo.ip,
          user_agent: clientInfo.userAgent,
        })
        .eq('id', signatureId)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      // Log to audit
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        user_email: user?.email,
        action: 'document_signature_rejected',
        resource_type: 'document_signature',
        resource_id: signatureId,
        new_values: { 
          document_type: documentType,
          document_id: documentId,
          rejected_at: new Date().toISOString(),
          reason,
        },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-signatures', documentType, documentId] });
      queryClient.invalidateQueries({ queryKey: ['pending-signature', documentType, documentId] });
      toast.success('Signature refusée');
    },
    onError: (error) => {
      console.error('Error rejecting signature:', error);
      toast.error('Erreur lors du refus de signature');
    },
  });

  // Cancel signature (admin only)
  const cancelSignatureMutation = useMutation({
    mutationFn: async (signatureId: string) => {
      const { data, error } = await supabase
        .from('document_signatures')
        .update({
          signature_status: 'cancelled' as SignatureStatus,
        })
        .eq('id', signatureId)
        .select()
        .single();

      if (error) throw error;

      // Log to audit
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        user_email: user?.email,
        action: 'document_signature_cancelled',
        resource_type: 'document_signature',
        resource_id: signatureId,
        new_values: { 
          document_type: documentType,
          document_id: documentId,
          cancelled_at: new Date().toISOString(),
        },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-signatures', documentType, documentId] });
      toast.success('Signature annulée');
    },
    onError: (error) => {
      console.error('Error cancelling signature:', error);
      toast.error('Erreur lors de l\'annulation de la signature');
    },
  });

  // Get signature status summary
  const getSignatureStatus = () => {
    const signatures = signaturesQuery.data || [];
    if (signatures.length === 0) return 'unsigned';
    
    const signed = signatures.filter(s => s.signature_status === 'signed').length;
    const rejected = signatures.filter(s => s.signature_status === 'rejected').length;
    const pending = signatures.filter(s => s.signature_status === 'pending').length;
    const required = signatures.filter(s => s.is_required).length;
    const requiredSigned = signatures.filter(s => s.is_required && s.signature_status === 'signed').length;
    
    if (rejected > 0) return 'rejected';
    if (requiredSigned === required && required > 0) return 'fully_signed';
    if (signed > 0) return 'partially_signed';
    if (pending > 0) return 'pending';
    return 'unsigned';
  };

  return {
    signatures: signaturesQuery.data || [],
    isLoading: signaturesQuery.isLoading,
    pendingSignature: pendingSignatureQuery.data,
    hasPendingSignature: !!pendingSignatureQuery.data,
    signatureStatus: getSignatureStatus(),
    createSignature: createSignatureMutation.mutateAsync,
    signDocument: signDocumentMutation.mutateAsync,
    rejectSignature: rejectSignatureMutation.mutateAsync,
    cancelSignature: cancelSignatureMutation.mutateAsync,
    isCreating: createSignatureMutation.isPending,
    isSigning: signDocumentMutation.isPending,
    isRejecting: rejectSignatureMutation.isPending,
    refetch: signaturesQuery.refetch,
  };
}

// Hook to fetch workflows
export function useSignatureWorkflows(documentType?: string) {
  return useQuery({
    queryKey: ['signature-workflows', documentType],
    queryFn: async () => {
      let query = supabase
        .from('signature_workflows')
        .select('*')
        .eq('is_active', true);

      if (documentType) {
        query = query.eq('document_type', documentType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SignatureWorkflow[];
    },
  });
}

// Hook to initiate workflow
export function useInitiateSignatureWorkflow() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      documentType,
      documentId,
      documentRef,
      documentHash,
      signers,
    }: {
      documentType: string;
      documentId: string;
      documentRef?: string;
      documentHash: string;
      signers: Array<{
        userId: string;
        name: string;
        role: string;
        email?: string;
        order: number;
        isRequired?: boolean;
      }>;
    }) => {
      const signatureRequests = signers.map((signer) => ({
        document_type: documentType,
        document_id: documentId,
        document_ref: documentRef,
        document_hash: documentHash,
        user_id: signer.userId,
        signer_name: signer.name,
        signer_role: signer.role,
        signer_email: signer.email,
        signature_order: signer.order,
        is_required: signer.isRequired ?? true,
        created_by: user?.id,
      }));

      const { data, error } = await supabase
        .from('document_signatures')
        .insert(signatureRequests)
        .select();

      if (error) throw error;

      // Log to audit
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        user_email: user?.email,
        action: 'signature_workflow_initiated',
        resource_type: documentType,
        resource_id: documentId,
        new_values: { 
          document_ref: documentRef,
          signers_count: signers.length,
        },
      });

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['document-signatures', variables.documentType, variables.documentId] 
      });
      toast.success('Workflow de signature initié');
    },
    onError: (error) => {
      console.error('Error initiating signature workflow:', error);
      toast.error('Erreur lors de l\'initiation du workflow de signature');
    },
  });
}
