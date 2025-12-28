import { useState } from "react";
import { Plus, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ContractDocumentsList } from "./ContractDocumentsList";
import { ContractDocumentsUpload } from "./ContractDocumentsUpload";
import { useUploadContractDocument } from "@/hooks/useContractDocuments";

interface ContractDocumentsSectionProps {
  contractId: string;
  canAdd?: boolean;
  canDelete?: boolean;
  canDownload?: boolean;
  isReadOnly?: boolean;
}

export function ContractDocumentsSection({
  contractId,
  canAdd = true,
  canDelete = true,
  canDownload = true,
  isReadOnly = false
}: ContractDocumentsSectionProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  
  const uploadDocument = useUploadContractDocument();

  const handleUpload = async () => {
    if (pendingFiles.length === 0) return;
    
    await uploadDocument.mutateAsync({
      contractId,
      files: pendingFiles,
      description: description || undefined
    });
    
    // Reset form
    setPendingFiles([]);
    setDescription("");
    setIsUploadDialogOpen(false);
  };

  const handleClose = () => {
    setPendingFiles([]);
    setDescription("");
    setIsUploadDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Documents du marché</CardTitle>
        {canAdd && !isReadOnly && (
          <Button 
            size="sm" 
            onClick={() => setIsUploadDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un document
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <ContractDocumentsList 
          contractId={contractId} 
          canDelete={canDelete && !isReadOnly}
          canDownload={canDownload}
        />
      </CardContent>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajouter des documents</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <ContractDocumentsUpload 
              files={pendingFiles}
              onChange={setPendingFiles}
            />
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnelle)</Label>
              <Textarea
                id="description"
                placeholder="Description des documents..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={pendingFiles.length === 0 || uploadDocument.isPending}
            >
              {uploadDocument.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Téléversement...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Téléverser ({pendingFiles.length} fichier{pendingFiles.length > 1 ? 's' : ''})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
