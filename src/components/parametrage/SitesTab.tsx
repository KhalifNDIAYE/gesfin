import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column } from './DataTable';
import { useSites, useSiteMutations, useCountries } from '@/hooks/useParametrage';
import type { Site } from '@/types/parametrage';
import { SiteDialog } from './dialogs/SiteDialog';

export function SitesTab() {
  const { data: sites = [], isLoading } = useSites();
  const { data: countries = [] } = useCountries();
  const { createSite, updateSite, deleteSite } = useSiteMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Site | null>(null);

  const columns: Column<Site>[] = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Nom' },
    { key: 'address', label: 'Adresse' },
    {
      key: 'country.name',
      label: 'Pays',
      render: (item) => item.country?.name || '-',
    },
    {
      key: 'is_active',
      label: 'Statut',
      render: (item) => (
        <Badge variant={item.is_active ? 'default' : 'secondary'}>
          {item.is_active ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
  ];

  const handleSave = (data: Omit<Site, 'id' | 'created_at' | 'updated_at' | 'country'>) => {
    if (editingItem) {
      updateSite.mutate({ id: editingItem.id, ...data });
    } else {
      createSite.mutate(data);
    }
    setDialogOpen(false);
    setEditingItem(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sites</CardTitle>
        <CardDescription>
          Gérez les sites de votre organisation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          data={sites}
          columns={columns}
          onAdd={() => {
            setEditingItem(null);
            setDialogOpen(true);
          }}
          onEdit={(item) => {
            setEditingItem(item);
            setDialogOpen(true);
          }}
          onDelete={(item) => deleteSite.mutate(item.id)}
          searchKey="name"
          isLoading={isLoading}
          addLabel="Nouveau site"
        />

        <SiteDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={handleSave}
          initialData={editingItem}
          countries={countries}
          isLoading={createSite.isPending || updateSite.isPending}
        />
      </CardContent>
    </Card>
  );
}
