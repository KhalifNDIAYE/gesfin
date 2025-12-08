import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useBudgetTransfers } from '@/hooks/useBudgetTransfers';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Loader2 } from 'lucide-react';

const formSchema = z.object({
  source_budget_line_id: z.string().min(1, 'Sélectionnez une ligne source'),
  destination_budget_line_id: z.string().min(1, 'Sélectionnez une ligne destination'),
  amount: z.number().positive('Le montant doit être positif'),
  reason: z.string().min(10, 'Justification requise (min 10 caractères)'),
  description: z.string().optional(),
}).refine(data => data.source_budget_line_id !== data.destination_budget_line_id, {
  message: 'Les lignes source et destination doivent être différentes',
  path: ['destination_budget_line_id'],
});

type FormData = z.infer<typeof formSchema>;

interface BudgetLine {
  id: string;
  description: string | null;
  line_number: number;
  forecast_amount: number;
  committed_amount: number;
  realized_amount: number;
  budget: {
    id: string;
    name: string;
    code: string;
    status: string;
    is_frozen: boolean;
  };
}

interface BudgetTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BudgetTransferDialog = ({ open, onOpenChange }: BudgetTransferDialogProps) => {
  const { createTransfer } = useBudgetTransfers();
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  // Fetch all budget lines from validated budgets
  const { data: budgetLines, isLoading: isLoadingLines } = useQuery({
    queryKey: ['all-budget-lines-for-transfer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_lines')
        .select(`
          id,
          description,
          line_number,
          forecast_amount,
          committed_amount,
          realized_amount,
          budget:budgets(id, name, code, status, is_frozen)
        `)
        .order('line_number');

      if (error) throw error;
      
      // Filter only lines from validated and non-frozen budgets
      return (data as unknown as BudgetLine[])?.filter(
        line => line.budget?.status === 'valide' && !line.budget?.is_frozen
      ) || [];
    },
    enabled: open,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      source_budget_line_id: '',
      destination_budget_line_id: '',
      amount: 0,
      reason: '',
      description: '',
    },
  });

  const sourceLine = budgetLines?.find(l => l.id === selectedSource);
  const availableAmount = sourceLine 
    ? (sourceLine.forecast_amount || 0) - (sourceLine.committed_amount || 0) - (sourceLine.realized_amount || 0)
    : 0;

  const onSubmit = async (data: FormData) => {
    await createTransfer.mutateAsync({
      source_budget_line_id: data.source_budget_line_id,
      destination_budget_line_id: data.destination_budget_line_id,
      amount: data.amount,
      reason: data.reason,
      description: data.description,
    });
    form.reset();
    onOpenChange(false);
  };

  const getLineLabel = (line: BudgetLine) => {
    const desc = line.description || `Ligne ${line.line_number}`;
    return `${line.budget?.code} - ${desc}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouveau transfert budgétaire</DialogTitle>
          <DialogDescription>
            Créez une demande de transfert entre deux lignes budgétaires. 
            Le transfert nécessite la validation du Directeur puis de l'Administrateur.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-end">
              <FormField
                control={form.control}
                name="source_budget_line_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ligne source</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedSource(value);
                      }} 
                      value={field.value}
                      disabled={isLoadingLines}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingLines ? "Chargement..." : "Sélectionner..."} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {budgetLines?.map((line) => (
                          <SelectItem key={line.id} value={line.id}>
                            {getLineLabel(line)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedSource && (
                      <p className="text-xs text-muted-foreground">
                        Disponible: {availableAmount.toLocaleString()} XOF
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="hidden md:flex items-center justify-center pb-6">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>

              <FormField
                control={form.control}
                name="destination_budget_line_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ligne destination</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={isLoadingLines}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingLines ? "Chargement..." : "Sélectionner..."} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {budgetLines?.filter(l => l.id !== selectedSource).map((line) => (
                          <SelectItem key={line.id} value={line.id}>
                            {getLineLabel(line)}
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
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant à transférer (XOF)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  {selectedSource && field.value > availableAmount && (
                    <p className="text-xs text-destructive">
                      Le montant dépasse le disponible ({availableAmount.toLocaleString()} XOF)
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justification *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Expliquez pourquoi ce transfert est nécessaire..."
                      className="min-h-[100px]"
                      {...field}
                    />
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
                  <FormLabel>Description additionnelle</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informations complémentaires (optionnel)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createTransfer.isPending}>
                {createTransfer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Soumettre la demande
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
