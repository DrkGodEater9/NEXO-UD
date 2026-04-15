import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useThemeTokens } from '../context/useThemeTokens';
import { User, Hash, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft, Sun, Moon } from 'lucide-react';

function PasswordStrength({ password, T }: { password: string; T: ReturnType<typeof useThemeTokens> }) {
  const checks = [
    password.length >= 6, password.length >= 10,
    /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password),
  ];
  const strength = checks.filter(Boolean).length;
  const labels = ['', 'Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte'];
  const colors = ['', '#DC2626', '#D97706', '#D97706', T.accentGreen.color, T.accentGreen.color];
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1.5">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: i <= strength ? colors[strength] : T.strengthBarInactive }} />
        ))}
      </div>
      <p style={{ color: colors[strength] || T.textMuted, fontSize: '11px', fontWeight: 500 }}>{labels[strength]}</p>
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const T = useThemeTokens();
  const [formData, setFormData] = useState({ nombre: '', codigo: '', correo: '', password: '', confirmPassword: '', terms: false });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailValid = formData.correo.endsWith('@udistrital.edu.co');
  const emailDirty = formData.correo.length > 0;
  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;

  const validateForm = (): string | null => {
    if (!formData.nombre || !formData.codigo || !formData.correo || !formData.password || !formData.confirmPassword)
      return 'Por favor completa todos los campos';
    if (formData.nombre.length < 3) return 'El nombre debe tener al menos 3 caracteres';
    if (!/^\d{11}$/.test(formData.codigo)) return 'El código estudiantil debe tener 11 dígitos';
    if (!emailValid) return 'Debes usar tu correo institucional (@udistrital.edu.co)';
    if (formData.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    if (formData.password !== formData.confirmPassword) return 'Las contraseñas no coinciden';
    if (!formData.terms) return 'Debes aceptar los términos y condiciones';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const err = validateForm();
    if (err) { setError(err); setLoading(false); return; }
    const success = register({ nombre: formData.nombre, codigo: formData.codigo, correo: formData.correo, password: formData.password });
    if (success) {
      localStorage.setItem('pending_verification', JSON.stringify({ correo: formData.correo, codigo: formData.codigo }));
      navigate('/verify-email');
    } else {
      setError('Este correo o código ya está registrado');
    }
    setLoading(false);
  };

  const iStyle = { background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '14px' };
  const ifocus = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = T.inputFocusBorder; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.inputFocusShadow}`; };
  const iblur = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = T.inputBorder; e.currentTarget.style.boxShadow = 'none'; };

  const emailBorderColor = emailDirty ? (emailValid ? T.accentGreen.color : T.error.text) : T.inputBorder;

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

      {T.showBlobs && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.5) 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div className="absolute bottom-1/4 left-1/4 w-60 h-60 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, rgba(201,52,76,0.4) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        </div>
      )}

      <div className="w-full max-w-[460px] relative">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 mb-8 transition-all"
          style={{ color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
          onMouseEnter={e => e.currentTarget.style.color = T.text}
          onMouseLeave={e => e.currentTarget.style.color = T.textMuted}>
          <ArrowLeft size={16} /> Volver al inicio
        </button>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #E8485F, #A02438)', boxShadow: T.isDark ? '0 4px 16px rgba(201,52,76,0.4)' : '0 2px 8px rgba(201,52,76,0.22)' }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: '16px' }}>N</span>
            </div>
            <span style={{ color: T.text, fontWeight: 700, fontSize: '22px', letterSpacing: '-0.02em' }}>NexoUD</span>
          </div>
          <p style={{ color: T.textMuted, fontSize: '14px' }}>Crea tu cuenta gratuita</p>
        </div>

        <div className="p-8 rounded-3xl animate-fade-up"
          style={{ background: T.authCardBg, backdropFilter: T.authCardBlur, WebkitBackdropFilter: T.authCardBlur, border: `1px solid ${T.authCardBorder}`, boxShadow: T.authCardShadow }}>
          <h1 className="mb-1" style={{ color: T.text, fontWeight: 700, fontSize: '22px', letterSpacing: '-0.02em' }}>Crear cuenta</h1>
          <p className="mb-7" style={{ color: T.textMuted, fontSize: '14px' }}>Solo estudiantes de la Universidad Distrital</p>

          {error && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl mb-5" style={{ background: T.error.bg, border: `1px solid ${T.error.border}` }}>
              <AlertCircle size={16} style={{ color: T.error.text, flexShrink: 0, marginTop: '1px' }} />
              <p style={{ color: T.error.text, fontSize: '13px', lineHeight: 1.5 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block mb-2" style={{ color: T.textMuted, fontSize: '13px', fontWeight: 500 }}>Nombre completo</label>
              <div className="relative">
                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: T.inputIcon }} />
                <input type="text" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Juan Pérez González" className="w-full py-3 pl-10 pr-4 rounded-xl outline-none transition-all"
                  style={iStyle} onFocus={ifocus} onBlur={iblur} />
              </div>
            </div>

            {/* Código */}
            <div>
              <label className="block mb-2" style={{ color: T.textMuted, fontSize: '13px', fontWeight: 500 }}>
                Código estudiantil <span style={{ color: T.textSubtle, fontWeight: 400 }}>(11 dígitos)</span>
              </label>
              <div className="relative">
                <Hash size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: T.inputIcon }} />
                <input type="text" value={formData.codigo}
                  onChange={e => setFormData({ ...formData, codigo: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                  placeholder="20211020XXX" maxLength={11}
                  className="w-full py-3 pl-10 pr-4 rounded-xl outline-none transition-all font-mono-num"
                  style={{ ...iStyle, fontFamily: 'JetBrains Mono, monospace' }} onFocus={ifocus} onBlur={iblur} />
              </div>
            </div>

            {/* Correo */}
            <div>
              <label className="block mb-2" style={{ color: T.textMuted, fontSize: '13px', fontWeight: 500 }}>Correo institucional</label>
              <div className="relative">
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: T.inputIcon }} />
                <input type="email" value={formData.correo} onChange={e => setFormData({ ...formData, correo: e.target.value })}
                  placeholder="tucorreo@udistrital.edu.co"
                  className="w-full py-3 pl-10 pr-10 rounded-xl outline-none transition-all"
                  style={{ ...iStyle, borderColor: emailBorderColor }}
                  onFocus={ifocus}
                  onBlur={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = emailBorderColor; }} />
                {emailDirty && (
                  <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                    {emailValid ? <CheckCircle size={16} style={{ color: T.accentGreen.color }} /> : <AlertCircle size={16} style={{ color: T.error.text }} />}
                  </div>
                )}
              </div>
              {emailDirty && !emailValid && (
                <p style={{ color: T.error.text, fontSize: '11px', marginTop: '6px' }}>Solo se aceptan correos @udistrital.edu.co</p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label className="block mb-2" style={{ color: T.textMuted, fontSize: '13px', fontWeight: 500 }}>Contraseña</label>
              <div className="relative">
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: T.inputIcon }} />
                <input type={showPassword ? 'text' : 'password'} value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••" className="w-full py-3 pl-10 pr-12 rounded-xl outline-none transition-all"
                  style={iStyle} onFocus={ifocus} onBlur={iblur} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: T.inputIcon, background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrength password={formData.password} T={T} />
            </div>

            {/* Confirmar */}
            <div>
              <label className="block mb-2" style={{ color: T.textMuted, fontSize: '13px', fontWeight: 500 }}>Confirmar contraseña</label>
              <div className="relative">
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: T.inputIcon }} />
                <input type={showConfirm ? 'text' : 'password'} value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••" className="w-full py-3 pl-10 pr-12 rounded-xl outline-none transition-all"
                  style={{ ...iStyle, borderColor: formData.confirmPassword ? (passwordsMatch ? T.accentGreen.color : T.error.text) : T.inputBorder }}
                  onFocus={ifocus}
                  onBlur={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = formData.confirmPassword ? (passwordsMatch ? T.accentGreen.color : T.error.text) : T.inputBorder; }} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: T.inputIcon, background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <div onClick={() => setFormData({ ...formData, terms: !formData.terms })}
                className="flex-shrink-0 w-5 h-5 rounded-md mt-0.5 flex items-center justify-center transition-all"
                style={{ background: formData.terms ? '#C9344C' : T.inputBg, border: formData.terms ? 'none' : `1px solid ${T.inputBorder}`, cursor: 'pointer' }}>
                {formData.terms && <CheckCircle size={13} style={{ color: 'white' }} />}
              </div>
              <span style={{ color: T.textMuted, fontSize: '12px', lineHeight: 1.5 }}>
                Acepto el tratamiento de mis datos personales según la{' '}
                <span style={{ color: T.link }}>Ley 1581 de 2012</span> y los{' '}
                <span style={{ color: T.link }}>términos de uso</span> de NexoUD
              </span>
            </label>

            <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl transition-all mt-2"
              style={{ background: loading ? T.cardBg2 : '#C9344C', color: loading ? T.textMuted : 'white', border: loading ? `1px solid ${T.cardBorder}` : 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: 600, boxShadow: loading ? 'none' : T.primaryShadow }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#A02438'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={e => { e.currentTarget.style.background = loading ? T.cardBg2 : '#C9344C'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p style={{ color: T.textMuted, fontSize: '13px' }}>
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" style={{ color: T.link, fontWeight: 500, textDecoration: 'none' }}>Inicia sesión</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
