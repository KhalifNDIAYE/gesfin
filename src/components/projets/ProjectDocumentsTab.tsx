import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileText, 
  File, 
  FileSpreadsheet,
  Image as ImageIcon,
  Trash2, 
  Download,
  Loader2
} from "lucide-react";
import { 
  useProjectDocuments, 
  useUploadProjectDocument, 
  useDeleteProjectDocument,
  useDownloadProjectDocument,
  formatFileSize,
  validateFiles,
  ProjectDocument
} from "@/hooks/useProjectDocuments";
import { usePermissions } from "@/hooks/usePermissions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface ProjectDocumentsTabProps {
  projectId: string;
}

const fileTypeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-5 w-5 text-destructive" />,
  word: <File className="h-5 w-5 text-info" />,
  excel: <FileSpreadsheet className="h-5 w-5 text-success" />,
  image: <ImageIcon className="h-5 w-5 text-warning" />,
  other: <FileText className="h-5 w-5 text-muted-foreground" />,
};

const fileTypeLabels: Record<string, string> = {
  pdf: "PDF",
  word: "Word",
  excel: "Excel",
  image: "Image",
  other: "Autre",
};

export function ProjectDocumentsTab({ projectId }: ProjectDocumentsTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: documents = [], isLoading } = useProjectDocuments(projectId);
  const uploadDocument = useUploadProjectDocument();
  const deleteDocument = useDeleteProjectDocument();
  const downloadDocument = useDownloadProjectDocument();
  const { canAccess } = usePermissions();
  
  const [documentToDelete, setDocumentToDelete] = useState<ProjectDocument | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const canUpload = canAccess('projets', 'update') || canAccess('projets', 'create');
  const canDelete = canAccess('projets', 'delete');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const { validFiles, errors } = validateFiles(files);
    
    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
    }
    
    if (validFiles.length > 0) {
      setPendingFiles(prev => [...prev, ...validFiles]);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (pendingFiles.length === 0) return;
    
    await uploadDocument.mutateAsync({ projectId, files: pendingFiles });
    setPendingFiles([]);
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;
    await deleteDocument.mutateAsync({ document: documentToDelete });
    setDocumentToDelete(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents du projet
          </CardTitle>
          {canUpload && (
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Sélectionner
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pending files preview */}
          {pendingFiles.length > 0 && (
            <div className="p-4 rounded-lg border border-dashed border-primary/50 bg-primary/5">
              <p className="text-sm font-medium mb-3">Fichiers à uploader :</p>
              <div className="space-y-2">
                {pendingFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded bg-background">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{file.name}</span>
                      <Badge variant="outline" className="text-xs">{formatFileSize(file.size)}</Badge>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-destructive"
                      onClick={() => removePendingFile(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button 
                className="mt-3 w-full" 
                onClick={handleUpload}
                disabled={uploadDocument.isPending}
              >
                {uploadDocument.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Uploader {pendingFiles.length} fichier(s)
              </Button>
            </div>
          )}

          {/* Uploaded documents list */}
          {documents.length > 0 ? (
            <div className="divide-y">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      {fileTypeIcons[doc.file_type] || fileTypeIcons.other}
                    </div>
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {fileTypeLabels[doc.file_type] || doc.file_type}
                        </Badge>
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>•</span>
                        <span>{new Date(doc.created_at).toLocaleDateString('fr-FR')}</span>
                        {doc.uploader && (
                          <>
                            <span>•</span>
                            <span>{doc.uploader.full_name || doc.uploader.email}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => downloadDocument.mutate(doc)}
                      disabled={downloadDocument.isPending}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {canDelete && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDocumentToDelete(doc)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : pendingFiles.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">Aucun document attaché</p>
              {canUpload && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Uploader des documents
                </Button>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!documentToDelete} onOpenChange={() => setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le document ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le fichier "{documentToDelete?.name}" sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
