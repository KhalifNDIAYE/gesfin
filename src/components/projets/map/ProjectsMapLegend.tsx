import { projectStatusConfig } from '@/hooks/useProjectsMap';

interface ProjectsMapLegendProps {
  projectCounts: Record<string, number>;
}

export function ProjectsMapLegend({ projectCounts }: ProjectsMapLegendProps) {
  const statuses = Object.entries(projectStatusConfig);

  return (
    <div className="absolute bottom-4 left-4 z-[1000] bg-card/95 backdrop-blur border border-border rounded-lg p-3 shadow-lg">
      <h4 className="text-xs font-medium text-muted-foreground mb-2">Légende</h4>
      <div className="space-y-1.5">
        {statuses.map(([key, config]) => {
          const count = projectCounts[key] || 0;
          return (
            <div key={key} className="flex items-center gap-2 text-xs">
              <span 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: config.color }}
              />
              <span className="flex-1">{config.label}</span>
              <span className="text-muted-foreground font-mono">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
