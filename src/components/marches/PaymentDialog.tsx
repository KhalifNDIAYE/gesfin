import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usePaymentMutations, ContractPayment } from '@/hooks/useContracts';
import { useEffect } from 'react';

const paymentSchema = z.object({
  amount: z.coerce.number().min(0, 'Le montant doit être positif'),
  payment_date: z.string().min(1, 'La date est requise'),
  payment_method: z.string().min(1, 'La méthode est requise'),
  bank_reference: z.string().optional(),
  beneficiary_name: z.string().optional(),
  status: z.string().min(1, 'Le statut est requis'),
  description: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  payment?: ContractPayment | null;
}

const paymentMethods = [
  { value: 'transfer', label: 'Virement' },
  { value: 'check', label: 'Chèque' },
  { value: 'cash', label: 'Espèces' },
];

const paymentStatuses = [
  { value: 'pending', label: 'En attente' },
  { value: 'processed', label: 'Traité' },
  { value: 'cancelled', label: 'Annulé' },
];

export function PaymentDialog({ open, onOpenChange, contractId, payment }: PaymentDialogProps) {
  const { createPayment, updatePayment } = usePaymentMutations();
  const isEdit = !!payment;
  
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'transfer',
      bank_reference: '',
      beneficiary_name: '',
      status: 'pending',
      description: '',
    },
  });

  useEffect(() => {
    if (payment) {
      form.reset({
        amount: payment.amount,
        payment_date: payment.payment_date,
        payment_method: payment.payment_method || 'transfer',
        bank_reference: payment.bank_reference || '',
        beneficiary_name: payment.beneficiary_name || '',
        status: payment.status,
        description: payment.description || '',
      });
    } else {
      form.reset({
        amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'transfer',
        bank_reference: '',
        beneficiary_name: '',
        status: 'pending',
        description: '',
      });
    }
  }, [payment, form]);

  const onSubmit = async (values: PaymentFormValues) => {
    try {
      if (isEdit) {
        await updatePayment.mutateAsync({
          id: payment.id,
          ...values,
          contract_id: contractId,
          oldAmount: payment.amount,
        });
      } else {
        await createPayment.mutateAsync({
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

  const isPending = isEdit ? updatePayment.isPending : createPayment.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier le règlement' : 'Nouveau règlement'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                name="payment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de paiement *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Méthode *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
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
                        {paymentStatuses.map((status) => (
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
                name="bank_reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Référence bancaire</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="beneficiary_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bénéficiaire</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
