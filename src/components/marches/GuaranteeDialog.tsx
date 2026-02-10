import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useGuaranteeMutations, ContractGuarantee } from '@/hooks/useContracts';
import { useEffect } from 'react';

const guaranteeSchema = z.object({
  guarantee_type: z.string().min(1, 'Le type est requis'),
  amount: z.coerce.number().min(0, 'Le montant doit être positif'),
  percentage: z.coerce.number().min(0).max(100).optional(),
  issuer_name: z.string().optional(),
  reference_number: z.string().optional(),
  issue_date: z.string().min(1, 'La date est requise'),
  expiry_date: z.string().optional(),
  status: z.string().min(1, 'Le statut est requis'),
  description: z.string().optional(),
});

type GuaranteeFormValues = z.infer<typeof guaranteeSchema>;

interface GuaranteeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  guarantee?: ContractGuarantee | null;
}

const guaranteeTypes = [
  { value: 'bid', label: 'Caution de soumission' },
  { value: 'performance', label: 'Caution de bonne exécution' },
  { value: 'advance', label: "Caution d'avance" },
  { value: 'retention', label: 'Retenue de garantie' },
];

const guaranteeStatuses = [
  { value: 'active', label: 'Active' },
  { value: 'released', label: 'Libérée' },
  { value: 'called', label: 'Appelée' },
  { value: 'expired', label: 'Expirée' },
];

export function GuaranteeDialog({ open, onOpenChange, contractId, guarantee }: GuaranteeDialogProps) {
  const { createGuarantee, updateGuarantee } = useGuaranteeMutations();
  const isEdit = !!guarantee;
  
  const form = useForm<GuaranteeFormValues>({
    resolver: zodResolver(guaranteeSchema),
    defaultValues: {
      guarantee_type: 'performance',
      amount: 0,
      percentage: 0,
      issuer_name: '',
      reference_number: '',
      issue_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      status: 'active',
      description: '',
    },
  });

  useEffect(() => {
    if (guarantee) {
      form.reset({
        guarantee_type: guarantee.guarantee_type,
        amount: guarantee.amount,
        percentage: guarantee.percentage || 0,
        issuer_name: guarantee.issuer_name || '',
        reference_number: guarantee.reference_number || '',
        issue_date: guarantee.issue_date,
        expiry_date: guarantee.expiry_date || '',
        status: guarantee.status,
        description: guarantee.description || '',
      });
    } else {
      form.reset({
        guarantee_type: 'performance',
        amount: 0,
        percentage: 0,
        issuer_name: '',
        reference_number: '',
        issue_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        status: 'active',
        description: '',
      });
    }
  }, [guarantee, form]);

  const onSubmit = async (values: GuaranteeFormValues) => {
    try {
      if (isEdit) {
        await updateGuarantee.mutateAsync({
          id: guarantee.id,
          ...values,
          contract_id: contractId,
        });
      } else {
        await createGuarantee.mutateAsync({
          ...values,
          contract_id: contractId,
        });
      }
      form.reset();
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  const isPending = isEdit ? updateGuarantee.isPending : createGuarantee.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier la garantie' : 'Nouvelle garantie'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="guarantee_type"
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
                        {guaranteeTypes.map((type) => (
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pourcentage (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="issuer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Émetteur</FormLabel>
                    <FormControl>
                      <Input placeholder="Banque / Assurance" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reference_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>N° de référence</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
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
                        {guaranteeStatuses.map((status) => (
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
                name="issue_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date d'émission *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date d'expiration</FormLabel>
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
              <Button type="submit" disabled={isPending}>
                {isEdit ? 'Enregistrer' : 'Créer'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
