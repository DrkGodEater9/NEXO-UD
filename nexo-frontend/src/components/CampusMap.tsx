import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { CampusData } from '../services/api';

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

const getColor = (name: string) =>
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

// Dark map tiles — CartoDB Dark Matter, no API key required
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>';

interface Props {
  campusList: CampusData[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  isDark: boolean;
}

export default function CampusMap({ campusList, selectedId, onSelect, isDark }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());

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

    const tileUrl = isDark ? TILE_URL : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    L.tileLayer(tileUrl, { attribution: TILE_ATTR, subdomains: 'abcd', maxZoom: 19 }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // Add/update markers when campusList changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || campusList.length === 0) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    const valid = campusList.filter(c => c.latitude && c.longitude);

    valid.forEach(campus => {
      const color = getColor(campus.name);
      const marker = L.marker([campus.latitude!, campus.longitude!], { icon: makeIcon(color) });

      marker.bindPopup(`
        <div style="font-family:system-ui,sans-serif;min-width:180px;">
          <div style="width:100%;height:4px;background:${color};border-radius:4px 4px 0 0;margin:-8px -8px 8px -8px;width:calc(100% + 16px);"></div>
          <strong style="color:#fff;font-size:13px;line-height:1.4;display:block;margin-bottom:4px;">${campus.name}</strong>
          ${campus.address ? `<span style="color:#aaa;font-size:11px;">${campus.address}</span>` : ''}
          <br/><span style="color:${color};font-size:10px;font-weight:700;margin-top:4px;display:inline-block;">${campus.faculty}</span>
        </div>
      `, {
        className: 'nexo-popup',
        maxWidth: 240,
      });

      marker.on('click', () => onSelect(campus.id));
      marker.addTo(map);
      markersRef.current.set(campus.id, marker);
    });

    if (valid.length > 0) {
      const bounds = L.latLngBounds(valid.map(c => [c.latitude!, c.longitude!]));
      map.fitBounds(bounds, { padding: [48, 48] });
    }
  }, [campusList]);

  // Pan to selected campus
  useEffect(() => {
    const map = mapRef.current;
    if (!map || selectedId === null) return;
    const marker = markersRef.current.get(selectedId);
    if (!marker) return;
    map.setView(marker.getLatLng(), 15, { animate: true });
    marker.openPopup();
  }, [selectedId]);

  return (
    <>
      <style>{`
        .nexo-popup .leaflet-popup-content-wrapper {
          background: #1a1a2e;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.6);
          padding: 8px;
          color: #fff;
        }
        .nexo-popup .leaflet-popup-tip {
          background: #1a1a2e;
        }
        .nexo-popup .leaflet-popup-close-button {
          color: #888 !important;
        }
        .leaflet-attribution-flag { display: none !important; }
        .leaflet-control-attribution {
          background: rgba(0,0,0,0.5) !important;
          color: #666 !important;
          font-size: 9px !important;
        }
        .leaflet-control-attribution a { color: #888 !important; }
      `}</style>
      <div ref={containerRef} style={{ width: '100%', height: '100%', borderRadius: 'inherit' }} />
    </>
  );
}
