import React, { useState, useRef, useCallback } from "react";
import { 
  Upload, 
  FileText, 
  Trash2, 
  Download, 
  X, 
  FileSpreadsheet, 
  File,
  Loader2,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  useDocuments, 
  useUploadDocument, 
  useDeleteDocument, 
  useDownloadDocument,
  validateFiles,
  formatFileSize,
  DocumentEntityType,
  DocumentCategory,
  Document,
  CATEGORY_LABELS
} from "@/hooks/useDocuments";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Props du composant
interface DocumentManagerProps {
  entityType: DocumentEntityType;
  entityId: string;
  title?: string;
  showCategory?: boolean;
  defaultCategory?: DocumentCategory;
  className?: string;
}

// Icônes par type de fichier
const fileTypeIcons: Record<string, React.ReactNode> = {
  'PDF': <FileText className="h-5 w-5 text-red-500" />,
  'Word': <FileText className="h-5 w-5 text-blue-500" />,
  'Excel': <FileSpreadsheet className="h-5 w-5 text-green-500" />,
  'Document': <File className="h-5 w-5 text-muted-foreground" />
};

// Mapper les permissions par type d'entité
const getPermissionModule = (entityType: DocumentEntityType) => {
  switch (entityType) {
    case 'project': return 'projets';
    case 'convention': return 'conventions';
    case 'contract': return 'marches';
    case 'budget': return 'comptabilite';
    case 'expense': return 'comptabilite';
    case 'asset': return 'immobilisations';
    default: return 'projets';
  }
};

export function DocumentManager({
  entityType,
  entityId,
  title = "Documents",
  showCategory = true,
  defaultCategory = 'other',
  className = ""
}: DocumentManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>(defaultCategory);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Hooks de données
  const { data: documents = [], isLoading } = useDocuments(entityType, entityId);
  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument();
  const downloadMutation = useDownloadDocument();

  // Permissions
  const { canAccess } = usePermissions();
  const module = getPermissionModule(entityType);
  const canView = canAccess(module as any, 'read');
  const canUpload = canAccess(module as any, 'create');
  const canDelete = canAccess(module as any, 'delete');

  // Gestionnaire de sélection de fichiers
  const handleFileSelect = useCallback((files: FileList | File[] | null) => {
    if (!files) return;
    
    const { valid, errors } = validateFiles(files);
    
    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
    }
    
    if (valid.length > 0) {
      setPendingFiles(prev => [...prev, ...valid]);
    }
  }, []);

  // Drag & Drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // Supprimer un fichier en attente
  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload des fichiers
  const handleUpload = async () => {
    if (pendingFiles.length === 0) return;

    try {
      await uploadMutation.mutateAsync({
        entityType,
        entityId,
        files: pendingFiles,
        category: selectedCategory
      });
      setPendingFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      // L'erreur est gérée par le hook
    }
  };

  // Télécharger un document
  const handleDownload = (doc: Document) => {
    downloadMutation.mutate({
      storagePath: doc.storage_path,
      fileName: doc.file_name,
      entityType: doc.entity_type as DocumentEntityType,
      entityId: doc.entity_id,
      documentId: doc.id
    });
  };

  // Confirmer la suppression
  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;

    await deleteMutation.mutateAsync({
      id: documentToDelete.id,
      entityType: documentToDelete.entity_type as DocumentEntityType,
      entityId: documentToDelete.entity_id,
      storagePath: documentToDelete.storage_path,
      fileName: documentToDelete.file_name
    });
    setDocumentToDelete(null);
  };

  if (!canView) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </CardTitle>
          {documents.length > 0 && (
            <Badge variant="secondary">{documents.length}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Zone d'upload */}
        {canUpload && (
          <div className="space-y-3">
            <div
              className={`
                border-2 border-dashed rounded-lg p-6 text-center transition-colors
                ${isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                ${pendingFiles.length > 0 ? 'border-primary/50' : ''}
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Glissez-déposez vos fichiers ici ou
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Parcourir
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                PDF, Word, Excel • Max 20 Mo
              </p>
            </div>

            {/* Fichiers en attente */}
            {pendingFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {pendingFiles.length} fichier(s) prêt(s)
                  </span>
                  {showCategory && (
                    <Select
                      value={selectedCategory}
                      onValueChange={(v) => setSelectedCategory(v as DocumentCategory)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                <div className="space-y-1">
                  {pendingFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between bg-muted/50 rounded p-2"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removePendingFile(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full"
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Upload en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Uploader {pendingFiles.length} fichier(s)
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Liste des documents */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucun document</p>
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {fileTypeIcons[doc.file_type] || fileTypeIcons['Document']}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{doc.file_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(doc.file_size)}</span>
                      {showCategory && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs py-0">
                            {CATEGORY_LABELS[doc.category as DocumentCategory] || doc.category}
                          </Badge>
                        </>
                      )}
                      <span>•</span>
                      <span>
                        {format(new Date(doc.created_at), "dd/MM/yyyy", { locale: fr })}
                      </span>
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
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDownload(doc)}
                    disabled={downloadMutation.isPending}
                    title="Télécharger"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDocumentToDelete(doc)}
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!documentToDelete} onOpenChange={() => setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le document{" "}
              <strong>{documentToDelete?.file_name}</strong> ? 
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

export default DocumentManager;
