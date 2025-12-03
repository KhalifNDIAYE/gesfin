import { useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { ThirdParty, ThirdPartyType, useThirdPartyMutations } from "@/hooks/useComptabilite";
import { Lock } from "lucide-react";

const formSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "Nom requis").max(200),
  third_party_type: z.enum(['fournisseur', 'client', 'employe', 'bailleur', 'autre']),
  account_code: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  tax_id: z.string().optional(),
  is_active: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface ThirdPartyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  thirdParty?: ThirdParty | null;
}

const THIRD_PARTY_TYPE_LABELS: Record<ThirdPartyType, string> = {
  fournisseur: "Fournisseur",
  client: "Client",
  employe: "Employé",
  bailleur: "Bailleur",
  autre: "Autre",
};

export function ThirdPartyDialog({ open, onOpenChange, thirdParty }: ThirdPartyDialogProps) {
  const { createMutation, updateMutation } = useThirdPartyMutations();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      third_party_type: "fournisseur",
      account_code: "",
      email: "",
      phone: "",
      address: "",
      tax_id: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (thirdParty) {
      form.reset({
        code: thirdParty.code,
        name: thirdParty.name,
        third_party_type: thirdParty.third_party_type,
        account_code: thirdParty.account_code || "",
        email: thirdParty.email || "",
        phone: thirdParty.phone || "",
        address: thirdParty.address || "",
        tax_id: thirdParty.tax_id || "",
        is_active: thirdParty.is_active,
      });
    } else {
      form.reset({
        code: "",
        name: "",
        third_party_type: "fournisseur",
        account_code: "",
        email: "",
        phone: "",
        address: "",
        tax_id: "",
        is_active: true,
      });
    }
  }, [thirdParty, form]);

  const onSubmit = async (data: FormData) => {
    const { code, ...restData } = data;
    const payload = {
      name: restData.name,
      third_party_type: restData.third_party_type,
      is_active: restData.is_active,
      account_code: restData.account_code || null,
      email: restData.email || null,
      phone: restData.phone || null,
      address: restData.address || null,
      tax_id: restData.tax_id || null,
    };

    if (thirdParty) {
      await updateMutation.mutateAsync({ id: thirdParty.id, code: thirdParty.code, ...payload });
    } else {
      await createMutation.mutateAsync(payload as any);
    }
    onOpenChange(false);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{thirdParty ? "Modifier le tiers" : "Nouveau tiers"}</DialogTitle>
          <DialogDescription>
            {thirdParty
              ? "Modifiez les informations du tiers"
              : "Créez un nouveau tiers (fournisseur, client, etc.)"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {thirdParty ? (
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
                  <p className="text-xs text-muted-foreground">Format: TIER-AAAA-XXX</p>
                </div>
              )}

              <FormField
                control={form.control}
                name="third_party_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(THIRD_PARTY_TYPE_LABELS).map(([value, label]) => (
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

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom / Raison sociale *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom du tiers" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="account_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compte auxiliaire</FormLabel>
                    <FormControl>
                      <Input placeholder="401001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tax_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>N° Fiscal / RCCM</FormLabel>
                    <FormControl>
                      <Input placeholder="NIF / RCCM" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input placeholder="+225 00 00 00 00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Adresse complète" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Actif</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Le tiers peut être utilisé dans les écritures
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="gradient" disabled={isLoading}>
                {isLoading ? "Enregistrement..." : thirdParty ? "Modifier" : "Créer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
