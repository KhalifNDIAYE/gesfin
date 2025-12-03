import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useContractMutations, Contract } from '@/hooks/useContracts';
import { useEffect } from 'react';
import { Lock } from 'lucide-react';

const contractSchema = z.object({
  code: z.string().optional(),
  object: z.string().min(1, "L'objet est requis"),
  contract_type: z.string().min(1, 'Le type est requis'),
  status: z.string().min(1, 'Le statut est requis'),
  supplier_name: z.string().optional(),
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
  
  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      code: '',
      object: '',
      contract_type: 'works',
      status: 'draft',
      supplier_name: '',
      total_amount: 0,
      progress_percentage: 0,
      signing_date: '',
      start_date: '',
      end_date: '',
      description: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (contract) {
      form.reset({
        code: contract.code,
        object: contract.object,
        contract_type: contract.contract_type,
        status: contract.status,
        supplier_name: contract.supplier_name || '',
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
      const { code, ...restValues } = values;
      if (contract) {
        await updateContract.mutateAsync({ id: contract.id, code: contract.code, ...restValues });
      } else {
        await createContract.mutateAsync(restValues as any);
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
              <Button type="submit" disabled={createContract.isPending || updateContract.isPending}>
                {contract ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
