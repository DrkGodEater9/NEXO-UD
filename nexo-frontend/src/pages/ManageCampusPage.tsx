import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { useThemeTokens } from '../context/useThemeTokens';
import { MapPin, Plus, Trash2, X, Loader2, AlertCircle } from 'lucide-react';
import { campusApi, CampusData, CampusPayload, ApiError } from '../services/api';
import L from 'leaflet';

export default function ManageCampusPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isRestoring } = useAuth();
  const T = useThemeTokens();
  const [items, setItems] = useState<CampusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<CampusData | null>(null);
  const [showForm, setShowForm] = useState(false);

  const canAccess = user?.roles.includes('RADICADOR_SEDES') || user?.roles.includes('ADMINISTRADOR');

  useEffect(() => {
    if (isRestoring) return;
    if (!isAuthenticated) navigate('/login');
    if (user && !canAccess) navigate('/dashboard');
  }, [isAuthenticated, isRestoring, user, navigate, canAccess]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try { setItems(await campusApi.list()); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Error cargando sedes'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  if (isRestoring || !isAuthenticated || !user || !canAccess) return null;

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta sede?')) return;
    try { await campusApi.delete(id); await fetchItems(); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Error eliminando'); }
  };

  const handleSave = async (data: CampusPayload) => {
    if (editing) await campusApi.update(editing.id, data);
    else await campusApi.create(data);
    setShowForm(false); setEditing(null); await fetchItems();
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: T.accentYellow.bg, border: `1px solid ${T.accentYellow.border}` }}>
              <MapPin size={18} style={{ color: T.accentYellow.color }} />
            </div>
            <div>
              <h1 style={{ color: T.text, fontWeight: 700, fontSize: '20px' }}>Gestionar Sedes</h1>
              <p style={{ color: T.textMuted, fontSize: '13px' }}>Administra las sedes de la universidad.</p>
            </div>
          </div>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl" style={{ background: '#C9344C', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            <Plus size={14} /> Nueva Sede
          </button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl flex items-center gap-2" style={{ background: T.error.bg, border: `1px solid ${T.error.border}` }}><AlertCircle size={16} style={{ color: T.error.text }} /><p style={{ color: T.error.text, fontSize: '13px' }}>{error}</p></div>}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: T.textMuted }} /></div>
        ) : items.length === 0 ? (
          <p className="py-12 text-center" style={{ color: T.textMuted, fontSize: '14px' }}>No hay sedes registradas.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map(item => (
              <div key={item.id} className="p-4 rounded-2xl" style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}` }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 style={{ color: T.text, fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{item.name}</h3>
                    <span className="inline-block px-2 py-0.5 rounded-full mb-2" style={{ background: T.accentYellow.bg, border: `1px solid ${T.accentYellow.border}`, color: T.accentYellow.color, fontSize: '10px', fontWeight: 600 }}>{item.faculty}</span>
                    {item.address && <p style={{ color: T.textMuted, fontSize: '12px' }}>{item.address}</p>}
                    <p style={{ color: T.textSubtle, fontSize: '11px', marginTop: '4px' }}>{item.classrooms.length} salón(es)</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditing(item); setShowForm(true); }} className="p-2 rounded-lg" style={{ background: T.btnGhostBg, border: `1px solid ${T.btnGhostBorder}`, cursor: 'pointer', color: T.textMuted, fontSize: '11px' }}>Editar</button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg" style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.error.text }}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showForm && createPortal(
        <CampusForm T={T} initial={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />,
        document.body
      )}
    </AppLayout>
  );
}

// ── Mini-map picker ────────────────────────────────────────────────────────────

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const PIN_ICON = L.divIcon({
  className: '',
  html: `<div style="
    width:28px;height:28px;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    background:#C9344C;
    border:3px solid rgba(255,255,255,0.9);
    box-shadow:0 4px 14px rgba(0,0,0,0.5),0 0 0 3px #C9344C44;
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -32],
});

function MapPicker({ lat, lng, onChange }: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: lat && lng ? [lat, lng] : [4.610000, -74.082000],
      zoom: lat && lng ? 15 : 12,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    if (lat && lng) {
      markerRef.current = L.marker([lat, lng], { icon: PIN_ICON, draggable: true }).addTo(map);
      markerRef.current.on('dragend', () => {
        const pos = markerRef.current!.getLatLng();
        onChange(parseFloat(pos.lat.toFixed(6)), parseFloat(pos.lng.toFixed(6)));
      });
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      const rounded = [parseFloat(clickLat.toFixed(6)), parseFloat(clickLng.toFixed(6))] as [number, number];

      if (markerRef.current) {
        markerRef.current.setLatLng(rounded);
      } else {
        markerRef.current = L.marker(rounded, { icon: PIN_ICON, draggable: true }).addTo(map);
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current!.getLatLng();
          onChange(parseFloat(pos.lat.toFixed(6)), parseFloat(pos.lng.toFixed(6)));
        });
      }
      onChange(rounded[0], rounded[1]);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Sync marker if parent changes coords (e.g. manual input)
  useEffect(() => {
    if (!mapRef.current || lat === null || lng === null) return;
    const pos: [number, number] = [lat, lng];
    if (markerRef.current) {
      markerRef.current.setLatLng(pos);
    } else {
      markerRef.current = L.marker(pos, { icon: PIN_ICON, draggable: true }).addTo(mapRef.current);
      markerRef.current.on('dragend', () => {
        const p = markerRef.current!.getLatLng();
        onChange(parseFloat(p.lat.toFixed(6)), parseFloat(p.lng.toFixed(6)));
      });
    }
    mapRef.current.setView(pos, Math.max(mapRef.current.getZoom(), 14), { animate: true });
  }, [lat, lng]);

  return (
    <>
      <style>{`
        .nexo-picker .leaflet-tile-pane {
          filter: brightness(1.55) contrast(0.88) saturate(0.7) hue-rotate(195deg);
        }
        .nexo-picker .leaflet-control-zoom a {
          background: rgba(22,22,42,0.95) !important;
          color: #aaa !important;
          border-color: rgba(255,255,255,0.12) !important;
        }
        .nexo-picker .leaflet-control-zoom a:hover { color: #fff !important; }
      `}</style>
      <div
        ref={containerRef}
        className="nexo-picker"
        style={{ width: '100%', height: '220px', borderRadius: '12px', cursor: 'crosshair' }}
      />
    </>
  );
}

// ── Seed constants ─────────────────────────────────────────────────────────────

const FACULTIES = [
  'Ingeniería',
  'Ciencias y Educación',
  'Tecnológica',
  'Medio Ambiente',
  'Artes',
  'Ciencias Matemáticas y Naturales',
  'Ciencias de la Salud',
  'General',
] as const;

// Datos pre-cargados del seed V7__seed_campus.sql
const KNOWN_CAMPUSES: { name: string; faculty: string; address: string; lat: number; lng: number }[] = [
  { name: 'Sede Ingeniería (Sabio Caldas)',         faculty: 'Ingeniería',                       address: 'Calle 40 Sur No. 8B-84',        lat: 4.628055,  lng: -74.065277 },
  { name: 'Sede Macarena A (Ciencias y Educación)', faculty: 'Ciencias y Educación',             address: 'Carrera 3 No. 26A-40',          lat: 4.614416,  lng: -74.064415 },
  { name: 'Sede Macarena B (Ciencias y Educación)', faculty: 'Ciencias y Educación',             address: 'Carrera 3 No. 26A-40',          lat: 4.614416,  lng: -74.064415 },
  { name: 'Sede Tecnológica',                       faculty: 'Tecnológica',                      address: 'Cra. 7 No. 40B-53',             lat: 4.577880,  lng: -74.150420 },
  { name: 'Sede Vivero (Medio Ambiente)',            faculty: 'Medio Ambiente',                   address: 'Carrera 5 Este No. 15-82',      lat: 4.596600,  lng: -74.065000 },
  { name: 'Ciudadela Universitaria Bosa Porvenir',  faculty: 'Ingeniería',                       address: 'Diagonal 86J No. 77G-15',       lat: 4.629100,  lng: -74.185000 },
  { name: 'Sede ASAB (Artes)',                      faculty: 'Artes',                            address: 'Plaza de La Macarena No. 5-41', lat: 4.604510,  lng: -74.075420 },
  { name: 'Edificio Calle 34',                      faculty: 'Ciencias y Educación',             address: 'Calle 34 No. 6-31',             lat: 4.623100,  lng: -74.068200 },
  { name: 'Edificio Crisanto Luque (Ciencias)',     faculty: 'Ciencias Matemáticas y Naturales', address: 'Carrera 4 No. 26B-54',          lat: 4.604440,  lng: -74.072700 },
  { name: 'Aduanilla de Paiba (Biblioteca Central)',faculty: 'General',                          address: 'Av. Cra. 30 No. 45A-53',       lat: 4.619000,  lng: -74.095000 },
];

// ── Form ───────────────────────────────────────────────────────────────────────

function CampusForm({ T, initial, onSave, onCancel }: {
  T: ReturnType<typeof useThemeTokens>;
  initial: CampusData | null;
  onSave: (d: CampusPayload) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [faculty, setFaculty] = useState(initial?.faculty ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [lat, setLat] = useState<number | null>(initial?.latitude ?? null);
  const [lng, setLng] = useState<number | null>(initial?.longitude ?? null);
  const [latInput, setLatInput] = useState(initial?.latitude?.toString() ?? '');
  const [lngInput, setLngInput] = useState(initial?.longitude?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [nameSuggestions, setNameSuggestions] = useState<typeof KNOWN_CAMPUSES>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const inputStyle = { background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '13px' };
  const labelStyle = { color: T.textMuted, fontSize: '12px', fontWeight: 600 as const, marginBottom: '6px', display: 'block' as const };

  const handleNameChange = (val: string) => {
    setName(val);
    if (val.trim().length < 2) { setNameSuggestions([]); setShowSuggestions(false); return; }
    const lower = val.toLowerCase();
    const matches = KNOWN_CAMPUSES.filter(c => c.name.toLowerCase().includes(lower));
    setNameSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  };

  const applySuggestion = (c: typeof KNOWN_CAMPUSES[number]) => {
    setName(c.name);
    setFaculty(c.faculty);
    setAddress(c.address);
    setLat(c.lat);
    setLng(c.lng);
    setLatInput(c.lat.toString());
    setLngInput(c.lng.toString());
    setShowSuggestions(false);
  };

  const handleMapChange = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    setLatInput(newLat.toString());
    setLngInput(newLng.toString());
  };

  const handleLatInput = (val: string) => {
    setLatInput(val);
    const n = parseFloat(val);
    if (!isNaN(n)) setLat(n);
  };

  const handleLngInput = (val: string) => {
    setLngInput(val);
    const n = parseFloat(val);
    if (!isNaN(n)) setLng(n);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !faculty.trim()) { setFormError('Nombre y facultad son obligatorios.'); return; }
    const parsedLat = latInput ? parseFloat(latInput) : undefined;
    const parsedLng = lngInput ? parseFloat(lngInput) : undefined;
    if ((latInput && isNaN(parsedLat!)) || (lngInput && isNaN(parsedLng!))) {
      setFormError('Latitud y longitud deben ser números válidos.');
      return;
    }
    setSaving(true); setFormError(null);
    try {
      await onSave({ name, faculty, address: address || undefined, latitude: parsedLat, longitude: parsedLng });
    } catch (e: any) { setFormError(e.message || 'Error guardando'); setSaving(false); }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 overflow-y-auto"
        style={{
          background: T.isDark ? 'rgba(22,22,42,0.98)' : T.cardBg,
          border: `1px solid ${T.cardBorder}`,
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          maxHeight: '90vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 style={{ color: T.text, fontSize: '16px', fontWeight: 700 }}>{initial ? 'Editar Sede' : 'Nueva Sede'}</h3>
          <button onClick={onCancel} style={{ color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <div className="space-y-4">
          {/* Nombre con autocompletado del seed */}
          <div style={{ position: 'relative' }}>
            <label style={labelStyle}>Nombre <span style={{ color: '#E8485F' }}>*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onFocus={() => name.trim().length >= 2 && nameSuggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Ej: Sede Macarena A"
              className="w-full py-2.5 px-3 rounded-xl outline-none"
              style={inputStyle}
              autoComplete="off"
            />
            {showSuggestions && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                background: T.isDark ? 'rgba(22,22,42,0.98)' : T.cardBg,
                border: `1px solid ${T.cardBorder}`,
                borderRadius: '12px', marginTop: '4px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                overflow: 'hidden',
              }}>
                {nameSuggestions.map((c, i) => (
                  <button
                    key={i}
                    onMouseDown={() => applySuggestion(c)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '8px 12px', background: 'none', border: 'none',
                      cursor: 'pointer', borderBottom: i < nameSuggestions.length - 1 ? `1px solid ${T.cardBorder}` : 'none',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = T.btnGhostBg)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <p style={{ color: T.text, fontSize: '12px', fontWeight: 600, margin: 0 }}>{c.name}</p>
                    <p style={{ color: T.textMuted, fontSize: '11px', margin: 0 }}>{c.faculty} · {c.address}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Facultad como select con valores del seed */}
            <div>
              <label style={labelStyle}>Facultad <span style={{ color: '#E8485F' }}>*</span></label>
              <select
                value={faculty}
                onChange={e => setFaculty(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl outline-none"
                style={{ ...inputStyle, appearance: 'none' as const, cursor: 'pointer' }}
              >
                <option value="" disabled>Selecciona una facultad</option>
                {FACULTIES.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Dirección</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Ej: Calle 40 Sur No. 8B-84" className="w-full py-2.5 px-3 rounded-xl outline-none" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>
              <MapPin size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              Ubicación en el mapa
            </label>
            <div style={{ border: `1px solid ${T.inputBorder}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '8px' }}>
              <MapPicker lat={lat} lng={lng} onChange={handleMapChange} />
            </div>
            <p style={{ color: T.textSubtle, fontSize: '11px', marginBottom: '8px' }}>
              Haz clic en el mapa para colocar el marcador, o arrástralo. También puedes ingresar las coordenadas manualmente.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ ...labelStyle, marginBottom: '4px' }}>Latitud</label>
                <input
                  type="number"
                  step="any"
                  value={latInput}
                  onChange={e => handleLatInput(e.target.value)}
                  placeholder="Ej: 4.628055"
                  className="w-full py-2 px-3 rounded-xl outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ ...labelStyle, marginBottom: '4px' }}>Longitud</label>
                <input
                  type="number"
                  step="any"
                  value={lngInput}
                  onChange={e => handleLngInput(e.target.value)}
                  placeholder="Ej: -74.065277"
                  className="w-full py-2 px-3 rounded-xl outline-none"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {formError && (
            <div className="p-3 rounded-xl flex items-center gap-2" style={{ background: T.error.bg, border: `1px solid ${T.error.border}` }}>
              <AlertCircle size={14} style={{ color: T.error.text }} />
              <p style={{ color: T.error.text, fontSize: '12px' }}>{formError}</p>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <button onClick={onCancel} className="px-4 py-2 rounded-xl" style={{ background: T.btnGhostBg, border: `1px solid ${T.btnGhostBorder}`, color: T.btnGhostColor, cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
            <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 rounded-xl flex items-center gap-1.5" style={{ background: '#C9344C', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
              {saving && <Loader2 size={14} className="animate-spin" />} {initial ? 'Guardar cambios' : 'Crear sede'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
