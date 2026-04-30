import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { useThemeTokens } from '../context/useThemeTokens';
import { Calendar, Plus, Pencil, Trash2, X, Loader2, AlertCircle } from 'lucide-react';
import {
  calendarApi, CalendarEventData, CalendarEventPayload, CalendarEventType, ApiError,
} from '../services/api';

const EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  INSCRIPCION:   'Inscripción',
  INICIO_CLASES: 'Inicio de clases',
  FIN_CLASES:    'Fin de clases',
  PARCIAL:       'Parcial',
  FESTIVO:       'Festivo',
  PARO:          'Paro',
  OTRO:          'Otro',
};

const EVENT_TYPE_COLORS: Record<CalendarEventType, { bg: string; color: string; border: string }> = {
  INSCRIPCION:   { bg: 'rgba(99,102,241,0.12)',  color: '#818CF8', border: 'rgba(99,102,241,0.22)' },
  INICIO_CLASES: { bg: 'rgba(52,211,153,0.12)',  color: '#34D399', border: 'rgba(52,211,153,0.22)' },
  FIN_CLASES:    { bg: 'rgba(244,114,182,0.12)', color: '#F472B6', border: 'rgba(244,114,182,0.22)' },
  PARCIAL:       { bg: 'rgba(201,52,76,0.12)',   color: '#E8485F', border: 'rgba(201,52,76,0.22)' },
  FESTIVO:       { bg: 'rgba(251,191,36,0.12)',  color: '#FBBF24', border: 'rgba(251,191,36,0.22)' },
  PARO:          { bg: 'rgba(248,113,113,0.12)', color: '#F87171', border: 'rgba(248,113,113,0.22)' },
  OTRO:          { bg: 'rgba(139,138,151,0.12)', color: '#8B8A97', border: 'rgba(139,138,151,0.22)' },
};

const ALL_TYPES: CalendarEventType[] = [
  'INSCRIPCION', 'INICIO_CLASES', 'FIN_CLASES', 'PARCIAL', 'FESTIVO', 'PARO', 'OTRO',
];

interface CalendarFormProps {
  initial?: CalendarEventData | null;
  onSave: (data: CalendarEventPayload) => Promise<void>;
  onClose: () => void;
  T: ReturnType<typeof useThemeTokens>;
}

function CalendarForm({ initial, onSave, onClose, T }: CalendarFormProps) {
  const [startDate, setStartDate] = useState(initial?.startDate ?? '');
  const [endDate, setEndDate] = useState(initial?.endDate ?? '');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [eventType, setEventType] = useState<CalendarEventType>(initial?.eventType ?? 'OTRO');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !title) { setError('Fecha y título son obligatorios'); return; }
    setSaving(true);
    try {
      const payload: CalendarEventPayload = { title, eventType, startDate };
      if (description) payload.description = description;
      if (endDate) payload.endDate = endDate;
      await onSave(payload);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al guardar');
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '10px',
    background: T.inputBg, border: `1px solid ${T.inputBorder}`,
    color: T.text, fontSize: '14px', outline: 'none',
  };

  const labelStyle = {
    color: T.textMuted, fontSize: '12px', fontWeight: 600,
    textTransform: 'uppercase' as const, letterSpacing: '0.06em',
    display: 'block', marginBottom: '6px',
  };

  const overlay = (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: T.isDark ? 'rgba(30,30,52,0.97)' : 'rgba(255,255,255,0.97)',
        border: `1px solid ${T.cardBorder}`,
        borderRadius: '20px',
        padding: '28px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ color: T.text, fontWeight: 700, fontSize: '18px' }}>
            {initial ? 'Editar evento' : 'Nuevo evento'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl"
            style={{ background: T.error.bg, border: `1px solid ${T.error.border}` }}>
            <AlertCircle size={14} style={{ color: T.error.text }} />
            <p style={{ color: T.error.text, fontSize: '13px' }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label style={labelStyle}>Título</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej. Inicio inscripciones 2026-2"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Tipo de evento</label>
            <select
              value={eventType}
              onChange={e => setEventType(e.target.value as CalendarEventType)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {ALL_TYPES.map(t => (
                <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Fecha inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Fecha fin <span style={{ fontWeight: 400, textTransform: 'none' }}>(opcional)</span></label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Descripción <span style={{ fontWeight: 400, textTransform: 'none' }}>(opcional)</span></label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detalles adicionales..."
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px',
                background: T.cardBg2, border: `1px solid ${T.cardBorder}`,
                color: T.textMuted, fontSize: '14px', fontWeight: 500, cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px',
                background: '#C9344C', border: 'none',
                color: 'white', fontSize: '14px', fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Guardando...' : initial ? 'Guardar cambios' : 'Crear evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

export default function ManageCalendarPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isRestoring } = useAuth();
  const T = useThemeTokens();
  const [items, setItems] = useState<CalendarEventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<CalendarEventData | null>(null);
  const [showForm, setShowForm] = useState(false);

  const canAccess = user?.roles.includes('RADICADOR_CALENDARIO') || user?.roles.includes('ADMINISTRADOR');

  useEffect(() => {
    if (isRestoring) return;
    if (!isAuthenticated) navigate('/login');
    if (user && !canAccess) navigate('/dashboard');
  }, [isAuthenticated, isRestoring, user, navigate, canAccess]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try { setItems(await calendarApi.list()); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Error cargando eventos'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  if (isRestoring || !isAuthenticated || !user || !canAccess) return null;

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este evento del calendario?')) return;
    try { await calendarApi.delete(id); await fetchItems(); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Error eliminando'); }
  };

  const handleSave = async (data: CalendarEventPayload) => {
    if (editing) await calendarApi.update(editing.id, data);
    else await calendarApi.create(data);
    setShowForm(false);
    setEditing(null);
    await fetchItems();
  };

  const sortedItems = [...items].sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: T.accentIndigo.bg, border: `1px solid ${T.accentIndigo.border}` }}>
              <Calendar size={18} style={{ color: T.accentIndigo.color }} />
            </div>
            <div>
              <h1 style={{ color: T.text, fontWeight: 700, fontSize: '20px' }}>Calendario académico</h1>
              <p style={{ color: T.textMuted, fontSize: '13px' }}>Gestiona los eventos del calendario institucional.</p>
            </div>
          </div>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl"
            style={{ background: '#C9344C', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
          >
            <Plus size={14} /> Nuevo evento
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl flex items-center gap-2"
            style={{ background: T.error.bg, border: `1px solid ${T.error.border}` }}>
            <AlertCircle size={16} style={{ color: T.error.text }} />
            <p style={{ color: T.error.text, fontSize: '13px' }}>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin" style={{ color: T.textMuted }} />
          </div>
        ) : sortedItems.length === 0 ? (
          <p className="py-12 text-center" style={{ color: T.textMuted, fontSize: '14px' }}>
            No hay eventos registrados.
          </p>
        ) : (
          <div className="space-y-2">
            {sortedItems.map(item => {
              const accent = EVENT_TYPE_COLORS[item.eventType] ?? EVENT_TYPE_COLORS.OTRO;
              const dateObj = new Date(item.startDate + 'T00:00:00');
              const dateLabel = dateObj.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

              return (
                <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl transition-all"
                  style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}>
                  <div className="w-20 text-center px-2 py-1.5 rounded-lg flex-shrink-0"
                    style={{ background: accent.bg, border: `1px solid ${accent.border}` }}>
                    <span style={{ color: accent.color, fontSize: '11px', fontWeight: 700 }}>{dateLabel}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: T.text, fontSize: '14px', fontWeight: 500 }}>{item.title}</p>
                    <span className="px-2 py-0.5 rounded-full mt-1 inline-block"
                      style={{ background: accent.bg, color: accent.color, fontSize: '10px', fontWeight: 600, border: `1px solid ${accent.border}` }}>
                      {EVENT_TYPE_LABELS[item.eventType] ?? item.eventType}
                    </span>
                    {item.description && (
                      <p style={{ color: T.textMuted, fontSize: '12px', marginTop: '2px' }}>{item.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => { setEditing(item); setShowForm(true); }}
                      className="p-2 rounded-lg transition-all"
                      style={{ background: T.cardBg2, border: `1px solid ${T.cardBorder}`, color: T.textMuted, cursor: 'pointer' }}
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-lg transition-all"
                      style={{ background: T.error.bg, border: `1px solid ${T.error.border}`, color: T.error.text, cursor: 'pointer' }}
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <CalendarForm
          initial={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
          T={T}
        />
      )}
    </AppLayout>
  );
}
