import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, AlertCircle, AlertTriangle } from "lucide-react";
import { useJournals, useThirdParties, useJournalEntryMutations, EntryType } from "@/hooks/useComptabilite";
import { useFiscalYears, useCurrencies, usePlanAccounts, useTrackingAxes } from "@/hooks/useParametrage";
import { useProjects } from "@/hooks/useProjects";
import { useBudgetLines } from "@/hooks/useBudget";
import { Alert, AlertDescription } from "@/components/ui/alert";

const lineSchema = z.object({
  account_id: z.string().min(1, "Compte requis"),
  description: z.string().optional(),
  debit_amount: z.number().min(0),
  credit_amount: z.number().min(0),
  third_party_id: z.string().optional(),
  tracking_axis_id: z.string().optional(),
});

const formSchema = z.object({
  entry_date: z.string().min(1, "Date requise"),
  journal_id: z.string().min(1, "Journal requis"),
  fiscal_year_id: z.string().min(1, "Exercice requis"),
  entry_type: z.enum(['depense', 'financement', 'decaissement', 'prise_en_charge', 'autre']),
  description: z.string().min(1, "Libellé requis"),
  reference: z.string().optional(),
  currency_id: z.string().min(1, "Devise requise"),
  exchange_rate: z.number().min(0.000001),
  third_party_id: z.string().optional(),
  project_id: z.string().optional(),
  budget_line_id: z.string().optional(),
  requested_amount: z.number().min(0).optional(),
  lines: z.array(lineSchema).min(2, "Minimum 2 lignes requises"),
}).refine((data) => {
  const totalDebit = data.lines.reduce((sum, line) => sum + (line.debit_amount || 0), 0);
  const totalCredit = data.lines.reduce((sum, line) => sum + (line.credit_amount || 0), 0);
  return Math.abs(totalDebit - totalCredit) < 0.01;
}, {
  message: "L'écriture doit être équilibrée (Total Débit = Total Crédit)",
  path: ["lines"],
});

type FormData = z.infer<typeof formSchema>;

interface JournalEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryType?: EntryType;
}

const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  depense: "Dépense",
  financement: "Financement",
  decaissement: "Décaissement",
  prise_en_charge: "Prise en charge",
  autre: "Autre",
};

export function JournalEntryDialog({ open, onOpenChange, entryType = 'autre' }: JournalEntryDialogProps) {
  const { data: journals } = useJournals();
  const { data: fiscalYears } = useFiscalYears();
  const { data: currencies } = useCurrencies();
  const { data: accounts } = usePlanAccounts('comptable');
  const { data: thirdParties } = useThirdParties();
  const { data: trackingAxes } = useTrackingAxes();
  const { projects } = useProjects();
  const { createMutation } = useJournalEntryMutations();

  const currentFiscalYear = fiscalYears?.find(fy => fy.is_current);
  const defaultCurrency = currencies?.find(c => c.is_default);

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const { data: budgetLines } = useBudgetLines(selectedProjectId ? undefined : undefined);

  // Get budget lines for the selected fiscal year
  const availableBudgetLines = budgetLines?.filter(bl => bl.budget_id) || [];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entry_date: new Date().toISOString().split('T')[0],
      journal_id: "",
      fiscal_year_id: currentFiscalYear?.id || "",
      entry_type: entryType,
      description: "",
      reference: "",
      currency_id: defaultCurrency?.id || "",
      exchange_rate: 1,
      third_party_id: "",
      project_id: "",
      budget_line_id: "",
      requested_amount: 0,
      lines: [
        { account_id: "", description: "", debit_amount: 0, credit_amount: 0, third_party_id: "", tracking_axis_id: "" },
        { account_id: "", description: "", debit_amount: 0, credit_amount: 0, third_party_id: "", tracking_axis_id: "" },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  useEffect(() => {
    if (currentFiscalYear) {
      form.setValue('fiscal_year_id', currentFiscalYear.id);
    }
    if (defaultCurrency) {
      form.setValue('currency_id', defaultCurrency.id);
    }
    form.setValue('entry_type', entryType);
  }, [currentFiscalYear, defaultCurrency, entryType, form]);

  const watchedLines = form.watch("lines");
  const totalDebit = watchedLines.reduce((sum, line) => sum + (Number(line.debit_amount) || 0), 0);
  const totalCredit = watchedLines.reduce((sum, line) => sum + (Number(line.credit_amount) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const onSubmit = async (data: FormData) => {
    const entry = {
      entry_date: data.entry_date,
      journal_id: data.journal_id,
      fiscal_year_id: data.fiscal_year_id,
      entry_type: data.entry_type,
      description: data.description,
      reference: data.reference || null,
      currency_id: data.currency_id,
      exchange_rate: data.exchange_rate,
      status: 'brouillon' as const,
      third_party_id: data.third_party_id || null,
      validated_by: null,
      validated_at: null,
      created_by: null,
    };

    const lines = data.lines.map(line => ({
      line_number: 0,
      account_id: line.account_id,
      description: line.description || null,
      debit_amount: line.debit_amount,
      credit_amount: line.credit_amount,
      debit_amount_currency: line.debit_amount * data.exchange_rate,
      credit_amount_currency: line.credit_amount * data.exchange_rate,
      third_party_id: line.third_party_id || null,
      tracking_axis_id: line.tracking_axis_id || null,
      lettering_code: null,
      is_lettered: false,
    }));

    await createMutation.mutateAsync({ entry, lines });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Nouvelle écriture - {ENTRY_TYPE_LABELS[entryType]}</DialogTitle>
          <DialogDescription>
            Saisie d'une écriture comptable avec multi-devises
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                {/* Header Fields */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="entry_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="journal_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Journal *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {journals?.filter(j => j.is_active).map((journal) => (
                              <SelectItem key={journal.id} value={journal.id}>
                                {journal.code} - {journal.name}
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
                    name="fiscal_year_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exercice *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {fiscalYears?.filter(fy => fy.is_open).map((fy) => (
                              <SelectItem key={fy.id} value={fy.id}>
                                {fy.name}
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
                    name="entry_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(ENTRY_TYPE_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="currency_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Devise *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {currencies?.map((currency) => (
                              <SelectItem key={currency.id} value={currency.id}>
                                {currency.code} ({currency.symbol})
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
                    name="exchange_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taux de change</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.000001"
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
                    name="third_party_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tiers</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Aucun" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Aucun</SelectItem>
                            {thirdParties?.filter(tp => tp.is_active).map((tp) => (
                              <SelectItem key={tp.id} value={tp.id}>
                                {tp.code} - {tp.name}
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
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Référence</FormLabel>
                        <FormControl>
                          <Input placeholder="N° pièce externe" {...field} />
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
                      <FormLabel>Libellé *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Description de l'écriture"
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Project and Budget fields for expenses */}
                {entryType === 'depense' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg border">
                    <FormField
                      control={form.control}
                      name="project_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Projet</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedProjectId(value);
                            }} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un projet" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Aucun</SelectItem>
                              {projects?.filter(p => p.status === 'active').map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.code} - {project.name}
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
                      name="budget_line_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ligne budgétaire</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une ligne" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Aucune</SelectItem>
                              {availableBudgetLines.map((line) => (
                                <SelectItem key={line.id} value={line.id}>
                                  Ligne {line.line_number} - {line.description || 'Sans description'}
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
                      name="requested_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Montant demandé</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Alert className="col-span-full">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Pour soumettre cette dépense à validation, veuillez sélectionner un projet et une ligne budgétaire avec un budget suffisant.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Entry Lines */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Lignes d'écriture</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        append({
                          account_id: "",
                          description: "",
                          debit_amount: 0,
                          credit_amount: 0,
                          third_party_id: "",
                          tracking_axis_id: "",
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter ligne
                    </Button>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-2 py-2 text-left font-medium">Compte *</th>
                          <th className="px-2 py-2 text-left font-medium">Libellé</th>
                          <th className="px-2 py-2 text-left font-medium">Axe</th>
                          <th className="px-2 py-2 text-right font-medium">Débit</th>
                          <th className="px-2 py-2 text-right font-medium">Crédit</th>
                          <th className="px-2 py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {fields.map((field, index) => (
                          <tr key={field.id} className="border-t">
                            <td className="px-2 py-1">
                              <FormField
                                control={form.control}
                                name={`lines.${index}.account_id`}
                                render={({ field }) => (
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Compte" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {accounts?.filter(a => a.is_active).map((account) => (
                                        <SelectItem key={account.id} value={account.id}>
                                          {account.code} - {account.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </td>
                            <td className="px-2 py-1">
                              <FormField
                                control={form.control}
                                name={`lines.${index}.description`}
                                render={({ field }) => (
                                  <Input
                                    className="h-8 text-xs"
                                    placeholder="Description"
                                    {...field}
                                  />
                                )}
                              />
                            </td>
                            <td className="px-2 py-1">
                              <FormField
                                control={form.control}
                                name={`lines.${index}.tracking_axis_id`}
                                render={({ field }) => (
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Axe" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="">Aucun</SelectItem>
                                      {trackingAxes?.filter(a => a.is_active).map((axis) => (
                                        <SelectItem key={axis.id} value={axis.id}>
                                          {axis.code}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </td>
                            <td className="px-2 py-1">
                              <FormField
                                control={form.control}
                                name={`lines.${index}.debit_amount`}
                                render={({ field }) => (
                                  <Input
                                    type="number"
                                    className="h-8 text-xs text-right"
                                    step="0.01"
                                    {...field}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      field.onChange(value);
                                      if (value > 0) {
                                        form.setValue(`lines.${index}.credit_amount`, 0);
                                      }
                                    }}
                                  />
                                )}
                              />
                            </td>
                            <td className="px-2 py-1">
                              <FormField
                                control={form.control}
                                name={`lines.${index}.credit_amount`}
                                render={({ field }) => (
                                  <Input
                                    type="number"
                                    className="h-8 text-xs text-right"
                                    step="0.01"
                                    {...field}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      field.onChange(value);
                                      if (value > 0) {
                                        form.setValue(`lines.${index}.debit_amount`, 0);
                                      }
                                    }}
                                  />
                                )}
                              />
                            </td>
                            <td className="px-2 py-1">
                              {fields.length > 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => remove(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-muted/50">
                        <tr className="border-t font-medium">
                          <td colSpan={3} className="px-2 py-2 text-right">
                            Total
                          </td>
                          <td className="px-2 py-2 text-right font-mono">
                            {totalDebit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-2 py-2 text-right font-mono">
                            {totalCredit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {!isBalanced && totalDebit > 0 && totalCredit > 0 && (
                    <div className="flex items-center gap-2 text-destructive text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>
                        Écart: {Math.abs(totalDebit - totalCredit).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        {totalDebit > totalCredit ? ' (Débit > Crédit)' : ' (Crédit > Débit)'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="gradient" disabled={createMutation.isPending || !isBalanced}>
                {createMutation.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
