import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useDecompteMutations } from '@/hooks/useContracts';

const decompteSchema = z.object({
  code: z.string().min(1, 'Le code est requis'),
  decompte_number: z.coerce.number().min(1, 'Le numéro est requis'),
  decompte_type: z.string().min(1, 'Le type est requis'),
  amount: z.coerce.number().min(0, 'Le montant doit être positif'),
  cumulative_amount: z.coerce.number().optional(),
  previous_amount: z.coerce.number().optional(),
  deduction_amount: z.coerce.number().optional(),
  progress_percentage: z.coerce.number().min(0).max(100).optional(),
  submission_date: z.string().min(1, 'La date est requise'),
  status: z.string().min(1, 'Le statut est requis'),
  description: z.string().optional(),
});

type DecompteFormValues = z.infer<typeof decompteSchema>;

interface DecompteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
}

const decompteTypes = [
  { value: 'progress', label: 'Acompte' },
  { value: 'partial', label: 'Partiel' },
  { value: 'final', label: 'Final' },
  { value: 'retention', label: 'Retenue de garantie' },
];

const decompteStatuses = [
  { value: 'submitted', label: 'Soumis' },
  { value: 'approved', label: 'Approuvé' },
  { value: 'paid', label: 'Payé' },
  { value: 'rejected', label: 'Rejeté' },
];

export function DecompteDialog({ open, onOpenChange, contractId }: DecompteDialogProps) {
  const { createDecompte } = useDecompteMutations();
  
  const form = useForm<DecompteFormValues>({
    resolver: zodResolver(decompteSchema),
    defaultValues: {
      code: '',
      decompte_number: 1,
      decompte_type: 'progress',
      amount: 0,
      cumulative_amount: 0,
      previous_amount: 0,
      deduction_amount: 0,
      progress_percentage: 0,
      submission_date: new Date().toISOString().split('T')[0],
      status: 'submitted',
      description: '',
    },
  });

  const onSubmit = async (values: DecompteFormValues) => {
    try {
      await createDecompte.mutateAsync({
        ...values,
        contract_id: contractId,
        net_amount: values.amount - (values.deduction_amount || 0),
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating decompte:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouveau décompte</DialogTitle>
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
                      <Input placeholder="DC-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="decompte_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro *</FormLabel>
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
                name="decompte_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {decompteTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {decompteStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant *</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="submission_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de soumission *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="progress_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avancement (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createDecompte.isPending}>
                Créer
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
