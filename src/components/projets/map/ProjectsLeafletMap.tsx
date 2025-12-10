import { useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { ProjectMapData, projectStatusConfig } from '@/hooks/useProjectsMap';
import { formatCurrency } from '@/lib/utils';
import { MapViewMode } from './ProjectsMapControls';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface ProjectsLeafletMapProps {
  projects: ProjectMapData[];
  viewMode: MapViewMode;
  onProjectClick?: (project: ProjectMapData) => void;
  canEditLocation?: boolean;
  onLocationUpdate?: (projectId: string, lat: number, lng: number) => void;
}

// Create custom marker icon based on status
function createMarkerIcon(status: string, size: 'small' | 'normal' = 'normal'): L.DivIcon {
  const config = projectStatusConfig[status as keyof typeof projectStatusConfig] || projectStatusConfig.draft;
  const sizeValue = size === 'small' ? 24 : 32;
  const innerSize = size === 'small' ? 12 : 16;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${sizeValue}px;
        height: ${sizeValue}px;
        background-color: ${config.color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: ${innerSize}px;
          height: ${innerSize}px;
          background-color: white;
          border-radius: 50%;
          opacity: 0.4;
        "></div>
      </div>
    `,
    iconSize: [sizeValue, sizeValue],
    iconAnchor: [sizeValue / 2, sizeValue / 2],
    popupAnchor: [0, -sizeValue / 2],
  });
}

// Create popup content for a project
function createPopupContent(project: ProjectMapData): string {
  const statusConfig = projectStatusConfig[project.status] || projectStatusConfig.draft;
  const executionRate = project.total_budget > 0 
    ? Math.round((project.consumed_budget / project.total_budget) * 100) 
    : 0;
  
  const bailleurs = project.project_bailleurs?.map(pb => pb.bailleur?.short_name || pb.bailleur?.name).filter(Boolean) || [];
  const conventions = project.project_conventions?.map(pc => pc.convention?.code).filter(Boolean) || [];

  return `
    <div style="min-width: 280px; font-family: system-ui, sans-serif;">
      <div style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span style="font-size: 11px; color: #666; font-family: monospace;">${project.code}</span>
          <span style="
            font-size: 10px;
            padding: 2px 8px;
            border-radius: 9999px;
            background-color: ${statusConfig.color}22;
            color: ${statusConfig.color};
            border: 1px solid ${statusConfig.color}44;
          ">${statusConfig.label}</span>
        </div>
        <h3 style="font-size: 14px; font-weight: 600; margin: 0; line-height: 1.3;">${project.name}</h3>
      </div>
      
      ${bailleurs.length > 0 ? `
        <div style="margin-bottom: 8px;">
          <span style="font-size: 10px; color: #666;">Bailleurs:</span>
          <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px;">
            ${bailleurs.map(b => `<span style="font-size: 11px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${b}</span>`).join('')}
          </div>
        </div>
      ` : ''}
      
      ${conventions.length > 0 ? `
        <div style="margin-bottom: 8px;">
          <span style="font-size: 10px; color: #666;">Conventions:</span>
          <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px;">
            ${conventions.slice(0, 2).map(c => `<span style="font-size: 11px; border: 1px solid #e2e8f0; padding: 2px 6px; border-radius: 4px;">${c}</span>`).join('')}
            ${conventions.length > 2 ? `<span style="font-size: 11px; border: 1px solid #e2e8f0; padding: 2px 6px; border-radius: 4px;">+${conventions.length - 2}</span>` : ''}
          </div>
        </div>
      ` : ''}
      
      <div style="background: #f8fafc; border-radius: 6px; padding: 8px; margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
          <span style="color: #666;">Taux d'exécution</span>
          <span style="font-weight: 600;">${executionRate}%</span>
        </div>
        <div style="background: #e2e8f0; height: 6px; border-radius: 3px; overflow: hidden;">
          <div style="background: ${statusConfig.color}; height: 100%; width: ${executionRate}%;"></div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; font-size: 11px;">
          <div>
            <div style="color: #666;">Budget</div>
            <div style="font-weight: 500;">${formatCurrency(project.total_budget)} ${project.currency?.code || 'FCFA'}</div>
          </div>
          <div>
            <div style="color: #666;">Consommé</div>
            <div style="font-weight: 500;">${formatCurrency(project.consumed_budget)} ${project.currency?.code || 'FCFA'}</div>
          </div>
        </div>
      </div>
      
      <div style="display: flex; gap: 12px; font-size: 11px; color: #666; margin-bottom: 8px;">
        ${project.start_date && project.end_date ? `<span>📅 ${project.start_date.split('-')[0]} → ${project.end_date.split('-')[0]}</span>` : ''}
        ${project.responsible?.full_name ? `<span>👤 ${project.responsible.full_name}</span>` : ''}
      </div>
      
      <a href="/projets/${project.id}" style="
        display: block;
        text-align: center;
        background: #3b82f6;
        color: white;
        padding: 8px;
        border-radius: 6px;
        text-decoration: none;
        font-size: 12px;
        font-weight: 500;
      ">Voir détails du projet →</a>
    </div>
  `;
}

// Create cluster icon
function createClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const childCount = cluster.getChildCount();
  const childMarkers = cluster.getAllChildMarkers();
  
  // Count status distribution
  const statusCounts: Record<string, number> = {};
  childMarkers.forEach((marker: any) => {
    const status = marker.options.projectStatus || 'draft';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  
  // Find dominant status
  const dominantStatus = Object.entries(statusCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  const color = projectStatusConfig[dominantStatus as keyof typeof projectStatusConfig]?.color || '#3B82F6';
  
  // Size based on count
  let size = 40;
  if (childCount >= 10) size = 50;
  if (childCount >= 50) size = 60;
  
  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 4px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${size > 50 ? 16 : 14}px;
      ">${childCount}</div>
    `,
    className: 'marker-cluster-custom',
    iconSize: L.point(size, size),
    iconAnchor: L.point(size / 2, size / 2),
  });
}

export function ProjectsLeafletMap({
  projects,
  viewMode,
  onProjectClick,
  canEditLocation = false,
  onLocationUpdate,
}: ProjectsLeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  // Filter projects with valid coordinates
  const geolocatedProjects = useMemo(() => 
    projects.filter(p => p.latitude !== null && p.longitude !== null),
    [projects]
  );

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Default center: West Africa (Senegal area)
    const defaultCenter: L.LatLngExpression = [14.4974, -14.4524];
    const defaultZoom = 6;

    mapRef.current = L.map(containerRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      scrollWheelZoom: true,
      zoomControl: true,
    });

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    // Initialize layers
    markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
    clusterGroupRef.current = L.markerClusterGroup({
      iconCreateFunction: createClusterIcon,
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers based on view mode
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    // Clear existing layers
    markersLayerRef.current.clearLayers();
    if (clusterGroupRef.current) {
      clusterGroupRef.current.clearLayers();
      mapRef.current.removeLayer(clusterGroupRef.current);
    }

    if (geolocatedProjects.length === 0) return;

    const markers: L.Marker[] = [];

    geolocatedProjects.forEach((project) => {
      const marker = L.marker([project.latitude!, project.longitude!], {
        icon: createMarkerIcon(project.status),
        draggable: canEditLocation,
        projectStatus: project.status,
      } as any);

      marker.bindPopup(createPopupContent(project), {
        maxWidth: 350,
        minWidth: 280,
      });

      if (canEditLocation && onLocationUpdate) {
        marker.on('dragend', (e) => {
          const newPos = e.target.getLatLng();
          onLocationUpdate(project.id, newPos.lat, newPos.lng);
        });
      }

      if (onProjectClick) {
        marker.on('click', () => onProjectClick(project));
      }

      markers.push(marker);
    });

    // Add to appropriate layer based on view mode
    if (viewMode === 'cluster' && clusterGroupRef.current) {
      markers.forEach(m => clusterGroupRef.current!.addLayer(m));
      mapRef.current.addLayer(clusterGroupRef.current);
    } else {
      markers.forEach(m => markersLayerRef.current!.addLayer(m));
    }

    // Fit bounds to show all markers
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [geolocatedProjects, viewMode, canEditLocation, onLocationUpdate, onProjectClick]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full rounded-lg"
      style={{ minHeight: '500px' }}
    />
  );
}

export default ProjectsLeafletMap;
