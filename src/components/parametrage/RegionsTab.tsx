import { useState } from 'react';
import { useRegions, Region, RegionFormData } from '@/hooks/useRegions';
import { useCountries } from '@/hooks/useParametrage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export function RegionsTab() {
  const { regions, isLoading, createRegion, updateRegion, deleteRegion } = useRegions();
  const { data: countries = [] } = useCountries();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [formData, setFormData] = useState<RegionFormData>({
    code: '',
    name: '',
    country_id: null,
    latitude: null,
    longitude: null,
    is_active: true,
  });

  const handleOpenDialog = (region?: Region) => {
    if (region) {
      setEditingRegion(region);
      setFormData({
        code: region.code,
        name: region.name,
        country_id: region.country_id,
        latitude: region.latitude,
        longitude: region.longitude,
        is_active: region.is_active,
      });
    } else {
      setEditingRegion(null);
      setFormData({
        code: '',
        name: '',
        country_id: null,
        latitude: null,
        longitude: null,
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editingRegion) {
      await updateRegion.mutateAsync({ id: editingRegion.id, data: formData });
    } else {
      await createRegion.mutateAsync(formData);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette région ?')) {
      await deleteRegion.mutateAsync(id);
    }
  };

  if (isLoading) {
    return <div className="p-4">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Gestion des Régions</h3>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle région
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Pays</TableHead>
            <TableHead>Coordonnées</TableHead>
            <TableHead>Actif</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {regions.map((region) => (
            <TableRow key={region.id}>
              <TableCell className="font-mono">{region.code}</TableCell>
              <TableCell>{region.name}</TableCell>
              <TableCell>{region.country?.name || '-'}</TableCell>
              <TableCell>
                {region.latitude && region.longitude ? (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {region.latitude.toFixed(4)}, {region.longitude.toFixed(4)}
                  </span>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                <Switch checked={region.is_active} disabled />
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(region)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(region.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {regions.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Aucune région configurée
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRegion ? 'Modifier la région' : 'Nouvelle région'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="REG01"
                />
              </div>
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Dakar"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Pays</Label>
              <Select
                value={formData.country_id || ''}
                onValueChange={(value) => setFormData({ ...formData, country_id: value || null })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un pays" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.latitude ?? ''}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="14.6928"
                />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.longitude ?? ''}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="-17.4467"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Région active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.code || !formData.name}>
              {editingRegion ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
