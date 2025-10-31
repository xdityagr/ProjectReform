// MapPage.tsx
import { useState, useEffect, useRef } from 'react';
import Logo from '@/assets/logo.png';

import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as turf from '@turf/turf';
import { Sparkles, MessageSquare, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdvancedSearchBar from '@/components/AdvancedSearchBar';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import AQIWidget from '@/components/AQIWidget';
import TrafficHeatmap from '@/components/TrafficHeatmap';
import ReportModal from '@/components/ReportModal';
import PlannerActionsModal from '@/components/PlannerActionsModal';
import AIChatPanel from '@/components/AIChatPanel';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Report } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
if (!mapboxToken) {
  throw new Error(
    'VITE_MAPBOX_TOKEN environment variable is not configured. Please add it to your Replit/ENV.'
  );
}
mapboxgl.accessToken = mapboxToken;

const JAIPUR_CENTER: [number, number] = [75.8267, 26.9124];

export default function MapPage() {
  const [, setLocation] = useLocation();
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [userRole] = useState<'citizen' | 'planner'>(
    () => (localStorage.getItem('userRole') as 'citizen' | 'planner') || 'citizen'
  );
  const [userId] = useState(() => localStorage.getItem('userId') || '');
  const [userEmail] = useState(() => localStorage.getItem('userEmail') || '');
  const { toast } = useToast();

  const [analytics, setAnalytics] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPlannerActions, setShowPlannerActions] = useState(false);
  const [reportLocation, setReportLocation] = useState<[number, number] | null>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiMinimized, setAiMinimized] = useState(false);

  // Planner-specific state for "Select area" feature
  const [isSelectMode, setIsSelectMode] = useState(false);
  const isSelectModeRef = useRef(false); // Initialize with false
  const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [plannerModalOpen, setPlannerModalOpen] = useState(false);
  const selectedMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Keep isSelectModeRef in sync with isSelectMode state
  useEffect(() => {
    isSelectModeRef.current = isSelectMode;
  }, [isSelectMode]);

  const { data: reports = [] } = useQuery<Report[]>({
    queryKey: ['/api/reports'],
  });

  const createReportMutation = useMutation({
    mutationFn: async (report: any) => apiRequest('POST', '/api/reports', report),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      toast({ title: 'Report submitted', description: 'Your report has been successfully submitted' });
    },
    onError: (error: any) =>
      toast({ title: 'Failed to submit report', description: error.message, variant: 'destructive' }),
  });

const deleteReportMutation = useMutation({
  mutationFn: (reportId: string | number) => apiRequest('DELETE', `/api/reports/${reportId}`),

  // optimistic update: remove from cache and map immediately
  onMutate: async (reportId) => {
    await queryClient.cancelQueries({ queryKey: ['/api/reports'] });

    const previous = queryClient.getQueryData<Report[]>(['/api/reports']) || [];

    // Optimistically remove from cache
    queryClient.setQueryData<Report[]>(['/api/reports'], (old = []) =>
      old.filter((r: any) => String(r.id) !== String(reportId))
    );

    // Best-effort map cleanup now (so user sees immediate removal)
    try {
      if (map.current) {
        const layerId = `report-marker-${reportId}`;
        const sourceId = `report-source-${reportId}`;
        if (map.current.getLayer(layerId)) {
          map.current.removeLayer(layerId);
        }
        if (map.current.getSource(sourceId)) {
          map.current.removeSource(sourceId);
        }
      }
    } catch (e) {
      console.warn('map cleanup onMutate failed', e);
    }

    return { previous };
  },

  // rollback on error
  onError: (err, reportId, context: any) => {
    console.error('deleteReportMutation error', err);
    if (context?.previous) {
      queryClient.setQueryData<Report[]>(['/api/reports'], context.previous);
    }
    toast({
      title: 'Failed to delete report',
      description: (err as any)?.message || 'Server error',
      variant: 'destructive',
    });
  },

  // confirm success: ensure map + cache cleaned (idempotent)
  onSuccess: (_, reportId) => {
    try {
      if (map.current) {
        const layerId = `report-marker-${reportId}`;
        const sourceId = `report-source-${reportId}`;
        if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
        if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);
      }
    } catch (e) {
      console.warn('map cleanup onSuccess failed', e);
    }

    // ensure cache doesn't contain the item
    queryClient.setQueryData<Report[]>(['/api/reports'], (old = []) =>
      old.filter((r: any) => String(r.id) !== String(reportId))
    );
    console.log("Deleted from server:", reportId);
fetch('/api/reports')
  .then(r => r.json())
  .then(data => console.log("Server state NOW:", data));

    toast({ title: 'Report deleted', description: 'The report has been removed.' });
  },

  // always refetch server state as a final safety net
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
  },
});


  const mockAnalytics = {
    residential: 2500000,
    commercial: 800000,
    industrial: 600000,
    green: 1200000,
    construction: 300000,
    total: 5400000,
  };

  const mockTrafficData = {
    level: 'medium' as const,
    percentage: 65,
    avgSpeed: 35,
    predictedCongestion: 72,
  };

  const [currentLocation, setCurrentLocation] = useState<[number, number]>(JAIPUR_CENTER);
  const [aqiValue, setAqiValue] = useState(85);

  const { data: aqiData, refetch: refetchAQI } = useQuery({
    queryKey: ['/api/aqi', currentLocation[1], currentLocation[0]],
    queryFn: async () => {
      const response = await fetch(`/api/aqi?lat=${currentLocation[1]}&lon=${currentLocation[0]}`);
      if (!response.ok) throw new Error('Failed to fetch AQI');
      return response.json();
    },
    enabled: !!currentLocation,
  });

  useEffect(() => {
    if (aqiData?.aqi) setAqiValue(aqiData.aqi);
  }, [aqiData]);

  // ---- Map init ----
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: JAIPUR_CENTER,
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    map.current.on('click', (e) => {
      // First, query the map to see what features, if any, were clicked
      const features = map.current?.queryRenderedFeatures(e.point);

      if (userRole === 'citizen') {
        // Check if any of the clicked features are one of our report markers
        const reportFeature = features?.find((f) => f.layer?.id.startsWith('report-marker-'));

        if (reportFeature && reportFeature.properties?.reportId) {
          // If a report marker was clicked, show the deletion confirmation
          const reportId = reportFeature.properties?.reportId ?? null;
          const reportKey = reportFeature.properties?.reportKey ?? null;

          // If server uses reportId/_id use that, otherwise use reportKey which matches the layer/source naming
          const identifierToDelete = reportId ?? reportKey;
          if (!identifierToDelete) {
            console.warn('Clicked report without an id/key', reportFeature);
          } else {
            if (window.confirm('Do you want to delete this report?')) {
              deleteReportMutation.mutate(identifierToDelete);
            }
          }
          return; // Stop processing to prevent other modals from opening
        }

        // If no report marker was clicked, check if a landuse polygon was clicked.
        // If so, we do nothing here, allowing the separate landuse popup to appear without interference.
        const landuseFeature = features?.find((f) => f.layer?.id === 'landuse-fill');
        if (landuseFeature) {
          return;
        }

        // If no interactive feature was clicked, open the report creation modal
        setReportLocation([e.lngLat.lng, e.lngLat.lat]);
        setShowReportModal(true);
      } else if (userRole === 'planner' && isSelectModeRef.current) {
        // Planner: only respond when in select mode
        // remove previous selected marker
        if (selectedMarkerRef.current) {
          try { selectedMarkerRef.current.remove(); } catch (e) {}
          selectedMarkerRef.current = null;
        }

        // create a visible pin element with a popup
        const el = document.createElement('div');
        el.className = 'selected-pin';
        Object.assign(el.style, {
          width: '20px',
          height: '20px',
          backgroundColor: '#06b6d4',
          borderRadius: '50%',
          border: '2px solid white',
          boxShadow: '0 4px 12px rgba(6, 182, 212, 0.25)',
          transform: 'translateY(-4px)',
        });
        
        // Create popup
        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          anchor: 'left',
          offset: [10, 0],
          className: 'planning-popup'
        })
        .setHTML(
          `<div style="padding: 8px; font-size: 12px;">
            <div style="font-weight: 500; color: #06b6d4;">Planning Area Selected</div>
            <div style="color: #6b7280; margin-top: 2px;">
              ${e.lngLat.lat.toFixed(4)}, ${e.lngLat.lng.toFixed(4)}
            </div>
          </div>`
        );

        selectedMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([e.lngLat.lng, e.lngLat.lat])
          .addTo(map.current as mapboxgl.Map); // Cast to mapboxgl.Map

        const newPoint = { lat: e.lngLat.lat, lng: e.lngLat.lng };
        setSelectedPoint(newPoint);
        setPlannerModalOpen(true);
        setIsSelectMode(false);
        // Update current location and refetch AQI
        setCurrentLocation([newPoint.lng, newPoint.lat]);
        refetchAQI();
        return;
      }

      // otherwise planner clicks do nothing
    });

    // set initial analytics after map ready
    setTimeout(() => setAnalytics(mockAnalytics as any), 1500);

    return () => {
      markersRef.current.forEach((m) => m.remove());
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole]);

  // ---- Reports -> markers ----
// inside MapPage.tsx — replace the whole useEffect that watches `reports` with this:

useEffect(() => {
  if (!map.current) return;

  const getReportKey = (report: any, idx: number) => {
    // Prefer id or _id from server; fall back to unique index-based key
    return String(report.id ?? report._id ?? `idx-${idx}`);
  };

  const addMarkers = () => {
    // Remove old report layers/sources safely
    const style = map.current!.getStyle();
    if (style && style.layers) {
      const toRemove = style.layers
        .map(l => l.id)
        .filter(id => id && id.startsWith('report-marker-')) as string[];
      toRemove.forEach((layerId) => {
        if (map.current!.getLayer(layerId)) {
          try { map.current!.removeLayer(layerId); } catch (e) {}
        }
      });
    }
    if (style && style.sources) {
      Object.keys(style.sources).forEach((sourceId) => {
        if (sourceId.startsWith('report-source-')) {
          try { if (map.current!.getSource(sourceId)) map.current!.removeSource(sourceId); } catch (e) {}
        }
      });
    }

    // Add current reports
    reports.forEach((report: any, idx: number) => {
      const key = getReportKey(report, idx);
      const layerId = `report-marker-${key}`;
      const sourceId = `report-source-${key}`;

      const feature = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [report.longitude, report.latitude] },
        properties: { reportKey: key, reportId: report.id ?? report._id ?? null },
      } as GeoJSON.Feature;

      if (map.current!.getSource(sourceId)) {
        try {
          (map.current!.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(feature);
        } catch (e) {
          // source exists but updating failed — remove and re-add
          try { map.current!.removeSource(sourceId); } catch (err) {}
          map.current!.addSource(sourceId, { type: 'geojson', data: feature });
        }
      } else {
        map.current!.addSource(sourceId, { type: 'geojson', data: feature });
      }

      if (!map.current!.getLayer(layerId)) {
        map.current!.addLayer({
          id: layerId,
          type: 'circle',
          source: sourceId,
          paint: {
            'circle-radius': 10,
            'circle-color':
              ({
                pothole: '#ef4444',
                construction: '#f97316',
                'park-idea': '#22c55e',
                traffic: '#eab308',
              } as Record<string, string>)[report.category] || '#3b82f6',
            'circle-stroke-width': 2,
            'circle-stroke-color': 'white',
          },
        });
      }
    });
  };

  if (map.current.isStyleLoaded()) addMarkers();
  else map.current.once('style.load', addMarkers);

  return () => {
    if (!map.current) return;
    if (!map.current.isStyleLoaded()) return;

    // cleanup only report layers/sources we created
    const style = map.current.getStyle();
    if (style && style.layers) {
      style.layers.forEach((layer) => {
        if (layer.id.startsWith('report-marker-') && map.current!.getLayer(layer.id)) {
          try { map.current!.removeLayer(layer.id); } catch (e) {}
        }
      });
    }
    if (style && style.sources) {
      Object.keys(style.sources).forEach((s) => {
        if (s.startsWith('report-source-') && map.current!.getSource(s)) {
          try { map.current!.removeSource(s); } catch (e) {}
        }
      });
    }
  };
}, [reports]);


  // ---- Search handler (keeps your previous behavior) ----
  const handleSearch = async (query: string, mode: string, filters: string[]) => {
    if (!query.trim() || !map.current) return;

    try {
      if (mode === 'coordinates') {
        const parts = query.split(',').map((p) => parseFloat(p.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          const [lat, lng] = [parts[0], parts[1]];
          map.current.flyTo({ center: [lng, lat], zoom: 14, duration: 2000 });
          setCurrentLocation([lng, lat]);
          // Refetch AQI for new location
          refetchAQI();
          toast({ title: 'Coordinates selected', description: `Lat: ${lat}, Lng: ${lng}` });
          return;
        }
        toast({ title: 'Invalid coordinates', description: 'Use: latitude, longitude', variant: 'destructive' });
        return;
      }

      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?access_token=${mapboxToken}&limit=1`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();

      if (data?.features?.length > 0) {
        const [lng, lat] = data.features[0].center;
        map.current.flyTo({ center: [lng, lat], zoom: 14, duration: 2000 });
        setCurrentLocation([lng, lat]);
        // Refetch AQI for the new location
        refetchAQI();
        toast({ title: 'Location found', description: data.features[0].place_name });
      } else {
        toast({ title: 'No results found', description: 'Try again', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Search failed', description: err.message, variant: 'destructive' });
    }
  };

  // ---- Landuse polygons: fetch + draw + analytics ----
  useEffect(() => {
    if (!map.current) return;
    let debounceTimer: number | undefined;

    const updateLandUse = async () => {
      if (!map.current) return;
      const currentZoom = map.current.getZoom();
      // don't fetch if zoomed out too far
      if (currentZoom < 13) {
        // remove source/layer if exists to save memory
        if (map.current.getLayer('landuse-fill')) {
          try {
            map.current.removeLayer('landuse-fill');
          } catch (e) {}
        }
        if (map.current.getSource('landuse')) {
          try {
            map.current.removeSource('landuse');
          } catch (e) {}
        }
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const bounds = map.current.getBounds();
      if (!bounds) return; // Add null check for bounds
      const bbox = [bounds.getSouth(), bounds.getWest(), bounds.getNorth(), bounds.getEast()].join(',');
      const query = `
        [out:json][timeout:25];
        (
          way["landuse"](${bbox});
          way["building"="construction"](${bbox});
        );
        out geom;
      `;

      try {
        const res = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: query,
        });
        const data = await res.json();

        const geoJson = {
          type: 'FeatureCollection', // Fix: use string literal
          features: (data.elements || [])
            .filter((el: any) => el.type === 'way' && el.geometry && el.geometry.length > 2)
            .map((el: any) => ({
              type: 'Feature',
              properties: {
                landuse: el.tags?.landuse || (el.tags?.building === 'construction' ? 'construction' : 'unknown'),
                building: el.tags?.building,
                name: el.tags?.name,
              },
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    ...el.geometry.map((node: any) => [node.lon, node.lat]),
                    [el.geometry[0].lon, el.geometry[0].lat],
                  ],
                ],
              },
            })),
        };

        if (map.current.getSource('landuse')) {
          (map.current.getSource('landuse') as any).setData(geoJson);
        } else {
          map.current.addSource('landuse', { type: 'geojson', data: geoJson });

          map.current.addLayer({
            id: 'landuse-fill',
            type: 'fill',
            source: 'landuse',
            paint: {
              'fill-color': [
                'match',
                ['get', 'landuse'],
                'residential',
                '#3b82f6',
                'commercial',
                '#f97316',
                'industrial',
                '#ef4444',
                'grass',
                '#22c55e',
                'forest',
                '#15803d',
                'farmland',
                '#84cc16',
                'construction',
                '#dc2626',
                '#6b7280',
              ],
              'fill-opacity': 0.45,
              'fill-outline-color': '#111827',
            },
          });

          // pointer cursor & popup on polygon click
          map.current.on('mouseenter', 'landuse-fill', () => {
            if (map.current && map.current.getCanvas()) map.current.getCanvas().style.cursor = 'pointer';
          });
          map.current.on('mouseleave', 'landuse-fill', () => {
            if (map.current && map.current.getCanvas()) map.current.getCanvas().style.cursor = '';
          });
          map.current.on('click', 'landuse-fill', (e: any) => {
            const props = e.features?.[0]?.properties || {};
            const name = props.name || 'Area';
            const kind = props.landuse || 'unknown';
            const popupHtml = `<div style="font-size:13px;padding:6px;">
                <strong style="display:block;margin-bottom:6px;">${name}</strong>
                <div style="font-size:12px;color:#333;">Type: ${kind}</div>
              </div>`;
            new mapboxgl.Popup({ offset: 8 })
              .setLngLat(e.lngLat)
              .setHTML(popupHtml)
              .addTo(map.current as mapboxgl.Map);
          });
        }

        // compute analytics from geoJson
        computeAreaAnalytics(geoJson);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching landuse:', err);
        setIsLoading(false);
      }
    };

    const debounced = () => {
      if (debounceTimer) window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(updateLandUse, 700);
    };

    // listen to movement and zoom
    map.current.on('moveend', debounced);
    map.current.on('zoomend', debounced);

    // initial load
    debounced();

    return () => {
      if (!map.current) return;
      map.current.off('moveend', debounced);
      map.current.off('zoomend', debounced);
      if (debounceTimer) window.clearTimeout(debounceTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map.current]);

  // ---- area analytics using turf ----
  const computeAreaAnalytics = (geoJson: any) => {
    try {
      const summary = {
        residential: 0,
        commercial: 0,
        industrial: 0,
        green: 0,
        construction: 0,
        total: 0,
      };

      (geoJson.features || []).forEach((feature: any) => {
        try {
          const area = turf.area(feature);
          const type = feature.properties?.landuse;
          if (type === 'residential') summary.residential += area;
          else if (type === 'commercial') summary.commercial += area;
          else if (type === 'industrial') summary.industrial += area;
          else if (['grass', 'forest', 'farmland'].includes(type)) summary.green += area;
          else if (type === 'construction') summary.construction += area;
          else summary.total += 0; // unknown types ignored in categorization

          summary.total += area;
        } catch (e) {
          // ignore invalid feature
        }
      });

      setAnalytics(summary);
    } catch (e) {
      console.error('computeAreaAnalytics error:', e);
    }
  };

  // ---- Report submit (server-backed) ----
  const handleReportSubmit = (report: any) => {
    createReportMutation.mutate({
      userId,
      userEmail,
      category: report.category,
      description: report.description,
      priority: report.priority,
      longitude: report.location[0],
      latitude: report.location[1],
      status: 'pending',
    });
    setShowReportModal(false);
  };

const handlePlannerAction = (action: string, location?: [number, number]) => {
  setShowPlannerActions(false);
  
  // Update current location if provided
  if (location) {
    setCurrentLocation(location);
    refetchAQI();
  }
  
  if (['urban-optimization', 'congestion-prediction', 'traffic-analysis', 'zone-analysis'].includes(action)) {
    setShowAIChat(true);
    setAiMinimized(false);
    
    // Store the action type so AIChatPanel can handle it
    // You can use localStorage or pass it as a prop
    localStorage.setItem('pendingPlannerAction', action);
  }
};


  const handleLogout = () => {
    localStorage.removeItem('userRole');
    setLocation('/');
  };

  const formatArea = (sqm: number) => {

    if (sqm > 1000000) return `${(sqm / 1000000).toFixed(2)} km²`;    return `${(sqm / 10000).toFixed(2)} ha`;  };  const getAQI = () => Math.floor(50 + Math.random() * 100);  const safeAnalytics = analytics || { total: 0, residential: 0, commercial: 0, green: 0, construction: 0 };  return (    <div className="flex h-screen">      {/* Sidebar */}      <div className="w-96 bg-sidebar border-r border-sidebar-border overflow-y-auto">        <div className="p-6">          <div className="flex items-center justify-between mb-6">            <div>              <h1 className="text-xl font-bold flex items-center gap-2">                <img 
  src={Logo} 
  alt="Urbanize Logo"
  className="w-8 h-8 object-contain"
  loading="lazy"
/>               Urbanize.              </h1>              <p className="text-sm text-muted-foreground mt-1">{userRole === 'planner' ? 'Urban Planner' : 'Citizen'} View</p>            </div>            <Button size="icon" variant="ghost" onClick={handleLogout} data-testid="button-logout">              <LogOut className="w-4 h-4" />            </Button>          </div>          <div className="space-y-6">            <AQIWidget value={aqiValue} trend="down" location="Current Area" />            <div>              <h2 className="text-lg font-semibold mb-3">Area Analytics</h2>              <AnalyticsDashboard data={analytics} isLoading={isLoading} />            </div>            <TrafficHeatmap data={mockTrafficData} />            {userRole === 'planner' && (              <>                <Button                   className="w-full mb-2"                   onClick={() => setIsSelectMode(true)}                   variant={isSelectMode ? "secondary" : "default"}                  data-testid="button-select-area"                >                  {isSelectMode ? 'Cancel Selection' : 'Select Area for Planning'}                </Button>                <Button className="w-full" onClick={() => setShowAIChat(true)} data-testid="button-open-ai-chat">                  <MessageSquare className="w-4 h-4 mr-2" />                  AI Planning Assistant                </Button>              </>            )}          </div>        </div>      </div>      {/* Map + Search */}      <div className="flex-1 relative">        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-2xl px-4">          <AdvancedSearchBar onSearch={handleSearch} />        </div>        <div ref={mapContainer} className="w-full h-full" data-testid="map-container" />        <div className="absolute bottom-6 right-6 text-sm text-muted-foreground bg-card/90 backdrop-blur-sm px-4 py-2 rounded-md border border-card-border">          {userRole === 'citizen' ? 'Click anywhere on the map to report an issue' : 'Click anywhere on the map for planning actions'}        </div>      </div>      {/* Modals & Panels */}      <ReportModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} location={reportLocation} onSubmit={handleReportSubmit} />      <PlannerActionsModal         isOpen={plannerModalOpen}         onClose={() => {          setPlannerModalOpen(false);          if (selectedMarkerRef.current) {            selectedMarkerRef.current.remove();            selectedMarkerRef.current = null;          }        }}         location={selectedPoint ? [selectedPoint.lng, selectedPoint.lat] : null}         onAction={(action) => {          setPlannerModalOpen(false);          if (selectedMarkerRef.current) {            selectedMarkerRef.current.remove();            selectedMarkerRef.current = null;          }          handlePlannerAction(action);        }}      />      {userRole === 'planner' && (        <>          {aiMinimized ? (            <div className="fixed bottom-6 right-6 z-[100]">              <Button                className="rounded-full w-14 h-14 shadow-lg"                onClick={() => {                  setAiMinimized(false);                  setShowAIChat(true);                }}                data-testid="button-restore-chat"              >                <MessageSquare className="w-6 h-6" />              </Button>            </div>          ) : (            <div className="fixed bottom-6 right-6 z-[100]">              <AIChatPanel                isOpen={showAIChat && !aiMinimized}                onClose={() => setShowAIChat(false)}                location={currentLocation}                onMinimize={() => {                  setAiMinimized(true);                  setShowAIChat(false);                }}              />            </div>          )}        </>      )}    </div>  );}