import { useState, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router';
import { useAuth, ApiError } from '../context/AuthContext';
import { useThemeTokens } from '../context/useThemeTokens';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft, Sun, Moon, Hash, GraduationCap, Calendar, Building2, BookOpen } from 'lucide-react';

// ─── Curriculum Codes Dictionary ─────────────────────────────────────────────

interface CurriculumEntry {
  code: string;
  career: string;
  faculty: string;
}

const CURRICULUM_CODES: CurriculumEntry[] = [
  // Facultad de Ingeniería
  { code: '005', career: 'Ingeniería Electrónica', faculty: 'Facultad de Ingeniería' },
  { code: '007', career: 'Ingeniería Eléctrica', faculty: 'Facultad de Ingeniería' },
  { code: '015', career: 'Ingeniería Industrial', faculty: 'Facultad de Ingeniería' },
  { code: '020', career: 'Ingeniería de Sistemas', faculty: 'Facultad de Ingeniería' },
  { code: '025', career: 'Ingeniería Catastral y Geodesia', faculty: 'Facultad de Ingeniería' },
  // Facultad Tecnológica
  { code: '379', career: 'Tecnología en Construcciones Civiles', faculty: 'Facultad Tecnológica' },
  { code: '572', career: 'Tecnología en Electricidad de Media y Baja Tensión', faculty: 'Facultad Tecnológica' },
  { code: '573', career: 'Ingeniería Eléctrica (por ciclos)', faculty: 'Facultad Tecnológica' },
  { code: '574', career: 'Tecnología en Mecánica Industrial', faculty: 'Facultad Tecnológica' },
  { code: '577', career: 'Tecnología en Gestión de la Producción Industrial', faculty: 'Facultad Tecnológica' },
  { code: '578', career: 'Tecnología en Sistematización de Datos', faculty: 'Facultad Tecnológica' },
  { code: '579', career: 'Ingeniería Civil', faculty: 'Facultad Tecnológica' },
  { code: '583', career: 'Ingeniería en Control y Automatización', faculty: 'Facultad Tecnológica' },
  { code: '673', career: 'Tecnología en Electrónica Industrial', faculty: 'Facultad Tecnológica' },
  { code: '675', career: 'Ingeniería Mecánica', faculty: 'Facultad Tecnológica' },
  { code: '676', career: 'Ingeniería de Producción', faculty: 'Facultad Tecnológica' },
  { code: '678', career: 'Ingeniería en Telemática', faculty: 'Facultad Tecnológica' },
  // Facultad de Ciencias y Educación
  { code: '052', career: 'Comunicación Social y Periodismo', faculty: 'Facultad de Ciencias y Educación' },
  { code: '053', career: 'Archivística y Gestión de la Información Digital', faculty: 'Facultad de Ciencias y Educación' },
  { code: '135', career: 'Licenciatura en Física', faculty: 'Facultad de Ciencias y Educación' },
  { code: '140', career: 'Licenciatura en Biología', faculty: 'Facultad de Ciencias y Educación' },
  { code: '145', career: 'Licenciatura en Matemáticas', faculty: 'Facultad de Ciencias y Educación' },
  { code: '150', career: 'Licenciatura en Química', faculty: 'Facultad de Ciencias y Educación' },
  { code: '155', career: 'Licenciatura en Ciencias Sociales', faculty: 'Facultad de Ciencias y Educación' },
  { code: '160', career: 'Licenciatura en Humanidades y Lengua Castellana', faculty: 'Facultad de Ciencias y Educación' },
  { code: '165', career: 'Licenciatura en Lenguas Extranjeras (Inglés)', faculty: 'Facultad de Ciencias y Educación' },
  { code: '187', career: 'Licenciatura en Educación Infantil', faculty: 'Facultad de Ciencias y Educación' },
  { code: '188', career: 'Licenciatura en Educación Artística', faculty: 'Facultad de Ciencias y Educación' },
  // Facultad del Medio Ambiente y Recursos Naturales
  { code: '001', career: 'Administración Deportiva', faculty: 'Facultad del Medio Ambiente y Recursos Naturales' },
  { code: '010', career: 'Ingeniería Forestal', faculty: 'Facultad del Medio Ambiente y Recursos Naturales' },
  { code: '031', career: 'Tecnología en Levantamientos Topográficos', faculty: 'Facultad del Medio Ambiente y Recursos Naturales' },
  { code: '032', career: 'Ingeniería Topográfica', faculty: 'Facultad del Medio Ambiente y Recursos Naturales' },
  { code: '081', career: 'Tecnología en Gestión Ambiental y Servicios Públicos', faculty: 'Facultad del Medio Ambiente y Recursos Naturales' },
  { code: '085', career: 'Tecnología en Saneamiento Ambiental', faculty: 'Facultad del Medio Ambiente y Recursos Naturales' },
  { code: '180', career: 'Ingeniería Ambiental', faculty: 'Facultad del Medio Ambiente y Recursos Naturales' },
  { code: '181', career: 'Ingeniería Sanitaria', faculty: 'Facultad del Medio Ambiente y Recursos Naturales' },
  { code: '185', career: 'Administración Ambiental', faculty: 'Facultad del Medio Ambiente y Recursos Naturales' },
  // Facultad de Artes - ASAB
  { code: '016', career: 'Artes Plásticas y Visuales', faculty: 'Facultad de Artes - ASAB' },
  { code: '098', career: 'Artes Musicales', faculty: 'Facultad de Artes - ASAB' },
  { code: '102', career: 'Arte Danzario', faculty: 'Facultad de Artes - ASAB' },
  { code: '104', career: 'Artes Escénicas', faculty: 'Facultad de Artes - ASAB' },
  // Facultad de Ciencias Matemáticas y Naturales
  { code: '167', career: 'Matemáticas (Pregrado Profesional)', faculty: 'Facultad de Ciencias Matemáticas y Naturales' },
  { code: '168', career: 'Química (Pregrado Profesional)', faculty: 'Facultad de Ciencias Matemáticas y Naturales' },
  { code: '169', career: 'Física (Pregrado Profesional)', faculty: 'Facultad de Ciencias Matemáticas y Naturales' },
  { code: '309', career: 'Biología (Pregrado Profesional)', faculty: 'Facultad de Ciencias Matemáticas y Naturales' },
];

const CURRICULUM_MAP = new Map(CURRICULUM_CODES.map(c => [c.code, c]));

// ─── Student Code Parser ─────────────────────────────────────────────────────

interface ParsedStudentCode {
  year: number | null;
  semester: string | null;
  curriculumCode: string | null;
  career: string | null;
  faculty: string | null;
  listNumber: number | null;
  isComplete: boolean;
  errors: string[];
}

function parseStudentCode(code: string): ParsedStudentCode {
  const result: ParsedStudentCode = {
    year: null, semester: null, curriculumCode: null,
    career: null, faculty: null, listNumber: null,
    isComplete: false, errors: [],
  };

  if (code.length < 4) return result;

  const yearStr = code.substring(0, 4);
  const year = parseInt(yearStr);
  const currentYear = new Date().getFullYear();
  if (year >= 2000 && year <= currentYear) {
    result.year = year;
  } else if (code.length >= 4) {
    result.errors.push(`Año inválido: ${yearStr}`);
  }

  if (code.length < 5) return result;
  const semFlag = code.charAt(4);
  if (semFlag === '1') {
    result.semester = `${yearStr}-1`;
  } else if (semFlag === '3') {
    result.semester = `${yearStr}-2`;
  } else {
    result.errors.push('El 5° dígito debe ser 1 o 3');
  }

  if (code.length < 8) return result;
  const currCode = code.substring(5, 8);
  result.curriculumCode = currCode;
  const entry = CURRICULUM_MAP.get(currCode);
  if (entry) {
    result.career = entry.career;
    result.faculty = entry.faculty;
  } else {
    result.errors.push(`Código de carrera "${currCode}" no reconocido`);
  }

  if (code.length < 11) return result;
  const listStr = code.substring(8, 11);
  const listNum = parseInt(listStr);
  if (listNum > 0 && listNum < 300) {
    result.listNumber = listNum;
  } else {
    result.errors.push('Los últimos 3 dígitos deben ser entre 001 y 299');
  }

  if (code.length === 11 && result.errors.length === 0 && result.career) {
    result.isComplete = true;
  }

  return result;
}

// ─── Password Strength ───────────────────────────────────────────────────────

function PasswordStrength({ password, T }: { password: string; T: ReturnType<typeof useThemeTokens> }) {
  const checks = [
    password.length >= 8, password.length >= 12,
    /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password),
  ];
  const strength = checks.filter(Boolean).length;
  const labels = ['', 'Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte'];
  const colors = ['', '#DC2626', '#D97706', '#D97706', T.accentGreen.color, T.accentGreen.color];
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1.5">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: i <= strength ? colors[strength] : T.strengthBarInactive }} />
        ))}
      </div>
      <p style={{ color: colors[strength] || T.textMuted, fontSize: '11px', fontWeight: 500 }}>{labels[strength]}</p>
    </div>
  );
}

// ─── Floating Info Card ──────────────────────────────────────────────────────

function StudentInfoCard({ parsed, T, visible }: {
  parsed: ParsedStudentCode;
  T: ReturnType<typeof useThemeTokens>;
  visible: boolean;
}) {
  const hasAnyData = parsed.year || parsed.semester || parsed.career || parsed.faculty;
  if (!visible || !hasAnyData) return null;

  const items = [
    { icon: Calendar, label: 'Año de ingreso', value: parsed.year?.toString(), color: '#8B5CF6' },
    { icon: BookOpen, label: 'Semestre', value: parsed.semester, color: '#3B82F6' },
    { icon: GraduationCap, label: 'Carrera', value: parsed.career, color: '#C9344C' },
    { icon: Building2, label: 'Facultad', value: parsed.faculty, color: '#059669' },
  ].filter(i => i.value);

  return (
    <div
      className="student-info-card"
      style={{
        position: 'absolute',
        right: '-340px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '310px',
        padding: '24px',
        borderRadius: '20px',
        background: T.authCardBg,
        backdropFilter: T.authCardBlur,
        WebkitBackdropFilter: T.authCardBlur,
        border: `1px solid ${T.authCardBorder}`,
        boxShadow: T.authCardShadow,
        animation: 'floatIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards, floatBounce 3s ease-in-out infinite 0.5s',
        zIndex: 20,
      }}
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }}>
          <Hash size={14} style={{ color: 'white' }} />
        </div>
        <div>
          <p style={{ color: T.text, fontWeight: 600, fontSize: '14px', letterSpacing: '-0.01em' }}>Datos del código</p>
          <p style={{ color: T.textMuted, fontSize: '11px' }}>Información extraída automáticamente</p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={item.label}
            className="flex items-start gap-3 p-3 rounded-xl"
            style={{
              background: T.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              border: `1px solid ${T.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
              animation: `fadeSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.08}s both`,
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: `${item.color}18`, border: `1px solid ${item.color}30` }}
            >
              <item.icon size={13} style={{ color: item.color }} />
            </div>
            <div className="min-w-0">
              <p style={{ color: T.textMuted, fontSize: '11px', fontWeight: 500, marginBottom: '2px' }}>{item.label}</p>
              <p style={{ color: T.text, fontSize: '13px', fontWeight: 600, lineHeight: 1.4, wordBreak: 'break-word' }}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {parsed.errors.length > 0 && (
        <div className="mt-4 p-3 rounded-xl" style={{ background: T.error.bg, border: `1px solid ${T.error.border}` }}>
          {parsed.errors.map((err, i) => (
            <p key={i} style={{ color: T.error.text, fontSize: '11px', lineHeight: 1.5 }}>
              <AlertCircle size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              {err}
            </p>
          ))}
        </div>
      )}

      {parsed.isComplete && parsed.errors.length === 0 && (
        <div className="mt-4 flex items-center gap-2 p-3 rounded-xl"
          style={{ background: T.isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.06)', border: `1px solid ${T.isDark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)'}` }}>
          <CheckCircle size={14} style={{ color: T.accentGreen.color, flexShrink: 0 }} />
          <p style={{ color: T.accentGreen.color, fontSize: '12px', fontWeight: 500 }}>Código válido</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Register Page ──────────────────────────────────────────────────────

const QUICK_STORAGE_KEY = 'nexoud_quick_schedule';

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  const T = useThemeTokens();

  const [formData, setFormData] = useState({
    nickname: '',
    correo: '',
    studentCode: '',
    password: '',
    confirmPassword: '',
    terms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const parsed = useMemo(() => parseStudentCode(formData.studentCode), [formData.studentCode]);

  const emailValid = formData.correo.endsWith('@udistrital.edu.co');
  const emailDirty = formData.correo.length > 0;
  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;
  const codeValid = parsed.isComplete && parsed.errors.length === 0;
  const codeDirty = formData.studentCode.length > 0;

  const validateForm = (): string | null => {
    if (!formData.nickname || !formData.correo || !formData.studentCode || !formData.password || !formData.confirmPassword)
      return 'Por favor completa todos los campos';
    if (formData.nickname.trim().length < 3) return 'El apodo debe tener al menos 3 caracteres';
    if (!emailValid) return 'Debes usar tu correo institucional (@udistrital.edu.co)';
    if (formData.studentCode.length !== 11) return 'El código estudiantil debe tener exactamente 11 dígitos';
    if (!codeValid) return 'El código estudiantil no es válido. Revisa los datos extraídos';
    if (formData.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    if (formData.password !== formData.confirmPassword) return 'Las contraseñas no coinciden';
    if (!formData.terms) return 'Debes aceptar los términos y condiciones';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const err = validateForm();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      await register({
        nickname: formData.nickname.trim(),
        email: formData.correo,
        password: formData.password,
        studentCode: formData.studentCode,
      });
      localStorage.setItem('pending_verification', JSON.stringify({ email: formData.correo }));
      // If came from quick mode, move schedule to localStorage so it survives email verification
      if (location.state?.returnAfterLogin) {
        const quickRaw = sessionStorage.getItem(QUICK_STORAGE_KEY);
        if (quickRaw) {
          localStorage.setItem(QUICK_STORAGE_KEY, quickRaw);
          sessionStorage.removeItem(QUICK_STORAGE_KEY);
        }
      }
      navigate('/verify-email');
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo crear la cuenta. Intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  const iStyle = { background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '14px' };
  const ifocus = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = T.inputFocusBorder; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.inputFocusShadow}`; };
  const iblur = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = T.inputBorder; e.currentTarget.style.boxShadow = 'none'; };

  const emailBorderColor = emailDirty ? (emailValid ? T.accentGreen.color : T.error.text) : T.inputBorder;
  const codeBorderColor = codeDirty ? (codeValid ? T.accentGreen.color : (formData.studentCode.length === 11 && !codeValid ? T.error.text : T.inputBorder)) : T.inputBorder;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ backgroundImage: T.pageBg, backgroundColor: T.pageBgColor }}
    >
      {/* Inject floating animation keyframes */}
      <style>{`
        @keyframes floatIn {
          0% { opacity: 0; transform: translateY(-50%) translateX(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(-50%) translateX(0) scale(1); }
        }
        @keyframes floatBounce {
          0%, 100% { transform: translateY(-50%); }
          50% { transform: translateY(calc(-50% - 8px)); }
        }
        @keyframes fadeSlideUp {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 1100px) {
          .student-info-card {
            position: relative !important;
            right: auto !important;
            top: auto !important;
            transform: none !important;
            width: 100% !important;
            margin-top: 16px;
            animation: fadeSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards, floatBounce 3s ease-in-out infinite 0.5s !important;
          }
          .register-layout {
            flex-direction: column !important;
            align-items: center !important;
          }
        }
      `}</style>

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

      <div className="register-layout relative" style={{ display: 'flex', alignItems: 'flex-start', gap: '0' }}>
        <div className="w-full max-w-[480px] relative">
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

          <div className="p-8 rounded-3xl animate-fade-up relative"
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
              {/* Apodo / Nickname */}
              <div>
                <label className="block mb-2" style={{ color: T.textMuted, fontSize: '13px', fontWeight: 500 }}>
                  Apodo <span style={{ color: T.textSubtle, fontWeight: 400 }}>(se mostrará en la app)</span>
                </label>
                <div className="relative">
                  <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: T.inputIcon }} />
                  <input type="text" value={formData.nickname}
                    onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                    placeholder="JuanP" className="w-full py-3 pl-10 pr-4 rounded-xl outline-none transition-all"
                    style={iStyle} onFocus={ifocus} onBlur={iblur} />
                </div>
              </div>

              {/* Correo institucional */}
              <div>
                <label className="block mb-2" style={{ color: T.textMuted, fontSize: '13px', fontWeight: 500 }}>Correo institucional</label>
                <div className="relative">
                  <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: T.inputIcon }} />
                  <input type="email" value={formData.correo}
                    onChange={e => setFormData({ ...formData, correo: e.target.value })}
                    placeholder="tucorreo@udistrital.edu.co"
                    className="w-full py-3 pl-10 pr-10 rounded-xl outline-none transition-all"
                    style={{ ...iStyle, borderColor: emailBorderColor }}
                    onFocus={ifocus}
                    onBlur={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = emailBorderColor; }} />
                  {emailDirty && (
                    <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                      {emailValid
                        ? <CheckCircle size={16} style={{ color: T.accentGreen.color }} />
                        : <AlertCircle size={16} style={{ color: T.error.text }} />}
                    </div>
                  )}
                </div>
                {emailDirty && !emailValid && (
                  <p style={{ color: T.error.text, fontSize: '11px', marginTop: '6px' }}>Solo se aceptan correos @udistrital.edu.co</p>
                )}
              </div>

              {/* Código estudiantil */}
              <div>
                <label className="block mb-2" style={{ color: T.textMuted, fontSize: '13px', fontWeight: 500 }}>
                  Código estudiantil <span style={{ color: T.textSubtle, fontWeight: 400 }}>(11 dígitos)</span>
                </label>
                <div className="relative">
                  <Hash size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: T.inputIcon }} />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.studentCode}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setFormData({ ...formData, studentCode: val });
                    }}
                    placeholder="20241020042"
                    className="w-full py-3 pl-10 pr-10 rounded-xl outline-none transition-all"
                    style={{ ...iStyle, borderColor: codeBorderColor }}
                    onFocus={ifocus}
                    onBlur={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = codeBorderColor; }}
                  />
                  {codeDirty && formData.studentCode.length === 11 && (
                    <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                      {codeValid
                        ? <CheckCircle size={16} style={{ color: T.accentGreen.color }} />
                        : <AlertCircle size={16} style={{ color: T.error.text }} />}
                    </div>
                  )}
                </div>
                {codeDirty && formData.studentCode.length !== 11 && (
                  <p style={{ color: T.textMuted, fontSize: '11px', marginTop: '6px' }}>{formData.studentCode.length}/11 dígitos</p>
                )}
                {/* Code breakdown visual */}
                {codeDirty && formData.studentCode.length >= 4 && (
                  <div className="flex gap-1 mt-2" style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace" }}>
                    <span style={{ color: '#8B5CF6', background: '#8B5CF610', padding: '2px 4px', borderRadius: '4px' }}>
                      {formData.studentCode.substring(0, 4).padEnd(4, '·')}
                    </span>
                    {formData.studentCode.length >= 5 && (
                      <span style={{ color: '#3B82F6', background: '#3B82F610', padding: '2px 4px', borderRadius: '4px' }}>
                        {formData.studentCode.charAt(4)}
                      </span>
                    )}
                    {formData.studentCode.length >= 6 && (
                      <span style={{ color: '#C9344C', background: '#C9344C10', padding: '2px 4px', borderRadius: '4px' }}>
                        {formData.studentCode.substring(5, 8).padEnd(3, '·')}
                      </span>
                    )}
                    {formData.studentCode.length >= 9 && (
                      <span style={{ color: '#059669', background: '#05966910', padding: '2px 4px', borderRadius: '4px' }}>
                        {formData.studentCode.substring(8, 11).padEnd(3, '·')}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Contraseña */}
              <div>
                <label className="block mb-2" style={{ color: T.textMuted, fontSize: '13px', fontWeight: 500 }}>Contraseña</label>
                <div className="relative">
                  <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: T.inputIcon }} />
                  <input type={showPassword ? 'text' : 'password'} value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mínimo 8 caracteres" className="w-full py-3 pl-10 pr-12 rounded-xl outline-none transition-all"
                    style={iStyle} onFocus={ifocus} onBlur={iblur} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: T.inputIcon, background: 'none', border: 'none', cursor: 'pointer' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <PasswordStrength password={formData.password} T={T} />
              </div>

              {/* Confirmar contraseña */}
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

            {/* Floating info card — positioned relative to this card */}
            <StudentInfoCard parsed={parsed} T={T} visible={codeDirty && formData.studentCode.length >= 4} />
          </div>
        </div>
      </div>
    </div>
  );
}
