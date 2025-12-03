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
import { useCreateConvention, useUpdateConvention, Convention, useBailleurs } from "@/hooks/useConventionsBailleurs";
import { useCurrencies } from "@/hooks/useParametrage";
import { Lock } from "lucide-react";

const formSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "Nom requis"),
  bailleur_id: z.string().min(1, "Bailleur requis"),
  currency_id: z.string().min(1, "Devise requise"),
  total_amount: z.number().min(0, "Montant invalide"),
  exchange_rate: z.number().min(0, "Taux invalide"),
  signing_date: z.string().optional(),
  effective_date: z.string().optional(),
  closing_date: z.string().optional(),
  status: z.string(),
  convention_type: z.string(),
  description: z.string().optional(),
  objectives: z.string().optional(),
  special_conditions: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ConventionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  convention?: Convention | null;
}

const statusOptions = [
  { value: "draft", label: "Brouillon" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspendue" },
  { value: "closed", label: "Clôturée" },
];

const typeOptions = [
  { value: "grant", label: "Don" },
  { value: "loan", label: "Prêt" },
  { value: "mixed", label: "Mixte" },
];

export function ConventionDialog({ open, onOpenChange, convention }: ConventionDialogProps) {
  const createConvention = useCreateConvention();
  const updateConvention = useUpdateConvention();
  const { data: bailleurs } = useBailleurs();
  const { data: currencies } = useCurrencies();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      bailleur_id: "",
      currency_id: "",
      total_amount: 0,
      exchange_rate: 1,
      signing_date: "",
      effective_date: "",
      closing_date: "",
      status: "draft",
      convention_type: "grant",
      description: "",
      objectives: "",
      special_conditions: "",
    },
  });

  useEffect(() => {
    if (convention) {
      form.reset({
        code: convention.code,
        name: convention.name,
        bailleur_id: convention.bailleur_id,
        currency_id: convention.currency_id,
        total_amount: convention.total_amount,
        exchange_rate: convention.exchange_rate,
        signing_date: convention.signing_date || "",
        effective_date: convention.effective_date || "",
        closing_date: convention.closing_date || "",
        status: convention.status,
        convention_type: convention.convention_type,
        description: convention.description || "",
        objectives: convention.objectives || "",
        special_conditions: convention.special_conditions || "",
      });
    } else {
      form.reset({
        code: "",
        name: "",
        bailleur_id: "",
        currency_id: "",
        total_amount: 0,
        exchange_rate: 1,
        signing_date: "",
        effective_date: "",
        closing_date: "",
        status: "draft",
        convention_type: "grant",
        description: "",
        objectives: "",
        special_conditions: "",
      });
    }
  }, [convention, form]);

  const onSubmit = async (values: FormValues) => {
    const { code, ...restValues } = values;
    const totalAmountLocal = restValues.total_amount * restValues.exchange_rate;
    const data = {
      ...restValues,
      total_amount_local: totalAmountLocal,
      signing_date: restValues.signing_date || null,
      effective_date: restValues.effective_date || null,
      closing_date: restValues.closing_date || null,
    };

    if (convention) {
      await updateConvention.mutateAsync({ id: convention.id, code: convention.code, ...data });
    } else {
      await createConvention.mutateAsync(data as any);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {convention ? "Modifier la convention" : "Nouvelle convention"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {convention ? (
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
                  <p className="text-xs text-muted-foreground">Format: CONV-AAAA-XXX</p>
                </div>
              )}
              <FormField
                control={form.control}
                name="bailleur_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bailleur *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un bailleur" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bailleurs?.filter(b => b.is_active).map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.short_name || b.name}
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la convention *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Projet d'Appui..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
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
              <FormField
                control={form.control}
                name="total_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant total *</FormLabel>
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
                name="exchange_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taux de change</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.0001"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
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
              <FormField
                control={form.control}
                name="convention_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {typeOptions.map((t) => (
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
                name="effective_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date d'effet</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="closing_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de clôture</FormLabel>
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
                    <Textarea {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="objectives"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objectifs</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="special_conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conditions particulières</FormLabel>
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
              <Button type="submit" disabled={createConvention.isPending || updateConvention.isPending}>
                {convention ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
