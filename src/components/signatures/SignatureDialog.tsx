import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { DocumentSignature } from '@/hooks/useDocumentSignatures';

interface SignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signature: DocumentSignature | null;
  documentTitle?: string;
  onSign: (params: { signatureId: string; legalConsent: boolean; consentText?: string }) => Promise<void>;
  onReject: (params: { signatureId: string; reason: string }) => Promise<void>;
  isSigning?: boolean;
  isRejecting?: boolean;
}

const LEGAL_CONSENT_TEXT = `En signant ce document, je certifie avoir pris connaissance de son contenu et j'accepte les termes et conditions qui y sont mentionnés. Cette signature électronique a la même valeur juridique qu'une signature manuscrite conformément à la réglementation en vigueur.`;

export function SignatureDialog({
  open,
  onOpenChange,
  signature,
  documentTitle,
  onSign,
  onReject,
  isSigning,
  isRejecting,
}: SignatureDialogProps) {
  const [activeTab, setActiveTab] = useState<'sign' | 'reject'>('sign');
  const [legalConsent, setLegalConsent] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleSign = async () => {
    if (!signature || !legalConsent) return;
    
    await onSign({
      signatureId: signature.id,
      legalConsent: true,
      consentText: LEGAL_CONSENT_TEXT,
    });
    
    setLegalConsent(false);
    onOpenChange(false);
  };

  const handleReject = async () => {
    if (!signature || !rejectionReason.trim()) return;
    
    await onReject({
      signatureId: signature.id,
      reason: rejectionReason.trim(),
    });
    
    setRejectionReason('');
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setLegalConsent(false);
      setRejectionReason('');
      setActiveTab('sign');
    }
    onOpenChange(newOpen);
  };

  if (!signature) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Signature électronique
          </DialogTitle>
          <DialogDescription>
            {documentTitle && (
              <span className="block font-medium text-foreground mt-1">
                {documentTitle}
              </span>
            )}
            {signature.document_ref && (
              <span className="block text-xs text-muted-foreground mt-1">
                Réf: {signature.document_ref}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'sign' | 'reject')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sign" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Signer
            </TabsTrigger>
            <TabsTrigger value="reject" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Refuser
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sign" className="space-y-4 mt-4">
            <div className="rounded-lg border p-4 bg-muted/30">
              <h4 className="font-medium text-sm mb-2">Récapitulatif</h4>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Signataire :</dt>
                  <dd className="font-medium">{signature.signer_name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Rôle :</dt>
                  <dd>{signature.signer_role}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Date :</dt>
                  <dd>{format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}</dd>
                </div>
              </dl>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {LEGAL_CONSENT_TEXT}
              </AlertDescription>
            </Alert>

            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <Checkbox
                id="legal-consent"
                checked={legalConsent}
                onCheckedChange={(checked) => setLegalConsent(checked === true)}
              />
              <Label htmlFor="legal-consent" className="text-sm cursor-pointer leading-relaxed">
                J'ai lu et j'accepte les termes mentionnés ci-dessus. Je confirme mon intention de signer ce document électroniquement.
              </Label>
            </div>
          </TabsContent>

          <TabsContent value="reject" className="space-y-4 mt-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Le refus de signature sera notifié aux parties concernées et sera enregistré dans l'historique du document.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Motif du refus *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Veuillez indiquer le motif de votre refus..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Annuler
          </Button>
          
          {activeTab === 'sign' ? (
            <Button 
              onClick={handleSign} 
              disabled={!legalConsent || isSigning}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signature en cours...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Signer le document
                </>
              )}
            </Button>
          ) : (
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason.trim() || isRejecting}
            >
              {isRejecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Refus en cours...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Refuser la signature
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SignatureDialog;
