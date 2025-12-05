import { useState, useEffect, useMemo } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Save, Send, Upload, X, FileText, Loader2 } from "lucide-react";
import { useJournals, useThirdParties, useJournalEntryMutations } from "@/hooks/useComptabilite";
import { useFiscalYears, useCurrencies } from "@/hooks/useParametrage";
import { useProjects } from "@/hooks/useProjects";
import { useBudgetLines } from "@/hooks/useBudget";
import { useCheckBudgetAvailability, useExpenseWorkflowTransition } from "@/hooks/useExpenseWorkflow";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const formSchema = z.object({
  entry_date: z.string().min(1, "Date requise"),
  project_id: z.string().min(1, "Projet requis"),
  budget_line_id: z.string().min(1, "Ligne budgétaire requise"),
  third_party_id: z.string().min(1, "Fournisseur requis"),
  description: z.string().min(1, "Objet de la dépense requis").max(500, "Maximum 500 caractères"),
  requested_amount: z.number().min(0.01, "Montant doit être supérieur à 0"),
  currency_id: z.string().min(1, "Devise requise"),
  exchange_rate: z.number().min(0.000001, "Taux de change invalide"),
  reference: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExpenseFormDialog({ open, onOpenChange }: ExpenseFormDialogProps) {
  const { user } = useAuth();
  const { data: journals } = useJournals();
  const { data: fiscalYears } = useFiscalYears();
  const { data: currencies } = useCurrencies();
  const { data: suppliers } = useThirdParties('fournisseur');
  const { projects } = useProjects();
  const { createMutation } = useJournalEntryMutations();
  const checkBudgetMutation = useCheckBudgetAvailability();
  const workflowTransition = useExpenseWorkflowTransition();

  const currentFiscalYear = fiscalYears?.find(fy => fy.is_current);
  const defaultCurrency = currencies?.find(c => c.is_default);
  const expenseJournal = journals?.find(j => j.journal_type === 'achats');

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [budgetWarning, setBudgetWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: allBudgetLines } = useBudgetLines();

  // Filter budget lines by project - filter those linked to project's budgets
  const availableBudgetLines = useMemo(() => {
    if (!allBudgetLines || !selectedProjectId) return [];
    // For now, show all budget lines - ideally filter by project's associated budget
    return allBudgetLines;
  }, [allBudgetLines, selectedProjectId]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entry_date: new Date().toISOString().split('T')[0],
      project_id: "",
      budget_line_id: "",
      third_party_id: "",
      description: "",
      requested_amount: 0,
      currency_id: defaultCurrency?.id || "",
      exchange_rate: 1,
      reference: "",
    },
  });

  useEffect(() => {
    if (defaultCurrency) {
      form.setValue('currency_id', defaultCurrency.id);
    }
  }, [defaultCurrency, form]);

  // Watch for project changes
  const watchedProjectId = form.watch("project_id");
  useEffect(() => {
    if (watchedProjectId !== selectedProjectId) {
      setSelectedProjectId(watchedProjectId);
      form.setValue("budget_line_id", "");
    }
  }, [watchedProjectId, selectedProjectId, form]);

  // Check budget availability when amount or budget line changes
  const watchedAmount = form.watch("requested_amount");
  const watchedBudgetLine = form.watch("budget_line_id");

  useEffect(() => {
    const checkBudget = async () => {
      if (watchedBudgetLine && watchedAmount > 0) {
        const budgetLine = allBudgetLines?.find(bl => bl.id === watchedBudgetLine);
        if (budgetLine) {
          const available = (budgetLine.forecast_amount || 0) - (budgetLine.committed_amount || 0) - (budgetLine.realized_amount || 0);
          if (watchedAmount > available) {
            setBudgetWarning(`Budget insuffisant ! Disponible: ${available.toLocaleString()} XOF. Votre demande: ${watchedAmount.toLocaleString()} XOF`);
          } else {
            setBudgetWarning(null);
          }
        }
      } else {
        setBudgetWarning(null);
      }
    };
    checkBudget();
  }, [watchedAmount, watchedBudgetLine, allBudgetLines]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Erreur", description: "Le fichier ne doit pas dépasser 10 Mo", variant: "destructive" });
        return;
      }
      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast({ title: "Erreur", description: "Seuls les fichiers PDF, JPG et PNG sont acceptés", variant: "destructive" });
        return;
      }
      setAttachmentFile(file);
    }
  };

  const removeAttachment = () => {
    setAttachmentFile(null);
  };

  const uploadAttachment = async (): Promise<string | null> => {
    if (!attachmentFile || !user) return null;

    setIsUploading(true);
    try {
      const fileExt = attachmentFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('expense-attachments')
        .upload(fileName, attachmentFile);

      if (error) throw error;

      // Use signed URL for private bucket (24 hours expiry)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('expense-attachments')
        .createSignedUrl(fileName, 60 * 60 * 24);

      if (signedUrlError) throw signedUrlError;

      return signedUrlData.signedUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: "Erreur", description: "Échec de l'upload du fichier", variant: "destructive" });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: FormData, shouldSubmit: boolean = false) => {
    // Block if budget is insufficient and trying to submit
    if (budgetWarning && shouldSubmit) {
      toast({ 
        title: "Blocage", 
        description: "Impossible de soumettre : budget insuffisant", 
        variant: "destructive" 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload attachment if present
      let attachmentUrl: string | null = null;
      if (attachmentFile) {
        attachmentUrl = await uploadAttachment();
      }

      if (!expenseJournal) {
        toast({ title: "Erreur", description: "Aucun journal d'achats trouvé", variant: "destructive" });
        return;
      }

      if (!currentFiscalYear) {
        toast({ title: "Erreur", description: "Aucun exercice fiscal courant", variant: "destructive" });
        return;
      }

      // Create the expense entry
      const entry = {
        entry_date: data.entry_date,
        journal_id: expenseJournal.id,
        fiscal_year_id: currentFiscalYear.id,
        entry_type: 'depense' as const,
        description: data.description,
        reference: data.reference || null,
        currency_id: data.currency_id,
        exchange_rate: data.exchange_rate,
        status: 'brouillon' as const,
        third_party_id: data.third_party_id || null,
        project_id: data.project_id || null,
        budget_line_id: data.budget_line_id || null,
        requested_amount: data.requested_amount,
        expense_workflow_status: shouldSubmit ? 'soumise' : 'brouillon',
        attachment_url: attachmentUrl,
      };

      // Create minimal lines for balanced entry
      const lines = [
        {
          account_id: "", // This would need a proper expense account
          description: data.description,
          debit_amount: data.requested_amount,
          credit_amount: 0,
          debit_amount_currency: data.requested_amount,
          credit_amount_currency: 0,
          third_party_id: data.third_party_id || null,
          tracking_axis_id: null,
          lettering_code: null,
          is_lettered: false,
        },
        {
          account_id: "", // This would need a proper supplier account  
          description: data.description,
          debit_amount: 0,
          credit_amount: data.requested_amount,
          debit_amount_currency: 0,
          credit_amount_currency: data.requested_amount,
          third_party_id: data.third_party_id || null,
          tracking_axis_id: null,
          lettering_code: null,
          is_lettered: false,
        },
      ];

      // For now, we'll create a simplified entry without journal lines
      const { data: newEntry, error } = await supabase
        .from('journal_entries')
        .insert({
          entry_number: `DEP-${Date.now()}`, // Temporary, should use proper sequence
          ...entry,
        })
        .select()
        .single();

      if (error) throw error;

      toast({ 
        title: shouldSubmit ? "Dépense soumise" : "Dépense enregistrée",
        description: shouldSubmit 
          ? "La dépense a été soumise pour validation" 
          : "La dépense a été enregistrée comme brouillon"
      });

      form.reset();
      setAttachmentFile(null);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating expense:', error);
      toast({ 
        title: "Erreur", 
        description: error.message || "Échec de la création de la dépense", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = () => {
    form.handleSubmit((data) => onSubmit(data, false))();
  };

  const handleSubmit = () => {
    form.handleSubmit((data) => onSubmit(data, true))();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Nouvelle Dépense</DialogTitle>
          <DialogDescription>
            Saisissez les informations de la dépense
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form className="space-y-6">
              {/* Budget Warning */}
              {budgetWarning && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{budgetWarning}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Date */}
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

                {/* Reference */}
                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>N° Facture</FormLabel>
                      <FormControl>
                        <Input placeholder="FAC-2024-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Project */}
              <FormField
                control={form.control}
                name="project_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Projet *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un projet" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects?.map((project) => (
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

              {/* Budget Line */}
              <FormField
                control={form.control}
                name="budget_line_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ligne Budgétaire *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!selectedProjectId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedProjectId ? "Sélectionner une ligne" : "Sélectionnez d'abord un projet"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableBudgetLines?.map((line) => {
                          const available = (line.forecast_amount || 0) - (line.committed_amount || 0) - (line.realized_amount || 0);
                          return (
                            <SelectItem key={line.id} value={line.id}>
                              Ligne {line.line_number} - {line.description || 'Sans libellé'} 
                              <span className="text-muted-foreground ml-2">
                                (Dispo: {available.toLocaleString()} XOF)
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Supplier */}
              <FormField
                control={form.control}
                name="third_party_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fournisseur *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un fournisseur" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers?.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.code} - {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objet de la dépense *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Décrivez l'objet de la dépense..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum 500 caractères ({field.value?.length || 0}/500)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                {/* Amount */}
                <FormField
                  control={form.control}
                  name="requested_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Montant *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Currency */}
                <FormField
                  control={form.control}
                  name="currency_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Devise *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Devise" />
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

                {/* Exchange Rate */}
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
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Attachment */}
              <div className="space-y-2">
                <FormLabel>Pièce jointe (facture)</FormLabel>
                {attachmentFile ? (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="flex-1 text-sm truncate">{attachmentFile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(attachmentFile.size / 1024).toFixed(1)} Ko
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeAttachment}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Glissez un fichier ou cliquez pour sélectionner
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      PDF, JPG ou PNG (max. 10 Mo)
                    </p>
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                      id="attachment-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('attachment-upload')?.click()}
                    >
                      Parcourir
                    </Button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSave}
                  disabled={isSubmitting || isUploading}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Enregistrer
                </Button>
                <Button
                  type="button"
                  variant="gradient"
                  onClick={handleSubmit}
                  disabled={isSubmitting || isUploading || !!budgetWarning}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Soumettre
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
