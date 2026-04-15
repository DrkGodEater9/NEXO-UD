import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useThemeTokens } from '../context/useThemeTokens';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, Sun, Moon } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const T = useThemeTokens();
  const [formData, setFormData] = useState({ correoOrCodigo: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!formData.correoOrCodigo || !formData.password) {
      setError('Por favor completa todos los campos');
      setLoading(false);
      return;
    }
    const success = login(formData.correoOrCodigo, formData.password);
    if (success) { navigate('/dashboard'); } else {
      setError('Credenciales incorrectas. Verifica tu correo/código y contraseña.');
    }
    setLoading(false);
  };

  const ifocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = T.inputFocusBorder;
    e.currentTarget.style.boxShadow = `0 0 0 3px ${T.inputFocusShadow}`;
  };
  const iblur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = T.inputBorder;
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ backgroundImage: T.pageBg, backgroundColor: T.pageBgColor }}
    >
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

      {/* Background blobs — dark only */}
      {T.showBlobs && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(201,52,76,0.4) 0%, transparent 70%)', filter: 'blur(50px)' }} />
          <div className="absolute bottom-1/4 right-1/3 w-60 h-60 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        </div>
      )}

      <div className="w-full max-w-[420px] relative">
        {/* Back */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 mb-8 transition-all"
          style={{ color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
          onMouseEnter={e => e.currentTarget.style.color = T.text}
          onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
        >
          <ArrowLeft size={16} />
          Volver al inicio
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #E8485F, #A02438)', boxShadow: T.isDark ? '0 4px 16px rgba(201,52,76,0.4)' : '0 2px 8px rgba(201,52,76,0.22)' }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: '16px' }}>N</span>
            </div>
            <span style={{ color: T.text, fontWeight: 700, fontSize: '22px', letterSpacing: '-0.02em' }}>NexoUD</span>
          </div>
          <p style={{ color: T.textMuted, fontSize: '14px' }}>Bienvenido de vuelta</p>
        </div>

        {/* Card */}
        <div
          className="p-8 rounded-3xl animate-fade-up"
          style={{ background: T.authCardBg, backdropFilter: T.authCardBlur, WebkitBackdropFilter: T.authCardBlur, border: `1px solid ${T.authCardBorder}`, boxShadow: T.authCardShadow }}
        >
          <h1 className="mb-1" style={{ color: T.text, fontWeight: 700, fontSize: '22px', letterSpacing: '-0.02em' }}>
            Iniciar sesión
          </h1>
          <p className="mb-7" style={{ color: T.textMuted, fontSize: '14px' }}>
            Ingresa tus credenciales para continuar
          </p>

          {error && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl mb-5"
              style={{ background: T.error.bg, border: `1px solid ${T.error.border}` }}>
              <AlertCircle size={16} style={{ color: T.error.text, flexShrink: 0, marginTop: '1px' }} />
              <p style={{ color: T.error.text, fontSize: '13px', lineHeight: 1.5 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2" style={{ color: T.textMuted, fontSize: '13px', fontWeight: 500 }}>
                Correo o Código Estudiantil
              </label>
              <div className="relative">
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: T.inputIcon }} />
                <input
                  type="text"
                  value={formData.correoOrCodigo}
                  onChange={e => setFormData({ ...formData, correoOrCodigo: e.target.value })}
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
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
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
                <button type="button" style={{ color: T.link, fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl transition-all mt-2"
              style={{
                background: loading ? T.cardBg2 : '#C9344C',
                color: loading ? T.textMuted : 'white',
                border: loading ? `1px solid ${T.cardBorder}` : 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '15px', fontWeight: 600,
                boxShadow: loading ? 'none' : T.primaryShadow,
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#A02438'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={e => { e.currentTarget.style.background = loading ? T.cardBg2 : '#C9344C'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p style={{ color: T.textMuted, fontSize: '13px' }}>
              ¿No tienes cuenta?{' '}
              <Link to="/register" style={{ color: T.link, fontWeight: 500, textDecoration: 'none' }}>
                Regístrate gratis
              </Link>
            </p>
          </div>

          {/* Demo credentials */}
          <div className="mt-5 p-3.5 rounded-xl" style={{ background: T.secondaryBg, border: `1px solid ${T.secondaryBorder}` }}>
            <p style={{ color: T.secondary, fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Credenciales de prueba</p>
            <p style={{ color: T.textMuted, fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}>
              jcperezg@udistrital.edu.co<br />Contraseña: test123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
