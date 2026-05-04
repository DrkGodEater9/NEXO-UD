import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import polyline from '@mapbox/polyline';
import { CampusData, routeApi, RouteResponse } from '../services/api';
import RoutePanel from './RoutePanel';
import { Navigation, X } from 'lucide-react';

// Fix default marker icons broken by webpack/vite bundling
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const PALETTE = [
  '#E8485F', '#818CF8', '#34D399', '#FBBF24', '#F472B6',
  '#22D3EE', '#A78BFA', '#FB923C', '#2DD4BF', '#E879F9',
];

export const getColor = (name: string) =>
  PALETTE[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];

const makeIcon = (color: string) =>
  L.divIcon({
    className: '',
    html: `
      <div style="
        width:32px; height:32px; border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        background:${color};
        border:3px solid rgba(255,255,255,0.9);
        box-shadow:0 4px 14px rgba(0,0,0,0.5),0 0 0 3px ${color}44;
      "></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -36],
  });

const makeRouteEndIcon = (color: string, letter: string) =>
  L.divIcon({
    className: '',
    html: `
      <div style="
        width:36px; height:36px; border-radius:50%;
        background:${color};
        border:3px solid rgba(255,255,255,0.95);
        box-shadow:0 4px 16px rgba(0,0,0,0.6),0 0 0 4px ${color}55;
        display:flex; align-items:center; justify-content:center;
        font-size:14px; font-weight:800; color:#fff; font-family:system-ui,sans-serif;
      ">${letter}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });

const TILE_URL  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>';

interface Props {
  campusList: CampusData[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  isDark: boolean;
}

type RouteMode = 'idle' | 'picking-origin' | 'picking-dest' | 'loading' | 'result' | 'error';

export default function CampusMap({ campusList, selectedId, onSelect, isDark }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<L.Map | null>(null);
  const markersRef    = useRef<Map<number, L.Marker>>(new Map());
  const polylineRef   = useRef<L.Polyline | null>(null);
  const endMarkersRef = useRef<L.Marker[]>([]);

  const [routeMode, setRouteMode]     = useState<RouteMode>('idle');
  const [originId, setOriginId]       = useState<number | null>(null);
  const [destId, setDestId]           = useState<number | null>(null);
  const [route, setRoute]             = useState<RouteResponse | null>(null);
  const [routeError, setRouteError]   = useState<string | null>(null);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [4.610000, -74.082000],
      zoom: 12,
      zoomControl: false,
      attributionControl: true,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tileUrl = isDark
      ? TILE_URL
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    L.tileLayer(tileUrl, { attribution: TILE_ATTR, subdomains: 'abcd', maxZoom: 19 }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // Add/update campus markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || campusList.length === 0) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    const valid = campusList.filter(c => c.latitude && c.longitude);

    valid.forEach(campus => {
      const color  = getColor(campus.name);
      const marker = L.marker([campus.latitude!, campus.longitude!], { icon: makeIcon(color) });

      marker.bindPopup(`
        <div style="font-family:system-ui,sans-serif;min-width:180px;">
          <div style="width:100%;height:4px;background:${color};border-radius:4px 4px 0 0;margin:-8px -8px 8px -8px;width:calc(100% + 16px);"></div>
          <strong style="color:#fff;font-size:13px;line-height:1.4;display:block;margin-bottom:4px;">${campus.name}</strong>
          ${campus.address ? `<span style="color:#aaa;font-size:11px;">${campus.address}</span>` : ''}
          <br/><span style="color:${color};font-size:10px;font-weight:700;margin-top:4px;display:inline-block;">${campus.faculty}</span>
        </div>
      `, { className: 'nexo-popup', maxWidth: 240 });

      marker.on('click', () => {
        if (routeMode === 'picking-origin') {
          setOriginId(campus.id);
          setRouteMode('picking-dest');
          marker.closePopup();
        } else if (routeMode === 'picking-dest') {
          setDestId(campus.id);
          setRouteMode('loading');
          marker.closePopup();
        } else {
          onSelect(campus.id);
        }
      });

      marker.addTo(map);
      markersRef.current.set(campus.id, marker);
    });

    if (valid.length > 0) {
      const bounds = L.latLngBounds(valid.map(c => [c.latitude!, c.longitude!]));
      map.fitBounds(bounds, { padding: [48, 48] });
    }
  }, [campusList]);

  // Update marker click behavior when routeMode changes
  useEffect(() => {
    markersRef.current.forEach((marker, campusId) => {
      marker.off('click');
      marker.on('click', () => {
        if (routeMode === 'picking-origin') {
          setOriginId(campusId);
          setRouteMode('picking-dest');
          marker.closePopup();
        } else if (routeMode === 'picking-dest') {
          setDestId(campusId);
          setRouteMode('loading');
          marker.closePopup();
        } else {
          onSelect(campusId);
        }
      });
    });
  }, [routeMode]);

  // Pan to selected campus (only when not in route mode)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || selectedId === null || routeMode !== 'idle') return;
    const marker = markersRef.current.get(selectedId);
    if (!marker) return;
    map.setView(marker.getLatLng(), 15, { animate: true });
    marker.openPopup();
  }, [selectedId]);

  // Fetch route when both ids are set
  useEffect(() => {
    if (routeMode !== 'loading' || originId === null || destId === null) return;

    const origin = campusList.find(c => c.id === originId);
    const dest   = campusList.find(c => c.id === destId);
    if (!origin?.latitude || !dest?.latitude) return;

    routeApi
      .calculate(origin.latitude, origin.longitude!, dest.latitude, dest.longitude!)
      .then(data => { setRoute(data); setRouteMode('result'); })
      .catch(err  => { setRouteError(err.message || 'Error calculando ruta'); setRouteMode('error'); });
  }, [routeMode, originId, destId, campusList]);

  // Draw polyline + endpoint markers when route arrives
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !route) return;

    // Remove previous
    polylineRef.current?.remove();
    endMarkersRef.current.forEach(m => m.remove());
    endMarkersRef.current = [];

    // Decode Google's encoded polyline → [[lat,lng], ...]
    const coords = polyline.decode(route.encodedPolyline) as [number, number][];

    const poly = L.polyline(coords, {
      color: '#818cf8',
      weight: 5,
      opacity: 0.92,
      lineCap: 'round',
      lineJoin: 'round',
    });
    poly.addTo(map);
    polylineRef.current = poly;

    // Origin marker (green A)
    const origin = campusList.find(c => c.id === originId);
    const dest   = campusList.find(c => c.id === destId);

    if (origin?.latitude && origin.longitude) {
      const m = L.marker([origin.latitude, origin.longitude], { icon: makeRouteEndIcon('#34d399', 'A') });
      m.bindTooltip(origin.name, { permanent: false, direction: 'top' });
      m.addTo(map);
      endMarkersRef.current.push(m);
    }
    if (dest?.latitude && dest.longitude) {
      const m = L.marker([dest.latitude, dest.longitude], { icon: makeRouteEndIcon('#e8485f', 'B') });
      m.bindTooltip(dest.name, { permanent: false, direction: 'top' });
      m.addTo(map);
      endMarkersRef.current.push(m);
    }

    map.fitBounds(poly.getBounds(), { padding: [40, 360] });
  }, [route]);

  const clearRoute = useCallback(() => {
    polylineRef.current?.remove();
    polylineRef.current = null;
    endMarkersRef.current.forEach(m => m.remove());
    endMarkersRef.current = [];
    setRoute(null);
    setRouteError(null);
    setOriginId(null);
    setDestId(null);
    setRouteMode('idle');
  }, []);

  const validCampuses = campusList.filter(c => c.latitude && c.longitude);
  const originCampus  = campusList.find(c => c.id === originId);
  const destCampus    = campusList.find(c => c.id === destId);

  const showPanel = routeMode === 'loading' || routeMode === 'result' || routeMode === 'error';
  const cursorStyle = (routeMode === 'picking-origin' || routeMode === 'picking-dest') ? 'crosshair' : 'grab';

  return (
    <>
      <style>{`
        .nexo-map .leaflet-tile-pane {
          filter: brightness(1.55) contrast(0.88) saturate(0.7) hue-rotate(195deg);
        }
        .nexo-popup .leaflet-popup-content-wrapper {
          background: #1a1a2e;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.6);
          padding: 8px;
          color: #fff;
        }
        .nexo-popup .leaflet-popup-tip { background: #1a1a2e; }
        .nexo-popup .leaflet-popup-close-button { color: #888 !important; }
        .leaflet-attribution-flag { display: none !important; }
        .leaflet-control-attribution {
          background: rgba(0,0,0,0.5) !important;
          color: #666 !important;
          font-size: 9px !important;
        }
        .leaflet-control-attribution a { color: #888 !important; }
      `}</style>

      <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 'inherit' }}>

        {/* Map container */}
        <div
          ref={containerRef}
          className="nexo-map"
          style={{ width: '100%', height: '100%', borderRadius: 'inherit', cursor: cursorStyle }}
        />

        {/* Route button — top-left overlay */}
        {routeMode === 'idle' && validCampuses.length >= 2 && (
          <button
            onClick={() => setRouteMode('picking-origin')}
            style={{
              position: 'absolute', top: '12px', left: '12px', zIndex: 900,
              display: 'flex', alignItems: 'center', gap: '6px',
              background: '#1a1a2e', border: '1px solid rgba(129,140,248,0.4)',
              color: '#818cf8', borderRadius: '10px', padding: '7px 12px',
              cursor: 'pointer', fontSize: '12px', fontWeight: 600,
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#22223a')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1a1a2e')}
          >
            <Navigation size={13} /> Calcular ruta
          </button>
        )}

        {/* Picking instruction banner */}
        {(routeMode === 'picking-origin' || routeMode === 'picking-dest') && (
          <div style={{
            position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 900, display: 'flex', alignItems: 'center', gap: '10px',
            background: '#1a1a2e', border: '1px solid rgba(129,140,248,0.35)',
            borderRadius: '12px', padding: '9px 16px',
            boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: routeMode === 'picking-origin' ? '#34d399' : '#e8485f',
              animation: 'nexo-pulse 1.4s ease-in-out infinite',
            }} />
            <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>
              {routeMode === 'picking-origin'
                ? 'Selecciona la sede de origen'
                : `Origen: ${originCampus?.name} → Selecciona el destino`}
            </span>
            <button onClick={clearRoute} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)', display: 'flex', padding: '2px',
            }}>
              <X size={14} />
            </button>
            <style>{`@keyframes nexo-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }`}</style>
          </div>
        )}

        {/* Route panel */}
        {showPanel && (
          <RoutePanel
            loading={routeMode === 'loading'}
            error={routeMode === 'error' ? (routeError ?? 'Error desconocido') : null}
            route={routeMode === 'result' ? route : null}
            originName={originCampus?.name ?? ''}
            destName={destCampus?.name ?? ''}
            onClose={clearRoute}
          />
        )}
      </div>
    </>
  );
}
