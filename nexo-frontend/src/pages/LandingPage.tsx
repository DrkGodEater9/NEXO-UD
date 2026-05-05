import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useEffect, Fragment } from 'react';
import {
  Calendar, BookOpen, Zap, ArrowRight, CheckCircle,
  Clock, AlertTriangle, Users, Sun, Moon,
} from 'lucide-react';

const features = [
  {
    icon: Zap, title: 'Detección de cruces',
    desc: 'Detecta automáticamente conflictos de horario antes de inscribirte. Sin sorpresas el día del semestre.',
    darkColor: '#E8485F', darkBg: 'rgba(232,72,95,0.12)',
    lightColor: '#C9344C', lightBg: '#FFF1F2', lightBorder: 'rgba(201,52,76,0.20)',
  },
  {
    icon: BookOpen, title: 'Control de créditos',
    desc: 'Visualiza tu carga académica en tiempo real. Alertas cuando superas el máximo permitido.',
    darkColor: '#818CF8', darkBg: 'rgba(129,140,248,0.12)',
    lightColor: '#4F46E5', lightBg: '#EEF2FF', lightBorder: 'rgba(79,70,229,0.20)',
  },
  {
    icon: Clock, title: 'Tiempos entre sedes',
    desc: 'Calcula desplazamientos entre sedes de la UD para evitar llegadas tarde a clase.',
    darkColor: '#34D399', darkBg: 'rgba(52,211,153,0.12)',
    lightColor: '#059669', lightBg: '#F0FDF9', lightBorder: 'rgba(5,150,105,0.20)',
  },
  {
    icon: Calendar, title: 'Historial de horarios',
    desc: 'Guarda hasta 5 versiones de tu horario por semestre. Compara y elige el mejor.',
    darkColor: '#FBBF24', darkBg: 'rgba(251,191,36,0.12)',
    lightColor: '#D97706', lightBg: '#FFFBEB', lightBorder: 'rgba(217,119,6,0.20)',
  },
];

const steps = [
  { n: '01', title: 'Regístrate', desc: 'Crea tu cuenta con tu correo @udistrital.edu.co y accede al sistema completo.' },
  { n: '02', title: 'Busca materias', desc: 'Explora el catálogo completo por facultad, carrera, horario o profesor.' },
  { n: '03', title: 'Arma tu horario', desc: 'Agrega grupos, detecta cruces automáticamente y guarda tu plan perfecto.' },
];

const SCHEDULE_ROWS = (isDark: boolean) => [
  {
    time: '7–9',
    slots: [
      { label: 'Cálculo\nDif.', color: isDark ? '#818CF8' : '#4F46E5', conflict: false },
      { label: '', color: '', conflict: false },
      { label: 'Cálculo\nDif.', color: isDark ? '#818CF8' : '#4F46E5', conflict: false },
      { label: '', color: '', conflict: false },
      { label: 'Cálculo\nDif.', color: isDark ? '#818CF8' : '#4F46E5', conflict: false },
      { label: '', color: '', conflict: false },
    ],
  },
  {
    time: '9–11',
    slots: [
      { label: '', color: '', conflict: false },
      { label: 'Prog. I', color: isDark ? '#E8485F' : '#C9344C', conflict: false },
      { label: '', color: '', conflict: false },
      { label: 'Prog. I', color: isDark ? '#E8485F' : '#C9344C', conflict: false },
      { label: '', color: '', conflict: false },
      { label: '', color: '', conflict: false },
    ],
  },
  {
    time: '11–13',
    slots: [
      { label: 'Física\nMec.', color: isDark ? '#34D399' : '#059669', conflict: false },
      { label: '', color: '', conflict: false },
      { label: 'Física\nMec.', color: isDark ? '#34D399' : '#059669', conflict: false },
      { label: '', color: '', conflict: false },
      { label: 'Cruce!', color: isDark ? '#FBBF24' : '#D97706', conflict: true },
      { label: '', color: '', conflict: false },
    ],
  },
];

const CSS_ANIM = `
  @keyframes _fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes _floatY {
    0%, 100% { transform: translateY(0px);  }
    50%       { transform: translateY(-12px); }
  }
  @keyframes _blob1 {
    0%, 100% { transform: translate(0,0)       scale(1);    }
    33%       { transform: translate(45px,-28px) scale(1.08); }
    66%       { transform: translate(-22px,18px) scale(0.94); }
  }
  @keyframes _blob2 {
    0%, 100% { transform: translate(0,0)        scale(1);    }
    33%       { transform: translate(-32px,22px)  scale(1.06); }
    66%       { transform: translate(24px,-18px)  scale(0.95); }
  }
  @keyframes _pulseRing {
    0%   { box-shadow: 0 0 0  0   rgba(201,52,76,.50); }
    70%  { box-shadow: 0 0 0 14px rgba(201,52,76,0);   }
    100% { box-shadow: 0 0 0  0   rgba(201,52,76,0);   }
  }
  @keyframes _gradFlow {
    0%, 100% { background-position: 0%   50%; }
    50%       { background-position: 100% 50%; }
  }
  @keyframes _blink {
    0%, 100% { opacity: 1;   }
    50%       { opacity: 0.5; }
  }
  @keyframes _shimmer {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(200%);  }
  }

  .a-h0 { animation: _fadeUp .8s cubic-bezier(.16,1,.3,1) both; }
  .a-h1 { animation: _fadeUp .8s .13s cubic-bezier(.16,1,.3,1) both; }
  .a-h2 { animation: _fadeUp .8s .26s cubic-bezier(.16,1,.3,1) both; }
  .a-h3 { animation: _fadeUp .8s .39s cubic-bezier(.16,1,.3,1) both; }
  .a-h4 { animation: _fadeUp .8s .52s cubic-bezier(.16,1,.3,1) both; }
  .a-float  { animation: _floatY  4.5s ease-in-out infinite; }
  .a-blob1  { animation: _blob1   14s  ease-in-out infinite; }
  .a-blob2  { animation: _blob2   18s  ease-in-out infinite; }
  .a-ring   { animation: _pulseRing 2.8s ease-in-out infinite; }
  .a-grad   { background-size: 200% 200% !important; animation: _gradFlow 5s ease infinite; }
  .a-blink  { animation: _blink 2.5s ease-in-out infinite; }

  /* Scroll-reveal */
  .rv  { opacity: 0; transform: translateY(32px); transition: opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1); }
  .rv.in { opacity: 1; transform: translateY(0); }
  .rvc { opacity: 0; transform: translateY(22px) scale(.97); transition: opacity .55s cubic-bezier(.16,1,.3,1), transform .55s cubic-bezier(.16,1,.3,1), box-shadow .22s ease, border-color .22s ease; }
  .rvc.in { opacity: 1; transform: translateY(0) scale(1); }

  /* Shimmer overlay on cards */
  .card-shimmer { position: relative; overflow: hidden; }
  .card-shimmer::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,.06) 50%, transparent 60%);
    transform: translateX(-100%);
    transition: none;
    pointer-events: none;
  }
  .card-shimmer:hover::after { animation: _shimmer .55s ease forwards; }

  /* Smooth scroll */
  html { scroll-behavior: smooth; }

  @media (prefers-reduced-motion: reduce) {
    .a-h0,.a-h1,.a-h2,.a-h3,.a-h4 { animation: none !important; opacity: 1 !important; transform: none !important; }
    .a-float,.a-blob1,.a-blob2,.a-ring,.a-grad,.a-blink { animation: none !important; }
    .rv,.rvc { opacity: 1 !important; transform: none !important; transition: none !important; }
    html { scroll-behavior: auto; }
  }
`;

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        Array.from(e.target.querySelectorAll('.rvc')).forEach((el, i) =>
          setTimeout(() => el.classList.add('in'), i * 115)
        );
        io.unobserve(e.target);
      }),
      { threshold: 0.07, rootMargin: '0px 0px -48px 0px' }
    );
    document.querySelectorAll('.rv').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  const T = {
    pageBg:           isDark ? 'linear-gradient(145deg,#0D0A1E 0%,#150F2B 50%,#090D1C 100%)' : '#F5F5F7',
    pageSolid:        isDark ? '#0D0A1E' : '#F5F5F7',
    headerBg:         isDark ? 'rgba(13,10,30,0.82)'       : 'rgba(255,255,255,0.90)',
    headerBorder:     isDark ? 'rgba(255,255,255,0.09)'     : 'rgba(210,210,215,0.85)',
    headerShadow:     isDark ? '0 8px 40px rgba(0,0,0,.45)' : '0 4px 24px rgba(0,0,0,.09)',
    text:             isDark ? '#F1F0F5' : '#1D1D1F',
    textMuted:        isDark ? '#9B9AA6' : '#6E6E73',
    textSubtle:       isDark ? '#5C5B66' : '#86868B',
    cardBg:           isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
    cardBorder:       isDark ? 'rgba(255,255,255,0.08)' : '#E5E5EA',
    cardShadow:       isDark ? 'none'                   : '0 2px 16px rgba(0,0,0,.06)',
    sectionBorder:    isDark ? 'rgba(255,255,255,0.05)' : '#D2D2D7',
    toggleBg:         isDark ? 'rgba(255,255,255,0.08)' : '#E5E5EA',
    toggleBorder:     isDark ? 'rgba(255,255,255,0.14)' : '#C7C7CC',
    toggleColor:      isDark ? '#8B8A97' : '#6E6E73',
    ghostBorder:      isDark ? 'rgba(255,255,255,0.14)' : '#D2D2D7',
    ghostColor:       isDark ? '#C0BFC8' : '#1D1D1F',
    ghostHoverBg:     isDark ? 'rgba(255,255,255,0.07)' : '#F0F0F3',
    badgeBg:          isDark ? 'rgba(201,52,76,0.12)'   : 'rgba(201,52,76,0.07)',
    badgeBorder:      isDark ? 'rgba(201,52,76,0.30)'   : 'rgba(201,52,76,0.22)',
    badgeColor:       isDark ? '#E8485F' : '#C9344C',
    heroTitle:        isDark ? '#F1F0F5' : '#1D1D1F',
    heroGradientStyle: isDark
      ? { backgroundImage: 'linear-gradient(135deg,#E8485F 0%,#C084FC 50%,#818CF8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block' } as React.CSSProperties
      : { color: '#C9344C' } as React.CSSProperties,
    heroSubtitle:     isDark ? '#9B9AA6' : '#6E6E73',
    primaryShadow:    isDark ? '0 6px 28px rgba(201,52,76,.52)' : '0 4px 18px rgba(201,52,76,.28)',
    btnSecBg:         isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
    btnSecBorder:     isDark ? 'rgba(255,255,255,0.14)' : '#D2D2D7',
    btnSecColor:      isDark ? '#F1F0F5' : '#1D1D1F',
    btnSecHoverBg:    isDark ? 'rgba(255,255,255,0.10)' : '#F0F0F3',
    checkColor:       isDark ? '#34D399' : '#16A34A',
    trustColor:       isDark ? '#9B9AA6' : '#6E6E73',
    previewBg:        isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
    previewBorder:    isDark ? 'rgba(255,255,255,0.10)' : '#E5E5EA',
    previewShadow:    isDark
      ? '0 28px 90px rgba(0,0,0,.65), 0 0 0 1px rgba(255,255,255,0.05)'
      : '0 12px 52px rgba(0,0,0,.12)',
    previewChromeBg:  isDark ? 'rgba(255,255,255,0.025)' : '#F9F9FB',
    previewDayBorder: isDark ? 'rgba(255,255,255,0.06)'  : '#E5E5EA',
    previewDayColor:  isDark ? '#6B6A77' : '#9E9EA6',
    previewTimeBg:    isDark ? 'rgba(255,255,255,0.025)' : '#FAFAFA',
    disclaimerBg:     isDark ? 'rgba(251,191,36,0.07)'  : '#FFFBEB',
    disclaimerBorder: isDark ? 'rgba(251,191,36,0.18)'  : '#FDE68A',
    stepNumBg:        isDark ? 'linear-gradient(135deg,rgba(201,52,76,0.18),rgba(99,102,241,0.14))' : 'rgba(201,52,76,0.08)',
    stepNumBorder:    isDark ? 'rgba(201,52,76,0.32)'   : 'rgba(201,52,76,0.22)',
    stepGlow:         isDark ? '0 0 28px rgba(201,52,76,.18)' : 'none',
    ctaBg:            isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
    ctaBorder:        isDark ? 'rgba(201,52,76,0.22)'   : '#E5E5EA',
    ctaShadow:        isDark
      ? '0 0 90px rgba(201,52,76,.14), 0 0 0 1px rgba(201,52,76,.16)'
      : '0 8px 44px rgba(0,0,0,.08)',
    footerBorder:     isDark ? 'rgba(255,255,255,0.05)' : '#D2D2D7',
    footerText:       isDark ? '#4A4958' : '#86868B',
    footerLogoText:   isDark ? '#F1F0F5' : '#1D1D1F',
  };

  const primaryBtnBase: React.CSSProperties = {
    background: 'linear-gradient(135deg,#E8485F,#B02D44)',
    color: 'white', border: 'none', cursor: 'pointer',
    fontWeight: 600, boxShadow: T.primaryShadow,
  };

  return (
    <>
      <style>{CSS_ANIM}</style>
      <div
        className="min-h-screen flex flex-col"
        style={{ background: T.pageBg, backgroundAttachment: 'fixed', backgroundColor: T.pageSolid }}
      >

        {/* ── FLOATING NAVBAR ─────────────────────────────────── */}
        <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 pointer-events-none">
          <header
            className="w-fit mx-auto px-4 py-2.5 rounded-2xl flex items-center gap-4 pointer-events-auto"
            style={{
              background: T.headerBg,
              backdropFilter: 'blur(28px) saturate(200%)',
              WebkitBackdropFilter: 'blur(28px) saturate(200%)',
              border: `1px solid ${T.headerBorder}`,
              boxShadow: T.headerShadow,
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="a-ring w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#E8485F,#A02438)', boxShadow: '0 4px 14px rgba(201,52,76,.45)' }}
              >
                <span style={{ color: 'white', fontWeight: 800, fontSize: '14px', letterSpacing: '-0.02em' }}>N</span>
              </div>
              <span style={{ color: T.text, fontWeight: 700, fontSize: '17px', letterSpacing: '-0.03em' }}>NexoUD</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                title={isDark ? 'Tema claro' : 'Tema oscuro'}
                className="p-2 rounded-xl transition-all duration-200"
                style={{ background: T.toggleBg, border: `1px solid ${T.toggleBorder}`, color: T.toggleColor, cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.color = T.text; e.currentTarget.style.background = T.ghostHoverBg; }}
                onMouseLeave={e => { e.currentTarget.style.color = T.toggleColor; e.currentTarget.style.background = T.toggleBg; }}
              >
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </button>

              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-3.5 py-1.5 rounded-xl transition-all duration-200"
                    style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, color: T.text, cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                    onMouseEnter={e => { e.currentTarget.style.background = T.ghostHoverBg; }}
                    onMouseLeave={e => { e.currentTarget.style.background = T.cardBg; }}
                  >Dashboard</button>
                  <button
                    onClick={() => navigate('/planner')}
                    className="px-3.5 py-1.5 rounded-xl transition-all duration-200"
                    style={{ ...primaryBtnBase, fontSize: '13px' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(201,52,76,.58)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = T.primaryShadow; }}
                  >Planificador</button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-3.5 py-1.5 rounded-xl transition-all duration-200 max-sm:hidden"
                    style={{ background: 'transparent', border: `1px solid ${T.ghostBorder}`, color: T.ghostColor, cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                    onMouseEnter={e => { e.currentTarget.style.background = T.ghostHoverBg; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >Iniciar sesión</button>
                  <button
                    onClick={() => navigate('/register')}
                    className="px-3.5 py-1.5 rounded-xl transition-all duration-200"
                    style={{ ...primaryBtnBase, fontSize: '13px' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(201,52,76,.58)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = T.primaryShadow; }}
                  >Registrarse</button>
                </>
              )}
            </div>
          </header>
        </div>

        {/* Spacer for fixed navbar */}
        <div style={{ height: '76px' }} />

        {/* ── DISCLAIMER BANNER ──────────────────────────────── */}
        <div
          className="px-6 py-2 flex items-center justify-center gap-2 text-center"
          style={{ background: T.disclaimerBg, borderBottom: `1px solid ${T.disclaimerBorder}` }}
        >
          <AlertTriangle size={13} style={{ color: '#D97706', flexShrink: 0 }} />
          <p style={{ color: T.textMuted, fontSize: '11.5px', lineHeight: 1.5 }}>
            <span style={{ color: '#D97706', fontWeight: 600 }}>Herramienta estudiantil independiente.</span>{' '}
            NexoUD no es el sistema oficial de inscripción de la Universidad Distrital.
          </p>
        </div>

        {/* ── HERO ────────────────────────────────────────────── */}
        <section className="flex-1 flex items-center px-6 py-24 md:py-32 relative overflow-hidden">

          {/* Dark mode animated blobs */}
          {isDark && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div
                className="a-blob1 absolute -top-16 left-1/4 w-[520px] h-[520px] rounded-full"
                style={{ background: 'radial-gradient(circle,rgba(232,72,95,.65) 0%,transparent 65%)', filter: 'blur(90px)', opacity: 0.18 }}
              />
              <div
                className="a-blob2 absolute -bottom-16 right-1/4 w-[440px] h-[440px] rounded-full"
                style={{ background: 'radial-gradient(circle,rgba(129,140,248,.65) 0%,transparent 65%)', filter: 'blur(90px)', opacity: 0.14 }}
              />
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
                style={{ background: 'radial-gradient(circle,rgba(192,132,252,.35) 0%,transparent 70%)', filter: 'blur(110px)', opacity: 0.07 }}
              />
            </div>
          )}

          {/* Light mode subtle tint */}
          {!isDark && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div
                className="absolute -top-20 right-0 w-[700px] h-[500px]"
                style={{ background: 'radial-gradient(ellipse at top right,rgba(201,52,76,.07) 0%,transparent 60%)', opacity: 1 }}
              />
            </div>
          )}

          <div className="max-w-6xl mx-auto w-full relative">
            <div className="max-w-3xl mx-auto text-center">

              {/* Badge */}
              <div
                className="a-h0 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-8 cursor-default select-none"
                style={{ background: T.badgeBg, border: `1px solid ${T.badgeBorder}` }}
              >
                <span className="a-blink w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: T.badgeColor, display: 'inline-block' }} />
                <span style={{ color: T.badgeColor, fontSize: '12px', fontWeight: 600, letterSpacing: '0.01em' }}>
                  Universidad Distrital · Planificador académico
                </span>
              </div>

              {/* Headline */}
              <h1
                className="a-h1 mb-6"
                style={{ fontSize: 'clamp(2.6rem,6.5vw,4.2rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, color: T.heroTitle }}
              >
                Planifica tu semestre{' '}
                <span className={isDark ? 'a-grad' : ''} style={T.heroGradientStyle}>sin estrés</span>
              </h1>

              {/* Subtitle */}
              <p
                className="a-h2"
                style={{ color: T.heroSubtitle, fontSize: '18px', lineHeight: 1.75, maxWidth: '540px', margin: '0 auto 40px' }}
              >
                Organiza horarios, valida prerrequisitos y detecta conflictos —
                todo{' '}
                <strong style={{ color: T.textMuted, fontWeight: 600 }}>antes del día de inscripciones</strong>.
              </p>

              {/* CTA Buttons */}
              <div className="a-h3 flex flex-col sm:flex-row gap-3 justify-center items-center mb-12">
                <button
                  onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl transition-all duration-200"
                  style={{ ...primaryBtnBase, fontSize: '15px', minWidth: '210px', justifyContent: 'center' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(201,52,76,.62)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = T.primaryShadow; }}
                >
                  {isAuthenticated ? 'Ir al Dashboard' : 'Crear cuenta gratis'}
                  <ArrowRight size={17} />
                </button>
                <button
                  onClick={() => navigate('/quick')}
                  className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl transition-all duration-200"
                  style={{ background: T.btnSecBg, border: `1px solid ${T.btnSecBorder}`, color: T.btnSecColor, cursor: 'pointer', fontSize: '15px', fontWeight: 500, minWidth: '210px' }}
                  onMouseEnter={e => { e.currentTarget.style.background = T.btnSecHoverBg; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = T.btnSecBg; e.currentTarget.style.transform = ''; }}
                >
                  <Zap size={17} />
                  Modo rápido
                </button>
              </div>

              {/* Trust signals */}
              <div className="a-h4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
                {[
                  { text: '10+ Facultades' },
                  { text: '100+ Materias' },
                  { text: 'Gratis y sin límites' },
                ].map(({ text }) => (
                  <div key={text} className="flex items-center gap-2">
                    <CheckCircle size={13} style={{ color: T.checkColor }} />
                    <span style={{ color: T.trustColor, fontSize: '13px', fontWeight: 500 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── SCHEDULE PREVIEW ─── */}
            <div
              className="a-float mt-20 mx-auto rounded-2xl overflow-hidden"
              style={{
                maxWidth: '680px',
                background: T.previewBg,
                backdropFilter: isDark ? 'blur(24px) saturate(180%)' : 'none',
                WebkitBackdropFilter: isDark ? 'blur(24px) saturate(180%)' : 'none',
                border: `1px solid ${T.previewBorder}`,
                boxShadow: T.previewShadow,
              }}
            >
              {/* Browser chrome */}
              <div
                className="flex items-center gap-1.5 px-4 py-3"
                style={{ background: T.previewChromeBg, borderBottom: `1px solid ${T.previewDayBorder}` }}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#F87171' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FBBF24' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#34D399' }} />
                <div
                  className="flex-1 mx-3 h-5 rounded-md flex items-center justify-center"
                  style={{ background: isDark ? 'rgba(255,255,255,0.05)' : '#EFEFEF' }}
                >
                  <span style={{ color: T.previewDayColor, fontSize: '10px', fontWeight: 500 }}>
                    Horario 2026-1 · Semestre 4
                  </span>
                </div>
              </div>

              {/* Grid */}
              <div className="p-4">
                <div style={{ display: 'grid', gridTemplateColumns: '36px repeat(6,1fr)', gap: '6px' }}>
                  {/* Header row */}
                  <div />
                  {['LUN','MAR','MIÉ','JUE','VIE','SÁB'].map(d => (
                    <div key={d} className="text-center pb-2" style={{ fontSize: '9px', color: T.previewDayColor, fontWeight: 700, borderBottom: `1px solid ${T.previewDayBorder}`, letterSpacing: '0.06em' }}>
                      {d}
                    </div>
                  ))}

                  {/* Time rows */}
                  {SCHEDULE_ROWS(isDark).map((row, ri) => (
                    <Fragment key={ri}>
                      <div
                        className="flex items-center justify-end pr-1"
                        style={{ fontSize: '8px', color: T.previewDayColor, fontWeight: 600, fontFamily: 'JetBrains Mono,monospace', minHeight: '56px', background: T.previewTimeBg, borderRadius: '6px' }}
                      >
                        {row.time}
                      </div>
                      {row.slots.map((slot, si) => (
                        <div
                          key={si}
                          className="rounded-lg p-1.5 flex items-center justify-center"
                          style={{
                            background: slot.color ? (isDark ? `${slot.color}22` : `${slot.color}14`) : 'transparent',
                            border: slot.color
                              ? `1px solid ${slot.color}${isDark ? (slot.conflict ? 'BB' : '44') : (slot.conflict ? '99' : '32')}`
                              : '1px solid transparent',
                            minHeight: '56px',
                            boxShadow: slot.conflict && isDark ? `0 0 12px ${slot.color}33` : 'none',
                          }}
                        >
                          {slot.label && (
                            <span style={{ color: slot.color, fontSize: '8px', fontWeight: 700, lineHeight: 1.35, textAlign: 'center', whiteSpace: 'pre-line' }}>
                              {slot.label}
                            </span>
                          )}
                        </div>
                      ))}
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ────────────────────────────────────────── */}
        <section id="features" className="py-24 px-6 rv" style={{ borderTop: `1px solid ${T.sectionBorder}` }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2
                className="mb-3"
                style={{ fontSize: 'clamp(1.8rem,4vw,2.3rem)', fontWeight: 800, letterSpacing: '-0.03em', color: T.text }}
              >
                Todo lo que necesitas
              </h2>
              <p style={{ color: T.textMuted, fontSize: '16px', maxWidth: '460px', margin: '0 auto', lineHeight: 1.7 }}>
                Diseñado para estudiantes de la UD que quieren planificar con inteligencia
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {features.map((f) => {
                const color  = isDark ? f.darkColor  : f.lightColor;
                const bg     = isDark ? f.darkBg     : f.lightBg;
                const border = isDark ? 'rgba(255,255,255,0.08)' : f.lightBorder;
                return (
                  <div
                    key={f.title}
                    className="rvc card-shimmer p-6 rounded-2xl cursor-default"
                    style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF', border: `1px solid ${border}`, boxShadow: T.cardShadow }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-5px) scale(1.01)';
                      e.currentTarget.style.boxShadow = isDark ? `0 18px 52px ${color}26` : `0 12px 36px rgba(0,0,0,.12)`;
                      e.currentTarget.style.borderColor = isDark ? `${color}52` : color;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = '';
                      e.currentTarget.style.boxShadow = T.cardShadow;
                      e.currentTarget.style.borderColor = border;
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                      style={{ background: bg, border: `1px solid ${isDark ? `${color}38` : f.lightBorder}` }}
                    >
                      <f.icon size={22} style={{ color }} />
                    </div>
                    <h3 className="mb-2.5" style={{ color: T.text, fontWeight: 700, fontSize: '15px', letterSpacing: '-0.01em' }}>{f.title}</h3>
                    <p style={{ color: T.textMuted, fontSize: '13.5px', lineHeight: 1.7 }}>{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ────────────────────────────────────── */}
        <section className="py-24 px-6 rv" style={{ borderTop: `1px solid ${T.sectionBorder}` }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2
                className="mb-3"
                style={{ fontSize: 'clamp(1.8rem,4vw,2.3rem)', fontWeight: 800, letterSpacing: '-0.03em', color: T.text }}
              >
                ¿Cómo funciona?
              </h2>
              <p style={{ color: T.textMuted, fontSize: '16px', lineHeight: 1.7 }}>
                Tres pasos simples para tener tu horario listo
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {steps.map(({ n, title, desc }, i) => (
                <div key={n} className="rvc flex flex-col items-center text-center relative">
                  {i < steps.length - 1 && (
                    <div
                      className="hidden md:block absolute top-7 h-px"
                      style={{
                        left: '50%', width: '100%', marginLeft: '44px',
                        background: isDark
                          ? 'linear-gradient(90deg,rgba(201,52,76,.40),rgba(129,140,248,.20),transparent)'
                          : 'linear-gradient(90deg,#D2D2D7,transparent)',
                      }}
                    />
                  )}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 relative z-10"
                    style={{
                      background: T.stepNumBg,
                      border: `1px solid ${T.stepNumBorder}`,
                      boxShadow: T.stepGlow,
                    }}
                  >
                    <span style={{ color: '#C9344C', fontSize: '17px', fontWeight: 800, fontFamily: 'JetBrains Mono,monospace', letterSpacing: '-0.02em' }}>
                      {n}
                    </span>
                  </div>
                  <h3 className="mb-2.5" style={{ color: T.text, fontWeight: 700, fontSize: '16px', letterSpacing: '-0.01em' }}>{title}</h3>
                  <p style={{ color: T.textMuted, fontSize: '14px', lineHeight: 1.75 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────── */}
        {!isAuthenticated && (
          <section className="py-24 px-6 rv" style={{ borderTop: `1px solid ${T.sectionBorder}` }}>
            <div className="max-w-xl mx-auto text-center">
              <div
                className="p-10 rounded-3xl relative overflow-hidden"
                style={{
                  background: T.ctaBg,
                  backdropFilter: isDark ? 'blur(28px) saturate(200%)' : 'none',
                  WebkitBackdropFilter: isDark ? 'blur(28px) saturate(200%)' : 'none',
                  border: `1px solid ${T.ctaBorder}`,
                  boxShadow: T.ctaShadow,
                }}
              >
                {isDark && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at 50% 110%,rgba(201,52,76,.16) 0%,transparent 65%)' }}
                  />
                )}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 relative z-10"
                  style={{
                    background: isDark ? 'linear-gradient(135deg,rgba(201,52,76,.24),rgba(99,102,241,.18))' : 'rgba(201,52,76,.09)',
                    border: `1px solid ${isDark ? 'rgba(201,52,76,.38)' : 'rgba(201,52,76,.20)'}`,
                  }}
                >
                  <Users size={28} style={{ color: '#C9344C' }} />
                </div>
                <h2
                  className="mb-4 relative z-10"
                  style={{ fontSize: 'clamp(1.5rem,3.5vw,1.9rem)', fontWeight: 800, letterSpacing: '-0.03em', color: T.text }}
                >
                  ¿Listo para empezar?
                </h2>
                <p
                  className="relative z-10"
                  style={{ color: T.textMuted, fontSize: '15px', lineHeight: 1.75, maxWidth: '380px', margin: '0 auto 36px' }}
                >
                  Únete a los estudiantes de la UD que planifican su semestre de forma inteligente.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center relative z-10">
                  <button
                    onClick={() => navigate('/register')}
                    className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl transition-all duration-200"
                    style={{ ...primaryBtnBase, fontSize: '15px' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(201,52,76,.62)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = T.primaryShadow; }}
                  >
                    Crear cuenta gratis <ArrowRight size={17} />
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-7 py-3.5 rounded-xl transition-all duration-200"
                    style={{ background: T.btnSecBg, border: `1px solid ${T.btnSecBorder}`, color: T.btnSecColor, cursor: 'pointer', fontSize: '15px', fontWeight: 500 }}
                    onMouseEnter={e => { e.currentTarget.style.background = T.btnSecHoverBg; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = T.btnSecBg; e.currentTarget.style.transform = ''; }}
                  >
                    Ya tengo cuenta
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── FOOTER ──────────────────────────────────────────── */}
        <footer className="px-6 py-10 text-center" style={{ borderTop: `1px solid ${T.footerBorder}` }}>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#E8485F,#A02438)', boxShadow: '0 3px 10px rgba(201,52,76,.38)' }}
              >
                <span style={{ color: 'white', fontWeight: 800, fontSize: '12px' }}>N</span>
              </div>
              <span style={{ color: T.footerLogoText, fontWeight: 700, fontSize: '16px', letterSpacing: '-0.02em' }}>NexoUD</span>
            </div>
            <p style={{ color: T.footerText, fontSize: '13px', marginBottom: '6px', lineHeight: 1.65 }}>
              Hecho con amor para la comunidad de la Universidad Distrital Francisco José de Caldas
            </p>
            <p style={{ color: T.footerText, fontSize: '11.5px', opacity: 0.8 }}>
              NexoUD © 2026 · Herramienta estudiantil independiente · No afiliada a la Universidad Distrital
            </p>
          </div>
        </footer>

      </div>
    </>
  );
}
