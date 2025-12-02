import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column } from './DataTable';
import { useTrackingAxes, useTrackingAxisMutations } from '@/hooks/useParametrage';
import type { TrackingAxis } from '@/types/parametrage';
import { TrackingAxisDialog } from './dialogs/TrackingAxisDialog';

export function TrackingAxesTab() {
  const { data: axes = [], isLoading } = useTrackingAxes();
  const { createTrackingAxis, updateTrackingAxis, deleteTrackingAxis } = useTrackingAxisMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TrackingAxis | null>(null);

  const columns: Column<TrackingAxis>[] = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Nom' },
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

  const handleSave = (data: Omit<TrackingAxis, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingItem) {
      updateTrackingAxis.mutate({ id: editingItem.id, ...data });
    } else {
      createTrackingAxis.mutate(data);
    }
    setDialogOpen(false);
    setEditingItem(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Axes de suivi</CardTitle>
        <CardDescription>
          Configurez les axes de suivi pour l'analyse multidimensionnelle
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          data={axes}
          columns={columns}
          onAdd={() => {
            setEditingItem(null);
            setDialogOpen(true);
          }}
          onEdit={(item) => {
            setEditingItem(item);
            setDialogOpen(true);
          }}
          onDelete={(item) => deleteTrackingAxis.mutate(item.id)}
          searchKey="name"
          isLoading={isLoading}
          addLabel="Nouvel axe"
        />

        <TrackingAxisDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={handleSave}
          initialData={editingItem}
          isLoading={createTrackingAxis.isPending || updateTrackingAxis.isPending}
        />
      </CardContent>
    </Card>
  );
}
