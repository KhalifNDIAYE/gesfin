import { useState, useRef } from "react";
import { Upload, FileText, File, FileSpreadsheet, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { validateFiles, formatFileSize } from "@/hooks/useConventionDocuments";
import { toast } from "sonner";

interface ConventionDocumentsUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
}

const FileTypeIcon = ({ fileName }: { fileName: string }) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return <FileText className="h-5 w-5 text-red-500" />;
  if (ext === 'doc' || ext === 'docx') return <File className="h-5 w-5 text-blue-500" />;
  if (ext === 'xls' || ext === 'xlsx') return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
  return <File className="h-5 w-5 text-muted-foreground" />;
};

export function ConventionDocumentsUpload({ files, onChange }: ConventionDocumentsUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    processFiles(Array.from(selectedFiles));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFiles = (newFiles: File[]) => {
    const { valid, errors } = validateFiles(newFiles);
    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
    }
    if (valid.length > 0) {
      onChange([...files, ...valid]);
    }
  };

  const handleRemove = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Pièces jointes</label>
      
      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Glissez-déposez vos fichiers ici ou cliquez pour sélectionner
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          PDF, Word (.doc, .docx), Excel (.xls, .xlsx) - Max 20 Mo par fichier
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Files list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Les fichiers seront téléversés à la sauvegarde</span>
          </div>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileTypeIcon fileName={file.name} />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => handleRemove(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
