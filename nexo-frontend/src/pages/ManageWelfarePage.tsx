import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { useThemeTokens } from '../context/useThemeTokens';
import { Heart, Plus, Trash2, X, Loader2, AlertCircle } from 'lucide-react';
import { welfareApi, WelfareData, WelfarePayload, ApiError } from '../services/api';

const categoryLabels: Record<string, string> = {
  APOYO_ALIMENTARIO: 'Apoyo Alimentario',
  BECAS: 'Becas',
  SALUD_MENTAL: 'Salud Mental',
  SERVICIOS_SALUD: 'Servicios de Salud',
};

const categoryColors: Record<string, (T: any) => any> = {
  APOYO_ALIMENTARIO: T => T.accentYellow,
  BECAS: T => T.accentGreen,
  SALUD_MENTAL: T => T.accentPink,
  SERVICIOS_SALUD: T => T.accentCyan,
};

export default function ManageWelfarePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const T = useThemeTokens();
  const [items, setItems] = useState<WelfareData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<WelfareData | null>(null);
  const [showForm, setShowForm] = useState(false);

  const canAccess = user?.roles.includes('RADICADOR_BIENESTAR') || user?.roles.includes('ADMINISTRADOR');

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
    if (user && !canAccess) navigate('/dashboard');
  }, [isAuthenticated, user, navigate, canAccess]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try { setItems(await welfareApi.list()); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Error cargando'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  if (!isAuthenticated || !user || !canAccess) return null;

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este contenido?')) return;
    try { await welfareApi.delete(id); await fetchItems(); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Error eliminando'); }
  };

  const handleSave = async (data: WelfarePayload) => {
    if (editing) await welfareApi.update(editing.id, data);
    else await welfareApi.create(data);
    setShowForm(false); setEditing(null); await fetchItems();
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: T.accentPink.bg, border: `1px solid ${T.accentPink.border}` }}>
              <Heart size={18} style={{ color: T.accentPink.color }} />
            </div>
            <div>
              <h1 style={{ color: T.text, fontWeight: 700, fontSize: '20px' }}>Gestionar Bienestar</h1>
              <p style={{ color: T.textMuted, fontSize: '13px' }}>Administra contenido de bienestar institucional.</p>
            </div>
          </div>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl" style={{ background: '#C9344C', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            <Plus size={14} /> Nuevo
          </button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl flex items-center gap-2" style={{ background: T.error.bg, border: `1px solid ${T.error.border}` }}><AlertCircle size={16} style={{ color: T.error.text }} /><p style={{ color: T.error.text, fontSize: '13px' }}>{error}</p></div>}

        {showForm && <WelfareForm T={T} initial={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: T.textMuted }} /></div>
        ) : items.length === 0 ? (
          <p className="py-12 text-center" style={{ color: T.textMuted, fontSize: '14px' }}>No hay contenido de bienestar.</p>
        ) : (
          <div className="space-y-3">
            {items.map(item => {
              const accent = (categoryColors[item.category] || (() => T.accentIndigo))(T);
              return (
                <div key={item.id} className="p-4 rounded-2xl" style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h3 style={{ color: T.text, fontSize: '14px', fontWeight: 600 }}>{item.title}</h3>
                        <span className="px-2 py-0.5 rounded-full" style={{ background: accent.bg, border: `1px solid ${accent.border}`, color: accent.color, fontSize: '10px', fontWeight: 600 }}>{categoryLabels[item.category] || item.category}</span>
                      </div>
                      <p style={{ color: T.textMuted, fontSize: '13px', lineHeight: 1.5 }} className="line-clamp-2">{item.description}</p>
                      {item.links && <p style={{ color: T.link, fontSize: '12px', marginTop: '4px' }}>{item.links}</p>}
                      <p style={{ color: T.textSubtle, fontSize: '11px', marginTop: '6px' }}>{new Date(item.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => { setEditing(item); setShowForm(true); }} className="p-2 rounded-lg" style={{ background: T.btnGhostBg, border: `1px solid ${T.btnGhostBorder}`, cursor: 'pointer', color: T.textMuted, fontSize: '11px' }}>Editar</button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg" style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.error.text }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function WelfareForm({ T, initial, onSave, onCancel }: { T: ReturnType<typeof useThemeTokens>; initial: WelfareData | null; onSave: (d: WelfarePayload) => Promise<void>; onCancel: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState<WelfarePayload['category']>(initial?.category as any ?? 'APOYO_ALIMENTARIO');
  const [links, setLinks] = useState(initial?.links ?? '');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) { setFormError('Título y descripción son obligatorios.'); return; }
    setSaving(true); setFormError(null);
    try { await onSave({ title, description, category, links: links || undefined }); }
    catch (e: any) { setFormError(e.message || 'Error guardando'); setSaving(false); }
  };

  return (
    <div className="mb-4 p-5 rounded-2xl" style={{ background: T.cardBg, border: `1px solid ${T.primaryBorder}` }}>
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ color: T.text, fontSize: '15px', fontWeight: 600 }}>{initial ? 'Editar Contenido' : 'Nuevo Contenido'}</h3>
        <button onClick={onCancel} style={{ color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block mb-1.5" style={{ color: T.text, fontSize: '12px', fontWeight: 500 }}>Título</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full py-2.5 px-3 rounded-xl outline-none" style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '13px' }} />
        </div>
        <div>
          <label className="block mb-1.5" style={{ color: T.text, fontSize: '12px', fontWeight: 500 }}>Descripción</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full py-2.5 px-3 rounded-xl outline-none resize-none" style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '13px' }} />
        </div>
        <div>
          <label className="block mb-1.5" style={{ color: T.text, fontSize: '12px', fontWeight: 500 }}>Categoría</label>
          <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full py-2.5 px-3 rounded-xl outline-none cursor-pointer" style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '13px' }}>
            {Object.entries(categoryLabels).map(([val, label]) => <option key={val} value={val} style={{ background: T.selectOptionBg }}>{label}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1.5" style={{ color: T.text, fontSize: '12px', fontWeight: 500 }}>Enlaces (opcional)</label>
          <input type="text" value={links} onChange={e => setLinks(e.target.value)} placeholder="URL de recurso" className="w-full py-2.5 px-3 rounded-xl outline-none" style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '13px' }} />
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
