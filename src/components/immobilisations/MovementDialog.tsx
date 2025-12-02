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
import { useAssets, useAssetMovementMutations } from '@/hooks/useAssets';
import { useLocations } from '@/hooks/useParametrage';

const movementSchema = z.object({
  asset_id: z.string().min(1, 'L\'actif est requis'),
  movement_type: z.string().min(1, 'Le type est requis'),
  movement_date: z.string().min(1, 'La date est requise'),
  from_location_id: z.string().optional(),
  to_location_id: z.string().optional(),
  reason: z.string().optional(),
  document_reference: z.string().optional(),
  notes: z.string().optional(),
});

type MovementFormValues = z.infer<typeof movementSchema>;

interface MovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MovementDialog({ open, onOpenChange }: MovementDialogProps) {
  const { data: assets } = useAssets();
  const { data: locations } = useLocations();
  const { createMutation } = useAssetMovementMutations();

  const activeAssets = assets?.filter(a => a.status !== 'disposed') || [];

  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      asset_id: '',
      movement_type: 'transfer',
      movement_date: new Date().toISOString().split('T')[0],
      from_location_id: '',
      to_location_id: '',
      reason: '',
      document_reference: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        asset_id: '',
        movement_type: 'transfer',
        movement_date: new Date().toISOString().split('T')[0],
        from_location_id: '',
        to_location_id: '',
        reason: '',
        document_reference: '',
        notes: '',
      });
    }
  }, [open, form]);

  const onSubmit = (values: MovementFormValues) => {
    createMutation.mutate(
      {
        asset_id: values.asset_id,
        movement_type: values.movement_type,
        movement_date: values.movement_date,
        from_location_id: values.from_location_id || null,
        to_location_id: values.to_location_id || null,
        from_assigned_to: null,
        to_assigned_to: null,
        reason: values.reason || null,
        document_reference: values.document_reference || null,
        notes: values.notes || null,
        created_by: null,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  const isLoading = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enregistrer un mouvement</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="asset_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actif *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un actif" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeAssets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            {asset.code} - {asset.designation}
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
                name="movement_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de mouvement *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="transfer">Transfert</SelectItem>
                        <SelectItem value="assignment">Affectation</SelectItem>
                        <SelectItem value="return">Retour</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="movement_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date du mouvement *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="from_location_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localisation d'origine</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Origine" />
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

              <FormField
                control={form.control}
                name="to_location_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localisation de destination</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Destination" />
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

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motif</FormLabel>
                  <FormControl>
                    <Input placeholder="Motif du mouvement" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="document_reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Référence document</FormLabel>
                  <FormControl>
                    <Input placeholder="BON-001" {...field} />
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
                {isLoading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
