import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Bug, X, Loader2, CheckCircle, ChevronDown } from 'lucide-react';
import { useThemeTokens } from '../context/useThemeTokens';
import { useAuth } from '../context/AuthContext';
import { reportApi, ReportType, ApiError } from '../services/api';
import { PhotoPicker } from './PhotoPicker';

const typeLabels: Record<ReportType, string> = {
  ERROR_HORARIO: 'Error en horario',
  CAMBIO_SALON: 'Cambio de salón',
  INFORMACION_INCORRECTA: 'Información incorrecta',
  OTRO: 'Otro',
};

export function BugReportButton() {
  const { user, isAuthenticated } = useAuth();
  const T = useThemeTokens();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  if (!isAuthenticated || !user) return null;

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => { setOpen(true); setSent(false); }}
        title="Reportar un problema"
        className="fixed z-40 flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg transition-all duration-200 bottom-20 md:bottom-6 right-4"
        style={{
          background: T.isDark ? 'rgba(30,24,50,0.92)' : 'rgba(255,255,255,0.95)',
          border: `1px solid ${T.isDark ? 'rgba(201,52,76,0.25)' : 'rgba(201,52,76,0.2)'}`,
          color: T.textMuted,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 500,
          boxShadow: T.isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.1)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = '#C9344C';
          e.currentTarget.style.borderColor = 'rgba(201,52,76,0.5)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = T.textMuted;
          e.currentTarget.style.borderColor = T.isDark ? 'rgba(201,52,76,0.25)' : 'rgba(201,52,76,0.2)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <Bug size={14} />
        <span className="hidden sm:inline">Reportar problema</span>
      </button>

      {open && createPortal(
        <BugReportModal T={T} sent={sent} setSent={setSent} onClose={() => setOpen(false)} />,
        document.body
      )}
    </>
  );
}

function BugReportModal({
  T, sent, setSent, onClose,
}: {
  T: ReturnType<typeof useThemeTokens>;
  sent: boolean;
  setSent: (v: boolean) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<ReportType>('ERROR_HORARIO');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typeOpen, setTypeOpen] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) { setError('La descripción es obligatoria.'); return; }
    setSaving(true); setError(null);
    try {
      await reportApi.create({
        reportType: type,
        description: description.trim(),
        evidenceUrl: photos.length > 0 ? JSON.stringify(photos) : undefined,
      });
      setSent(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error enviando el reporte');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: T.isDark ? 'rgba(30,30,52,0.97)' : 'rgba(255,255,255,0.97)',
          border: `1px solid ${T.cardBorder}`,
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${T.divider}` }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: T.isDark ? 'rgba(201,52,76,0.15)' : 'rgba(201,52,76,0.08)', border: `1px solid rgba(201,52,76,0.22)` }}>
              <Bug size={15} style={{ color: '#C9344C' }} />
            </div>
            <div>
              <h3 style={{ color: T.text, fontSize: '15px', fontWeight: 700 }}>Reportar problema</h3>
              <p style={{ color: T.textMuted, fontSize: '11px' }}>Tu reporte ayuda a mejorar NexoUD</p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {sent ? (
          <div className="px-5 py-10 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: T.accentGreen.bg, border: `1px solid ${T.accentGreen.border}` }}>
              <CheckCircle size={28} style={{ color: T.accentGreen.color }} />
            </div>
            <p style={{ color: T.text, fontWeight: 700, fontSize: '16px' }}>¡Reporte enviado!</p>
            <p style={{ color: T.textMuted, fontSize: '13px', maxWidth: '280px' }}>
              El equipo de administración revisará tu reporte. Gracias por ayudarnos a mejorar.
            </p>
            <button onClick={onClose} className="mt-2 px-5 py-2.5 rounded-xl" style={{ background: '#C9344C', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              Cerrar
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Type selector */}
            <div>
              <label className="block mb-1.5" style={{ color: T.text, fontSize: '12px', fontWeight: 500 }}>Tipo de problema</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTypeOpen(!typeOpen)}
                  className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl"
                  style={{ background: T.inputBg, border: `1px solid ${typeOpen ? '#C9344C' : T.inputBorder}`, color: T.inputText, fontSize: '13px', cursor: 'pointer', textAlign: 'left' }}
                >
                  {typeLabels[type]}
                  <ChevronDown size={14} style={{ color: T.textMuted, transform: typeOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                </button>
                {typeOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-10" style={{ background: T.isDark ? 'rgb(30,26,48)' : '#FFFFFF', border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}>
                    {(Object.entries(typeLabels) as [ReportType, string][]).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => { setType(val); setTypeOpen(false); }}
                        className="w-full text-left px-3 py-2.5 transition-all"
                        style={{
                          background: val === type ? (T.isDark ? 'rgba(201,52,76,0.12)' : 'rgba(201,52,76,0.06)') : 'transparent',
                          color: val === type ? '#C9344C' : T.text,
                          fontSize: '13px',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={e => { if (val !== type) e.currentTarget.style.background = T.isDark ? 'rgba(255,255,255,0.04)' : '#F5F5F7'; }}
                        onMouseLeave={e => { if (val !== type) e.currentTarget.style.background = 'transparent'; }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block mb-1.5" style={{ color: T.text, fontSize: '12px', fontWeight: 500 }}>Descripción <span style={{ color: T.textSubtle, fontWeight: 400 }}>(qué pasó, dónde, cómo reproducirlo)</span></label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe el problema con el mayor detalle posible..."
                className="w-full py-2.5 px-3 rounded-xl outline-none resize-none"
                style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '13px', lineHeight: 1.6 }}
                onFocus={e => { e.currentTarget.style.borderColor = '#C9344C'; }}
                onBlur={e => { e.currentTarget.style.borderColor = T.inputBorder; }}
              />
              <p style={{ color: T.textSubtle, fontSize: '11px', marginTop: '3px', textAlign: 'right' }}>{description.length}/2000</p>
            </div>

            {/* Photos */}
            <PhotoPicker photos={photos} onChange={setPhotos} />

            {error && (
              <div className="p-3 rounded-xl flex items-center gap-2" style={{ background: T.error.bg, border: `1px solid ${T.error.border}` }}>
                <p style={{ color: T.error.text, fontSize: '12px' }}>{error}</p>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-1">
              <button onClick={onClose} className="px-4 py-2 rounded-xl" style={{ background: T.btnGhostBg, border: `1px solid ${T.btnGhostBorder}`, color: T.btnGhostColor, cursor: 'pointer', fontSize: '13px' }}>
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || description.length > 2000}
                className="px-4 py-2 rounded-xl flex items-center gap-1.5"
                style={{ background: '#C9344C', color: 'white', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, opacity: saving ? 0.7 : 1 }}
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Enviar reporte
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
