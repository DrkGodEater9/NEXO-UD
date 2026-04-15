import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useThemeTokens } from '../context/useThemeTokens';
import { Mail, CheckCircle, AlertCircle, ArrowLeft, RefreshCw, Sun, Moon } from 'lucide-react';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);
  const [countdown, setCountdown] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const correctCode = '123456';

  useEffect(() => {
    const pending = localStorage.getItem('pending_verification');
    if (!pending) {
      navigate('/register');
      return;
    }
    setPendingData(JSON.parse(pending));
  }, [navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;
    const newCode = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setCode(newCode);
    const nextEmpty = newCode.findIndex(d => !d);
    if (nextEmpty >= 0) inputRefs.current[nextEmpty]?.focus();
    else inputRefs.current[5]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const enteredCode = code.join('');
    if (enteredCode.length !== 6) {
      setError('Por favor ingresa el código completo');
      setLoading(false);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 1200));

    if (enteredCode === correctCode) {
      setSuccess(true);
      localStorage.removeItem('pending_verification');
      setTimeout(() => navigate('/login'), 2500);
    } else {
      setError('Código incorrecto. Inténtalo de nuevo.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }

    setLoading(false);
  };

  const resendCode = () => {
    setCountdown(45);
    setCanResend(false);
    setError('');
  };

  // Mask email
  const maskedEmail = pendingData?.correo
    ? pendingData.correo.replace(/(.{2})(.+)(@.+)/, (_, a: string, b: string, c: string) => a + '*'.repeat(Math.min(b.length, 6)) + c)
    : '';

  const T = useThemeTokens();

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundImage: T.pageBg, backgroundColor: T.pageBgColor }}>
        <div className="text-center animate-scale-in">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{ background: T.accentGreen.bg, border: `1px solid ${T.accentGreen.border}` }}>
            <CheckCircle size={40} style={{ color: T.accentGreen.color }} />
          </div>
          <h2 style={{ color: T.text, fontWeight: 700, fontSize: '24px', marginBottom: '10px' }}>¡Verificación exitosa!</h2>
          <p style={{ color: T.textMuted, fontSize: '15px', marginBottom: '6px' }}>Tu cuenta ha sido verificada correctamente</p>
          <p style={{ color: T.link, fontSize: '14px' }}>Redirigiendo al inicio de sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ backgroundImage: T.pageBg, backgroundColor: T.pageBgColor }}>
      {/* Theme toggle */}
      <button onClick={T.toggleTheme} className="absolute top-5 right-5 p-2 rounded-xl transition-all z-10"
        style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, color: T.textMuted, cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.color = T.text}
        onMouseLeave={e => e.currentTarget.style.color = T.textMuted}>
        {T.isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {T.showBlobs && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/3 w-72 h-72 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        </div>
      )}

      <div className="w-full max-w-[420px] relative">
        <button onClick={() => navigate('/register')} className="flex items-center gap-2 mb-8 transition-all"
          style={{ color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
          onMouseEnter={e => e.currentTarget.style.color = T.text}
          onMouseLeave={e => e.currentTarget.style.color = T.textMuted}>
          <ArrowLeft size={16} /> Volver al registro
        </button>

        <div className="p-8 rounded-3xl animate-fade-up"
          style={{ background: T.authCardBg, backdropFilter: T.authCardBlur, WebkitBackdropFilter: T.authCardBlur, border: `1px solid ${T.authCardBorder}`, boxShadow: T.authCardShadow }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: T.accentIndigo.bg, border: `1px solid ${T.accentIndigo.border}` }}>
            <Mail size={28} style={{ color: T.accentIndigo.color }} />
          </div>

          <h1 className="mb-2" style={{ color: T.text, fontWeight: 700, fontSize: '22px', letterSpacing: '-0.02em' }}>Verifica tu correo</h1>
          <p className="mb-2" style={{ color: T.textMuted, fontSize: '14px', lineHeight: 1.6 }}>Enviamos un código de 6 dígitos a</p>
          <p className="mb-6" style={{ color: T.link, fontSize: '14px', fontWeight: 500 }}>{maskedEmail}</p>

          {/* Demo hint */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl mb-6"
            style={{ background: T.secondaryBg, border: `1px solid ${T.secondaryBorder}` }}>
            <span style={{ color: T.secondary, fontSize: '13px' }}>
              Código de prueba:{' '}
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.1em', color: T.text }}>123456</span>
            </span>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl mb-5"
              style={{ background: T.error.bg, border: `1px solid ${T.error.border}` }}>
              <AlertCircle size={16} style={{ color: T.error.text, flexShrink: 0, marginTop: '1px' }} />
              <p style={{ color: T.error.text, fontSize: '13px' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex gap-2.5 justify-center mb-7" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input key={index} ref={el => { inputRefs.current[index] = el; }}
                  id={`code-${index}`} type="text" inputMode="numeric" maxLength={1}
                  value={digit} onChange={e => handleCodeChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center rounded-xl outline-none transition-all font-mono-num"
                  style={{
                    background: T.inputBg,
                    border: `1.5px solid ${digit ? T.inputFocusBorder : T.inputBorder}`,
                    color: T.inputText, fontSize: '22px', fontWeight: 700,
                    fontFamily: 'JetBrains Mono, monospace',
                    boxShadow: digit ? `0 0 0 3px ${T.inputFocusShadow}` : 'none',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = T.inputFocusBorder; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.inputFocusShadow}`; }}
                  onBlur={e => {
                    if (!e.currentTarget.value) { e.currentTarget.style.borderColor = T.inputBorder; e.currentTarget.style.boxShadow = 'none'; }
                    else { e.currentTarget.style.borderColor = T.inputFocusBorder; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.inputFocusShadow}`; }
                  }} />
              ))}
            </div>

            <button type="submit" disabled={loading || code.some(d => !d)} className="w-full py-3.5 rounded-xl transition-all"
              style={{
                background: (loading || code.some(d => !d)) ? T.cardBg2 : '#C9344C',
                color: (loading || code.some(d => !d)) ? T.textMuted : 'white',
                border: (loading || code.some(d => !d)) ? `1px solid ${T.cardBorder}` : 'none',
                cursor: (loading || code.some(d => !d)) ? 'not-allowed' : 'pointer',
                fontSize: '15px', fontWeight: 600,
                boxShadow: (loading || code.some(d => !d)) ? 'none' : T.primaryShadow,
              }}>
              {loading ? 'Verificando...' : 'Verificar código'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p style={{ color: T.textMuted, fontSize: '13px', marginBottom: '8px' }}>
              ¿No recibiste el código?
            </p>
            {canResend ? (
              <button onClick={resendCode} className="flex items-center gap-2 mx-auto transition-all"
                style={{ color: T.link, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                <RefreshCw size={14} /> Reenviar código
              </button>
            ) : (
              <p style={{ color: T.textSubtle, fontSize: '13px' }}>
                Reenviar en <span style={{ color: T.primary, fontWeight: 600 }}>{countdown}s</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}