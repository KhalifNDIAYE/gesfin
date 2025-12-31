import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable, Column } from './DataTable';
import { usePlanAccounts, usePlanAccountMutations } from '@/hooks/usePlanAccounts';
import type { PlanAccount, PlanType } from '@/types/parametrage';
import { PLAN_TYPE_LABELS } from '@/types/parametrage';
import { PlanAccountDialog } from './dialogs/PlanAccountDialog';

const planTypes: PlanType[] = ['comptable', 'budgetaire', 'analytique', 'financier', 'geographique'];

export function PlansTab() {
  const [activePlan, setActivePlan] = useState<PlanType>('comptable');
  const { data: accounts = [], isLoading } = usePlanAccounts(activePlan);
  const { createPlanAccount, updatePlanAccount, deletePlanAccount } = usePlanAccountMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PlanAccount | null>(null);

  const columns: Column<PlanAccount>[] = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Libellé' },
    { key: 'level', label: 'Niveau' },
    {
      key: 'parent_id',
      label: 'Compte parent',
      render: (item) => {
        if (!item.parent_id) return '-';
        const parent = accounts.find((a) => a.id === item.parent_id);
        return parent ? `${parent.code} - ${parent.name}` : '-';
      },
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

  const handleSave = (data: Omit<PlanAccount, 'id' | 'created_at' | 'updated_at' | 'children'>) => {
    if (editingItem) {
      updatePlanAccount.mutate({ id: editingItem.id, ...data });
    } else {
      createPlanAccount.mutate(data);
    }
    setDialogOpen(false);
    setEditingItem(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plans</CardTitle>
        <CardDescription>
          Gérez vos différents plans : comptable, budgétaire, analytique, financier et géographique
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activePlan} onValueChange={(v) => setActivePlan(v as PlanType)}>
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            {planTypes.map((type) => (
              <TabsTrigger key={type} value={type} className="text-xs sm:text-sm">
                {PLAN_TYPE_LABELS[type]}
              </TabsTrigger>
            ))}
          </TabsList>

          {planTypes.map((type) => (
            <TabsContent key={type} value={type}>
              <DataTable
                data={accounts}
                columns={columns}
                onAdd={() => {
                  setEditingItem(null);
                  setDialogOpen(true);
                }}
                onEdit={(item) => {
                  setEditingItem(item);
                  setDialogOpen(true);
                }}
                onDelete={(item) => deletePlanAccount.mutate(item.id)}
                searchKey="name"
                isLoading={isLoading}
                addLabel="Nouveau compte"
              />
            </TabsContent>
          ))}
        </Tabs>

        <PlanAccountDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={handleSave}
          initialData={editingItem}
          planType={activePlan}
          accounts={accounts}
          isLoading={createPlanAccount.isPending || updatePlanAccount.isPending}
        />
      </CardContent>
    </Card>
  );
}
