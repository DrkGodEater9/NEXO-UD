import React from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useThemeTokens } from '../context/useThemeTokens';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export function Modal({ isOpen, onClose, children, title, size = 'md' }: ModalProps) {
  const T = useThemeTokens();
  if (!isOpen) return null;
  const maxWidths = { sm: '400px', md: '540px', lg: '720px', full: '95vw' };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      style={{ background: T.overlayBg, backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full animate-scale-in overflow-hidden"
        style={{
          maxWidth: maxWidths[size],
          maxHeight: '90vh',
          overflowY: 'auto',
          background: T.modalBg,
          backdropFilter: T.modalBlur,
          WebkitBackdropFilter: T.modalBlur,
          border: `1px solid ${T.modalBorder}`,
          borderRadius: '24px',
          boxShadow: T.modalShadow,
        }}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: `1px solid ${T.divider}` }}
          >
            <h3 style={{ color: T.text, fontWeight: 600, fontSize: '16px', margin: 0 }}>{title}</h3>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
              style={{ color: T.textMuted, background: T.modalCloseBg, border: `1px solid ${T.modalCloseBorder}`, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.color = T.text; }}
              onMouseLeave={e => { e.currentTarget.style.color = T.textMuted; }}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ─── PromptModal ──────────────────────────────────────────────────────────────
interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  message: string;
  defaultValue?: string;
  placeholder?: string;
}

export function PromptModal({
  isOpen, onClose, onConfirm, title, message, defaultValue = '', placeholder
}: PromptModalProps) {
  const T = useThemeTokens();
  const [value, setValue] = React.useState(defaultValue);

  React.useEffect(() => { setValue(defaultValue); }, [defaultValue, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) { onConfirm(value.trim()); setValue(''); }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      style={{ background: T.overlayBg, backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] animate-scale-in"
        style={{
          background: T.modalBg,
          backdropFilter: T.modalBlur,
          WebkitBackdropFilter: T.modalBlur,
          border: `1px solid ${T.modalBorder}`,
          borderRadius: '24px',
          boxShadow: T.modalShadow,
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${T.divider}` }}>
          <h3 style={{ color: T.text, fontWeight: 600, fontSize: '16px', margin: 0 }}>{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ color: T.textMuted, background: T.modalCloseBg, border: `1px solid ${T.modalCloseBorder}`, cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5">
            <p style={{ color: T.textMuted, fontSize: '14px', marginBottom: '16px' }}>{message}</p>
            <input
              type="text"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={placeholder}
              autoFocus
              className="w-full px-4 py-3 rounded-xl outline-none transition-all"
              style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '14px' }}
              onFocus={e => { e.currentTarget.style.borderColor = T.inputFocusBorder; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.inputFocusShadow}`; }}
              onBlur={e => { e.currentTarget.style.borderColor = T.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
          <div className="flex gap-3 px-6 py-4" style={{ borderTop: `1px solid ${T.divider}` }}>
            <button
              type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl transition-all"
              style={{ background: T.btnGhostBg, border: `1px solid ${T.btnGhostBorder}`, color: T.textMuted, cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl transition-all"
              style={{ background: '#C9344C', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600, border: 'none', boxShadow: T.primaryShadow }}
            >
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── AlertModal ───────────────────────────────────────────────────────────────
interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
}

export function AlertModal({ isOpen, onClose, title, message, type = 'info' }: AlertModalProps) {
  const T = useThemeTokens();
  if (!isOpen) return null;

  const configs = {
    success: { Icon: CheckCircle, color: T.accentGreen.color, bg: T.accentGreen.bg, border: T.accentGreen.border },
    error:   { Icon: AlertCircle, color: T.error.text,         bg: T.error.bg,         border: T.error.border },
    warning: { Icon: AlertTriangle, color: T.accentYellow.color, bg: T.accentYellow.bg, border: T.accentYellow.border },
    info:    { Icon: Info,          color: T.accentCyan.color,  bg: T.accentCyan.bg,   border: T.accentCyan.border },
  };
  const { Icon, color, bg, border } = configs[type];

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      style={{ background: T.overlayBg, backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[380px] animate-scale-in"
        style={{ background: T.modalBg, backdropFilter: T.modalBlur, border: `1px solid ${T.modalBorder}`, borderRadius: '24px', boxShadow: T.modalShadow, overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center px-8 py-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: bg, border: `1px solid ${border}` }}>
            <Icon size={28} style={{ color }} />
          </div>
          <h3 style={{ color: T.text, fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>{title}</h3>
          <p style={{ color: T.textMuted, fontSize: '14px', lineHeight: 1.6 }}>{message}</p>
        </div>
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl transition-all"
            style={{ background: '#C9344C', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600, border: 'none', boxShadow: T.primaryShadow }}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({
  isOpen, onClose, onConfirm, title, message,
  confirmText = 'Confirmar', cancelText = 'Cancelar', type = 'warning'
}: ConfirmModalProps) {
  const T = useThemeTokens();
  if (!isOpen) return null;

  const handleConfirm = () => { onConfirm(); onClose(); };

  const confirmStyles: Record<string, React.CSSProperties> = {
    danger:  { background: '#DC2626', boxShadow: '0 4px 16px rgba(220,38,38,0.30)' },
    warning: { background: '#D97706', boxShadow: '0 4px 16px rgba(217,119,6,0.30)' },
    info:    { background: '#C9344C', boxShadow: T.primaryShadow },
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      style={{ background: T.overlayBg, backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] animate-scale-in"
        style={{ background: T.modalBg, backdropFilter: T.modalBlur, border: `1px solid ${T.modalBorder}`, borderRadius: '24px', boxShadow: T.modalShadow, overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5" style={{ borderBottom: `1px solid ${T.divider}` }}>
          <h3 style={{ color: T.text, fontWeight: 600, fontSize: '16px', margin: 0 }}>{title}</h3>
        </div>
        <div className="px-6 py-5">
          <p style={{ color: T.textMuted, fontSize: '14px', lineHeight: 1.6 }}>{message}</p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button" onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl transition-all"
            style={{ background: T.btnGhostBg, border: `1px solid ${T.btnGhostBorder}`, color: T.textMuted, cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
          >
            {cancelText}
          </button>
          <button
            type="button" onClick={handleConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl transition-all"
            style={{ ...confirmStyles[type], color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600, border: 'none' }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
