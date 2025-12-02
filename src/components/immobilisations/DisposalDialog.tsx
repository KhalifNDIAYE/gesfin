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
import { useAssets, useAssetDisposalMutations } from '@/hooks/useAssets';

const disposalSchema = z.object({
  asset_id: z.string().min(1, 'L\'actif est requis'),
  disposal_type: z.string().min(1, 'Le type est requis'),
  disposal_date: z.string().min(1, 'La date est requise'),
  disposal_value: z.coerce.number().min(0).optional(),
  buyer_name: z.string().optional(),
  reason: z.string().optional(),
  document_reference: z.string().optional(),
  notes: z.string().optional(),
});

type DisposalFormValues = z.infer<typeof disposalSchema>;

interface DisposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DisposalDialog({ open, onOpenChange }: DisposalDialogProps) {
  const { data: assets } = useAssets();
  const { createMutation } = useAssetDisposalMutations();

  const activeAssets = assets?.filter(a => a.status !== 'disposed') || [];

  const form = useForm<DisposalFormValues>({
    resolver: zodResolver(disposalSchema),
    defaultValues: {
      asset_id: '',
      disposal_type: 'sale',
      disposal_date: new Date().toISOString().split('T')[0],
      disposal_value: 0,
      buyer_name: '',
      reason: '',
      document_reference: '',
      notes: '',
    },
  });

  const selectedAssetId = form.watch('asset_id');
  const selectedAsset = activeAssets.find(a => a.id === selectedAssetId);

  useEffect(() => {
    if (open) {
      form.reset({
        asset_id: '',
        disposal_type: 'sale',
        disposal_date: new Date().toISOString().split('T')[0],
        disposal_value: 0,
        buyer_name: '',
        reason: '',
        document_reference: '',
        notes: '',
      });
    }
  }, [open, form]);

  const onSubmit = (values: DisposalFormValues) => {
    const netBookValue = selectedAsset?.net_book_value || 0;
    const disposalValue = values.disposal_value || 0;
    const gainLoss = disposalValue - netBookValue;

    createMutation.mutate(
      {
        asset_id: values.asset_id,
        disposal_type: values.disposal_type,
        disposal_date: values.disposal_date,
        net_book_value_at_disposal: netBookValue,
        gain_loss: gainLoss,
        disposal_value: disposalValue,
        buyer_name: values.buyer_name || null,
        reason: values.reason || null,
        document_reference: values.document_reference || null,
        notes: values.notes || null,
        approved_by: null,
        approved_at: null,
        journal_entry_id: null,
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
          <DialogTitle>Enregistrer une sortie</DialogTitle>
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
                name="disposal_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de sortie *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sale">Cession</SelectItem>
                        <SelectItem value="scrapping">Mise au rebut</SelectItem>
                        <SelectItem value="donation">Don</SelectItem>
                        <SelectItem value="loss">Perte</SelectItem>
                        <SelectItem value="theft">Vol</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="disposal_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de sortie *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedAsset && (
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <h4 className="font-medium">Informations de l'actif</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Valeur d'acquisition:</span>
                    <span className="ml-2 font-mono">{selectedAsset.acquisition_value.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">VNC actuelle:</span>
                    <span className="ml-2 font-mono">{(selectedAsset.net_book_value || 0).toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="disposal_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valeur de cession</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="buyer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Acquéreur</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom de l'acquéreur" {...field} />
                    </FormControl>
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
                    <Input placeholder="Motif de la sortie" {...field} />
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
                    <Input placeholder="PV-REFORME-001" {...field} />
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
                {isLoading ? 'Enregistrement...' : 'Enregistrer la sortie'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
