import { useEffect, useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Budget, BudgetLine, useCreateBudget, useUpdateBudget, useBudgetLines, useCreateBudgetLine, useUpdateBudgetLine, useDeleteBudgetLine } from "@/hooks/useBudget";
import { useBudgetWorkflowTransition, BudgetWorkflowStatus } from "@/hooks/useBudgetWorkflow";
import { useFiscalYears, useCurrencies, usePlanAccounts, useTrackingAxes } from "@/hooks/useParametrage";
import { useCostCenters } from "@/hooks/useComptabiliteAnalytique";
import { useProjects } from "@/hooks/useProjects";
import { Lock, Plus, Trash2, Save, Send, Calculator, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const budgetLineSchema = z.object({
  id: z.string().optional(),
  account_id: z.string().optional(),
  tracking_axis_id: z.string().optional(),
  cost_center_id: z.string().optional(),
  description: z.string().min(1, "Description requise").max(500),
  forecast_amount: z.coerce.number().min(0, "Montant invalide").default(0),
  alert_threshold: z.coerce.number().min(0).max(100).default(80),
});

const formSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "Le nom est requis").max(200),
  description: z.string().max(1000).optional(),
  fiscal_year_id: z.string().min(1, "L'exercice est requis"),
  project_id: z.string().optional(),
  currency_id: z.string().min(1, "La devise est requise"),
  exchange_rate: z.coerce.number().min(0, "Taux invalide").default(1),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  lines: z.array(budgetLineSchema).default([]),
});

type FormData = z.infer<typeof formSchema>;

interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: Budget | null;
  fiscalYearId?: string;
}

export function BudgetFormDialog({ open, onOpenChange, budget, fiscalYearId }: BudgetFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: fiscalYears } = useFiscalYears();
  const { data: currencies } = useCurrencies();
  const { projects } = useProjects();
  const { data: accounts } = usePlanAccounts('budgetaire');
  const { data: trackingAxes } = useTrackingAxes();
  const { data: costCenters } = useCostCenters();
  const { data: existingLines } = useBudgetLines(budget?.id);
  
  const createBudgetMutation = useCreateBudget();
  const updateBudgetMutation = useUpdateBudget();
  const createLineMutation = useCreateBudgetLine();
  const updateLineMutation = useUpdateBudgetLine();
  const deleteLineMutation = useDeleteBudgetLine();
  const workflowTransition = useBudgetWorkflowTransition();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      fiscal_year_id: fiscalYearId || "",
      project_id: "",
      currency_id: "",
      exchange_rate: 1,
      start_date: "",
      end_date: "",
      lines: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  const watchedLines = form.watch("lines");
  const watchedExchangeRate = form.watch("exchange_rate");
  const selectedCurrency = currencies?.find(c => c.id === form.watch("currency_id"));

  // Calculate totals
  const { totalAmount, totalAmountLocal } = useMemo(() => {
    const total = watchedLines.reduce((sum, line) => sum + (Number(line.forecast_amount) || 0), 0);
    return {
      totalAmount: total,
      totalAmountLocal: total * (watchedExchangeRate || 1),
    };
  }, [watchedLines, watchedExchangeRate]);

  useEffect(() => {
    if (budget) {
      form.reset({
        code: budget.code,
        name: budget.name,
        description: budget.description || "",
        fiscal_year_id: budget.fiscal_year_id,
        project_id: "",
        currency_id: budget.currency_id,
        exchange_rate: budget.exchange_rate,
        start_date: budget.start_date || "",
        end_date: budget.end_date || "",
        lines: existingLines?.map(line => ({
          id: line.id,
          account_id: line.account_id || "",
          tracking_axis_id: line.tracking_axis_id || "",
          cost_center_id: line.cost_center_id || "",
          description: line.description || "",
          forecast_amount: Number(line.forecast_amount),
          alert_threshold: Number(line.alert_threshold),
        })) || [],
      });
    } else {
      form.reset({
        code: "",
        name: "",
        description: "",
        fiscal_year_id: fiscalYearId || "",
        project_id: "",
        currency_id: currencies?.find(c => c.is_default)?.id || "",
        exchange_rate: 1,
        start_date: "",
        end_date: "",
        lines: [],
      });
    }
  }, [budget, fiscalYearId, currencies, existingLines, form]);

  const addNewLine = () => {
    append({
      account_id: "",
      tracking_axis_id: "",
      cost_center_id: "",
      description: "",
      forecast_amount: 0,
      alert_threshold: 80,
    });
  };

  const handleSave = async (data: FormData, shouldSubmit: boolean = false) => {
    setIsSubmitting(true);
    try {
      let budgetId = budget?.id;

      // Create or update budget
      const budgetPayload = {
        name: data.name,
        description: data.description,
        fiscal_year_id: data.fiscal_year_id,
        currency_id: data.currency_id,
        exchange_rate: data.exchange_rate,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        total_amount: totalAmount,
        total_amount_local: totalAmountLocal,
      };

      if (budget) {
        await updateBudgetMutation.mutateAsync({ id: budget.id, ...budgetPayload });
      } else {
        const newBudget = await createBudgetMutation.mutateAsync(budgetPayload as any);
        budgetId = newBudget.id;
      }

      if (!budgetId) throw new Error("Budget ID manquant");

      // Handle budget lines
      const existingLineIds = existingLines?.map(l => l.id) || [];
      const currentLineIds = data.lines.filter(l => l.id).map(l => l.id!);
      
      // Delete removed lines
      const linesToDelete = existingLineIds.filter(id => !currentLineIds.includes(id));
      for (const lineId of linesToDelete) {
        await deleteLineMutation.mutateAsync(lineId);
      }

      // Create or update lines
      for (let i = 0; i < data.lines.length; i++) {
        const line = data.lines[i];
        const linePayload = {
          budget_id: budgetId,
          account_id: line.account_id || null,
          tracking_axis_id: line.tracking_axis_id || null,
          cost_center_id: line.cost_center_id || null,
          description: line.description,
          forecast_amount: line.forecast_amount,
          forecast_amount_local: line.forecast_amount * (data.exchange_rate || 1),
          alert_threshold: line.alert_threshold,
          line_number: i + 1,
          committed_amount: 0,
          committed_amount_local: 0,
          realized_amount: 0,
          realized_amount_local: 0,
        };

        if (line.id) {
          await updateLineMutation.mutateAsync({ id: line.id, ...linePayload });
        } else {
          await createLineMutation.mutateAsync(linePayload as any);
        }
      }

      // Submit if requested
      if (shouldSubmit && budgetId) {
        await workflowTransition.mutateAsync({ budgetId, newStatus: 'soumis' });
        toast.success("Budget enregistré et soumis pour validation");
      } else {
        toast.success("Budget enregistré avec succès");
      }

      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = (data: FormData) => handleSave(data, false);
  const onSubmitForValidation = () => {
    form.handleSubmit((data) => handleSave(data, true))();
  };

  const canSubmit = budget?.status === 'draft' || budget?.status === 'rejete' || !budget;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {budget ? "Modifier le budget" : "Nouveau budget"}
            {budget && (
              <Badge variant="outline" className="ml-2">
                {budget.status}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {budget ? "Modifiez les informations et les lignes budgétaires" : "Créez un nouveau budget avec ses lignes"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6">
                {/* Header Info */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">Informations générales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {budget ? (
                      <div className="space-y-2">
                        <FormLabel className="flex items-center gap-2">
                          Code <Lock className="h-3 w-3 text-muted-foreground" />
                        </FormLabel>
                        <Input value={budget.code} disabled className="bg-muted" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <FormLabel className="flex items-center gap-2">
                          Code <Lock className="h-3 w-3 text-muted-foreground" />
                        </FormLabel>
                        <Input value="Généré automatiquement" disabled className="bg-muted italic" />
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom du budget *</FormLabel>
                          <FormControl>
                            <Input placeholder="Budget annuel 2024" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                                {fiscalYears?.map((fy) => (
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
                        name="project_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Projet</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">Aucun</SelectItem>
                                {projects?.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.code} - {p.name}
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
                                {currencies?.map((c) => (
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

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="exchange_rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Taux de change</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.0001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="start_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date début</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="end_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date fin</FormLabel>
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
                            <Textarea placeholder="Description du budget..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Budget Lines */}
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Lignes budgétaires</CardTitle>
                      <Button type="button" size="sm" onClick={addNewLine}>
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter une ligne
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {fields.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Aucune ligne budgétaire</p>
                        <p className="text-sm">Cliquez sur "Ajouter une ligne" pour commencer</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[50px]">#</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Compte</TableHead>
                              <TableHead>Axe</TableHead>
                              <TableHead className="text-right">Montant</TableHead>
                              <TableHead className="w-[80px]">Seuil %</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {fields.map((field, index) => (
                              <TableRow key={field.id}>
                                <TableCell className="font-mono text-muted-foreground">
                                  {index + 1}
                                </TableCell>
                                <TableCell>
                                  <Input
                                    placeholder="Description de la ligne"
                                    {...form.register(`lines.${index}.description`)}
                                    className="min-w-[200px]"
                                  />
                                  {form.formState.errors.lines?.[index]?.description && (
                                    <p className="text-xs text-destructive mt-1">
                                      {form.formState.errors.lines[index]?.description?.message}
                                    </p>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={form.watch(`lines.${index}.account_id`) || ""}
                                    onValueChange={(value) => form.setValue(`lines.${index}.account_id`, value)}
                                  >
                                    <SelectTrigger className="min-w-[150px]">
                                      <SelectValue placeholder="Compte" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="">Aucun</SelectItem>
                                      {accounts?.map((a) => (
                                        <SelectItem key={a.id} value={a.id}>
                                          {a.code}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={form.watch(`lines.${index}.tracking_axis_id`) || ""}
                                    onValueChange={(value) => form.setValue(`lines.${index}.tracking_axis_id`, value)}
                                  >
                                    <SelectTrigger className="min-w-[150px]">
                                      <SelectValue placeholder="Axe" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="">Aucun</SelectItem>
                                      {trackingAxes?.map((a) => (
                                        <SelectItem key={a.id} value={a.id}>
                                          {a.code}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    {...form.register(`lines.${index}.forecast_amount`)}
                                    className="text-right min-w-[120px]"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    {...form.register(`lines.${index}.alert_threshold`)}
                                    className="text-center"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => remove(index)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Totals Summary */}
                <Card className="bg-muted/30">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-primary" />
                        <span className="font-medium">Total automatique</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold font-mono">
                          {totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {selectedCurrency?.symbol || ''}
                        </div>
                        {watchedExchangeRate !== 1 && (
                          <div className="text-sm text-muted-foreground">
                            ≈ {totalAmountLocal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} (locale)
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {fields.length} ligne(s) budgétaire(s)
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>

            <Separator className="my-4" />

            {/* Action Buttons */}
            <div className="flex justify-between gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={isSubmitting}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
                {canSubmit && (
                  <Button
                    type="button"
                    onClick={onSubmitForValidation}
                    disabled={isSubmitting || fields.length === 0}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Soumettre
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
