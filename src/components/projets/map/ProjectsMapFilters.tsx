import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Filter, RotateCcw } from 'lucide-react';
import { 
  useBailleursForFilter, 
  useConventionsForFilter, 
  useSitesForFilter,
  MapFilters,
  projectStatusConfig
} from '@/hooks/useProjectsMap';

interface ProjectsMapFiltersProps {
  filters: MapFilters;
  onFiltersChange: (filters: MapFilters) => void;
}

const statusOptions = [
  { value: 'draft', label: 'Planifié' },
  { value: 'active', label: 'En cours' },
  { value: 'suspended', label: 'Bloqué' },
  { value: 'completed', label: 'Terminé' },
  { value: 'closed', label: 'Clôturé' },
];

export function ProjectsMapFilters({ filters, onFiltersChange }: ProjectsMapFiltersProps) {
  const { data: bailleurs = [] } = useBailleursForFilter();
  const { data: conventions = [] } = useConventionsForFilter(filters.bailleurId);
  const { data: sites = [] } = useSitesForFilter();

  const [localFilters, setLocalFilters] = useState<MapFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // When bailleur changes, reset convention filter
  useEffect(() => {
    if (localFilters.bailleurId !== filters.bailleurId) {
      setLocalFilters(prev => ({ ...prev, conventionId: undefined }));
    }
  }, [localFilters.bailleurId]);

  const handleFilterChange = (key: keyof MapFilters, value: string | undefined) => {
    const newFilters = { ...localFilters, [key]: value === 'all' ? undefined : value };
    
    // Reset convention when bailleur changes
    if (key === 'bailleurId') {
      newFilters.conventionId = undefined;
    }
    
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const resetFilters = () => {
    const emptyFilters: MapFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== '').length;

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Filtres</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary">{activeFilterCount} actif(s)</Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Réinitialiser
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Bailleur Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Bailleur</Label>
          <Select 
            value={localFilters.bailleurId || 'all'} 
            onValueChange={(v) => handleFilterChange('bailleurId', v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les bailleurs</SelectItem>
              {bailleurs.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.short_name || b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Convention Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Convention</Label>
          <Select 
            value={localFilters.conventionId || 'all'} 
            onValueChange={(v) => handleFilterChange('conventionId', v)}
            disabled={!localFilters.bailleurId}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder={localFilters.bailleurId ? "Toutes" : "Sélectionner un bailleur"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les conventions</SelectItem>
              {conventions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Statut</Label>
          <Select 
            value={localFilters.status || 'all'} 
            onValueChange={(v) => handleFilterChange('status', v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {statusOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: projectStatusConfig[s.value as keyof typeof projectStatusConfig]?.color }}
                    />
                    {s.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Site Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Site / Zone</Label>
          <Select 
            value={localFilters.siteId || 'all'} 
            onValueChange={(v) => handleFilterChange('siteId', v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les sites</SelectItem>
              {sites.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range - Start */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Début après</Label>
          <Input
            type="date"
            className="h-9"
            value={localFilters.startDate || ''}
            onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
          />
        </div>

        {/* Date Range - End */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Fin avant</Label>
          <Input
            type="date"
            className="h-9"
            value={localFilters.endDate || ''}
            onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
          />
        </div>
      </div>
    </div>
  );
}
