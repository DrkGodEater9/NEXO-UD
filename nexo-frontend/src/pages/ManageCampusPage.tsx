import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { useThemeTokens } from '../context/useThemeTokens';
import { MapPin, Plus, Trash2, X, Loader2, AlertCircle } from 'lucide-react';
import { campusApi, CampusData, CampusPayload, ApiError } from '../services/api';

export default function ManageCampusPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const T = useThemeTokens();
  const [items, setItems] = useState<CampusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<CampusData | null>(null);
  const [showForm, setShowForm] = useState(false);

  const canAccess = user?.roles.includes('RADICADOR_SEDES') || user?.roles.includes('ADMINISTRADOR');

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
    if (user && !canAccess) navigate('/dashboard');
  }, [isAuthenticated, user, navigate, canAccess]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try { setItems(await campusApi.list()); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Error cargando sedes'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  if (!isAuthenticated || !user || !canAccess) return null;

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

        {showForm && <CampusForm T={T} initial={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />}

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
    </AppLayout>
  );
}

function CampusForm({ T, initial, onSave, onCancel }: { T: ReturnType<typeof useThemeTokens>; initial: CampusData | null; onSave: (d: CampusPayload) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [faculty, setFaculty] = useState(initial?.faculty ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [mapUrl, setMapUrl] = useState(initial?.mapUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim() || !faculty.trim()) { setFormError('Nombre y facultad son obligatorios.'); return; }
    setSaving(true); setFormError(null);
    try { await onSave({ name, faculty, address: address || undefined, mapUrl: mapUrl || undefined }); }
    catch (e: any) { setFormError(e.message || 'Error guardando'); setSaving(false); }
  };

  return (
    <div className="mb-4 p-5 rounded-2xl" style={{ background: T.cardBg, border: `1px solid ${T.primaryBorder}` }}>
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ color: T.text, fontSize: '15px', fontWeight: 600 }}>{initial ? 'Editar Sede' : 'Nueva Sede'}</h3>
        <button onClick={onCancel} style={{ color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block mb-1.5" style={{ color: T.text, fontSize: '12px', fontWeight: 500 }}>Nombre</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Sede Macarena A" className="w-full py-2.5 px-3 rounded-xl outline-none" style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '13px' }} />
        </div>
        <div>
          <label className="block mb-1.5" style={{ color: T.text, fontSize: '12px', fontWeight: 500 }}>Facultad</label>
          <input type="text" value={faculty} onChange={e => setFaculty(e.target.value)} placeholder="Ej: Ingeniería" className="w-full py-2.5 px-3 rounded-xl outline-none" style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '13px' }} />
        </div>
        <div>
          <label className="block mb-1.5" style={{ color: T.text, fontSize: '12px', fontWeight: 500 }}>Dirección (opcional)</label>
          <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full py-2.5 px-3 rounded-xl outline-none" style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '13px' }} />
        </div>
        <div>
          <label className="block mb-1.5" style={{ color: T.text, fontSize: '12px', fontWeight: 500 }}>URL del Mapa (opcional)</label>
          <input type="text" value={mapUrl} onChange={e => setMapUrl(e.target.value)} className="w-full py-2.5 px-3 rounded-xl outline-none" style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '13px' }} />
        </div>
        {formError && <div className="p-3 rounded-xl flex items-center gap-2" style={{ background: T.error.bg, border: `1px solid ${T.error.border}` }}><AlertCircle size={14} style={{ color: T.error.text }} /><p style={{ color: T.error.text, fontSize: '12px' }}>{formError}</p></div>}
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl" style={{ background: T.btnGhostBg, border: `1px solid ${T.btnGhostBorder}`, color: T.btnGhostColor, cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 rounded-xl flex items-center gap-1.5" style={{ background: '#C9344C', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
            {saving && <Loader2 size={14} className="animate-spin" />} {initial ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
}
