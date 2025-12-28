import { useState } from "react";
import { 
  FileText, 
  File, 
  FileSpreadsheet, 
  Download, 
  Trash2, 
  Loader2,
  Eye,
  Calendar,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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
import { 
  ContractDocument,
  useContractDocuments, 
  useDeleteContractDocument,
  useDownloadContractDocument,
  formatFileSize 
} from "@/hooks/useContractDocuments";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface ContractDocumentsListProps {
  contractId: string;
  canDelete?: boolean;
  canDownload?: boolean;
}

const FileTypeIcon = ({ fileType, fileName }: { fileType: string; fileName: string }) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf' || fileType.includes('pdf')) {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  if (ext === 'doc' || ext === 'docx' || fileType.includes('word')) {
    return <File className="h-5 w-5 text-blue-500" />;
  }
  if (ext === 'xls' || ext === 'xlsx' || fileType.includes('excel') || fileType.includes('spreadsheet')) {
    return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
  }
  return <File className="h-5 w-5 text-muted-foreground" />;
};

const FileTypeBadge = ({ fileName }: { fileName: string }) => {
  const ext = fileName.split('.').pop()?.toUpperCase() || 'FILE';
  const variants: Record<string, string> = {
    'PDF': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    'DOC': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'DOCX': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'XLS': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'XLSX': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  };
  
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${variants[ext] || 'bg-muted text-muted-foreground'}`}>
      {ext}
    </span>
  );
};

export function ContractDocumentsList({ 
  contractId, 
  canDelete = true,
  canDownload = true 
}: ContractDocumentsListProps) {
  const { data: documents, isLoading } = useContractDocuments(contractId);
  const deleteDocument = useDeleteContractDocument();
  const downloadDocument = useDownloadContractDocument();
  
  const [documentToDelete, setDocumentToDelete] = useState<ContractDocument | null>(null);

  const handleDownload = (doc: ContractDocument) => {
    downloadDocument.mutate({
      filePath: doc.file_path,
      fileName: doc.file_name,
      documentId: doc.id
    });
  };

  const handleDelete = () => {
    if (!documentToDelete) return;
    
    deleteDocument.mutate({
      documentId: documentToDelete.id,
      filePath: documentToDelete.file_path,
      contractId: contractId
    }, {
      onSuccess: () => setDocumentToDelete(null)
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Aucun document associé à ce marché</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
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
                  <div className="flex items-center gap-3">
                    <FileTypeIcon fileType={doc.file_type} fileName={doc.file_name} />
                    <div className="min-w-0">
                      <p className="font-medium truncate max-w-[200px]" title={doc.file_name}>
                        {doc.file_name}
                      </p>
                      {doc.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {doc.description}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <FileTypeBadge fileName={doc.file_name} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatFileSize(doc.file_size)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(doc.created_at), 'dd/MM/yyyy', { locale: fr })}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span className="truncate max-w-[100px]">
                      {doc.uploader?.full_name || doc.uploader?.email || 'Inconnu'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {canDownload && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(doc)}
                        disabled={downloadDocument.isPending}
                        title="Télécharger"
                      >
                        {downloadDocument.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDocumentToDelete(doc)}
                        className="text-destructive hover:text-destructive"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!documentToDelete} onOpenChange={() => setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le document ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le document "{documentToDelete?.file_name}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDocument.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
