import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  Download, 
  Mail, 
  Loader2,
  FileText
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { PDFTemplateContext } from "@/utils/pdfTemplate";
import { PDFGenerationOptions } from "@/hooks/usePDFGeneration";

interface PDFActionsProps {
  title: string;
  filename: string;
  config: Omit<PDFGenerationOptions, 'title'>;
  buildContent: (ctx: PDFTemplateContext) => void | Promise<void>;
  onPreview?: () => Promise<void>;
  onDownload?: () => Promise<void>;
  onEmail?: (recipients: string[], subject: string, message: string) => Promise<void>;
  disabled?: boolean;
  requiredPermission?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  showDropdown?: boolean;
}

export function PDFActions({
  title,
  filename,
  config,
  buildContent,
  onPreview,
  onDownload,
  onEmail,
  disabled = false,
  requiredPermission,
  variant = "outline",
  size = "sm",
  showDropdown = true,
}: PDFActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState("");
  const [emailSubject, setEmailSubject] = useState(`${title} - ${filename}`);
  const [emailMessage, setEmailMessage] = useState(
    `Veuillez trouver ci-joint le document "${title}".`
  );
  
  const { canAccess, isAdmin } = usePermissions();
  
  const canPerformAction = requiredPermission 
    ? (isAdmin || canAccess(requiredPermission as any))
    : true;

  const handlePreview = async () => {
    if (!canPerformAction || disabled) return;
    
    setIsLoading(true);
    try {
      await onPreview?.();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!canPerformAction || disabled) return;
    
    setIsLoading(true);
    try {
      await onDownload?.();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!canPerformAction || disabled) return;
    
    const recipients = emailRecipients
      .split(/[,;]/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0);
    
    if (recipients.length === 0) {
      toast.error("Veuillez entrer au moins un destinataire");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter((e) => !emailRegex.test(e));
    if (invalidEmails.length > 0) {
      toast.error(`Adresses email invalides: ${invalidEmails.join(", ")}`);
      return;
    }
    
    setIsLoading(true);
    try {
      await onEmail?.(recipients, emailSubject, emailMessage);
      setEmailDialogOpen(false);
      toast.success("Email envoyé avec succès");
    } catch (error) {
      toast.error("Erreur lors de l'envoi de l'email");
    } finally {
      setIsLoading(false);
    }
  };

  if (!canPerformAction) {
    return null;
  }

  if (!showDropdown) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant={variant}
          size={size}
          onClick={handlePreview}
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          <span className="ml-2 hidden sm:inline">Aperçu</span>
        </Button>
        <Button
          variant={variant}
          size={size}
          onClick={handleDownload}
          disabled={disabled || isLoading}
        >
          <Download className="h-4 w-4" />
          <span className="ml-2 hidden sm:inline">PDF</span>
        </Button>
        {onEmail && (
          <Button
            variant={variant}
            size={size}
            onClick={() => setEmailDialogOpen(true)}
            disabled={disabled || isLoading}
          >
            <Mail className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Email</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} disabled={disabled || isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            Document
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handlePreview} disabled={isLoading}>
            <Eye className="mr-2 h-4 w-4 text-primary" />
            Aperçu
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownload} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4 text-success" />
            Télécharger PDF
          </DropdownMenuItem>
          {onEmail && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setEmailDialogOpen(true)}
                disabled={isLoading}
              >
                <Mail className="mr-2 h-4 w-4 text-info" />
                Envoyer par email
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Envoyer par email</DialogTitle>
            <DialogDescription>
              Le document PDF sera joint à l'email automatiquement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recipients">Destinataires</Label>
              <Input
                id="recipients"
                placeholder="email1@example.com, email2@example.com"
                value={emailRecipients}
                onChange={(e) => setEmailRecipients(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Séparez les adresses par une virgule ou un point-virgule
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Objet</Label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                rows={4}
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEmailDialogOpen(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button onClick={handleSendEmail} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default PDFActions;
