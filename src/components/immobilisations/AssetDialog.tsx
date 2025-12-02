import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Asset, useAssetCategories, useAssetMutations } from '@/hooks/useAssets';
import { useLocations, useSites } from '@/hooks/useParametrage';

const assetSchema = z.object({
  code: z.string().min(1, 'Le code est requis'),
  designation: z.string().min(1, 'La désignation est requise'),
  description: z.string().optional(),
  category_id: z.string().optional(),
  acquisition_date: z.string().min(1, 'La date d\'acquisition est requise'),
  acquisition_value: z.coerce.number().min(0, 'La valeur doit être positive'),
  residual_value: z.coerce.number().min(0).optional(),
  useful_life_years: z.coerce.number().min(1).optional(),
  depreciation_method: z.string().optional(),
  location_id: z.string().optional(),
  site_id: z.string().optional(),
  serial_number: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  invoice_reference: z.string().optional(),
  notes: z.string().optional(),
});

type AssetFormValues = z.infer<typeof assetSchema>;

interface AssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: Asset | null;
}

export function AssetDialog({ open, onOpenChange, asset }: AssetDialogProps) {
  const { data: categories } = useAssetCategories();
  const { data: locations } = useLocations();
  const { data: sites } = useSites();
  const { createMutation, updateMutation } = useAssetMutations();

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      code: '',
      designation: '',
      description: '',
      category_id: '',
      acquisition_date: new Date().toISOString().split('T')[0],
      acquisition_value: 0,
      residual_value: 0,
      useful_life_years: 5,
      depreciation_method: 'linear',
      location_id: '',
      site_id: '',
      serial_number: '',
      brand: '',
      model: '',
      invoice_reference: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (asset) {
      form.reset({
        code: asset.code,
        designation: asset.designation,
        description: asset.description || '',
        category_id: asset.category_id || '',
        acquisition_date: asset.acquisition_date,
        acquisition_value: asset.acquisition_value,
        residual_value: asset.residual_value || 0,
        useful_life_years: asset.useful_life_years || 5,
        depreciation_method: asset.depreciation_method || 'linear',
        location_id: asset.location_id || '',
        site_id: asset.site_id || '',
        serial_number: asset.serial_number || '',
        brand: asset.brand || '',
        model: asset.model || '',
        invoice_reference: asset.invoice_reference || '',
        notes: asset.notes || '',
      });
    } else {
      form.reset({
        code: '',
        designation: '',
        description: '',
        category_id: '',
        acquisition_date: new Date().toISOString().split('T')[0],
        acquisition_value: 0,
        residual_value: 0,
        useful_life_years: 5,
        depreciation_method: 'linear',
        location_id: '',
        site_id: '',
        serial_number: '',
        brand: '',
        model: '',
        invoice_reference: '',
        notes: '',
      });
    }
  }, [asset, form]);

  const onSubmit = (values: AssetFormValues) => {
    const submitData = {
      ...values,
      category_id: values.category_id || null,
      location_id: values.location_id || null,
      site_id: values.site_id || null,
      status: 'active',
    };

    if (asset) {
      updateMutation.mutate(
        { id: asset.id, ...submitData },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createMutation.mutate(submitData as any, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {asset ? 'Modifier l\'actif' : 'Ajouter un actif'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="VEH-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Désignation *</FormLabel>
                    <FormControl>
                      <Input placeholder="Toyota Land Cruiser" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une catégorie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="acquisition_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date d'acquisition *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="acquisition_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valeur d'acquisition *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="residual_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valeur résiduelle</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="useful_life_years"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durée de vie (années)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="depreciation_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Méthode d'amortissement</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une méthode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="linear">Linéaire</SelectItem>
                        <SelectItem value="degressive">Dégressif</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invoice_reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Référence facture</FormLabel>
                    <FormControl>
                      <Input placeholder="FAC-2024-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="site_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un site" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sites?.map((site) => (
                          <SelectItem key={site.id} value={site.id}>
                            {site.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emplacement</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un emplacement" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations?.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marque</FormLabel>
                    <FormControl>
                      <Input placeholder="Toyota" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modèle</FormLabel>
                    <FormControl>
                      <Input placeholder="Land Cruiser" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serial_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro de série</FormLabel>
                    <FormControl>
                      <Input placeholder="SN-123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description détaillée de l'actif..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Notes additionnelles..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Enregistrement...' : asset ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
