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
import { useCreateFinancialReport, useUpdateFinancialReport, FinancialReport, useConventions } from "@/hooks/useConventionsBailleurs";

const formSchema = z.object({
  code: z.string().min(1, "Code requis"),
  convention_id: z.string().min(1, "Convention requise"),
  report_type: z.string().min(1, "Type requis"),
  period_start: z.string().min(1, "Début de période requis"),
  period_end: z.string().min(1, "Fin de période requise"),
  status: z.string(),
  total_expenses: z.number().min(0),
  opening_balance: z.number().min(0),
  closing_balance: z.number().min(0),
  replenishment_requested: z.number().min(0),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface FinancialReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report?: FinancialReport | null;
  conventionId?: string;
}

const reportTypes = [
  { value: "ifr", label: "IFR - Interim Financial Report" },
  { value: "rsf", label: "RSF - Relevé Spécial de Fonds" },
  { value: "soe", label: "SOE - Statement of Expenditure" },
];

const statusOptions = [
  { value: "draft", label: "Brouillon" },
  { value: "submitted", label: "Soumis" },
  { value: "approved", label: "Approuvé" },
  { value: "rejected", label: "Rejeté" },
];

export function FinancialReportDialog({ open, onOpenChange, report, conventionId }: FinancialReportDialogProps) {
  const createReport = useCreateFinancialReport();
  const updateReport = useUpdateFinancialReport();
  const { data: conventions } = useConventions();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      convention_id: conventionId || "",
      report_type: "ifr",
      period_start: "",
      period_end: "",
      status: "draft",
      total_expenses: 0,
      opening_balance: 0,
      closing_balance: 0,
      replenishment_requested: 0,
      notes: "",
    },
  });

  useEffect(() => {
    if (report) {
      form.reset({
        code: report.code,
        convention_id: report.convention_id,
        report_type: report.report_type,
        period_start: report.period_start,
        period_end: report.period_end,
        status: report.status,
        total_expenses: report.total_expenses,
        opening_balance: report.opening_balance,
        closing_balance: report.closing_balance,
        replenishment_requested: report.replenishment_requested,
        notes: report.notes || "",
      });
    } else {
      form.reset({
        code: `RPT-${Date.now().toString().slice(-6)}`,
        convention_id: conventionId || "",
        report_type: "ifr",
        period_start: "",
        period_end: "",
        status: "draft",
        total_expenses: 0,
        opening_balance: 0,
        closing_balance: 0,
        replenishment_requested: 0,
        notes: "",
      });
    }
  }, [report, conventionId, form]);

  const onSubmit = async (values: FormValues) => {
    if (report) {
      await updateReport.mutateAsync({ id: report.id, ...values });
    } else {
      await createReport.mutateAsync(values);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {report ? "Modifier le rapport" : "Nouveau rapport financier"}
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
                name="report_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de rapport *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {reportTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
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
                name="period_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Début période *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="period_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fin période *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                name="opening_balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Solde d'ouverture</FormLabel>
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
                name="total_expenses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total dépenses</FormLabel>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="closing_balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Solde de clôture</FormLabel>
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
                name="replenishment_requested"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Réappro. demandé</FormLabel>
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
              <Button type="submit" disabled={createReport.isPending || updateReport.isPending}>
                {report ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
