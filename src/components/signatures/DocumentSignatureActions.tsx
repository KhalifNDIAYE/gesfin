import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  PenLine, 
  Users, 
  ChevronDown, 
  Send,
  Eye,
  Loader2,
} from 'lucide-react';
import { SignatureStatusBadge } from './SignatureStatusBadge';
import { SignaturesList } from './SignaturesList';
import { SignatureDialog } from './SignatureDialog';
import { useDocumentSignatures } from '@/hooks/useDocumentSignatures';
import { usePermissions } from '@/hooks/usePermissions';
import type { ModuleName } from '@/types/database';

interface DocumentSignatureActionsProps {
  documentType: string;
  documentId: string;
  documentTitle?: string;
  module?: ModuleName;
  onInitiateWorkflow?: () => void;
  showStatusBadge?: boolean;
  variant?: 'default' | 'compact';
}

export function DocumentSignatureActions({
  documentType,
  documentId,
  documentTitle,
  module = 'conventions',
  onInitiateWorkflow,
  showStatusBadge = true,
  variant = 'default',
}: DocumentSignatureActionsProps) {
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [signaturesSheetOpen, setSignaturesSheetOpen] = useState(false);

  const { canAccess, isAdmin } = usePermissions();
  const {
    signatures,
    isLoading,
    pendingSignature,
    hasPendingSignature,
    signatureStatus,
    signDocument,
    rejectSignature,
    isSigning,
    isRejecting,
  } = useDocumentSignatures(documentType, documentId);

  const canSign = canAccess(module, 'validate') || isAdmin;
  const canViewSignatures = canAccess(module, 'read') || isAdmin;
  const canInitiateWorkflow = canAccess(module, 'validate') || isAdmin;

  const handleSign = async (params: { signatureId: string; legalConsent: boolean; consentText?: string }) => {
    await signDocument(params);
  };

  const handleReject = async (params: { signatureId: string; reason: string }) => {
    await rejectSignature(params);
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        {showStatusBadge && signatureStatus !== 'unsigned' && (
          <SignatureStatusBadge status={signatureStatus as any} />
        )}

        {hasPendingSignature && canSign && (
          <Button
            size="sm"
            onClick={() => setSignatureDialogOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <PenLine className="h-4 w-4 mr-1" />
            Signer
          </Button>
        )}

        {signatures.length > 0 && canViewSignatures && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSignaturesSheetOpen(true)}
          >
            <Eye className="h-4 w-4 mr-1" />
            {signatures.length}
          </Button>
        )}

        <SignatureDialog
          open={signatureDialogOpen}
          onOpenChange={setSignatureDialogOpen}
          signature={pendingSignature}
          documentTitle={documentTitle}
          onSign={handleSign}
          onReject={handleReject}
          isSigning={isSigning}
          isRejecting={isRejecting}
        />

        <Sheet open={signaturesSheetOpen} onOpenChange={setSignaturesSheetOpen}>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Signatures du document</SheetTitle>
              <SheetDescription>{documentTitle}</SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <SignaturesList signatures={signatures} isLoading={isLoading} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {showStatusBadge && (
        <SignatureStatusBadge status={signatureStatus as any} />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <PenLine className="h-4 w-4 mr-2" />
            Signatures
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {hasPendingSignature && canSign && (
            <>
              <DropdownMenuItem onClick={() => setSignatureDialogOpen(true)}>
                <PenLine className="h-4 w-4 mr-2 text-green-600" />
                Signer le document
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {canViewSignatures && (
            <DropdownMenuItem onClick={() => setSignaturesSheetOpen(true)}>
              <Users className="h-4 w-4 mr-2" />
              Voir les signatures ({signatures.length})
            </DropdownMenuItem>
          )}

          {canInitiateWorkflow && signatures.length === 0 && onInitiateWorkflow && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onInitiateWorkflow}>
                <Send className="h-4 w-4 mr-2" />
                Envoyer pour signature
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <SignatureDialog
        open={signatureDialogOpen}
        onOpenChange={setSignatureDialogOpen}
        signature={pendingSignature}
        documentTitle={documentTitle}
        onSign={handleSign}
        onReject={handleReject}
        isSigning={isSigning}
        isRejecting={isRejecting}
      />

      <Sheet open={signaturesSheetOpen} onOpenChange={setSignaturesSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Signatures du document</SheetTitle>
            <SheetDescription>{documentTitle}</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <SignaturesList signatures={signatures} isLoading={isLoading} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default DocumentSignatureActions;
