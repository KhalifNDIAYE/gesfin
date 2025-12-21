import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
  FormDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Coins,
  Building2,
  Folder,
  AlertTriangle,
  Loader2,
  Save,
  CheckCircle,
  X,
  Upload,
} from "lucide-react";
import {
  CashOperationFormData,
  useCreateCashOperation,
  useUpdateCashOperation,
  useValidateCashOperation,
  useGenerateCashOperationCode,
  CashOperation,
  checkBudgetAvailability,
} from "@/hooks/useCashOperations";
import { useFiscalYears, usePlanAccounts, useCurrencies } from "@/hooks/useParametrage";
import { useProjects } from "@/hooks/useProjects";
import { useBailleurs, useConventions } from "@/hooks/useConventionsBailleurs";
import { useBudgets, useBudgetLines } from "@/hooks/useBudget";
import { useThirdParties } from "@/hooks/useComptabilite";
import { usePermissions } from "@/hooks/usePermissions";

const formSchema = z.object({
  code: z.string().optional(),
  operation_type: z.enum(["entree", "sortie"], {
    required_error: "Le type d'opération est obligatoire",
  }),
  operation_date: z.string().min(1, "La date est obligatoire"),
  amount: z.coerce.number().positive("Le montant doit être supérieur à 0"),
  currency_id: z.string().optional(),
  exchange_rate: z.coerce.number().positive().default(1),
  description: z.string().min(1, "La description est obligatoire").max(500),
  payment_method: z.enum(["especes", "cheque", "virement", "autre"]),
  payment_method_other: z.string().optional(),
  cash_account_id: z.string().min(1, "Le compte de caisse est obligatoire"),
  counterpart_account_id: z.string().min(1, "Le compte de contrepartie est obligatoire"),
  fiscal_year_id: z.string().min(1, "L'exercice comptable est obligatoire"),
  project_id: z.string().optional(),
  bailleur_id: z.string().optional(),
  convention_id: z.string().optional(),
  budget_id: z.string().optional(),
  budget_line_id: z.string().optional(),
  third_party_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CashOperationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operation?: CashOperation | null;
  defaultType?: "entree" | "sortie";
}

export function CashOperationDialog({
  open,
  onOpenChange,
  operation,
  defaultType = "sortie",
}: CashOperationDialogProps) {
  const [budgetWarning, setBudgetWarning] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  
  const { canAccess, isAdmin } = usePermissions();
  const canCreate = canAccess("comptabilite", "create");
  const canValidate = canAccess("comptabilite", "validate") || isAdmin;
  
  const { data: generatedCode, refetch: refetchCode } = useGenerateCashOperationCode();
  const { data: fiscalYears } = useFiscalYears();
  const { data: accounts } = usePlanAccounts();
  const { data: currencies } = useCurrencies();
  const { projects } = useProjects();
  const { data: bailleurs } = useBailleurs();
  const { data: conventions } = useConventions();
  const { data: budgets } = useBudgets();
  const { data: thirdParties } = useThirdParties();
  
  const createMutation = useCreateCashOperation();
  const updateMutation = useUpdateCashOperation();
  const validateMutation = useValidateCashOperation();

  const currentFiscalYear = fiscalYears?.find(fy => fy.is_current);
  const isEditing = !!operation;
  const isValidated = operation?.status === "valide";
  const isReadOnly = isValidated || !canCreate;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      operation_type: defaultType,
      operation_date: new Date().toISOString().split("T")[0],
      amount: 0,
      exchange_rate: 1,
      description: "",
      payment_method: "especes",
      cash_account_id: "",
      counterpart_account_id: "",
      fiscal_year_id: currentFiscalYear?.id || "",
    },
  });

  const watchedBudgetLineId = form.watch("budget_line_id");
  const watchedAmount = form.watch("amount");
  const watchedOperationType = form.watch("operation_type");
  const watchedProjectId = form.watch("project_id");
  const watchedBailleurId = form.watch("bailleur_id");
  const watchedBudgetId = form.watch("budget_id");
  const watchedPaymentMethod = form.watch("payment_method");

  // Fetch budget lines based on selected budget
  const { data: budgetLines } = useBudgetLines(watchedBudgetId);

  // Filter conventions by bailleur
  const filteredConventions = watchedBailleurId
    ? conventions?.filter(c => c.bailleur_id === watchedBailleurId)
    : conventions;

  // Cash accounts (typically class 5)
  const cashAccounts = accounts?.filter(a => a.code?.startsWith("5"));
  
  // Counterpart accounts (expenses class 6, or revenues class 7)
  const counterpartAccounts = accounts?.filter(a => 
    watchedOperationType === "sortie" 
      ? a.code?.startsWith("6") 
      : a.code?.startsWith("7") || a.code?.startsWith("4")
  );

  // Reset form when opening
  useEffect(() => {
    if (open) {
      if (operation) {
        form.reset({
          code: operation.code,
          operation_type: operation.operation_type,
          operation_date: operation.operation_date,
          amount: operation.amount,
          currency_id: operation.currency_id || undefined,
          exchange_rate: operation.exchange_rate,
          description: operation.description,
          payment_method: operation.payment_method,
          payment_method_other: operation.payment_method_other || undefined,
          cash_account_id: operation.cash_account_id,
          counterpart_account_id: operation.counterpart_account_id,
          fiscal_year_id: operation.fiscal_year_id,
          project_id: operation.project_id || undefined,
          bailleur_id: operation.bailleur_id || undefined,
          convention_id: operation.convention_id || undefined,
          budget_id: operation.budget_id || undefined,
          budget_line_id: operation.budget_line_id || undefined,
          third_party_id: operation.third_party_id || undefined,
        });
      } else {
        form.reset({
          code: generatedCode || "",
          operation_type: defaultType,
          operation_date: new Date().toISOString().split("T")[0],
          amount: 0,
          exchange_rate: 1,
          description: "",
          payment_method: "especes",
          cash_account_id: "",
          counterpart_account_id: "",
          fiscal_year_id: currentFiscalYear?.id || "",
        });
        refetchCode();
      }
      setBudgetWarning(null);
      setActiveTab("general");
    }
  }, [open, operation, generatedCode, currentFiscalYear, defaultType]);

  // Check budget availability when budget line or amount changes
  useEffect(() => {
    const checkBudget = async () => {
      if (watchedBudgetLineId && watchedAmount > 0 && watchedOperationType === "sortie") {
        const result = await checkBudgetAvailability(watchedBudgetLineId, watchedAmount);
        setBudgetWarning(result.message || null);
      } else {
        setBudgetWarning(null);
      }
    };
    checkBudget();
  }, [watchedBudgetLineId, watchedAmount, watchedOperationType]);

  const onSubmit = async (values: FormValues, shouldValidate = false) => {
    try {
      if (isEditing && operation) {
        await updateMutation.mutateAsync({ id: operation.id, ...values });
        if (shouldValidate) {
          await validateMutation.mutateAsync(operation.id);
        }
      } else {
        const created = await createMutation.mutateAsync(values as CashOperationFormData);
        if (shouldValidate && created) {
          await validateMutation.mutateAsync(created.id);
        }
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSaveDraft = () => {
    form.handleSubmit((values) => onSubmit(values, false))();
  };

  const handleValidate = () => {
    if (budgetWarning) {
      return; // Block if budget warning
    }
    form.handleSubmit((values) => onSubmit(values, true))();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || validateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            {isEditing ? "Modifier l'opération de caisse" : "Nouvelle opération de caisse"}
            {operation?.status && (
              <Badge variant={operation.status === "valide" ? "default" : "secondary"}>
                {operation.status === "valide" ? "Validée" : "Brouillon"}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations de l'opération de caisse"
              : "Saisissez une nouvelle opération d'encaissement ou de décaissement"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Général
                </TabsTrigger>
                <TabsTrigger value="comptabilite" className="flex items-center gap-1">
                  <Coins className="h-4 w-4" />
                  Comptabilité
                </TabsTrigger>
                <TabsTrigger value="liens" className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  Liens métiers
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-1">
                  <Folder className="h-4 w-4" />
                  Documents
                </TabsTrigger>
              </TabsList>

              {/* General Tab */}
              <TabsContent value="general" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Informations générales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Référence</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Auto-générée"
                                {...field}
                                disabled={isReadOnly}
                              />
                            </FormControl>
                            <FormDescription>
                              Laissez vide pour une génération automatique
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="operation_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type d'opération *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isReadOnly}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner le type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="entree">
                                  <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-success" />
                                    Entrée de caisse
                                  </span>
                                </SelectItem>
                                <SelectItem value="sortie">
                                  <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-destructive" />
                                    Sortie de caisse
                                  </span>
                                </SelectItem>
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
                        name="operation_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date d'opération *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} disabled={isReadOnly} />
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
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                {...field}
                                disabled={isReadOnly}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="currency_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Devise</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isReadOnly}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Devise" />
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

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description / Libellé *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Description de l'opération..."
                              className="resize-none"
                              rows={3}
                              {...field}
                              disabled={isReadOnly}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="payment_method"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mode de règlement *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isReadOnly}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="especes">Espèces</SelectItem>
                                <SelectItem value="cheque">Chèque</SelectItem>
                                <SelectItem value="virement">Virement</SelectItem>
                                <SelectItem value="autre">Autre</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {watchedPaymentMethod === "autre" && (
                        <FormField
                          control={form.control}
                          name="payment_method_other"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Précisez</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Autre mode de règlement..."
                                  {...field}
                                  disabled={isReadOnly}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="third_party_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bénéficiaire / Tiers</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isReadOnly}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner un tiers" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">Aucun</SelectItem>
                                {thirdParties?.map((tp) => (
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
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Accounting Tab */}
              <TabsContent value="comptabilite" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Imputation comptable</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="fiscal_year_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Exercice comptable *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isReadOnly}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {fiscalYears?.map((fy) => (
                                  <SelectItem key={fy.id} value={fy.id}>
                                    {fy.name} {fy.is_current && "(En cours)"}
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
                                step="0.0001"
                                min="0.0001"
                                {...field}
                                disabled={isReadOnly}
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
                        name="cash_account_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Compte de caisse *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isReadOnly}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner le compte" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {cashAccounts?.map((acc) => (
                                  <SelectItem key={acc.id} value={acc.id}>
                                    {acc.code} - {acc.name}
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
                        name="counterpart_account_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Compte de contrepartie *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isReadOnly}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner le compte" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {counterpartAccounts?.map((acc) => (
                                  <SelectItem key={acc.id} value={acc.id}>
                                    {acc.code} - {acc.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              {watchedOperationType === "sortie"
                                ? "Compte de charge (classe 6)"
                                : "Compte de produit ou tiers (classe 7 ou 4)"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Business Links Tab */}
              <TabsContent value="liens" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Liens métiers (optionnels)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="project_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Projet</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isReadOnly}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner un projet" />
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
                        name="bailleur_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bailleur</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isReadOnly}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner un bailleur" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">Aucun</SelectItem>
                                {bailleurs?.map((b) => (
                                  <SelectItem key={b.id} value={b.id}>
                                    {b.code} - {b.name}
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
                          <FormLabel>Convention</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isReadOnly}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une convention" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Aucune</SelectItem>
                              {filteredConventions?.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.code} - {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {watchedBailleurId && (
                            <FormDescription>
                              Filtré par le bailleur sélectionné
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="budget_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Budget</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isReadOnly}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner un budget" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">Aucun</SelectItem>
                                {budgets?.map((b) => (
                                  <SelectItem key={b.id} value={b.id}>
                                    {b.code} - {b.name}
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
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isReadOnly || !watchedBudgetId}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner une ligne" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">Aucune</SelectItem>
                                {budgetLines?.map((bl) => (
                                  <SelectItem key={bl.id} value={bl.id}>
                                    {bl.description || `Ligne ${bl.line_number}`}
                                    {" - "}
                                    Dispo: {(Number(bl.forecast_amount) - Number(bl.realized_amount)).toLocaleString("fr-FR")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {!watchedBudgetId && (
                              <FormDescription>
                                Sélectionnez d'abord un budget
                              </FormDescription>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {budgetWarning && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{budgetWarning}</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Pièces jointes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Glissez-déposez vos fichiers ici ou cliquez pour sélectionner
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, Word, Excel - Max 20 Mo par fichier
                      </p>
                      <Button variant="outline" size="sm" className="mt-4" disabled={isReadOnly}>
                        <Upload className="h-4 w-4 mr-2" />
                        Sélectionner des fichiers
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>

              <div className="flex gap-2">
                {!isValidated && canCreate && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Enregistrer (brouillon)
                  </Button>
                )}

                {!isValidated && canValidate && (
                  <Button
                    type="button"
                    variant="gradient"
                    onClick={handleValidate}
                    disabled={isLoading || !!budgetWarning}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Valider
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
