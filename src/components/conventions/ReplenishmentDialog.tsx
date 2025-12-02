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
import { useCreateReplenishment, useUpdateReplenishment, Replenishment, useConventions } from "@/hooks/useConventionsBailleurs";

const formSchema = z.object({
  code: z.string().min(1, "Code requis"),
  convention_id: z.string().min(1, "Convention requise"),
  request_date: z.string().min(1, "Date requise"),
  amount: z.number().min(0, "Montant invalide"),
  exchange_rate: z.number().min(0, "Taux invalide"),
  status: z.string(),
  submitted_date: z.string().optional(),
  approved_date: z.string().optional(),
  received_date: z.string().optional(),
  bank_reference: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ReplenishmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replenishment?: Replenishment | null;
  conventionId?: string;
}

const statusOptions = [
  { value: "draft", label: "Brouillon" },
  { value: "submitted", label: "Soumis" },
  { value: "approved", label: "Approuvé" },
  { value: "received", label: "Reçu" },
];

export function ReplenishmentDialog({ open, onOpenChange, replenishment, conventionId }: ReplenishmentDialogProps) {
  const createReplenishment = useCreateReplenishment();
  const updateReplenishment = useUpdateReplenishment();
  const { data: conventions } = useConventions();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      convention_id: conventionId || "",
      request_date: new Date().toISOString().split("T")[0],
      amount: 0,
      exchange_rate: 1,
      status: "draft",
      submitted_date: "",
      approved_date: "",
      received_date: "",
      bank_reference: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (replenishment) {
      form.reset({
        code: replenishment.code,
        convention_id: replenishment.convention_id,
        request_date: replenishment.request_date,
        amount: replenishment.amount,
        exchange_rate: replenishment.exchange_rate,
        status: replenishment.status,
        submitted_date: replenishment.submitted_date || "",
        approved_date: replenishment.approved_date || "",
        received_date: replenishment.received_date || "",
        bank_reference: replenishment.bank_reference || "",
        notes: replenishment.notes || "",
      });
    } else {
      form.reset({
        code: `REA-${Date.now().toString().slice(-6)}`,
        convention_id: conventionId || "",
        request_date: new Date().toISOString().split("T")[0],
        amount: 0,
        exchange_rate: 1,
        status: "draft",
        submitted_date: "",
        approved_date: "",
        received_date: "",
        bank_reference: "",
        notes: "",
      });
    }
  }, [replenishment, conventionId, form]);

  const onSubmit = async (values: FormValues) => {
    const amountLocal = values.amount * values.exchange_rate;
    const data = {
      ...values,
      amount_local: amountLocal,
      submitted_date: values.submitted_date || null,
      approved_date: values.approved_date || null,
      received_date: values.received_date || null,
    };

    if (replenishment) {
      await updateReplenishment.mutateAsync({ id: replenishment.id, ...data });
    } else {
      await createReplenishment.mutateAsync(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {replenishment ? "Modifier la demande" : "Nouvelle demande de réapprovisionnement"}
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

            <div className="grid grid-cols-3 gap-4">
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
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="submitted_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date soumission</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="approved_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date approbation</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="received_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date réception</FormLabel>
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
              <Button type="submit" disabled={createReplenishment.isPending || updateReplenishment.isPending}>
                {replenishment ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
