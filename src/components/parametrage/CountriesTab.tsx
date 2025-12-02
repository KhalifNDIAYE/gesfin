import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, Column } from './DataTable';
import { useCountries, useCountryMutations } from '@/hooks/useParametrage';
import type { Country } from '@/types/parametrage';
import { CountryDialog } from './dialogs/CountryDialog';

export function CountriesTab() {
  const { data: countries = [], isLoading } = useCountries();
  const { createCountry, updateCountry, deleteCountry } = useCountryMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Country | null>(null);

  const columns: Column<Country>[] = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Nom' },
  ];

  const handleSave = (data: Omit<Country, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingItem) {
      updateCountry.mutate({ id: editingItem.id, ...data });
    } else {
      createCountry.mutate(data);
    }
    setDialogOpen(false);
    setEditingItem(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pays</CardTitle>
        <CardDescription>
          Gérez la liste des pays
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          data={countries}
          columns={columns}
          onAdd={() => {
            setEditingItem(null);
            setDialogOpen(true);
          }}
          onEdit={(item) => {
            setEditingItem(item);
            setDialogOpen(true);
          }}
          onDelete={(item) => deleteCountry.mutate(item.id)}
          searchKey="name"
          isLoading={isLoading}
          addLabel="Nouveau pays"
        />

        <CountryDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={handleSave}
          initialData={editingItem}
          isLoading={createCountry.isPending || updateCountry.isPending}
        />
      </CardContent>
    </Card>
  );
}
