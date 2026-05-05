import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth, ApiError } from '../context/AuthContext';
import { useThemeTokens } from '../context/useThemeTokens';
import { authApi } from '../services/api';
import {
  Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, Sun, Moon,
  CheckCircle, Zap, BookOpen, Clock, Calendar,
} from 'lucide-react';

// ─── Animations ──────────────────────────────────────────────────────────────

const AUTH_CSS = `
  @keyframes _aFadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes _aBlob1   { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-20px) scale(1.06)} 66%{transform:translate(-18px,14px) scale(0.95)} }
  @keyframes _aBlob2   { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-25px,18px) scale(1.05)} 66%{transform:translate(16px,-14px) scale(0.96)} }

  .ae0 { animation: _aFadeUp .65s cubic-bezier(.16,1,.3,1) both; }
  .ae1 { animation: _aFadeUp .65s .08s cubic-bezier(.16,1,.3,1) both; }
  .ae2 { animation: _aFadeUp .65s .16s cubic-bezier(.16,1,.3,1) both; }
  .ae3 { animation: _aFadeUp .65s .24s cubic-bezier(.16,1,.3,1) both; }
  .ae4 { animation: _aFadeUp .65s .32s cubic-bezier(.16,1,.3,1) both; }
  .ablob1 { animation: _aBlob1 13s ease-in-out infinite; }
  .ablob2 { animation: _aBlob2 17s ease-in-out infinite; }

  @media (prefers-reduced-motion: reduce) {
    .ae0,.ae1,.ae2,.ae3,.ae4 { animation:none!important; opacity:1!important; transform:none!important; }
    .ablob1,.ablob2 { animation:none!important; }
  }
`;

const LEFT_FEATURES = [
  { icon: Zap,      text: 'Detecta cruces de horario automáticamente', color: '#E8485F' },
  { icon: BookOpen, text: 'Controla tus créditos en tiempo real',       color: '#818CF8' },
  { icon: Clock,    text: 'Calcula tiempos entre sedes de la UD',       color: '#34D399' },
  { icon: Calendar, text: 'Guarda múltiples versiones de tu horario',   color: '#FBBF24' },
];

// ─── Forgot Password Modal ────────────────────────────────────────────────────

type ForgotStep = 'email' | 'reset' | 'done';

function ForgotPasswordModal({ onClose, T }: { onClose: () => void; T: ReturnType<typeof useThemeTokens> }) {
  const [step, setStep]           = useState<ForgotStep>('email');
  const [email, setEmail]         = useState('');
  const [code, setCode]           = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPwd, setShowPwd]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const ifocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = T.inputFocusBorder;
    e.currentTarget.style.boxShadow   = `0 0 0 3px ${T.inputFocusShadow}`;
  };
  const iblur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = T.inputBorder;
    e.currentTarget.style.boxShadow   = 'none';
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.endsWith('@udistrital.edu.co')) {
      setError('Ingresa un correo institucional (@udistrital.edu.co)');
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setStep('reset');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo enviar el código. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!code || code.length < 6)  { setError('Ingresa el código de 6 dígitos'); return; }
    if (newPassword.length < 8)    { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    setLoading(true);
    try {
      await authApi.resetPassword({ email, code, newPassword });
      setStep('done');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Código incorrecto o expirado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-[400px] p-8 rounded-3xl ae0"
        style={{ background: T.authCardBg, backdropFilter: T.authCardBlur, WebkitBackdropFilter: T.authCardBlur, border: `1px solid ${T.authCardBorder}`, boxShadow: T.authCardShadow }}
      >
        {step === 'done' ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: T.accentGreen.bg, border: `1px solid ${T.accentGreen.border}` }}>
              <CheckCircle size={28} style={{ color: T.accentGreen.color }} />
            </div>
            <h2 style={{ color: T.text, fontWeight: 700, fontSize: '20px', marginBottom: '8px' }}>¡Contraseña actualizada!</h2>
            <p style={{ color: T.textMuted, fontSize: '14px', marginBottom: '20px' }}>Ya puedes iniciar sesión con tu nueva contraseña.</p>
            <button onClick={onClose} className="w-full py-3 rounded-xl"
              style={{ background: 'linear-gradient(135deg,#E8485F,#B02D44)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
              Cerrar
            </button>
          </div>
        ) : step === 'email' ? (
          <>
            <h2 style={{ color: T.text, fontWeight: 700, fontSize: '20px', marginBottom: '6px' }}>Recuperar contraseña</h2>
            <p style={{ color: T.textMuted, fontSize: '13px', marginBottom: '20px' }}>
              Te enviaremos un código de verificación a tu correo institucional.
            </p>
            {error && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl mb-4"
                style={{ background: T.error.bg, border: `1px solid ${T.error.border}` }}>
                <AlertCircle size={15} style={{ color: T.error.text, flexShrink: 0, marginTop: '1px' }} />
                <p style={{ color: T.error.text, fontSize: '13px' }}>{error}</p>
              </div>
            )}
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block mb-2" style={{ color: T.textMuted, fontSize: '13px', fontWeight: 500 }}>Correo institucional</label>
                <div className="relative">
                  <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: T.inputIcon }} />
                  <input
                    type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="correo@udistrital.edu.co"
                    className="w-full py-3 pl-10 pr-4 rounded-xl outline-none transition-all"
                    style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '14px' }}
                    onFocus={ifocus} onBlur={iblur}
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl transition-all"
                style={{ background: loading ? T.cardBg2 : 'linear-gradient(135deg,#E8485F,#B02D44)', color: loading ? T.textMuted : 'white', border: loading ? `1px solid ${T.cardBorder}` : 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 600 }}>
                {loading ? 'Enviando...' : 'Enviar código'}
              </button>
              <button type="button" onClick={onClose} className="w-full py-3 rounded-xl"
                style={{ background: 'transparent', color: T.textMuted, border: `1px solid ${T.cardBorder}`, cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                Cancelar
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 style={{ color: T.text, fontWeight: 700, fontSize: '20px', marginBottom: '6px' }}>Ingresa el código</h2>
            <p style={{ color: T.textMuted, fontSize: '13px', marginBottom: '20px' }}>
              Revisá tu correo <span style={{ color: T.link }}>{email}</span> y escribe el código junto con tu nueva contraseña.
            </p>
            {error && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl mb-4"
                style={{ background: T.error.bg, border: `1px solid ${T.error.border}` }}>
                <AlertCircle size={15} style={{ color: T.error.text, flexShrink: 0, marginTop: '1px' }} />
                <p style={{ color: T.error.text, fontSize: '13px' }}>{error}</p>
              </div>
            )}
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block mb-2" style={{ color: T.textMuted, fontSize: '13px', fontWeight: 500 }}>Código de 6 dígitos</label>
                <input
                  type="text" inputMode="numeric" value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456" maxLength={6}
                  className="w-full py-3 px-4 rounded-xl outline-none transition-all text-center"
                  style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '22px', fontWeight: 700, fontFamily: 'JetBrains Mono,monospace', letterSpacing: '0.25em' }}
                  onFocus={ifocus} onBlur={iblur}
                />
              </div>
              <div>
                <label className="block mb-2" style={{ color: T.textMuted, fontSize: '13px', fontWeight: 500 }}>Nueva contraseña</label>
                <div className="relative">
                  <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: T.inputIcon }} />
                  <input
                    type={showPwd ? 'text' : 'password'} value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full py-3 pl-10 pr-12 rounded-xl outline-none transition-all"
                    style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '14px' }}
                    onFocus={ifocus} onBlur={iblur}
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: T.inputIcon, background: 'none', border: 'none', cursor: 'pointer' }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl transition-all"
                style={{ background: loading ? T.cardBg2 : 'linear-gradient(135deg,#E8485F,#B02D44)', color: loading ? T.textMuted : 'white', border: loading ? `1px solid ${T.cardBorder}` : 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 600 }}>
                {loading ? 'Guardando...' : 'Cambiar contraseña'}
              </button>
              <button type="button" onClick={() => { setStep('email'); setError(''); }} className="w-full py-3 rounded-xl"
                style={{ background: 'transparent', color: T.textMuted, border: `1px solid ${T.cardBorder}`, cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                Volver
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────

const QUICK_STORAGE_KEY = 'nexoud_quick_schedule';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, updateUser } = useAuth();
  const T = useThemeTokens();
  const [formData, setFormData]   = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.email || !formData.password) {
      setError('Por favor completa todos los campos');
      return;
    }
    setLoading(true);
    try {
      await login(formData.email, formData.password);

      const quickRaw = sessionStorage.getItem(QUICK_STORAGE_KEY) || localStorage.getItem(QUICK_STORAGE_KEY);
      if (quickRaw) {
        try {
          const quick = JSON.parse(quickRaw);
          const newH = { id: Date.now().toString(), nombre: 'Horario modo rápido', semestre: 'Activo', materias: quick.materias };
          updateUser({ horariosGuardados: [newH] });
          sessionStorage.removeItem(QUICK_STORAGE_KEY);
          localStorage.removeItem(QUICK_STORAGE_KEY);
          navigate('/planner', { state: { editSchedule: newH } });
          return;
        } catch {
          sessionStorage.removeItem(QUICK_STORAGE_KEY);
          localStorage.removeItem(QUICK_STORAGE_KEY);
        }
      }

      navigate('/dashboard');
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Credenciales incorrectas. Verifica tu correo y contraseña.'
      );
    } finally {
      setLoading(false);
    }
  };

  const ifocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = T.inputFocusBorder;
    e.currentTarget.style.boxShadow   = `0 0 0 3px ${T.inputFocusShadow}`;
  };
  const iblur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = T.inputBorder;
    e.currentTarget.style.boxShadow   = 'none';
  };

  return (
    <>
      <style>{AUTH_CSS}</style>
      <div
        className="min-h-screen flex"
        style={{ backgroundColor: T.pageBgColor, backgroundImage: T.isDark ? T.pageBg : 'none' }}
      >
        {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} T={T} />}

        {/* ── LEFT DECORATIVE PANEL ─────────────────────────── */}
        <div
          className="hidden lg:flex w-[440px] xl:w-[500px] flex-shrink-0 flex-col relative overflow-hidden"
          style={{
            background: T.isDark
              ? 'linear-gradient(145deg,#150F2B 0%,#0D0A1E 100%)'
              : 'linear-gradient(145deg,#FFF5F6 0%,#F0F0F5 100%)',
            borderRight: `1px solid ${T.isDark ? 'rgba(255,255,255,0.07)' : '#E8E8ED'}`,
          }}
        >
          {/* Blobs */}
          {T.isDark && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="ablob1 absolute top-1/4 left-1/4 w-[320px] h-[320px] rounded-full opacity-[0.22]"
                style={{ background: 'radial-gradient(circle,rgba(232,72,95,.65) 0%,transparent 65%)', filter: 'blur(80px)' }} />
              <div className="ablob2 absolute bottom-1/3 right-1/4 w-[260px] h-[260px] rounded-full opacity-[0.16]"
                style={{ background: 'radial-gradient(circle,rgba(129,140,248,.65) 0%,transparent 65%)', filter: 'blur(80px)' }} />
            </div>
          )}
          {!T.isDark && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-[380px] h-[380px] opacity-[0.6]"
                style={{ background: 'radial-gradient(ellipse at top right,rgba(201,52,76,.07) 0%,transparent 60%)' }} />
            </div>
          )}

          <div className="flex flex-col h-full p-12 relative z-10">
            {/* Logo */}
            <div className="ae0 flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#E8485F,#A02438)', boxShadow: '0 4px 14px rgba(201,52,76,.45)' }}
              >
                <span style={{ color: 'white', fontWeight: 800, fontSize: '16px' }}>N</span>
              </div>
              <span style={{ color: T.text, fontWeight: 700, fontSize: '20px', letterSpacing: '-0.03em' }}>NexoUD</span>
            </div>

            {/* Tagline + features */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="ae1 mb-10">
                <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.15, color: T.text, marginBottom: '12px' }}>
                  Planifica tu{' '}
                  <span style={{
                    backgroundImage: 'linear-gradient(135deg,#E8485F,#818CF8)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}>semestre</span>
                  <br />con inteligencia
                </h2>
                <p style={{ color: T.textMuted, fontSize: '14px', lineHeight: 1.75 }}>
                  La herramienta que los estudiantes de la UD necesitaban para organizar sus horarios antes del día de inscripciones.
                </p>
              </div>

              <div className="ae2 space-y-3">
                {LEFT_FEATURES.map(({ icon: Icon, text, color }) => (
                  <div key={text} className="flex items-center gap-3 group">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                      style={{ background: `${color}18`, border: `1px solid ${color}30` }}
                    >
                      <Icon size={15} style={{ color }} />
                    </div>
                    <span style={{ color: T.textMuted, fontSize: '13.5px', lineHeight: 1.5 }}>{text}</span>
                  </div>
                ))}
              </div>

              {/* Mini schedule preview */}
              <div
                className="ae3 mt-10 rounded-2xl overflow-hidden"
                style={{
                  background: T.isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                  border: `1px solid ${T.isDark ? 'rgba(255,255,255,0.08)' : '#E5E5EA'}`,
                  boxShadow: T.isDark ? '0 16px 48px rgba(0,0,0,0.40)' : '0 4px 24px rgba(0,0,0,0.08)',
                }}
              >
                <div
                  className="flex items-center gap-1.5 px-3 py-2.5"
                  style={{ borderBottom: `1px solid ${T.isDark ? 'rgba(255,255,255,0.06)' : '#F0F0F3'}`, background: T.isDark ? 'rgba(255,255,255,0.02)' : '#FAFAFA' }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: '#F87171' }} />
                  <div className="w-2 h-2 rounded-full" style={{ background: '#FBBF24' }} />
                  <div className="w-2 h-2 rounded-full" style={{ background: '#34D399' }} />
                  <span style={{ color: T.isDark ? '#6B6A77' : '#9E9EA6', fontSize: '9px', marginLeft: '6px', fontWeight: 500 }}>Horario 2026-1</span>
                </div>
                <div className="p-3">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '4px' }}>
                    {['LUN','MAR','MIÉ','JUE','VIE'].map(d => (
                      <div key={d} className="text-center pb-1.5" style={{ fontSize: '8px', color: T.isDark ? '#5C5B6A' : '#AEAEB8', fontWeight: 700, borderBottom: `1px solid ${T.isDark ? 'rgba(255,255,255,0.05)' : '#F0F0F3'}`, letterSpacing: '0.05em' }}>{d}</div>
                    ))}
                    {[
                      { c: T.isDark ? '#818CF8' : '#4F46E5', l: 'Cálculo' },
                      { c: '',                                l: '' },
                      { c: T.isDark ? '#818CF8' : '#4F46E5', l: 'Cálculo' },
                      { c: '',                                l: '' },
                      { c: T.isDark ? '#818CF8' : '#4F46E5', l: 'Cálculo' },
                      { c: '',                                l: '' },
                      { c: T.isDark ? '#E8485F' : '#C9344C', l: 'Prog. I' },
                      { c: '',                                l: '' },
                      { c: T.isDark ? '#E8485F' : '#C9344C', l: 'Prog. I' },
                      { c: '',                                l: '' },
                    ].map((s, i) => (
                      <div key={i} className="rounded-md p-1 flex items-center justify-center" style={{ minHeight: '36px', background: s.c ? (T.isDark ? `${s.c}22` : `${s.c}14`) : 'transparent', border: s.c ? `1px solid ${s.c}${T.isDark ? '44' : '30'}` : '1px solid transparent' }}>
                        {s.l && <span style={{ color: s.c, fontSize: '7px', fontWeight: 700, textAlign: 'center', lineHeight: 1.3 }}>{s.l}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Back to home */}
            <div className="ae4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 transition-all duration-200"
                style={{ color: T.textSubtle, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}
                onMouseEnter={e => e.currentTarget.style.color = T.textMuted}
                onMouseLeave={e => e.currentTarget.style.color = T.textSubtle}
              >
                <ArrowLeft size={14} /> Volver al inicio
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL (form) ────────────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">

          {/* Subtle bg for right panel in dark mode */}
          {T.isDark && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute bottom-0 right-0 w-[400px] h-[400px] opacity-[0.05]"
                style={{ background: 'radial-gradient(circle,rgba(129,140,248,.6) 0%,transparent 65%)', filter: 'blur(80px)' }} />
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={T.toggleTheme}
            className="absolute top-5 right-5 p-2 rounded-xl transition-all z-10"
            style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, color: T.textMuted, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.color = T.text}
            onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
          >
            {T.isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Mobile: back button */}
          <button
            onClick={() => navigate('/')}
            className="lg:hidden flex items-center gap-2 mb-8 self-start transition-all"
            style={{ color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
            onMouseEnter={e => e.currentTarget.style.color = T.text}
            onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
          >
            <ArrowLeft size={15} /> Volver al inicio
          </button>

          <div className="w-full max-w-[400px] relative z-10">
            {/* Mobile-only logo */}
            <div className="ae0 lg:hidden text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#E8485F,#A02438)', boxShadow: T.isDark ? '0 4px 16px rgba(201,52,76,.4)' : '0 2px 8px rgba(201,52,76,.22)' }}>
                  <span style={{ color: 'white', fontWeight: 800, fontSize: '16px' }}>N</span>
                </div>
                <span style={{ color: T.text, fontWeight: 700, fontSize: '22px', letterSpacing: '-0.02em' }}>NexoUD</span>
              </div>
            </div>

            {/* Greeting */}
            <div className="ae0 mb-8">
              <h1 style={{ color: T.text, fontWeight: 800, fontSize: '30px', letterSpacing: '-0.04em', marginBottom: '6px', lineHeight: 1.2 }}>
                Bienvenido de vuelta
              </h1>
              <p style={{ color: T.textMuted, fontSize: '14px', lineHeight: 1.6 }}>
                Ingresa tus credenciales para continuar
              </p>
            </div>

            {/* Card */}
            <div
              className="ae1 p-7 rounded-3xl"
              style={{ background: T.authCardBg, backdropFilter: T.authCardBlur, WebkitBackdropFilter: T.authCardBlur, border: `1px solid ${T.authCardBorder}`, boxShadow: T.authCardShadow }}
            >
              {error && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl mb-5"
                  style={{ background: T.error.bg, border: `1px solid ${T.error.border}` }}>
                  <AlertCircle size={15} style={{ color: T.error.text, flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ color: T.error.text, fontSize: '13px', lineHeight: 1.5 }}>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-2" style={{ color: T.textMuted, fontSize: '13px', fontWeight: 500 }}>
                    Correo institucional
                  </label>
                  <div className="relative">
                    <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: T.inputIcon }} />
                    <input
                      type="email" value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="correo@udistrital.edu.co"
                      className="w-full py-3 pl-10 pr-4 rounded-xl outline-none transition-all"
                      style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '14px' }}
                      onFocus={ifocus} onBlur={iblur}
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2" style={{ color: T.textMuted, fontSize: '13px', fontWeight: 500 }}>
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: T.inputIcon }} />
                    <input
                      type={showPassword ? 'text' : 'password'} value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full py-3 pl-10 pr-12 rounded-xl outline-none transition-all"
                      style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '14px' }}
                      onFocus={ifocus} onBlur={iblur}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: T.inputIcon, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="flex justify-end mt-2">
                    <button type="button" onClick={() => setShowForgot(true)}
                      style={{ color: T.link, fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}>
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl transition-all mt-2"
                  style={{
                    background: loading ? T.cardBg2 : 'linear-gradient(135deg,#E8485F,#B02D44)',
                    color: loading ? T.textMuted : 'white',
                    border: loading ? `1px solid ${T.cardBorder}` : 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '15px', fontWeight: 600,
                    boxShadow: loading ? 'none' : T.primaryShadow,
                  }}
                  onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 36px rgba(201,52,76,.60)'; } }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = loading ? 'none' : T.primaryShadow; }}
                >
                  {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </button>
              </form>

              <div
                className="mt-6 pt-5 text-center"
                style={{ borderTop: `1px solid ${T.isDark ? 'rgba(255,255,255,0.06)' : '#F0F0F3'}` }}
              >
                <p style={{ color: T.textMuted, fontSize: '13px' }}>
                  ¿No tienes cuenta?{' '}
                  <Link to="/register" style={{ color: T.link, fontWeight: 600, textDecoration: 'none' }}>
                    Regístrate gratis
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
