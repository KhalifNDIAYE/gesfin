import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column } from './DataTable';
import { useWorkUnits, useWorkUnitMutations } from '@/hooks/useParametrage';
import type { WorkUnit } from '@/types/parametrage';
import { WorkUnitDialog } from './dialogs/WorkUnitDialog';

export function WorkUnitsTab() {
  const { data: workUnits = [], isLoading } = useWorkUnits();
  const { createWorkUnit, updateWorkUnit, deleteWorkUnit } = useWorkUnitMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkUnit | null>(null);

  const columns: Column<WorkUnit>[] = [
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

  const handleSave = (data: Omit<WorkUnit, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingItem) {
      updateWorkUnit.mutate({ id: editingItem.id, ...data });
    } else {
      createWorkUnit.mutate(data);
    }
    setDialogOpen(false);
    setEditingItem(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unités d'œuvre</CardTitle>
        <CardDescription>
          Gérez les unités d'œuvre utilisées pour la répartition analytique
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          data={workUnits}
          columns={columns}
          onAdd={() => {
            setEditingItem(null);
            setDialogOpen(true);
          }}
          onEdit={(item) => {
            setEditingItem(item);
            setDialogOpen(true);
          }}
          onDelete={(item) => deleteWorkUnit.mutate(item.id)}
          searchKey="name"
          isLoading={isLoading}
          addLabel="Nouvelle unité"
        />

        <WorkUnitDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={handleSave}
          initialData={editingItem}
          isLoading={createWorkUnit.isPending || updateWorkUnit.isPending}
        />
      </CardContent>
    </Card>
  );
}
