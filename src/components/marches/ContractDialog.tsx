import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useContractMutations, Contract } from '@/hooks/useContracts';
import { useAvailableBudgetLines, validateContractEngagement, validateContractWithBudgetControl } from '@/hooks/useContractBudgetControl';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useMemo } from 'react';
import { Lock, AlertTriangle, Ban, CheckCircle } from 'lucide-react';

const contractSchema = z.object({
  code: z.string().optional(),
  object: z.string().min(1, "L'objet est requis"),
  contract_type: z.string().min(1, 'Le type est requis'),
  status: z.string().min(1, 'Le statut est requis'),
  supplier_name: z.string().optional(),
  budget_line_id: z.string().optional(),
  total_amount: z.coerce.number().min(0, 'Le montant doit être positif'),
  progress_percentage: z.coerce.number().min(0).max(100).optional(),
  signing_date: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

type ContractFormValues = z.infer<typeof contractSchema>;

interface ContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract?: Contract | null;
}

const contractTypes = [
  { value: 'works', label: 'Travaux' },
  { value: 'supplies', label: 'Fournitures' },
  { value: 'services', label: 'Services' },
  { value: 'studies', label: 'Études' },
];

const contractStatuses = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Terminé' },
  { value: 'suspended', label: 'Suspendu' },
  { value: 'terminated', label: 'Résilié' },
  { value: 'disputed', label: 'Litige' },
];

export function ContractDialog({ open, onOpenChange, contract }: ContractDialogProps) {
  const { createContract, updateContract } = useContractMutations();
  const { data: budgetLines } = useAvailableBudgetLines();
  const { user } = useAuth();
  
  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      code: '',
      object: '',
      contract_type: 'works',
      status: 'draft',
      supplier_name: '',
      budget_line_id: '',
      total_amount: 0,
      progress_percentage: 0,
      signing_date: '',
      start_date: '',
      end_date: '',
      description: '',
      notes: '',
    },
  });

  // Watch budget line and amount for real-time validation
  const watchedBudgetLineId = useWatch({ control: form.control, name: 'budget_line_id' });
  const watchedAmount = useWatch({ control: form.control, name: 'total_amount' });

  // Real-time budget control validation
  const budgetControlResult = useMemo(() => {
    if (!watchedBudgetLineId || !watchedAmount) {
      return null;
    }
    return validateContractEngagement(watchedBudgetLineId, watchedAmount, budgetLines);
  }, [watchedBudgetLineId, watchedAmount, budgetLines]);

  const isBlocked = budgetControlResult?.isBlocked || (budgetControlResult && !budgetControlResult.isAvailable);

  useEffect(() => {
    if (contract) {
      form.reset({
        code: contract.code,
        object: contract.object,
        contract_type: contract.contract_type,
        status: contract.status,
        supplier_name: contract.supplier_name || '',
        budget_line_id: contract.budget_line_id || '',
        total_amount: contract.total_amount,
        progress_percentage: contract.progress_percentage || 0,
        signing_date: contract.signing_date || '',
        start_date: contract.start_date || '',
        end_date: contract.end_date || '',
        description: contract.description || '',
        notes: contract.notes || '',
      });
    } else {
      form.reset({
        code: '',
        object: '',
        contract_type: 'works',
        status: 'draft',
        supplier_name: '',
        budget_line_id: '',
        total_amount: 0,
        progress_percentage: 0,
        signing_date: '',
        start_date: '',
        end_date: '',
        description: '',
        notes: '',
      });
    }
  }, [contract, form]);

  const onSubmit = async (values: ContractFormValues) => {
    try {
      const { code, budget_line_id, ...restValues } = values;
      
      // Validate budget control if budget line is selected
      if (budget_line_id) {
        const { canProceed } = await validateContractWithBudgetControl(
          budget_line_id,
          values.total_amount,
          budgetLines,
          user?.id,
          values.object
        );

        if (!canProceed) {
          return; // Blocked - toast already shown
        }
      }

      if (contract) {
        await updateContract.mutateAsync({ 
          id: contract.id, 
          code: contract.code, 
          budget_line_id: budget_line_id || null,
          ...restValues 
        });
      } else {
        await createContract.mutateAsync({
          budget_line_id: budget_line_id || null,
          ...restValues
        } as any);
      }
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contract ? 'Modifier le marché' : 'Nouveau marché'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {contract ? (
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Code <Lock className="h-3 w-3 text-muted-foreground" />
                      </FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="bg-muted" />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">Code généré automatiquement</p>
                    </FormItem>
                  )}
                />
              ) : (
                <div className="space-y-2">
                  <FormLabel className="flex items-center gap-2">
                    Code <Lock className="h-3 w-3 text-muted-foreground" />
                  </FormLabel>
                  <Input 
                    value="Généré automatiquement" 
                    disabled 
                    className="bg-muted text-muted-foreground italic"
                  />
                  <p className="text-xs text-muted-foreground">Format: MCH-AAAA-XXX</p>
                </div>
              )}
              <FormField
                control={form.control}
                name="contract_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contractTypes.map((type) => (
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
            </div>

            <FormField
              control={form.control}
              name="object"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objet *</FormLabel>
                  <FormControl>
                    <Input placeholder="Objet du marché" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplier_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fournisseur</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom du fournisseur" {...field} />
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
                          <SelectValue placeholder="Sélectionner le statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contractStatuses.map((status) => (
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

            {/* Budget Line Selection */}
            <FormField
              control={form.control}
              name="budget_line_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ligne budgétaire</FormLabel>
                  <Select onValueChange={(val) => field.onChange(val === "__none__" ? "" : val)} value={field.value || "__none__"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une ligne budgétaire (optionnel)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">Aucune ligne budgétaire</SelectItem>
                      {budgetLines?.filter(bl => bl.budget?.status === 'validated' || bl.budget?.status === 'approved')
                        .map((line) => {
                          const available = (line.forecast_amount || 0) - (line.committed_amount || 0) - (line.realized_amount || 0);
                          return (
                            <SelectItem key={line.id} value={line.id}>
                              {line.budget?.code} - {line.description || `Ligne ${line.id.slice(0, 8)}`} 
                              (Dispo: {available.toLocaleString()} XOF)
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Budget Control Feedback */}
            {budgetControlResult && watchedBudgetLineId && (
              <div className="space-y-2">
                {budgetControlResult.isAvailable ? (
                  <Alert className="border-green-500/50 bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                      Budget suffisant. Disponible: {budgetControlResult.availableBudget.toLocaleString()} XOF
                      {budgetControlResult.requestedAmount > 0 && (
                        <span className="ml-2">
                          (après engagement: {(budgetControlResult.availableBudget - budgetControlResult.requestedAmount).toLocaleString()} XOF)
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                    <Ban className="h-4 w-4" />
                    <AlertDescription className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-semibold">MARCHÉ EXCÉDENTAIRE BLOQUÉ</span>
                    </AlertDescription>
                  </Alert>
                )}
                {budgetControlResult.message && !budgetControlResult.isAvailable && (
                  <p className="text-sm text-destructive">{budgetControlResult.message}</p>
                )}
                <div className="text-xs text-muted-foreground grid grid-cols-3 gap-2">
                  <span>Prévision: {budgetControlResult.forecastAmount.toLocaleString()} XOF</span>
                  <span>Engagé: {budgetControlResult.committedAmount.toLocaleString()} XOF</span>
                  <span>Consommé: {budgetControlResult.consumptionPercentage.toFixed(1)}%</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="total_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant total *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="progress_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avancement (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="100" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="signing_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de signature</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <FormLabel>Date de début</FormLabel>
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
                    <FormLabel>Date de fin</FormLabel>
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
                    <Textarea placeholder="Description du marché" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={createContract.isPending || updateContract.isPending || isBlocked}
                className={isBlocked ? 'bg-destructive hover:bg-destructive cursor-not-allowed' : ''}
              >
                {isBlocked ? (
                  <>
                    <Ban className="h-4 w-4 mr-2" />
                    Bloqué
                  </>
                ) : (
                  contract ? 'Mettre à jour' : 'Créer'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
