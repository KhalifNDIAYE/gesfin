import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Search, Edit, Trash2, Loader2 } from 'lucide-react';
import { z } from 'zod';

export interface GenericItem {
  id: string;
  code: string;
  name: string;
  is_active?: boolean;
  [key: string]: unknown;
}

export interface ExtraField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface GenericSettingsTableProps<T extends GenericItem> {
  title: string;
  description?: string;
  data: T[] | undefined;
  isLoading: boolean;
  onCreate: (data: Partial<T>) => Promise<void>;
  onUpdate: (id: string, data: Partial<T>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  extraFields?: ExtraField[];
  codeLabel?: string;
  nameLabel?: string;
  codePlaceholder?: string;
  namePlaceholder?: string;
  showStatus?: boolean;
  isCreating?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

const itemSchema = z.object({
  code: z.string().min(1, 'Le code est obligatoire').max(20, 'Le code ne peut pas dépasser 20 caractères'),
  name: z.string().min(1, 'Le libellé est obligatoire').max(100, 'Le libellé ne peut pas dépasser 100 caractères'),
});

export function GenericSettingsTable<T extends GenericItem>({
  title,
  description,
  data,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
  extraFields = [],
  codeLabel = 'Code',
  nameLabel = 'Libellé',
  codePlaceholder = 'CODE',
  namePlaceholder = 'Nom',
  showStatus = true,
  isCreating = false,
  isUpdating = false,
  isDeleting = false,
}: GenericSettingsTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({
    code: '',
    name: '',
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredData = useMemo(() => {
    if (!data) return [];
    const search = searchTerm.toLowerCase();
    return data.filter(item =>
      item.code.toLowerCase().includes(search) ||
      item.name.toLowerCase().includes(search)
    );
  }, [data, searchTerm]);

  const resetForm = () => {
    setFormData({ code: '', name: '', is_active: true });
    setErrors({});
    setEditingItem(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (item: T) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      is_active: item.is_active ?? true,
      ...extraFields.reduce((acc, field) => {
        acc[field.key] = item[field.key] ?? '';
        return acc;
      }, {} as Record<string, unknown>),
    });
    setErrors({});
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate base fields
    try {
      itemSchema.parse({ code: formData.code, name: formData.name });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        return;
      }
    }

    // Validate required extra fields
    const extraErrors: Record<string, string> = {};
    extraFields.forEach(field => {
      if (field.required && !formData[field.key]) {
        extraErrors[field.key] = `${field.label} est obligatoire`;
      }
    });

    if (Object.keys(extraErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...extraErrors }));
      return;
    }

    try {
      if (editingItem) {
        await onUpdate(editingItem.id, formData as Partial<T>);
      } else {
        await onCreate(formData as Partial<T>);
      }
      setDialogOpen(false);
      resetForm();
    } catch {
      // Error handling is done in the mutation
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await onDelete(deleteId);
      setDeleteId(null);
    } catch {
      // Error handling is done in the mutation
    }
  };

  const renderExtraField = (field: ExtraField) => {
    switch (field.type) {
      case 'select':
        return (
          <select
            id={field.key}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={(formData[field.key] as string) || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
          >
            <option value="">Sélectionner...</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      case 'number':
        return (
          <Input
            id={field.key}
            type="number"
            placeholder={field.placeholder}
            value={(formData[field.key] as number) || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value ? Number(e.target.value) : '' }))}
          />
        );
      case 'date':
        return (
          <Input
            id={field.key}
            type="date"
            value={(formData[field.key] as string) || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
          />
        );
      default:
        return (
          <Input
            id={field.key}
            placeholder={field.placeholder}
            value={(formData[field.key] as string) || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
          />
        );
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            <Button variant="gradient" size="sm" onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{codeLabel}</TableHead>
                      <TableHead>{nameLabel}</TableHead>
                      {showStatus && <TableHead>Statut</TableHead>}
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">{item.code}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        {showStatus && (
                          <TableCell>
                            <Badge 
                              variant="secondary" 
                              className={item.is_active !== false ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}
                            >
                              {item.is_active !== false ? 'Actif' : 'Inactif'}
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={showStatus ? 4 : 3} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? 'Aucun résultat trouvé' : 'Aucune donnée'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setDialogOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Modifier' : 'Ajouter'} {title.toLowerCase()}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Modifiez les informations' : 'Remplissez les informations'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">{codeLabel} *</Label>
              <Input
                id="code"
                placeholder={codePlaceholder}
                value={(formData.code as string) || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                disabled={!!editingItem}
              />
              {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">{nameLabel} *</Label>
              <Input
                id="name"
                placeholder={namePlaceholder}
                value={(formData.name as string) || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            {extraFields.map(field => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>
                  {field.label} {field.required && '*'}
                </Label>
                {renderExtraField(field)}
                {errors[field.key] && <p className="text-xs text-destructive">{errors[field.key]}</p>}
              </div>
            ))}

            {showStatus && (
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <Label>Statut</Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.is_active ? 'Élément actif' : 'Élément inactif'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${!formData.is_active ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>Inactif</span>
                  <Switch
                    checked={formData.is_active as boolean}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <span className={`text-sm ${formData.is_active ? 'text-success' : 'text-muted-foreground/50'}`}>Actif</span>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="gradient" disabled={isCreating || isUpdating}>
                {(isCreating || isUpdating) ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {editingItem ? 'Modification...' : 'Création...'}
                  </>
                ) : (
                  'Enregistrer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Voulez-vous vraiment supprimer cet élément ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
