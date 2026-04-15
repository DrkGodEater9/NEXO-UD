import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { useThemeTokens } from '../context/useThemeTokens';
import {
  MapPin, Calendar, Heart, BookOpen, Megaphone, ChevronRight,
  Clock, Train, Bus, Footprints, ArrowLeft
} from 'lucide-react';

const sedes = [
  { name: 'Sede Macarena A', address: 'Cr 3 # 26A-40, La Candelaria', color: '#E8485F', hasLabs: true },
  { name: 'Sede Macarena B', address: 'Cr 4 # 26D-54, La Candelaria', color: '#818CF8', hasLabs: false },
  { name: 'Sede Vivero', address: 'Tv 4 # 26D-14, La Candelaria', color: '#34D399', hasLabs: true },
  { name: 'Sede El Ensueño', address: 'Cr 7F # 71B-11 sur, Ciudad Bolívar', color: '#FBBF24', hasLabs: true },
  { name: 'Fac. Tecnológica', address: 'Cr 68D # 6-17 sur, Kennedy', color: '#F472B6', hasLabs: true },
];

const tiemposEntreSedesData = [
  { from: 'Macarena', to: 'Fac. Tecnológica', metro: '35 min', bus: '50 min', walk: '—' },
  { from: 'Macarena', to: 'El Ensueño', metro: '45 min', bus: '60 min', walk: '—' },
  { from: 'Macarena A', to: 'Vivero', metro: '—', bus: '10 min', walk: '15 min' },
];

const calendarEvents = [
  { date: '15 abr', title: 'Inicio inscripciones 2026-1', type: 'primary' },
  { date: '22 abr', title: 'Cierre inscripciones', type: 'danger' },
  { date: '28 abr', title: 'Inicio clases 2026-1', type: 'success' },
  { date: '15 may', title: 'Festivo — Día del Trabajo', type: 'warning' },
  { date: '25 jun', title: 'Paro estudiantil (tentativo)', type: 'warning' },
  { date: '30 jun', title: 'Parciales primer corte', type: 'primary' },
];

const welfareInfo = [
  { title: 'Apoyo alimentario', desc: 'Subsidio de restaurante para estudiantes con vulnerabilidad socioeconómica. Aplica en Bienestar Institucional.', color: '#FBBF24' },
  { title: 'Salud mental', desc: 'Orientación psicológica gratuita. Agenda tu cita en el portal o directamente en Bienestar.', color: '#F472B6' },
  { title: 'Becas de excelencia', desc: 'Para estudiantes con promedio ≥ 3.8. Convocatoria semestral abierta en la primera semana de clases.', color: '#34D399' },
  { title: 'Transporte', desc: 'Subsidio de transporte para estudiantes de estratos 1 y 2. Verificar requisitos en Bienestar.', color: '#818CF8' },
];

const sgaSteps = [
  { n: '1', title: 'Accede al portal SGA', desc: 'Ingresa a sga.udistrital.edu.co con tu código estudiantil y contraseña institucional.' },
  { n: '2', title: 'Verifica tu habilitación', desc: 'Confirma que no tienes paz y salvo pendiente ni deudas académicas o financieras.' },
  { n: '3', title: 'Selecciona "Inscripción de materias"', desc: 'En el menú principal, busca la opción de inscripción para el período académico vigente.' },
  { n: '4', title: 'Busca y agrega grupos', desc: 'Busca por código de materia o nombre. Selecciona el grupo y horario de tu preferencia.' },
  { n: '5', title: 'Confirma tu inscripción', desc: 'Revisa el resumen, confirma los créditos y guarda tu inscripción antes de que cierre el sistema.' },
];

type Section = 'campus' | 'calendar' | 'welfare' | 'sga' | 'notices' | null;

const infoCards = [
  { key: 'campus', icon: MapPin, title: 'Campus y sedes', desc: 'Ubicaciones, tiempos de desplazamiento y laboratorios', color: '#E8485F', bg: 'rgba(201,52,76,0.1)' },
  { key: 'calendar', icon: Calendar, title: 'Calendario académico', desc: 'Fechas de inscripción, parciales, festivos y paros', color: '#818CF8', bg: 'rgba(99,102,241,0.1)' },
  { key: 'welfare', icon: Heart, title: 'Bienestar institucional', desc: 'Apoyo alimentario, salud mental, becas y transporte', color: '#34D399', bg: 'rgba(52,211,153,0.1)' },
  { key: 'sga', icon: BookOpen, title: 'Guía de inscripción SGA', desc: 'Paso a paso para inscribir materias en el sistema Cóndor', color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' },
  { key: 'notices', icon: Megaphone, title: 'Avisos generales', desc: 'Asambleas, comunicados y noticias de la comunidad', color: '#F472B6', bg: 'rgba(244,114,182,0.1)' },
] as const;

export default function InfoPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const T = useThemeTokens();
  const [activeSection, setActiveSection] = useState<Section>(null);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  const typeColors = {
    primary: { bg: T.accentIndigo.bg, border: T.accentIndigo.border, text: T.accentIndigo.color },
    danger:  { bg: T.error.bg,        border: T.error.border,        text: T.error.text },
    success: { bg: T.accentGreen.bg,  border: T.accentGreen.border,  text: T.accentGreen.color },
    warning: { bg: T.accentYellow.bg, border: T.accentYellow.border, text: T.accentYellow.color },
  };

  const infoCardAccents = {
    campus:   T.accentRed,
    calendar: T.accentIndigo,
    welfare:  T.accentGreen,
    sga:      T.accentYellow,
    notices:  T.accentPink,
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          {activeSection && (
            <button onClick={() => setActiveSection(null)} className="p-2 rounded-xl transition-all"
              style={{ background: T.cardBg2, border: `1px solid ${T.cardBorder}`, color: T.textMuted, cursor: 'pointer' }}>
              <ArrowLeft size={16} />
            </button>
          )}
          <div>
            <h1 style={{ color: T.text, fontWeight: 700, fontSize: '22px', letterSpacing: '-0.02em' }}>
              {activeSection ? infoCards.find(c => c.key === activeSection)?.title : 'Información general'}
            </h1>
            <p style={{ color: T.textMuted, fontSize: '14px', marginTop: '4px' }}>
              {activeSection ? 'Información detallada' : 'Recursos y utilidades para estudiantes de la UD'}
            </p>
          </div>
        </div>

        {/* Main grid */}
        {!activeSection && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {infoCards.map(({ key, icon: Icon, title, desc }) => {
              const accent = infoCardAccents[key as keyof typeof infoCardAccents];
              return (
                <div key={key} onClick={() => setActiveSection(key as Section)}
                  className="p-5 rounded-2xl cursor-pointer transition-all duration-200"
                  style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}
                  onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${accent.border}`; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = T.cardHoverShadow; }}
                  onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${T.cardBorder}`; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = T.cardShadow; }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: accent.bg, border: `1px solid ${accent.border}` }}>
                    <Icon size={22} style={{ color: accent.color }} />
                  </div>
                  <h3 style={{ color: T.text, fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>{title}</h3>
                  <p style={{ color: T.textMuted, fontSize: '13px', lineHeight: 1.6 }}>{desc}</p>
                  <div className="flex items-center gap-1 mt-3">
                    <span style={{ color: accent.color, fontSize: '12px', fontWeight: 500 }}>Ver más</span>
                    <ChevronRight size={12} style={{ color: accent.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Campus section */}
        {activeSection === 'campus' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sedes.map(sede => (
                <div key={sede.name} className="p-4 rounded-2xl transition-all"
                  style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = T.cardHoverShadow; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = T.cardShadow; }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: sede.color }} />
                    <h3 style={{ color: T.text, fontWeight: 600, fontSize: '14px' }}>{sede.name}</h3>
                  </div>
                  <div className="flex items-start gap-1.5 mb-2">
                    <MapPin size={12} style={{ color: T.textSubtle, marginTop: '2px', flexShrink: 0 }} />
                    <p style={{ color: T.textMuted, fontSize: '12px', lineHeight: 1.5 }}>{sede.address}</p>
                  </div>
                  {sede.hasLabs && (
                    <span className="px-2 py-0.5 rounded-full"
                      style={{ background: T.accentGreen.bg, color: T.accentGreen.color, fontSize: '10px', fontWeight: 600, border: `1px solid ${T.accentGreen.border}` }}>
                      Tiene laboratorios
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="p-5 rounded-2xl" style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}>
              <h3 style={{ color: T.text, fontWeight: 600, fontSize: '15px', marginBottom: '12px' }}>Tiempos entre sedes</h3>
              <div className="space-y-3">
                {tiemposEntreSedesData.map((t, i) => (
                  <div key={i} className="p-3 rounded-xl" style={{ background: T.cardBg2, border: `1px solid ${T.divider}` }}>
                    <p style={{ color: T.text, fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>
                      {t.from} → {t.to}
                    </p>
                    <div className="flex gap-4">
                      {[{ icon: Train, label: 'Metro', val: t.metro }, { icon: Bus, label: 'Bus', val: t.bus }, { icon: Footprints, label: 'Caminando', val: t.walk }].map(({ icon: I, label, val }) => (
                        <div key={label} className="flex items-center gap-1.5">
                          <I size={12} style={{ color: T.textMuted }} />
                          <span style={{ color: val === '—' ? T.textSubtle : T.text, fontSize: '12px' }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Calendar section */}
        {activeSection === 'calendar' && (
          <div className="space-y-3">
            {calendarEvents.map(({ date, title, type }) => {
              const c = typeColors[type as keyof typeof typeColors];
              return (
                <div key={title} className="flex items-center gap-4 p-4 rounded-xl transition-all"
                  style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; }}>
                  <div className="w-16 text-center px-2 py-1 rounded-lg flex-shrink-0"
                    style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                    <span style={{ color: c.text, fontSize: '12px', fontWeight: 700 }}>{date}</span>
                  </div>
                  <p style={{ color: T.text, fontSize: '14px', fontWeight: 500 }}>{title}</p>
                  <div className="ml-auto w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.text }} />
                </div>
              );
            })}
          </div>
        )}

        {/* Welfare section */}
        {activeSection === 'welfare' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {welfareInfo.map(({ title, desc, color }) => {
              const accentMap: Record<string, typeof T.accentGreen> = {
                '#FBBF24': T.accentYellow, '#F472B6': T.accentPink,
                '#34D399': T.accentGreen, '#818CF8': T.accentIndigo,
              };
              const accent = accentMap[color] || T.accentIndigo;
              return (
                <div key={title} className="p-5 rounded-2xl" style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}>
                  <div className="w-2 h-6 rounded-full mb-3" style={{ background: accent.color }} />
                  <h3 style={{ color: T.text, fontWeight: 600, fontSize: '15px', marginBottom: '8px' }}>{title}</h3>
                  <p style={{ color: T.textMuted, fontSize: '13px', lineHeight: 1.6 }}>{desc}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* SGA section */}
        {activeSection === 'sga' && (
          <div className="space-y-4">
            {sgaSteps.map(({ n, title, desc }) => (
              <div key={n} className="flex gap-4 p-5 rounded-2xl" style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: T.primaryBg, border: `1px solid ${T.primaryBorder}` }}>
                  <span style={{ color: T.primary, fontWeight: 800, fontSize: '14px', fontFamily: 'JetBrains Mono, monospace' }}>{n}</span>
                </div>
                <div>
                  <h3 style={{ color: T.text, fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{title}</h3>
                  <p style={{ color: T.textMuted, fontSize: '13px', lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
            <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: T.warning.bg, border: `1px solid ${T.warning.border}` }}>
              <Clock size={16} style={{ color: T.warning.text, flexShrink: 0, marginTop: '2px' }} />
              <p style={{ color: T.warning.text, fontSize: '13px', lineHeight: 1.6 }}>
                Recuerda realizar la inscripción en las fechas habilitadas. El sistema cierra puntualmente.
              </p>
            </div>
          </div>
        )}

        {/* Notices section */}
        {activeSection === 'notices' && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: T.accentPink.bg, border: `1px solid ${T.accentPink.border}` }}>
              <Megaphone size={24} style={{ color: T.accentPink.color }} />
            </div>
            <p style={{ color: T.text, fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Sin avisos recientes</p>
            <p style={{ color: T.textMuted, fontSize: '14px', textAlign: 'center', maxWidth: '300px' }}>
              Los comunicados y asambleas estudiantiles aparecerán aquí cuando estén disponibles.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}