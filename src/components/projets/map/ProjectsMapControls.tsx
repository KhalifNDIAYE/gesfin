import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MapPin, Layers, Flame, DollarSign, Download, FileImage, FileSpreadsheet, FileText } from 'lucide-react';

export type MapViewMode = 'markers' | 'cluster' | 'heatmap' | 'funding';

interface ProjectsMapControlsProps {
  viewMode: MapViewMode;
  onViewModeChange: (mode: MapViewMode) => void;
  onExportPNG?: () => void;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  canExport?: boolean;
}

export function ProjectsMapControls({
  viewMode,
  onViewModeChange,
  onExportPNG,
  onExportPDF,
  onExportExcel,
  canExport = true,
}: ProjectsMapControlsProps) {
  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      {/* View Mode Toggle */}
      <div className="bg-card/95 backdrop-blur border border-border rounded-lg p-1.5 shadow-lg">
        <ToggleGroup 
          type="single" 
          value={viewMode} 
          onValueChange={(v) => v && onViewModeChange(v as MapViewMode)}
          className="flex flex-col gap-1"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem value="markers" size="sm" className="h-8 w-8 p-0">
                <MapPin className="h-4 w-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="left">Marqueurs</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem value="cluster" size="sm" className="h-8 w-8 p-0">
                <Layers className="h-4 w-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="left">Regroupement</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem value="heatmap" size="sm" className="h-8 w-8 p-0">
                <Flame className="h-4 w-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="left">Heatmap</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem value="funding" size="sm" className="h-8 w-8 p-0">
                <DollarSign className="h-4 w-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="left">Financement</TooltipContent>
          </Tooltip>
        </ToggleGroup>
      </div>

      {/* Export Controls */}
      {canExport && (
        <div className="bg-card/95 backdrop-blur border border-border rounded-lg p-1.5 shadow-lg">
          <div className="flex flex-col gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onExportPNG}>
                  <FileImage className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Capture PNG</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onExportPDF}>
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Export PDF</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onExportExcel}>
                  <FileSpreadsheet className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Export Excel</TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
}
