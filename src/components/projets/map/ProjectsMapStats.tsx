import { Card, CardContent } from '@/components/ui/card';
import { MapPin, MapPinOff, Building2, Wallet } from 'lucide-react';
import { ProjectMapData } from '@/hooks/useProjectsMap';
import { formatCurrency } from '@/lib/utils';

interface ProjectsMapStatsProps {
  projects: ProjectMapData[];
}

export function ProjectsMapStats({ projects }: ProjectsMapStatsProps) {
  const totalProjects = projects.length;
  const geolocatedProjects = projects.filter(p => p.latitude && p.longitude).length;
  const nonGeolocatedProjects = totalProjects - geolocatedProjects;
  
  const uniqueBailleurs = new Set(
    projects.flatMap(p => p.project_bailleurs?.map(pb => pb.bailleur?.id).filter(Boolean) || [])
  ).size;
  
  const totalBudget = projects.reduce((sum, p) => sum + (p.total_budget || 0), 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card className="bg-card/50">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-green-500/10">
              <MapPin className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Géolocalisés</p>
              <p className="text-lg font-semibold">{geolocatedProjects}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-orange-500/10">
              <MapPinOff className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sans position</p>
              <p className="text-lg font-semibold">{nonGeolocatedProjects}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-500/10">
              <Building2 className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Bailleurs</p>
              <p className="text-lg font-semibold">{uniqueBailleurs}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Budget total</p>
              <p className="text-lg font-semibold">{formatCurrency(totalBudget / 1000000)}M</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
