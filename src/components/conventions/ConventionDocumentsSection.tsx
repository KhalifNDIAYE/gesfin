import { useState, useRef } from "react";
import { FileText, Download, Trash2, Upload, FileSpreadsheet, File, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PermissionGate, useModulePermissions } from "@/components/auth/PermissionButton";
import { 
  useConventionDocuments, 
  useUploadConventionDocument, 
  useDeleteConventionDocument, 
  useDownloadConventionDocument,
  validateFiles,
  formatFileSize,
  ConventionDocument 
} from "@/hooks/useConventionDocuments";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface ConventionDocumentsSectionProps {
  conventionId: string;
}

const FileTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'PDF':
      return <FileText className="h-5 w-5 text-red-500" />;
    case 'Word':
      return <File className="h-5 w-5 text-blue-500" />;
    case 'Excel':
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    default:
      return <File className="h-5 w-5 text-muted-foreground" />;
  }
};

const FileTypeBadge = ({ type }: { type: string }) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    PDF: "destructive",
    Word: "default",
    Excel: "secondary",
  };
  
  return (
    <Badge variant={variants[type] || "outline"} className="text-xs">
      {type}
    </Badge>
  );
};

export function ConventionDocumentsSection({ conventionId }: ConventionDocumentsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteDoc, setDeleteDoc] = useState<ConventionDocument | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  
  const { data: documents = [], isLoading } = useConventionDocuments(conventionId);
  const uploadMutation = useUploadConventionDocument();
  const deleteMutation = useDeleteConventionDocument();
  const downloadMutation = useDownloadConventionDocument();
  const { canRead, canUpdate, canDelete } = useModulePermissions('conventions');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const { valid, errors } = validateFiles(files);
    
    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
    }
    
    if (valid.length > 0) {
      setPendingFiles(prev => [...prev, ...valid]);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (pendingFiles.length === 0) return;
    
    await uploadMutation.mutateAsync({ conventionId, files: pendingFiles });
    setPendingFiles([]);
  };

  const handleDownload = (doc: ConventionDocument) => {
    downloadMutation.mutate({ filePath: doc.file_path, fileName: doc.file_name });
  };

  const handleDelete = async () => {
    if (!deleteDoc) return;
    await deleteMutation.mutateAsync({
      id: deleteDoc.id,
      conventionId: deleteDoc.convention_id,
      filePath: deleteDoc.file_path,
    });
    setDeleteDoc(null);
  };

  // If user doesn't have read permission, don't show the section
  if (!canRead) return null;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents de la convention ({documents.length})
          </CardTitle>
          <PermissionGate module="conventions" permission="update">
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un document
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </PermissionGate>
        </CardHeader>
        <CardContent>
          {/* Pending files to upload */}
          {pendingFiles.length > 0 && (
            <div className="mb-4 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">
                  Fichiers en attente ({pendingFiles.length})
                </span>
                <Button
                  size="sm"
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadMutation.isPending ? "Envoi..." : "Téléverser"}
                </Button>
              </div>
              <div className="space-y-2">
                {pendingFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                    <div className="flex items-center gap-2">
                      <FileTypeIcon type={file.name.split('.').pop()?.toUpperCase() === 'PDF' ? 'PDF' : 
                        file.name.split('.').pop()?.toLowerCase()?.includes('xls') ? 'Excel' : 'Word'} />
                      <div>
                        <p className="text-sm font-medium truncate max-w-xs">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemovePendingFile(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents table */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun document attaché à cette convention
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fichier</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Ajouté le</TableHead>
                  <TableHead>Par</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileTypeIcon type={doc.file_type} />
                        <span className="font-medium truncate max-w-[200px]" title={doc.file_name}>
                          {doc.file_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <FileTypeBadge type={doc.file_type} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatFileSize(doc.file_size)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(doc.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {doc.uploader?.full_name || doc.uploader?.email || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDownload(doc)}
                          disabled={downloadMutation.isPending}
                          title="Télécharger"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <PermissionGate module="conventions" permission="delete">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteDoc(doc)}
                            disabled={deleteMutation.isPending}
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </PermissionGate>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteDoc} onOpenChange={() => setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le document</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer "{deleteDoc?.file_name}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
