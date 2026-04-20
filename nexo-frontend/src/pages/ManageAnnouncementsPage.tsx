import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { useThemeTokens } from '../context/useThemeTokens';
import { Megaphone, Plus, Trash2, X, Loader2, AlertCircle } from 'lucide-react';
import { announcementsApi, AnnouncementData, AnnouncementPayload, ApiError } from '../services/api';

export default function ManageAnnouncementsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const T = useThemeTokens();
  const [items, setItems] = useState<AnnouncementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AnnouncementData | null>(null);
  const [showForm, setShowForm] = useState(false);

  const canAccess = user?.roles.includes('RADICADOR_AVISOS') || user?.roles.includes('ADMINISTRADOR');

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
    if (user && !canAccess) navigate('/dashboard');
  }, [isAuthenticated, user, navigate, canAccess]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try { setItems(await announcementsApi.list()); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Error cargando avisos'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  if (!isAuthenticated || !user || !canAccess) return null;

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este aviso?')) return;
    try { await announcementsApi.delete(id); await fetchItems(); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Error eliminando'); }
  };

  const handleSave = async (data: AnnouncementPayload) => {
    if (editing) await announcementsApi.update(editing.id, data);
    else await announcementsApi.create(data);
    setShowForm(false); setEditing(null); await fetchItems();
  };

  const scopeLabel = (s: string) => s === 'UNIVERSIDAD' ? 'Universidad' : 'Facultad';
  const typeLabel = (t: string) => t === 'ASAMBLEA' ? 'Asamblea' : 'General';

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: T.accentIndigo.bg, border: `1px solid ${T.accentIndigo.border}` }}>
              <Megaphone size={18} style={{ color: T.accentIndigo.color }} />
            </div>
            <div>
              <h1 style={{ color: T.text, fontWeight: 700, fontSize: '20px' }}>Gestionar Avisos</h1>
              <p style={{ color: T.textMuted, fontSize: '13px' }}>Crea y administra avisos para la comunidad.</p>
            </div>
          </div>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl" style={{ background: '#C9344C', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            <Plus size={14} /> Nuevo
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl flex items-center gap-2" style={{ background: T.error.bg, border: `1px solid ${T.error.border}` }}>
            <AlertCircle size={16} style={{ color: T.error.text }} />
            <p style={{ color: T.error.text, fontSize: '13px' }}>{error}</p>
          </div>
        )}

        {showForm && (
          <AnnouncementForm T={T} initial={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />
        )}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: T.textMuted }} /></div>
        ) : items.length === 0 ? (
          <p className="py-12 text-center" style={{ color: T.textMuted, fontSize: '14px' }}>No hay avisos registrados.</p>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="p-4 rounded-2xl" style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 style={{ color: T.text, fontSize: '14px', fontWeight: 600 }}>{item.title}</h3>
                      <span className="px-2 py-0.5 rounded-full" style={{ background: T.accentIndigo.bg, border: `1px solid ${T.accentIndigo.border}`, color: T.accentIndigo.color, fontSize: '10px', fontWeight: 600 }}>{scopeLabel(item.scope)}</span>
                      <span className="px-2 py-0.5 rounded-full" style={{ background: item.type === 'ASAMBLEA' ? T.accentYellow.bg : T.accentCyan.bg, border: `1px solid ${item.type === 'ASAMBLEA' ? T.accentYellow.border : T.accentCyan.border}`, color: item.type === 'ASAMBLEA' ? T.accentYellow.color : T.accentCyan.color, fontSize: '10px', fontWeight: 600 }}>{typeLabel(item.type)}</span>
                      {item.faculty && <span className="px-2 py-0.5 rounded-full" style={{ background: T.tagBg, border: `1px solid ${T.tagBorder}`, color: T.tagColor, fontSize: '10px', fontWeight: 600 }}>{item.faculty}</span>}
                    </div>
                    <p style={{ color: T.textMuted, fontSize: '13px', lineHeight: 1.5 }} className="line-clamp-2">{item.body}</p>
                    <p style={{ color: T.textSubtle, fontSize: '11px', marginTop: '6px' }}>{new Date(item.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
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

function AnnouncementForm({ T, initial, onSave, onCancel }: { T: ReturnType<typeof useThemeTokens>; initial: AnnouncementData | null; onSave: (d: AnnouncementPayload) => Promise<void>; onCancel: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [scope, setScope] = useState<'FACULTAD' | 'UNIVERSIDAD'>(initial?.scope as any ?? 'UNIVERSIDAD');
  const [type, setType] = useState<'GENERAL' | 'ASAMBLEA'>(initial?.type as any ?? 'GENERAL');
  const [faculty, setFaculty] = useState(initial?.faculty ?? '');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) { setFormError('Título y contenido son obligatorios.'); return; }
    setSaving(true); setFormError(null);
    try { await onSave({ title, body, scope, type, faculty: scope === 'FACULTAD' ? faculty : undefined }); }
    catch (e: any) { setFormError(e.message || 'Error guardando'); setSaving(false); }
  };

  return (
    <div className="mb-4 p-5 rounded-2xl" style={{ background: T.cardBg, border: `1px solid ${T.primaryBorder}` }}>
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ color: T.text, fontSize: '15px', fontWeight: 600 }}>{initial ? 'Editar Aviso' : 'Nuevo Aviso'}</h3>
        <button onClick={onCancel} style={{ color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block mb-1.5" style={{ color: T.text, fontSize: '12px', fontWeight: 500 }}>Título</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full py-2.5 px-3 rounded-xl outline-none" style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '13px' }} />
        </div>
        <div>
          <label className="block mb-1.5" style={{ color: T.text, fontSize: '12px', fontWeight: 500 }}>Contenido</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={4} className="w-full py-2.5 px-3 rounded-xl outline-none resize-none" style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '13px' }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-1.5" style={{ color: T.text, fontSize: '12px', fontWeight: 500 }}>Alcance</label>
            <select value={scope} onChange={e => setScope(e.target.value as any)} className="w-full py-2.5 px-3 rounded-xl outline-none cursor-pointer" style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '13px' }}>
              <option value="UNIVERSIDAD" style={{ background: T.selectOptionBg }}>Universidad</option>
              <option value="FACULTAD" style={{ background: T.selectOptionBg }}>Facultad</option>
            </select>
          </div>
          <div>
            <label className="block mb-1.5" style={{ color: T.text, fontSize: '12px', fontWeight: 500 }}>Tipo</label>
            <select value={type} onChange={e => setType(e.target.value as any)} className="w-full py-2.5 px-3 rounded-xl outline-none cursor-pointer" style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '13px' }}>
              <option value="GENERAL" style={{ background: T.selectOptionBg }}>General</option>
              <option value="ASAMBLEA" style={{ background: T.selectOptionBg }}>Asamblea</option>
            </select>
          </div>
        </div>
        {scope === 'FACULTAD' && (
          <div>
            <label className="block mb-1.5" style={{ color: T.text, fontSize: '12px', fontWeight: 500 }}>Facultad</label>
            <input type="text" value={faculty} onChange={e => setFaculty(e.target.value)} placeholder="Ej: Ingeniería" className="w-full py-2.5 px-3 rounded-xl outline-none" style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '13px' }} />
          </div>
        )}
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
