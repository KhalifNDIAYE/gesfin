import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BudgetLine, useCreateBudgetLine, useUpdateBudgetLine } from "@/hooks/useBudget";
import { usePlanAccounts, useTrackingAxes } from "@/hooks/useParametrage";
import { useCostCenters } from "@/hooks/useComptabiliteAnalytique";

const formSchema = z.object({
  account_id: z.string().optional(),
  tracking_axis_id: z.string().optional(),
  cost_center_id: z.string().optional(),
  description: z.string().optional(),
  forecast_amount: z.coerce.number().min(0).default(0),
  forecast_amount_local: z.coerce.number().min(0).default(0),
  alert_threshold: z.coerce.number().min(0).max(100).default(80),
  line_number: z.coerce.number().min(1),
});

type FormData = z.infer<typeof formSchema>;

interface BudgetLineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetId: string;
  line?: BudgetLine | null;
  nextLineNumber: number;
}

export function BudgetLineDialog({ open, onOpenChange, budgetId, line, nextLineNumber }: BudgetLineDialogProps) {
  const { data: accounts } = usePlanAccounts('budgetaire');
  const { data: trackingAxes } = useTrackingAxes();
  const { data: costCenters } = useCostCenters();
  const createMutation = useCreateBudgetLine();
  const updateMutation = useUpdateBudgetLine();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      account_id: "",
      tracking_axis_id: "",
      cost_center_id: "",
      description: "",
      forecast_amount: 0,
      forecast_amount_local: 0,
      alert_threshold: 80,
      line_number: nextLineNumber,
    },
  });

  useEffect(() => {
    if (line) {
      form.reset({
        account_id: line.account_id || "",
        tracking_axis_id: line.tracking_axis_id || "",
        cost_center_id: line.cost_center_id || "",
        description: line.description || "",
        forecast_amount: Number(line.forecast_amount),
        forecast_amount_local: Number(line.forecast_amount_local),
        alert_threshold: Number(line.alert_threshold),
        line_number: line.line_number,
      });
    } else {
      form.reset({
        account_id: "",
        tracking_axis_id: "",
        cost_center_id: "",
        description: "",
        forecast_amount: 0,
        forecast_amount_local: 0,
        alert_threshold: 80,
        line_number: nextLineNumber,
      });
    }
  }, [line, nextLineNumber, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        budget_id: budgetId,
        account_id: data.account_id || null,
        tracking_axis_id: data.tracking_axis_id || null,
        cost_center_id: data.cost_center_id || null,
        committed_amount: line?.committed_amount || 0,
        committed_amount_local: line?.committed_amount_local || 0,
        realized_amount: line?.realized_amount || 0,
        realized_amount_local: line?.realized_amount_local || 0,
      };

      if (line) {
        await updateMutation.mutateAsync({ id: line.id, ...payload });
      } else {
        await createMutation.mutateAsync(payload as any);
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{line ? "Modifier la ligne" : "Nouvelle ligne budgétaire"}</DialogTitle>
          <DialogDescription>
            {line ? "Modifiez les informations de la ligne" : "Ajoutez une nouvelle ligne au budget"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="line_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>N° Ligne</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alert_threshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seuil d'alerte (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={100} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compte budgétaire</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un compte" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Aucun</SelectItem>
                      {accounts?.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.code} - {a.name}
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
              name="tracking_axis_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Axe de suivi</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un axe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Aucun</SelectItem>
                      {trackingAxes?.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.code} - {a.name}
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
              name="cost_center_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Centre de coûts</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un centre" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Aucun</SelectItem>
                      {costCenters?.map((c) => (
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Description de la ligne..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="forecast_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prévision (devise)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="forecast_amount_local"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prévision (locale)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {line ? "Mettre à jour" : "Ajouter"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
