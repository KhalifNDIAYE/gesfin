import { useOrganizationSettings } from './useParametrage';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  PDFDocumentConfig, 
  PDFOrganizationInfo, 
  PDFTemplateContext,
  createPDFDocument,
  finalizePDF,
  savePDF,
  getPDFBlob,
  getPDFBase64
} from '@/utils/pdfTemplate';

export interface PDFGenerationOptions extends PDFDocumentConfig {
  onPreview?: (blob: Blob) => void;
  onDownload?: (filename: string) => void;
  onEmail?: (base64: string, subject: string) => void;
  auditModule?: string;
  auditResourceType?: string;
  auditResourceId?: string;
}

export function usePDFGeneration() {
  const { data: orgSettings } = useOrganizationSettings();

  const getOrganizationInfo = (): PDFOrganizationInfo | null => {
    if (!orgSettings) return null;
    return {
      name: orgSettings.name,
      acronym: orgSettings.acronym,
      address: orgSettings.address,
      city: orgSettings.city,
      phone: orgSettings.phone,
      email: orgSettings.email,
      website: orgSettings.website,
      tax_id: orgSettings.tax_id,
      logo_url: orgSettings.logo_url,
    };
  };

  const logAuditAction = async (
    action: string,
    resourceType?: string,
    resourceId?: string,
    module?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('audit_logs').insert({
        user_id: user.id,
        user_email: user.email,
        action,
        resource_type: resourceType || 'document',
        resource_id: resourceId,
        module: module as any,
        new_values: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  };

  const createDocument = async (
    config: PDFDocumentConfig,
    buildContent: (ctx: PDFTemplateContext) => void | Promise<void>
  ): Promise<PDFTemplateContext> => {
    const org = getOrganizationInfo();
    const ctx = await createPDFDocument(config, org);
    await buildContent(ctx);
    finalizePDF(ctx, config);
    return ctx;
  };

  const previewPDF = async (
    config: PDFGenerationOptions,
    buildContent: (ctx: PDFTemplateContext) => void | Promise<void>
  ): Promise<void> => {
    try {
      const ctx = await createDocument(config, buildContent);
      const blob = getPDFBlob(ctx);
      
      // Create preview URL and open in new tab
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Log audit action
      if (config.auditModule) {
        await logAuditAction(
          'pdf_preview',
          config.auditResourceType,
          config.auditResourceId,
          config.auditModule
        );
      }
      
      config.onPreview?.(blob);
      toast.success('Aperçu PDF généré');
    } catch (error) {
      console.error('Error previewing PDF:', error);
      toast.error('Erreur lors de la génération de l\'aperçu');
    }
  };

  const downloadPDF = async (
    config: PDFGenerationOptions,
    filename: string,
    buildContent: (ctx: PDFTemplateContext) => void | Promise<void>
  ): Promise<void> => {
    try {
      const ctx = await createDocument(config, buildContent);
      savePDF(ctx, filename);
      
      // Log audit action
      if (config.auditModule) {
        await logAuditAction(
          'pdf_download',
          config.auditResourceType,
          config.auditResourceId,
          config.auditModule
        );
      }
      
      config.onDownload?.(filename);
      toast.success('PDF téléchargé avec succès');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Erreur lors du téléchargement du PDF');
    }
  };

  const getPDFForEmail = async (
    config: PDFGenerationOptions,
    buildContent: (ctx: PDFTemplateContext) => void | Promise<void>
  ): Promise<{ blob: Blob; base64: string } | null> => {
    try {
      const ctx = await createDocument(config, buildContent);
      const blob = getPDFBlob(ctx);
      const base64 = getPDFBase64(ctx);
      
      // Log audit action
      if (config.auditModule) {
        await logAuditAction(
          'pdf_email_prepared',
          config.auditResourceType,
          config.auditResourceId,
          config.auditModule
        );
      }
      
      return { blob, base64 };
    } catch (error) {
      console.error('Error preparing PDF for email:', error);
      toast.error('Erreur lors de la préparation du PDF');
      return null;
    }
  };

  return {
    previewPDF,
    downloadPDF,
    getPDFForEmail,
    getOrganizationInfo,
  };
}

export default usePDFGeneration;
