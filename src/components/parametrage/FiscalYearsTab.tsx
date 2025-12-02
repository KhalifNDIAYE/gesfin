import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column } from './DataTable';
import { useFiscalYears, useFiscalYearMutations } from '@/hooks/useParametrage';
import type { FiscalYear } from '@/types/parametrage';
import { FiscalYearDialog } from './dialogs/FiscalYearDialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function FiscalYearsTab() {
  const { data: fiscalYears = [], isLoading } = useFiscalYears();
  const { createFiscalYear, updateFiscalYear, deleteFiscalYear } = useFiscalYearMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FiscalYear | null>(null);

  const columns: Column<FiscalYear>[] = [
    { key: 'name', label: 'Nom' },
    {
      key: 'start_date',
      label: 'Date début',
      render: (item) => format(new Date(item.start_date), 'dd MMM yyyy', { locale: fr }),
    },
    {
      key: 'end_date',
      label: 'Date fin',
      render: (item) => format(new Date(item.end_date), 'dd MMM yyyy', { locale: fr }),
    },
    {
      key: 'is_open',
      label: 'Statut',
      render: (item) => (
        <Badge variant={item.is_open ? 'default' : 'secondary'}>
          {item.is_open ? 'Ouvert' : 'Clôturé'}
        </Badge>
      ),
    },
    {
      key: 'is_current',
      label: 'Courant',
      render: (item) =>
        item.is_current ? <Badge variant="outline">Exercice actif</Badge> : null,
    },
  ];

  const handleSave = (data: Omit<FiscalYear, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingItem) {
      updateFiscalYear.mutate({ id: editingItem.id, ...data });
    } else {
      createFiscalYear.mutate(data);
    }
    setDialogOpen(false);
    setEditingItem(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exercices Comptables</CardTitle>
        <CardDescription>
          Gérez les exercices comptables, leur ouverture et clôture
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          data={fiscalYears}
          columns={columns}
          onAdd={() => {
            setEditingItem(null);
            setDialogOpen(true);
          }}
          onEdit={(item) => {
            setEditingItem(item);
            setDialogOpen(true);
          }}
          onDelete={(item) => deleteFiscalYear.mutate(item.id)}
          searchKey="name"
          isLoading={isLoading}
          addLabel="Nouvel exercice"
        />

        <FiscalYearDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={handleSave}
          initialData={editingItem}
          isLoading={createFiscalYear.isPending || updateFiscalYear.isPending}
        />
      </CardContent>
    </Card>
  );
}
