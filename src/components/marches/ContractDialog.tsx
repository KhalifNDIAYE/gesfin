import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useContractMutations, Contract } from '@/hooks/useContracts';
import { useAvailableBudgetLines, validateContractEngagement, validateContractWithBudgetControl } from '@/hooks/useContractBudgetControl';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { useBailleurs, useConventions } from '@/hooks/useConventionsBailleurs';
import { useCurrencies } from '@/hooks/useParametrage';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Lock, AlertTriangle, Ban, CheckCircle, FileText, Calendar, Building2, DollarSign, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { differenceInDays } from 'date-fns';
import { calculateTVAAmount, calculateTotalTTC, formatContractAmount, validateContractAmounts } from '@/lib/contractCalculations';

const contractSchema = z.object({
  code: z.string().optional(),
  object: z.string().min(1, "L'intitulé du marché est requis"),
  description: z.string().optional(),
  contract_type: z.string().min(1, 'Le type est requis'),
  status: z.string().min(1, 'Le statut est requis'),
  
  // Structural links
  project_id: z.string().min(1, 'Le projet est obligatoire'),
  bailleur_ids: z.array(z.string()).optional(),
  convention_ids: z.array(z.string()).optional(),
  
  // Contractual info
  contract_number: z.string().optional(),
  attributaire: z.string().optional(),
  signing_date: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  
  // Financial data
  amount_ht: z.coerce.number().min(0, 'Le montant HT doit être positif'),
  tva_rate: z.coerce.number().min(0).max(100).optional(),
  currency_id: z.string().optional(),
  exchange_rate: z.coerce.number().min(0).optional(),
  budget_line_id: z.string().optional(),
  
  // Payment
  payment_method: z.string().optional(),
  
  // Notes
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
  { value: 'other', label: 'Autre' },
];

const contractStatuses = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'validated', label: 'Validé' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'suspended', label: 'Suspendu' },
  { value: 'completed', label: 'Clôturé' },
  { value: 'terminated', label: 'Résilié' },
];

const paymentMethods = [
  { value: 'transfer', label: 'Virement' },
  { value: 'check', label: 'Chèque' },
  { value: 'cash', label: 'Espèces' },
  { value: 'other', label: 'Autre' },
];

export function ContractDialog({ open, onOpenChange, contract }: ContractDialogProps) {
  const { createContract, updateContract } = useContractMutations();
  const { data: budgetLines } = useAvailableBudgetLines();
  const { projects } = useProjects();
  const { data: bailleurs } = useBailleurs();
  const { data: conventions } = useConventions();
  const { data: currencies } = useCurrencies();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedBailleurs, setSelectedBailleurs] = useState<string[]>([]);
  const [selectedConventions, setSelectedConventions] = useState<string[]>([]);
  const [isLoadingRelations, setIsLoadingRelations] = useState(false);
  
  // Audit logging function
  const logAuditAction = useCallback(async (action: string, resourceId: string, oldValues?: any, newValues?: any) => {
    try {
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        user_email: user?.email,
        action,
        module: 'marches',
        resource_type: 'contract',
        resource_id: resourceId,
        old_values: oldValues,
        new_values: newValues,
      });
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  }, [user]);
  
  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      code: '',
      object: '',
      description: '',
      contract_type: 'works',
      status: 'draft',
      project_id: '',
      bailleur_ids: [],
      convention_ids: [],
      contract_number: '',
      attributaire: '',
      signing_date: '',
      start_date: '',
      end_date: '',
      amount_ht: 0,
      tva_rate: 18,
      currency_id: '',
      exchange_rate: 1,
      budget_line_id: '',
      payment_method: 'transfer',
      notes: '',
    },
  });

  const watchedProjectId = useWatch({ control: form.control, name: 'project_id' });
  const watchedBudgetLineId = useWatch({ control: form.control, name: 'budget_line_id' });
  const watchedAmountHT = useWatch({ control: form.control, name: 'amount_ht' });
  const watchedTvaRate = useWatch({ control: form.control, name: 'tva_rate' });
  const watchedStartDate = useWatch({ control: form.control, name: 'start_date' });
  const watchedEndDate = useWatch({ control: form.control, name: 'end_date' });

  // Calculate TVA and TTC amounts using centralized calculations
  const tvaAmount = useMemo(() => {
    return calculateTVAAmount(watchedAmountHT || 0, watchedTvaRate || 0);
  }, [watchedAmountHT, watchedTvaRate]);

  const totalAmountTTC = useMemo(() => {
    return calculateTotalTTC(watchedAmountHT || 0, watchedTvaRate || 0);
  }, [watchedAmountHT, watchedTvaRate]);

  // Calculate duration
  const duration = useMemo(() => {
    if (!watchedStartDate || !watchedEndDate) return null;
    try {
      const days = differenceInDays(new Date(watchedEndDate), new Date(watchedStartDate));
      if (days < 0) return null;
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      return { days, months, remainingDays };
    } catch {
      return null;
    }
  }, [watchedStartDate, watchedEndDate]);

  // Filter conventions by selected bailleurs
  const filteredConventions = useMemo(() => {
    if (!conventions) return [];
    if (selectedBailleurs.length === 0) return conventions;
    return conventions.filter(conv => selectedBailleurs.includes(conv.bailleur_id));
  }, [conventions, selectedBailleurs]);

  // Budget control validation
  const budgetControlResult = useMemo(() => {
    if (!watchedBudgetLineId || watchedBudgetLineId === '__none__' || !totalAmountTTC) {
      return null;
    }
    return validateContractEngagement(watchedBudgetLineId, totalAmountTTC, budgetLines);
  }, [watchedBudgetLineId, totalAmountTTC, budgetLines]);

  const isBlocked = budgetControlResult?.isBlocked || (budgetControlResult && !budgetControlResult.isAvailable);
  const isClosedContract = contract?.status === 'completed' || contract?.status === 'terminated';

  // Load existing contract data and relations
  useEffect(() => {
    const loadContractRelations = async () => {
      if (!contract?.id) return;
      setIsLoadingRelations(true);
      
      try {
        // Load bailleurs
        const { data: contractBailleurs } = await supabase
          .from('contract_bailleurs')
          .select('bailleur_id')
          .eq('contract_id', contract.id);
        
        if (contractBailleurs) {
          setSelectedBailleurs(contractBailleurs.map(cb => cb.bailleur_id));
        }
        
        // Load conventions
        const { data: contractConventions } = await supabase
          .from('contract_conventions')
          .select('convention_id')
          .eq('contract_id', contract.id);
        
        if (contractConventions) {
          setSelectedConventions(contractConventions.map(cc => cc.convention_id));
        }
      } catch (error) {
        console.error('Error loading contract relations:', error);
      } finally {
        setIsLoadingRelations(false);
      }
    };
    
    if (contract) {
      form.reset({
        code: contract.code,
        object: contract.object,
        description: contract.description || '',
        contract_type: contract.contract_type,
        status: contract.status,
        project_id: contract.project_id || '',
        bailleur_ids: [],
        convention_ids: [],
        contract_number: (contract as any).contract_number || '',
        attributaire: (contract as any).attributaire || contract.supplier_name || '',
        signing_date: contract.signing_date || '',
        start_date: contract.start_date || '',
        end_date: contract.end_date || '',
        amount_ht: (contract as any).amount_ht || contract.total_amount || 0,
        tva_rate: (contract as any).tva_rate || 18,
        currency_id: contract.currency_id || '',
        exchange_rate: contract.exchange_rate || 1,
        budget_line_id: contract.budget_line_id || '',
        payment_method: (contract as any).payment_method || 'transfer',
        notes: contract.notes || '',
      });
      loadContractRelations();
    } else {
      form.reset({
        code: '',
        object: '',
        description: '',
        contract_type: 'works',
        status: 'draft',
        project_id: '',
        bailleur_ids: [],
        convention_ids: [],
        contract_number: '',
        attributaire: '',
        signing_date: '',
        start_date: '',
        end_date: '',
        amount_ht: 0,
        tva_rate: 18,
        currency_id: '',
        exchange_rate: 1,
        budget_line_id: '',
        payment_method: 'transfer',
        notes: '',
      });
      setSelectedBailleurs([]);
      setSelectedConventions([]);
    }
  }, [contract, form]);

  const handleBailleurToggle = (bailleurId: string) => {
    setSelectedBailleurs(prev => 
      prev.includes(bailleurId) 
        ? prev.filter(id => id !== bailleurId)
        : [...prev, bailleurId]
    );
    // Clear selected conventions when bailleurs change
    setSelectedConventions([]);
  };

  const handleConventionToggle = (conventionId: string) => {
    setSelectedConventions(prev => 
      prev.includes(conventionId) 
        ? prev.filter(id => id !== conventionId)
        : [...prev, conventionId]
    );
  };

  const saveContractRelations = async (contractId: string) => {
    // Save bailleurs
    await supabase.from('contract_bailleurs').delete().eq('contract_id', contractId);
    if (selectedBailleurs.length > 0) {
      await supabase.from('contract_bailleurs').insert(
        selectedBailleurs.map(bailleurId => ({
          contract_id: contractId,
          bailleur_id: bailleurId,
        }))
      );
    }
    
    // Save conventions
    await supabase.from('contract_conventions').delete().eq('contract_id', contractId);
    if (selectedConventions.length > 0) {
      await supabase.from('contract_conventions').insert(
        selectedConventions.map(conventionId => ({
          contract_id: contractId,
          convention_id: conventionId,
        }))
      );
    }
  };

  const onSubmit = async (values: ContractFormValues) => {
    if (isClosedContract) {
      toast({ title: 'Marché clôturé', description: 'Impossible de modifier un marché clôturé', variant: 'destructive' });
      return;
    }

    // Validate amounts before saving
    const amountValidation = validateContractAmounts({
      amountHT: values.amount_ht,
      tvaRate: values.tva_rate || 0,
      totalTTC: totalAmountTTC,
    });

    if (!amountValidation.isValid) {
      toast({ 
        title: 'Erreur de validation', 
        description: amountValidation.errors.join('. '), 
        variant: 'destructive' 
      });
      return;
    }

    try {
      const { code, bailleur_ids, convention_ids, budget_line_id, ...restValues } = values;
      
      // Validate budget control if budget line is selected
      if (budget_line_id && budget_line_id !== '__none__') {
        const { canProceed } = await validateContractWithBudgetControl(
          budget_line_id,
          totalAmountTTC,
          budgetLines,
          user?.id,
          values.object
        );

        if (!canProceed) {
          return;
        }
      }

      // Validate dates
      if (values.start_date && values.end_date) {
        if (new Date(values.end_date) < new Date(values.start_date)) {
          toast({ title: 'Erreur', description: 'La date de fin doit être postérieure à la date de début', variant: 'destructive' });
          return;
        }
      }

      // Build contract data with properly calculated amounts
      const contractData = {
        ...restValues,
        budget_line_id: budget_line_id && budget_line_id !== '__none__' ? budget_line_id : null,
        total_amount: Math.round(totalAmountTTC), // Ensure whole number
        tva_amount: Math.round(tvaAmount), // Ensure whole number
        amount_ht: Math.round(values.amount_ht), // Store HT amount
        supplier_name: values.attributaire,
        remaining_amount: Math.round(totalAmountTTC), // Initially, remaining = total
        paid_amount: 0,
        engaged_amount: 0,
        created_by: user?.id,
      };

      if (contract) {
        const result = await updateContract.mutateAsync({ 
          id: contract.id, 
          code: contract.code,
          ...contractData 
        });
        await saveContractRelations(contract.id);
        
        // Log update
        await logAuditAction('update', contract.id, contract, result);
      } else {
        const result = await createContract.mutateAsync(contractData as any);
        if (result?.id) {
          await saveContractRelations(result.id);
          
          // Log creation
          await logAuditAction('create', result.id, null, result);
        }
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving contract:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {contract ? 'Modifier le marché' : 'Nouveau marché'}
            {isClosedContract && (
              <Badge variant="secondary" className="ml-2">
                <Lock className="h-3 w-3 mr-1" />
                Clôturé
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
            <Tabs defaultValue="general" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Général</span>
                </TabsTrigger>
                <TabsTrigger value="links" className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Liens</span>
                </TabsTrigger>
                <TabsTrigger value="financial" className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="hidden sm:inline">Financier</span>
                </TabsTrigger>
                <TabsTrigger value="contract" className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Contrat</span>
                </TabsTrigger>
              </TabsList>
              
              <ScrollArea className="flex-1 pr-4">
                {/* TAB: General Info */}
                <TabsContent value="general" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {contract ? (
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Code marché <Lock className="h-3 w-3 text-muted-foreground" />
                            </FormLabel>
                            <FormControl>
                              <Input {...field} disabled className="bg-muted font-mono" />
                            </FormControl>
                            <FormDescription>Auto-généré: MCH-AAAA-XXX</FormDescription>
                          </FormItem>
                        )}
                      />
                    ) : (
                      <div className="space-y-2">
                        <FormLabel className="flex items-center gap-2">
                          Code marché <Lock className="h-3 w-3 text-muted-foreground" />
                        </FormLabel>
                        <Input 
                          value="Généré automatiquement" 
                          disabled 
                          className="bg-muted text-muted-foreground italic font-mono"
                        />
                        <p className="text-xs text-muted-foreground">Format: MCH-AAAA-XXX</p>
                      </div>
                    )}
                    
                    <FormField
                      control={form.control}
                      name="contract_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type de marché *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={isClosedContract}>
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
                        <FormLabel>Intitulé du marché *</FormLabel>
                        <FormControl>
                          <Input placeholder="Intitulé du marché" {...field} disabled={isClosedContract} />
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
                        <FormLabel>Description / Objet</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Description détaillée du marché..." 
                            {...field} 
                            disabled={isClosedContract}
                            rows={3}
                          />
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
                        <Select onValueChange={field.onChange} value={field.value} disabled={isClosedContract}>
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

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Notes additionnelles..." 
                            {...field} 
                            disabled={isClosedContract}
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* TAB: Structural Links */}
                <TabsContent value="links" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="project_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Projet *</FormLabel>
                        <Select 
                          onValueChange={(val) => {
                            field.onChange(val);
                            setSelectedBailleurs([]);
                            setSelectedConventions([]);
                          }} 
                          value={field.value}
                          disabled={isClosedContract}
                        >
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

                  <div className="space-y-2">
                    <FormLabel>Bailleur(s)</FormLabel>
                    <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                      {bailleurs?.map((bailleur) => (
                        <div key={bailleur.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`bailleur-${bailleur.id}`}
                            checked={selectedBailleurs.includes(bailleur.id)}
                            onCheckedChange={() => handleBailleurToggle(bailleur.id)}
                            disabled={isClosedContract}
                          />
                          <label
                            htmlFor={`bailleur-${bailleur.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {bailleur.name} ({bailleur.code})
                          </label>
                        </div>
                      ))}
                    </div>
                    {selectedBailleurs.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedBailleurs.map(id => {
                          const bailleur = bailleurs?.find(b => b.id === id);
                          return bailleur ? (
                            <Badge key={id} variant="secondary" className="flex items-center gap-1">
                              {bailleur.code}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => handleBailleurToggle(id)}
                              />
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <FormLabel>Convention(s)</FormLabel>
                    {!watchedProjectId ? (
                      <p className="text-sm text-muted-foreground">Sélectionnez d'abord un projet</p>
                    ) : filteredConventions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aucune convention disponible pour ce projet</p>
                    ) : (
                      <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                        {filteredConventions.map((convention) => (
                          <div key={convention.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`convention-${convention.id}`}
                              checked={selectedConventions.includes(convention.id)}
                              onCheckedChange={() => handleConventionToggle(convention.id)}
                              disabled={isClosedContract}
                            />
                            <label
                              htmlFor={`convention-${convention.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {convention.code} - {convention.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedConventions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedConventions.map(id => {
                          const convention = conventions?.find(c => c.id === id);
                          return convention ? (
                            <Badge key={id} variant="secondary" className="flex items-center gap-1">
                              {convention.code}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => handleConventionToggle(id)}
                              />
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* TAB: Financial Data */}
                <TabsContent value="financial" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amount_ht"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Montant HT *</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} disabled={isClosedContract} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="tva_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>TVA (%)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" max="100" placeholder="18" {...field} disabled={isClosedContract} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <FormLabel>Montant TVA</FormLabel>
                      <Input 
                        value={tvaAmount.toLocaleString('fr-FR')} 
                        disabled 
                        className="bg-muted font-mono"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <FormLabel>Montant TTC</FormLabel>
                      <Input 
                        value={totalAmountTTC.toLocaleString('fr-FR')} 
                        disabled 
                        className="bg-muted font-mono font-bold"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="currency_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Devise</FormLabel>
                          <Select 
                            onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)} 
                            value={field.value || '__none__'}
                            disabled={isClosedContract}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une devise" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="__none__">Devise par défaut (XOF)</SelectItem>
                              {currencies?.map((currency) => (
                                <SelectItem key={currency.id} value={currency.id}>
                                  {currency.code} - {currency.name}
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
                            <Input type="number" step="0.0001" placeholder="1" {...field} disabled={isClosedContract} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <FormField
                    control={form.control}
                    name="budget_line_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ligne budgétaire</FormLabel>
                        <Select 
                          onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)} 
                          value={field.value || '__none__'}
                          disabled={isClosedContract}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une ligne budgétaire" />
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
                  {budgetControlResult && watchedBudgetLineId && watchedBudgetLineId !== '__none__' && (
                    <div className="space-y-2">
                      {budgetControlResult.isAvailable ? (
                        <Alert className="border-green-500/50 bg-green-500/10">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-700">
                            Budget suffisant. Disponible: {budgetControlResult.availableBudget.toLocaleString()} XOF
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                          <Ban className="h-4 w-4" />
                          <AlertDescription className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="font-semibold">DÉPASSEMENT BUDGÉTAIRE</span>
                          </AlertDescription>
                        </Alert>
                      )}
                      <div className="text-xs text-muted-foreground grid grid-cols-3 gap-2">
                        <span>Prévision: {budgetControlResult.forecastAmount.toLocaleString()} XOF</span>
                        <span>Engagé: {budgetControlResult.committedAmount.toLocaleString()} XOF</span>
                        <span>Consommé: {budgetControlResult.consumptionPercentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <FormField
                    control={form.control}
                    name="payment_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mode de paiement</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isClosedContract}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un mode" />
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
                </TabsContent>

                {/* TAB: Contract Info */}
                <TabsContent value="contract" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contract_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numéro du contrat</FormLabel>
                          <FormControl>
                            <Input placeholder="N° contrat" {...field} disabled={isClosedContract} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="attributaire"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Attributaire / Prestataire</FormLabel>
                          <FormControl>
                            <Input placeholder="Nom de l'attributaire" {...field} disabled={isClosedContract} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="signing_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de signature</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} disabled={isClosedContract} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date de début</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} disabled={isClosedContract} />
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
                            <Input type="date" {...field} disabled={isClosedContract} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {duration && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">
                        Durée calculée: {duration.months > 0 && `${duration.months} mois `}
                        {duration.remainingDays > 0 && `${duration.remainingDays} jours`}
                        <span className="text-muted-foreground ml-2">({duration.days} jours total)</span>
                      </p>
                    </div>
                  )}

                  {watchedStartDate && watchedEndDate && new Date(watchedEndDate) < new Date(watchedStartDate) && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        La date de fin doit être postérieure à la date de début
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>

            <Separator className="my-4" />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={createContract.isPending || updateContract.isPending || isBlocked || isClosedContract}
                className={isBlocked ? 'bg-destructive hover:bg-destructive cursor-not-allowed' : ''}
              >
                {isBlocked ? (
                  <>
                    <Ban className="h-4 w-4 mr-2" />
                    Bloqué
                  </>
                ) : isClosedContract ? (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Lecture seule
                  </>
                ) : (
                  contract ? 'Mettre à jour' : 'Créer le marché'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
