import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Calendar, BookOpen, Zap, ArrowRight, CheckCircle,
  Clock, AlertTriangle, Users, Star, Sun, Moon
} from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Detección de cruces',
    desc: 'Detecta automáticamente conflictos de horario antes de que te inscribas. Sin sorpresas el día del semestre.',
    darkColor: '#E8485F', darkBg: 'rgba(201,52,76,0.12)',
    lightColor: '#C9344C', lightBg: '#FFF1F2', lightBorder: 'rgba(201,52,76,0.15)',
  },
  {
    icon: BookOpen,
    title: 'Control de créditos',
    desc: 'Visualiza tu carga académica en tiempo real. Alertas cuando superas el máximo de créditos permitido.',
    darkColor: '#818CF8', darkBg: 'rgba(99,102,241,0.12)',
    lightColor: '#4F46E5', lightBg: '#EEF2FF', lightBorder: 'rgba(79,70,229,0.15)',
  },
  {
    icon: Clock,
    title: 'Tiempos entre sedes',
    desc: 'Calcula los tiempos de desplazamiento entre sedes de la UD para evitar llegadas tarde.',
    darkColor: '#34D399', darkBg: 'rgba(52,211,153,0.12)',
    lightColor: '#059669', lightBg: '#F0FDF9', lightBorder: 'rgba(5,150,105,0.15)',
  },
  {
    icon: Calendar,
    title: 'Historial de horarios',
    desc: 'Guarda hasta 5 versiones de tu horario por semestre. Compara y elige el que más te conviene.',
    darkColor: '#FBBF24', darkBg: 'rgba(251,191,36,0.12)',
    lightColor: '#D97706', lightBg: '#FFFBEB', lightBorder: 'rgba(217,119,6,0.15)',
  },
];

const steps = [
  { n: '01', title: 'Regístrate', desc: 'Crea tu cuenta con tu correo @udistrital.edu.co' },
  { n: '02', title: 'Busca materias', desc: 'Explora el catálogo por facultad, carrera, horario o profesor' },
  { n: '03', title: 'Arma tu horario', desc: 'Agrega grupos, detecta cruces y guarda tu plan perfecto' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === 'dark';

  // Apple-inspired light / NexoUD dark token map
  const T = {
    pageBg:          isDark ? 'linear-gradient(135deg, #0F0B1E 0%, #1A1333 50%, #0D1117 100%)' : '#F5F5F7',
    headerBg:        isDark ? 'rgba(15,11,30,0.85)'  : 'rgba(255,255,255,0.92)',
    headerBlur:      'blur(20px)',
    headerBorder:    isDark ? 'rgba(255,255,255,0.06)' : '#D2D2D7',
    text:            isDark ? '#F1F0F5' : '#1D1D1F',
    textMuted:       isDark ? '#8B8A97' : '#6E6E73',
    textSubtle:      isDark ? '#5C5B66' : '#86868B',
    cardBg:          isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
    cardBorder:      isDark ? 'rgba(255,255,255,0.07)' : '#E5E5EA',
    cardShadow:      isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)',
    sectionBorder:   isDark ? 'rgba(255,255,255,0.05)' : '#D2D2D7',
    toggleBg:        isDark ? 'rgba(255,255,255,0.07)' : '#E5E5EA',
    toggleBorder:    isDark ? 'rgba(255,255,255,0.12)' : '#C7C7CC',
    toggleColor:     isDark ? '#8B8A97' : '#6E6E73',
    ghostBorder:     isDark ? 'rgba(255,255,255,0.12)' : '#D2D2D7',
    ghostColor:      isDark ? '#8B8A97' : '#1D1D1F',
    ghostHoverBg:    isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F7',
    badgeBg:         isDark ? 'rgba(201,52,76,0.1)' : 'rgba(201,52,76,0.07)',
    badgeBorder:     isDark ? 'rgba(201,52,76,0.2)' : 'rgba(201,52,76,0.18)',
    badgeColor:      isDark ? '#E8485F' : '#C9344C',
    heroTitle:       isDark ? '#F1F0F5' : '#1D1D1F',
    heroGradient:    isDark
      ? { backgroundImage: 'linear-gradient(135deg, #E8485F, #818CF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }
      : { color: '#C9344C' },
    heroSubtitle:    isDark ? '#8B8A97' : '#6E6E73',
    primaryShadow:   isDark ? '0 6px 24px rgba(201,52,76,0.45)' : '0 4px 16px rgba(201,52,76,0.22)',
    btnSecBg:        isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
    btnSecBorder:    isDark ? 'rgba(255,255,255,0.12)' : '#D2D2D7',
    btnSecColor:     isDark ? '#F1F0F5' : '#1D1D1F',
    btnSecHoverBg:   isDark ? 'rgba(255,255,255,0.09)' : '#F5F5F7',
    checkColor:      isDark ? '#34D399' : '#16A34A',
    trustColor:      isDark ? '#8B8A97' : '#6E6E73',
    previewBg:       isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
    previewBorder:   isDark ? 'rgba(255,255,255,0.08)' : '#E5E5EA',
    previewShadow:   isDark ? '0 20px 60px rgba(0,0,0,0.5)' : '0 8px 40px rgba(0,0,0,0.10)',
    previewDayBorder: isDark ? 'rgba(255,255,255,0.06)' : '#E5E5EA',
    previewDayColor: isDark ? '#8B8A97' : '#6E6E73',
    disclaimerBg:    isDark ? 'rgba(251,191,36,0.08)' : '#FFFBEB',
    disclaimerBorder: isDark ? 'rgba(251,191,36,0.15)' : '#FDE68A',
    stepNumBg:       isDark ? 'linear-gradient(135deg, rgba(201,52,76,0.15), rgba(99,102,241,0.1))' : 'rgba(201,52,76,0.08)',
    stepNumBorder:   isDark ? 'rgba(201,52,76,0.25)' : 'rgba(201,52,76,0.18)',
    stepConnector:   isDark ? 'linear-gradient(90deg, rgba(255,255,255,0.1), transparent)' : 'linear-gradient(90deg, #D2D2D7, transparent)',
    ctaBg:           isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
    ctaBorder:       isDark ? 'rgba(255,255,255,0.08)' : '#E5E5EA',
    ctaShadow:       isDark ? '0 0 60px rgba(201,52,76,0.08)' : '0 4px 32px rgba(0,0,0,0.07)',
    ctaIconBg:       isDark ? 'linear-gradient(135deg, rgba(201,52,76,0.2), rgba(99,102,241,0.15))' : 'rgba(201,52,76,0.08)',
    ctaIconBorder:   isDark ? 'rgba(201,52,76,0.25)' : 'rgba(201,52,76,0.15)',
    footerBorder:    isDark ? 'rgba(255,255,255,0.05)' : '#D2D2D7',
    footerText:      isDark ? '#5C5B66' : '#86868B',
    footerLogoText:  isDark ? '#F1F0F5' : '#1D1D1F',
    blobVisible:     isDark,
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundImage: T.pageBg, backgroundAttachment: 'fixed', backgroundColor: isDark ? '#0F0B1E' : '#F5F5F7' }}
    >
      {/* Navbar */}
      <header
        className="sticky top-0 z-50 px-6 py-4"
        style={{ background: T.headerBg, backdropFilter: T.headerBlur, borderBottom: `1px solid ${T.headerBorder}` }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #E8485F, #A02438)', boxShadow: isDark ? '0 4px 12px rgba(201,52,76,0.4)' : '0 2px 8px rgba(201,52,76,0.25)' }}
            >
              <span style={{ color: 'white', fontWeight: 800, fontSize: '14px' }}>N</span>
            </div>
            <span style={{ color: T.text, fontWeight: 700, fontSize: '18px', letterSpacing: '-0.02em' }}>NexoUD</span>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              className="p-2 rounded-xl transition-all"
              style={{ background: T.toggleBg, border: `1px solid ${T.toggleBorder}`, color: T.toggleColor, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.color = T.text; }}
              onMouseLeave={e => { e.currentTarget.style.color = T.toggleColor; }}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 rounded-xl transition-all"
                  style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, color: T.text, cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
                  onMouseEnter={e => { e.currentTarget.style.background = T.ghostHoverBg; }}
                  onMouseLeave={e => { e.currentTarget.style.background = T.cardBg; }}
                >
                  Ir al Dashboard
                </button>
                <button
                  onClick={() => navigate('/planner')}
                  className="px-4 py-2 rounded-xl transition-all"
                  style={{ background: '#C9344C', color: 'white', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, boxShadow: T.primaryShadow }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#A02438'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#C9344C'; }}
                >
                  Planificador
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 rounded-xl transition-all max-sm:hidden"
                  style={{ background: 'transparent', border: `1px solid ${T.ghostBorder}`, color: T.ghostColor, cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
                  onMouseEnter={e => { e.currentTarget.style.background = T.ghostHoverBg; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Iniciar sesión
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 rounded-xl transition-all"
                  style={{ background: '#C9344C', color: 'white', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, boxShadow: T.primaryShadow }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#A02438'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#C9344C'; }}
                >
                  Registrarse
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Disclaimer Banner */}
      <div
        className="px-6 py-2.5 flex items-center justify-center gap-2 text-center"
        style={{ background: T.disclaimerBg, borderBottom: `1px solid ${T.disclaimerBorder}` }}
      >
        <AlertTriangle size={14} style={{ color: '#D97706', flexShrink: 0 }} />
        <p style={{ color: T.textMuted, fontSize: '12px' }}>
          <span style={{ color: '#D97706', fontWeight: 500 }}>Herramienta estudiantil independiente.</span>{' '}
          NexoUD no es el sistema oficial de inscripción de la Universidad Distrital.
        </p>
      </div>

      {/* Hero */}
      <section className="flex-1 flex items-center px-6 py-20 md:py-28 relative overflow-hidden">
        {/* Background blobs — dark only */}
        {T.blobVisible && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, rgba(201,52,76,0.5) 0%, transparent 70%)', filter: 'blur(60px)' }} />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full opacity-15"
              style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.5) 0%, transparent 70%)', filter: 'blur(60px)' }} />
          </div>
        )}

        <div className="max-w-6xl mx-auto w-full relative">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8"
              style={{ background: T.badgeBg, border: `1px solid ${T.badgeBorder}` }}
            >
              <Star size={12} style={{ color: T.badgeColor }} />
              <span style={{ color: T.badgeColor, fontSize: '12px', fontWeight: 600 }}>
                Universidad Distrital · Planificador académico
              </span>
            </div>

            <h1
              className="mb-6"
              style={{ fontSize: 'clamp(2.2rem, 6vw, 3.5rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15, color: T.heroTitle }}
            >
              Planifica tu semestre{' '}
              <span style={T.heroGradient}>sin estrés</span>
            </h1>

            <p
              className="mb-10"
              style={{ color: T.heroSubtitle, fontSize: '18px', lineHeight: 1.7, maxWidth: '560px', margin: '0 auto 40px' }}
            >
              Organiza tus horarios, valida prerrequisitos y detecta conflictos —
              todo antes del día de inscripciones.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-12">
              <button
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl transition-all"
                style={{ background: '#C9344C', color: 'white', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 600, boxShadow: T.primaryShadow, minWidth: '200px' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#A02438'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#C9344C'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {isAuthenticated ? 'Ir al Dashboard' : 'Crear cuenta gratis'}
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => navigate('/quick')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl transition-all"
                style={{ background: T.btnSecBg, border: `1px solid ${T.btnSecBorder}`, color: T.btnSecColor, cursor: 'pointer', fontSize: '15px', fontWeight: 500, minWidth: '200px' }}
                onMouseEnter={e => { e.currentTarget.style.background = T.btnSecHoverBg; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = T.btnSecBg; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <Zap size={18} />
                Modo rápido
              </button>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-6">
              {[{ text: '10+ Facultades' }, { text: '100+ Materias' }, { text: 'Gratis y sin límites' }].map(({ text }) => (
                <div key={text} className="flex items-center gap-2">
                  <CheckCircle size={14} style={{ color: T.checkColor }} />
                  <span style={{ color: T.trustColor, fontSize: '13px' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Floating preview card */}
          <div
            className="mt-16 mx-auto max-w-2xl p-4 rounded-2xl relative"
            style={{ background: T.previewBg, backdropFilter: isDark ? 'blur(20px)' : 'none', border: `1px solid ${T.previewBorder}`, boxShadow: T.previewShadow }}
          >
            <div className="flex items-center gap-2 mb-3 px-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#F87171' }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FBBF24' }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#34D399' }} />
              <span style={{ color: T.previewDayColor, fontSize: '12px', marginLeft: '8px' }}>Horario 2026-1</span>
            </div>
            <div className="grid grid-cols-6 gap-1.5 text-center">
              {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'].map(d => (
                <div key={d} style={{ color: T.previewDayColor, fontSize: '10px', fontWeight: 600, paddingBottom: '6px', borderBottom: `1px solid ${T.previewDayBorder}` }}>{d}</div>
              ))}
              {[
                { label: 'Cálculo Diferencial', color: isDark ? '#6366F1' : '#4F46E5' },
                { label: 'Prog. I', color: isDark ? '#C9344C' : '#C9344C' },
                { label: 'Física', color: isDark ? '#34D399' : '#059669' },
                { label: 'Cálculo Diferencial', color: isDark ? '#6366F1' : '#4F46E5' },
                { label: 'Prog. I', color: isDark ? '#C9344C' : '#C9344C' },
                { label: '', color: '' },
              ].map((item, i) => (
                <div key={i} className="rounded-lg p-2" style={{
                  background: item.color ? (isDark ? `${item.color}22` : `${item.color}12`) : 'transparent',
                  border: item.color ? `1px solid ${item.color}${isDark ? '44' : '28'}` : '1px solid transparent',
                  minHeight: '52px',
                }}>
                  {item.label && <span style={{ color: item.color, fontSize: '9px', fontWeight: 600, lineHeight: 1.3 }}>{item.label}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6" style={{ borderTop: `1px solid ${T.sectionBorder}` }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="mb-3" style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', color: T.text }}>
              Todo lo que necesitas
            </h2>
            <p style={{ color: T.textMuted, fontSize: '16px' }}>
              Diseñado para estudiantes de la UD que quieren planificar con inteligencia
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => {
              const color  = isDark ? f.darkColor : f.lightColor;
              const bg     = isDark ? f.darkBg    : f.lightBg;
              const border = isDark ? 'rgba(255,255,255,0.07)' : f.lightBorder;
              return (
                <div
                  key={f.title}
                  className="p-6 rounded-2xl transition-all duration-300"
                  style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF', border: `1px solid ${border}`, boxShadow: T.cardShadow }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = isDark ? `0 12px 32px ${color}18` : `0 8px 24px rgba(0,0,0,0.10)`;
                    e.currentTarget.style.borderColor = isDark ? `${color}44` : color;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = T.cardShadow;
                    e.currentTarget.style.borderColor = border;
                  }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: bg, border: `1px solid ${isDark ? `${color}30` : f.lightBorder}` }}>
                    <f.icon size={22} style={{ color }} />
                  </div>
                  <h3 className="mb-2" style={{ color: T.text, fontWeight: 600, fontSize: '15px' }}>{f.title}</h3>
                  <p style={{ color: T.textMuted, fontSize: '13px', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6" style={{ borderTop: `1px solid ${T.sectionBorder}` }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="mb-3" style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', color: T.text }}>
              ¿Cómo funciona?
            </h2>
            <p style={{ color: T.textMuted, fontSize: '16px' }}>Tres pasos simples para tener tu horario listo</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map(({ n, title, desc }, i) => (
              <div key={n} className="flex flex-col items-center text-center relative">
                {i < steps.length - 1 && (
                  <div
                    className="hidden md:block absolute top-6 left-full w-8 -translate-x-4 h-px"
                    style={{ background: T.stepConnector }}
                  />
                )}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: T.stepNumBg, border: `1px solid ${T.stepNumBorder}`, color: '#C9344C', fontSize: '16px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {n}
                </div>
                <h3 className="mb-2" style={{ color: T.text, fontWeight: 600, fontSize: '16px' }}>{title}</h3>
                <p style={{ color: T.textMuted, fontSize: '14px', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated && (
        <section className="py-20 px-6" style={{ borderTop: `1px solid ${T.sectionBorder}` }}>
          <div className="max-w-2xl mx-auto text-center">
            <div
              className="p-10 rounded-3xl"
              style={{ background: T.ctaBg, backdropFilter: isDark ? 'blur(24px)' : 'none', border: `1px solid ${T.ctaBorder}`, boxShadow: T.ctaShadow }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: T.ctaIconBg, border: `1px solid ${T.ctaIconBorder}` }}
              >
                <Users size={28} style={{ color: '#C9344C' }} />
              </div>
              <h2 className="mb-3" style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', color: T.text }}>
                ¿Listo para empezar?
              </h2>
              <p className="mb-8" style={{ color: T.textMuted, fontSize: '15px', lineHeight: 1.6 }}>
                Únete a la comunidad de estudiantes de la UD que planifican su semestre de forma inteligente.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate('/register')}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl transition-all"
                  style={{ background: '#C9344C', color: 'white', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 600, boxShadow: T.primaryShadow }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#A02438'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#C9344C'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  Crear cuenta gratis <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-3.5 rounded-xl transition-all"
                  style={{ background: T.btnSecBg, border: `1px solid ${T.btnSecBorder}`, color: T.btnSecColor, cursor: 'pointer', fontSize: '15px', fontWeight: 500 }}
                  onMouseEnter={e => { e.currentTarget.style.background = T.btnSecHoverBg; }}
                  onMouseLeave={e => { e.currentTarget.style.background = T.btnSecBg; }}
                >
                  Ya tengo cuenta
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="px-6 py-8 text-center" style={{ borderTop: `1px solid ${T.footerBorder}` }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E8485F, #A02438)' }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: '11px' }}>N</span>
            </div>
            <span style={{ color: T.footerLogoText, fontWeight: 700, fontSize: '15px' }}>NexoUD</span>
          </div>
          <p style={{ color: T.footerText, fontSize: '13px', marginBottom: '8px' }}>
            Hecho con amor para la comunidad de la Universidad Distrital Francisco José de Caldas
          </p>
          <p style={{ color: T.footerText, fontSize: '12px' }}>
            NexoUD © 2026 · Herramienta estudiantil independiente · No afiliada a la Universidad Distrital
          </p>
        </div>
      </footer>
    </div>
  );
}
