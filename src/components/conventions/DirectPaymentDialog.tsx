import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateDirectPayment, useUpdateDirectPayment, DirectPayment, useConventions, useExpenseCategories } from "@/hooks/useConventionsBailleurs";

const formSchema = z.object({
  code: z.string().min(1, "Code requis"),
  convention_id: z.string().min(1, "Convention requise"),
  expense_category_id: z.string().optional(),
  beneficiary_name: z.string().min(1, "Bénéficiaire requis"),
  beneficiary_account: z.string().optional(),
  amount: z.number().min(0, "Montant invalide"),
  exchange_rate: z.number().min(0, "Taux invalide"),
  request_date: z.string().min(1, "Date requise"),
  payment_date: z.string().optional(),
  status: z.string(),
  description: z.string().optional(),
  invoice_reference: z.string().optional(),
  contract_reference: z.string().optional(),
  bank_reference: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface DirectPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: DirectPayment | null;
  conventionId?: string;
}

const statusOptions = [
  { value: "draft", label: "Brouillon" },
  { value: "submitted", label: "Soumis" },
  { value: "approved", label: "Approuvé" },
  { value: "paid", label: "Payé" },
  { value: "rejected", label: "Rejeté" },
];

export function DirectPaymentDialog({ open, onOpenChange, payment, conventionId }: DirectPaymentDialogProps) {
  const createPayment = useCreateDirectPayment();
  const updatePayment = useUpdateDirectPayment();
  const { data: conventions } = useConventions();
  const { data: expenseCategories } = useExpenseCategories();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      convention_id: conventionId || "",
      expense_category_id: "",
      beneficiary_name: "",
      beneficiary_account: "",
      amount: 0,
      exchange_rate: 1,
      request_date: new Date().toISOString().split("T")[0],
      payment_date: "",
      status: "draft",
      description: "",
      invoice_reference: "",
      contract_reference: "",
      bank_reference: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (payment) {
      form.reset({
        code: payment.code,
        convention_id: payment.convention_id,
        expense_category_id: payment.expense_category_id || "",
        beneficiary_name: payment.beneficiary_name,
        beneficiary_account: payment.beneficiary_account || "",
        amount: payment.amount,
        exchange_rate: payment.exchange_rate,
        request_date: payment.request_date,
        payment_date: payment.payment_date || "",
        status: payment.status,
        description: payment.description || "",
        invoice_reference: payment.invoice_reference || "",
        contract_reference: payment.contract_reference || "",
        bank_reference: payment.bank_reference || "",
        notes: payment.notes || "",
      });
    } else {
      form.reset({
        code: `PD-${Date.now().toString().slice(-6)}`,
        convention_id: conventionId || "",
        expense_category_id: "",
        beneficiary_name: "",
        beneficiary_account: "",
        amount: 0,
        exchange_rate: 1,
        request_date: new Date().toISOString().split("T")[0],
        payment_date: "",
        status: "draft",
        description: "",
        invoice_reference: "",
        contract_reference: "",
        bank_reference: "",
        notes: "",
      });
    }
  }, [payment, conventionId, form]);

  const onSubmit = async (values: FormValues) => {
    const amountLocal = values.amount * values.exchange_rate;
    const data = {
      ...values,
      amount_local: amountLocal,
      expense_category_id: values.expense_category_id || null,
      payment_date: values.payment_date || null,
    };

    if (payment) {
      await updatePayment.mutateAsync({ id: payment.id, ...data });
    } else {
      await createPayment.mutateAsync(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {payment ? "Modifier le paiement" : "Nouveau paiement direct"}
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
                    <FormLabel>Statut</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
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
                name="convention_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Convention *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!!conventionId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une convention" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {conventions?.filter(c => c.status === 'active').map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.code} - {c.name}
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
                name="expense_category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie de dépense</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {expenseCategories?.filter(c => c.is_active).map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.code} - {c.name}
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
                name="beneficiary_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bénéficiaire *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="beneficiary_account"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compte bancaire</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="exchange_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taux de change</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.0001"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="request_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date demande *</FormLabel>
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
              name="payment_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de paiement</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                    <Textarea {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="invoice_reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Réf. facture</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contract_reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Réf. contrat</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bank_reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Réf. bancaire</FormLabel>
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createPayment.isPending || updatePayment.isPending}>
                {payment ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
