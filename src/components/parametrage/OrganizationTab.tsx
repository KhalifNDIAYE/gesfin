import { useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOrganizationSettings, useOrganizationSettingsMutations, useCountries } from '@/hooks/useParametrage';
import { useOrganizationAssets } from '@/hooks/useOrganizationAssets';
import { usePermissions } from '@/hooks/usePermissions';
import { Building2, Save, Upload, X, Image, Globe2 } from 'lucide-react';
import { toast } from 'sonner';

const formSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  acronym: z.string().optional(),
  address: z.string().optional(),
  country_id: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  website: z.string().url('URL invalide').optional().or(z.literal('')),
  tax_id: z.string().optional(),
  logo_url: z.string().optional(),
  favicon_url: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function OrganizationTab() {
  const { data: settings, isLoading } = useOrganizationSettings();
  const { data: countries } = useCountries();
  const { updateOrganizationSettings } = useOrganizationSettingsMutations();
  const { uploadAsset, isUploading } = useOrganizationAssets();
  const { canAccess, isAdmin } = usePermissions();
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const canEdit = isAdmin || canAccess('parametres', 'update');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      acronym: '',
      address: '',
      country_id: '',
      city: '',
      phone: '',
      email: '',
      website: '',
      tax_id: '',
      logo_url: '',
      favicon_url: '',
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        name: settings.name || '',
        acronym: settings.acronym || '',
        address: settings.address || '',
        country_id: settings.country_id || '',
        city: settings.city || '',
        phone: settings.phone || '',
        email: settings.email || '',
        website: settings.website || '',
        tax_id: settings.tax_id || '',
        logo_url: settings.logo_url || '',
        favicon_url: settings.favicon_url || '',
      });
    }
  }, [settings, form]);

  // Update browser favicon when favicon_url changes
  const updateBrowserFavicon = useCallback((url: string) => {
    if (!url) return;
    
    const existingLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (existingLink) {
      existingLink.href = url;
    } else {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = url;
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    const faviconUrl = form.watch('favicon_url');
    if (faviconUrl) {
      updateBrowserFavicon(faviconUrl);
    }
  }, [form.watch('favicon_url'), updateBrowserFavicon]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadAsset(file, 'logo', form.getValues('logo_url'));
    if (url) {
      form.setValue('logo_url', url);
    }
    
    // Reset input
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadAsset(file, 'favicon', form.getValues('favicon_url'));
    if (url) {
      form.setValue('favicon_url', url);
      updateBrowserFavicon(url);
    }
    
    // Reset input
    if (faviconInputRef.current) {
      faviconInputRef.current.value = '';
    }
  };

  const removeLogo = () => {
    form.setValue('logo_url', '');
  };

  const removeFavicon = () => {
    form.setValue('favicon_url', '');
  };

  const onSubmit = (data: FormData) => {
    if (!settings?.id) return;
    if (!canEdit) {
      toast.error("Vous n'avez pas les droits pour modifier ces paramètres");
      return;
    }
    
    // Clean empty strings for optional fields
    const cleanedData = {
      ...data,
      country_id: data.country_id || null,
    };
    
    updateOrganizationSettings.mutate({
      id: settings.id,
      ...cleanedData,
    } as any);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Chargement...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Informations de l'organisation
        </CardTitle>
        <CardDescription>
          Personnalisez l'identité visuelle et les informations légales de votre organisation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Identity Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
                Identité
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l'organisation *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Mon Organisation" 
                          {...field} 
                          disabled={!canEdit}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="acronym"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sigle / Acronyme</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="MO" 
                          {...field} 
                          disabled={!canEdit}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Logo & Favicon Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
                Identité visuelle
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Logo Upload */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Logo de l'organisation
                  </Label>
                  <div className="flex items-start gap-4">
                    <div className="relative h-24 w-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50 overflow-hidden">
                      {form.watch('logo_url') ? (
                        <>
                          <img
                            src={form.watch('logo_url')}
                            alt="Logo"
                            className="h-full w-full object-contain p-2"
                          />
                          {canEdit && (
                            <button
                              type="button"
                              onClick={removeLogo}
                              className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </>
                      ) : (
                        <Image className="h-8 w-8 text-muted-foreground/50" />
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex flex-col gap-2">
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept=".png,.jpg,.jpeg,.svg"
                          onChange={handleLogoUpload}
                          className="hidden"
                          id="logo-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => logoInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {isUploading ? 'Upload...' : 'Choisir un logo'}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG ou SVG. Max 5 Mo
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Favicon Upload */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Globe2 className="h-4 w-4" />
                    Favicon de l'application
                  </Label>
                  <div className="flex items-start gap-4">
                    <div className="relative h-16 w-16 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50 overflow-hidden">
                      {form.watch('favicon_url') ? (
                        <>
                          <img
                            src={form.watch('favicon_url')}
                            alt="Favicon"
                            className="h-8 w-8 object-contain"
                          />
                          {canEdit && (
                            <button
                              type="button"
                              onClick={removeFavicon}
                              className="absolute top-1 right-1 p-0.5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </>
                      ) : (
                        <Globe2 className="h-6 w-6 text-muted-foreground/50" />
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex flex-col gap-2">
                        <input
                          ref={faviconInputRef}
                          type="file"
                          accept=".png,.ico,.svg"
                          onChange={handleFaviconUpload}
                          className="hidden"
                          id="favicon-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => faviconInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {isUploading ? 'Upload...' : 'Choisir un favicon'}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          PNG, ICO ou SVG. 32×32 ou 64×64 recommandé
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
                Adresse
              </h3>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="123 Rue Example"
                        className="resize-none"
                        {...field}
                        disabled={!canEdit}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ville</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Paris" 
                          {...field} 
                          disabled={!canEdit}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pays</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ''}
                        disabled={!canEdit}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un pays" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries?.map((country) => (
                            <SelectItem key={country.id} value={country.id}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Contact Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
                Contact
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+33 1 23 45 67 89" 
                          {...field} 
                          disabled={!canEdit}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="contact@organisation.com" 
                          {...field} 
                          disabled={!canEdit}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site web</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://www.organisation.com" 
                        {...field} 
                        disabled={!canEdit}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Legal Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
                Informations légales
              </h3>
              <FormField
                control={form.control}
                name="tax_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Identifiants légaux (SIRET, RC, etc.)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="123456789" 
                        {...field} 
                        disabled={!canEdit}
                      />
                    </FormControl>
                    <FormDescription>
                      Numéro fiscal, SIRET, registre du commerce ou autre identifiant légal
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {canEdit && (
              <div className="flex justify-end pt-4 border-t">
                <Button
                  type="submit"
                  disabled={updateOrganizationSettings.isPending || isUploading}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {updateOrganizationSettings.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </Button>
              </div>
            )}

            {!canEdit && (
              <div className="text-sm text-muted-foreground text-center py-4 border-t">
                Vous êtes en mode lecture seule. Contactez un administrateur pour modifier ces paramètres.
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
