import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, User, Building2, FileText, ExternalLink } from 'lucide-react';
import { ProjectMapData, projectStatusConfig } from '@/hooks/useProjectsMap';
import { formatCurrency } from '@/lib/utils';

interface ProjectMarkerPopupProps {
  project: ProjectMapData;
}

export function ProjectMarkerPopup({ project }: ProjectMarkerPopupProps) {
  const statusConfig = projectStatusConfig[project.status] || projectStatusConfig.draft;
  const executionRate = project.total_budget > 0 
    ? Math.round((project.consumed_budget / project.total_budget) * 100) 
    : 0;

  const bailleurs = project.project_bailleurs?.map(pb => pb.bailleur).filter(Boolean) || [];
  const conventions = project.project_conventions?.map(pc => pc.convention).filter(Boolean) || [];

  return (
    <div className="min-w-[300px] max-w-[400px] p-1">
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-xs text-muted-foreground font-mono">{project.code}</p>
          <Badge 
            variant="outline" 
            className="text-xs"
            style={{ 
              borderColor: statusConfig.color, 
              color: statusConfig.color,
              backgroundColor: `${statusConfig.color}15`
            }}
          >
            {statusConfig.label}
          </Badge>
        </div>
        <h3 className="font-semibold text-sm leading-tight">{project.name}</h3>
      </div>

      {/* Bailleurs & Conventions */}
      <div className="space-y-2 mb-3">
        {bailleurs.length > 0 && (
          <div className="flex items-start gap-2">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
            <div className="flex flex-wrap gap-1">
              {bailleurs.map((b, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {b?.short_name || b?.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {conventions.length > 0 && (
          <div className="flex items-start gap-2">
            <FileText className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
            <div className="flex flex-wrap gap-1">
              {conventions.slice(0, 2).map((c, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {c?.code}
                </Badge>
              ))}
              {conventions.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{conventions.length - 2}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Budget Info */}
      <div className="bg-muted/50 rounded-md p-2 mb-3 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Taux d'exécution</span>
          <span className="font-medium">{executionRate}%</span>
        </div>
        <Progress value={executionRate} className="h-1.5" />
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Budget</p>
            <p className="font-medium">
              {formatCurrency(project.total_budget)} {project.currency?.code || 'FCFA'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Consommé</p>
            <p className="font-medium">
              {formatCurrency(project.consumed_budget)} {project.currency?.code || 'FCFA'}
            </p>
          </div>
        </div>
      </div>

      {/* Meta Info */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
        {project.start_date && project.end_date && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{project.start_date.split('-')[0]} → {project.end_date.split('-')[0]}</span>
          </div>
        )}
        {project.responsible?.full_name && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="truncate max-w-[120px]">{project.responsible.full_name}</span>
          </div>
        )}
      </div>

      {/* Action Button */}
      <Link to={`/projets/${project.id}`}>
        <Button size="sm" className="w-full h-8 text-xs">
          <ExternalLink className="h-3 w-3 mr-1" />
          Voir détails du projet
        </Button>
      </Link>
    </div>
  );
}
