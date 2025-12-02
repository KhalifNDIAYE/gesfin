import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column } from './DataTable';
import { useLocations, useLocationMutations, useSites } from '@/hooks/useParametrage';
import type { Location } from '@/types/parametrage';
import { LocationDialog } from './dialogs/LocationDialog';

export function LocationsTab() {
  const { data: locations = [], isLoading } = useLocations();
  const { data: sites = [] } = useSites();
  const { createLocation, updateLocation, deleteLocation } = useLocationMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Location | null>(null);

  const columns: Column<Location>[] = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Nom' },
    {
      key: 'site.name',
      label: 'Site',
      render: (item) => item.site?.name || '-',
    },
    { key: 'description', label: 'Description' },
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

  const handleSave = (data: Omit<Location, 'id' | 'created_at' | 'updated_at' | 'site'>) => {
    if (editingItem) {
      updateLocation.mutate({ id: editingItem.id, ...data });
    } else {
      createLocation.mutate(data);
    }
    setDialogOpen(false);
    setEditingItem(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Emplacements</CardTitle>
        <CardDescription>
          Gérez les emplacements physiques de vos actifs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          data={locations}
          columns={columns}
          onAdd={() => {
            setEditingItem(null);
            setDialogOpen(true);
          }}
          onEdit={(item) => {
            setEditingItem(item);
            setDialogOpen(true);
          }}
          onDelete={(item) => deleteLocation.mutate(item.id)}
          searchKey="name"
          isLoading={isLoading}
          addLabel="Nouvel emplacement"
        />

        <LocationDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={handleSave}
          initialData={editingItem}
          sites={sites}
          isLoading={createLocation.isPending || updateLocation.isPending}
        />
      </CardContent>
    </Card>
  );
}
