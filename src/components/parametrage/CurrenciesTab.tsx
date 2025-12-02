import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column } from './DataTable';
import { useCurrencies, useCurrencyMutations } from '@/hooks/useParametrage';
import type { Currency } from '@/types/parametrage';
import { CurrencyDialog } from './dialogs/CurrencyDialog';

export function CurrenciesTab() {
  const { data: currencies = [], isLoading } = useCurrencies();
  const { createCurrency, updateCurrency, deleteCurrency } = useCurrencyMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Currency | null>(null);

  const columns: Column<Currency>[] = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Nom' },
    { key: 'symbol', label: 'Symbole' },
    {
      key: 'exchange_rate',
      label: 'Taux de change',
      render: (item) => item.exchange_rate.toFixed(4),
    },
    {
      key: 'is_default',
      label: 'Par défaut',
      render: (item) =>
        item.is_default ? <Badge variant="default">Devise principale</Badge> : null,
    },
  ];

  const handleSave = (data: Omit<Currency, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingItem) {
      updateCurrency.mutate({ id: editingItem.id, ...data });
    } else {
      createCurrency.mutate(data);
    }
    setDialogOpen(false);
    setEditingItem(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monnaies</CardTitle>
        <CardDescription>
          Gérez les devises et leurs taux de change
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          data={currencies}
          columns={columns}
          onAdd={() => {
            setEditingItem(null);
            setDialogOpen(true);
          }}
          onEdit={(item) => {
            setEditingItem(item);
            setDialogOpen(true);
          }}
          onDelete={(item) => deleteCurrency.mutate(item.id)}
          searchKey="name"
          isLoading={isLoading}
          addLabel="Nouvelle devise"
        />

        <CurrencyDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={handleSave}
          initialData={editingItem}
          isLoading={createCurrency.isPending || updateCurrency.isPending}
        />
      </CardContent>
    </Card>
  );
}
