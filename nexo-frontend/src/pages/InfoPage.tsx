import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { useThemeTokens } from '../context/useThemeTokens';
import {
  MapPin, Calendar, Heart, BookOpen, Megaphone, ChevronRight,
  Clock, ArrowLeft, Loader2, ExternalLink
} from 'lucide-react';

import {
  campusApi, CampusData,
  welfareApi, WelfareData,
  announcementsApi, AnnouncementData,
  calendarApi, CalendarEventData, CalendarEventType,
} from '../services/api';
import CampusMap from '../components/CampusMap';

const CALENDAR_TYPE_TO_DISPLAY: Record<CalendarEventType, { label: string; type: 'primary' | 'danger' | 'success' | 'warning' }> = {
  INSCRIPCION:   { label: 'Inscripción',       type: 'primary' },
  INICIO_CLASES: { label: 'Inicio de clases',  type: 'success' },
  FIN_CLASES:    { label: 'Fin de clases',     type: 'danger' },
  PARCIAL:       { label: 'Parcial',           type: 'primary' },
  FESTIVO:       { label: 'Festivo',           type: 'warning' },
  PARO:          { label: 'Paro',              type: 'warning' },
  OTRO:          { label: 'Otro',              type: 'primary' },
};

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
  const { isAuthenticated, isRestoring } = useAuth();
  const T = useThemeTokens();
  const [activeSection, setActiveSection] = useState<Section>(null);

  // ── API State ──────────────────────────────────────────────────────────────
  const [campusList, setCampusList] = useState<CampusData[]>([]);
  const [campusLoading, setCampusLoading] = useState(false);
  const [selectedCampusId, setSelectedCampusId] = useState<number | null>(null);

  const [welfareList, setWelfareList] = useState<WelfareData[]>([]);
  const [welfareLoading, setWelfareLoading] = useState(false);

  const [announcementsList, setAnnouncementsList] = useState<AnnouncementData[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);

  const [calendarList, setCalendarList] = useState<CalendarEventData[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

  useEffect(() => {
    if (isRestoring) return;
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, isRestoring, navigate]);

  // ── Fetch data when a section opens ─────────────────────────────────────────
  const fetchCampus = useCallback(async () => {
    setCampusLoading(true);
    try {
      const data = await campusApi.list();
      setCampusList(data);
    } catch { /* silent */ }
    finally { setCampusLoading(false); }
  }, []);

  const fetchWelfare = useCallback(async () => {
    setWelfareLoading(true);
    try {
      const data = await welfareApi.list();
      setWelfareList(data);
    } catch { /* silent */ }
    finally { setWelfareLoading(false); }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    setAnnouncementsLoading(true);
    try {
      const data = await announcementsApi.list();
      setAnnouncementsList(data);
    } catch { /* silent */ }
    finally { setAnnouncementsLoading(false); }
  }, []);

  const fetchCalendar = useCallback(async () => {
    setCalendarLoading(true);
    try {
      const data = await calendarApi.list();
      setCalendarList(data);
    } catch { /* silent */ }
    finally { setCalendarLoading(false); }
  }, []);

  useEffect(() => {
    if (activeSection === 'campus' && campusList.length === 0) fetchCampus();
    if (activeSection === 'welfare' && welfareList.length === 0) fetchWelfare();
    if (activeSection === 'notices' && announcementsList.length === 0) fetchAnnouncements();
    if (activeSection === 'calendar' && calendarList.length === 0) fetchCalendar();
  }, [activeSection, campusList.length, welfareList.length, announcementsList.length, calendarList.length, fetchCampus, fetchWelfare, fetchAnnouncements, fetchCalendar]);

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

  const welfareCategoryLabel: Record<string, string> = {
    APOYO_ALIMENTARIO: 'Apoyo alimentario',
    BECAS: 'Becas',
    SALUD_MENTAL: 'Salud mental',
    SERVICIOS_SALUD: 'Servicios de salud',
  };

  const welfareCategoryAccent: Record<string, { color: string; bg: string; border: string }> = {
    APOYO_ALIMENTARIO: T.accentYellow,
    BECAS: T.accentGreen,
    SALUD_MENTAL: T.accentPink,
    SERVICIOS_SALUD: T.accentCyan,
  };

  const announcementTypeLabel: Record<string, string> = {
    GENERAL: 'General',
    ASAMBLEA: 'Asamblea',
  };

  // ── Loading Spinner ─────────────────────────────────────────────────────────
  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 size={28} className="animate-spin" style={{ color: T.textMuted }} />
      <p style={{ color: T.textMuted, fontSize: '13px', marginTop: '12px' }}>Cargando...</p>
    </div>
  );

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

        {/* ══════════════ Campus section — mapa + tarjetas ══════════════ */}
        {activeSection === 'campus' && (
          <div>
            {campusLoading ? <LoadingSpinner /> : campusList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: T.accentRed.bg, border: `1px solid ${T.accentRed.border}` }}>
                  <MapPin size={24} style={{ color: T.accentRed.color }} />
                </div>
                <p style={{ color: T.text, fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No hay sedes registradas</p>
                <p style={{ color: T.textMuted, fontSize: '14px', textAlign: 'center', maxWidth: '300px' }}>
                  Las sedes y campus aparecerán aquí cuando un radicador las registre.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {/* Mapa */}
                <div className="rounded-2xl overflow-hidden"
                  style={{ height: '420px', border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow, position: 'relative' }}>
                  <CampusMap
                    campusList={campusList}
                    selectedId={selectedCampusId}
                    onSelect={id => setSelectedCampusId(prev => prev === id ? null : id)}
                    isDark={T.isDark}
                  />
                </div>

                {/* Tarjetas de sedes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {campusList.map(campus => {
                    const colorPalette = ['#E8485F', '#818CF8', '#34D399', '#FBBF24', '#F472B6', '#22D3EE', '#A78BFA', '#FB923C', '#2DD4BF', '#E879F9'];
                    const campusColor = colorPalette[campus.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colorPalette.length];
                    const isSelected = selectedCampusId === campus.id;

                    return (
                      <div key={campus.id}
                        onClick={() => setSelectedCampusId(prev => prev === campus.id ? null : campus.id)}
                        className="p-4 rounded-2xl cursor-pointer transition-all"
                        style={{
                          background: isSelected ? `color-mix(in srgb, ${campusColor} 12%, ${T.cardBg})` : T.cardBg,
                          border: `1.5px solid ${isSelected ? campusColor + '88' : T.cardBorder}`,
                          boxShadow: isSelected ? `0 0 0 1px ${campusColor}33, ${T.cardShadow}` : T.cardShadow,
                        }}
                        onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = T.cardHoverShadow; } }}
                        onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = T.cardShadow; } }}>
                        <div className="flex items-center gap-2 mb-2">
                          <div style={{
                            width: '10px', height: '10px', borderRadius: '50%',
                            background: campusColor,
                            boxShadow: isSelected ? `0 0 8px ${campusColor}` : 'none',
                            flexShrink: 0,
                          }} />
                          <h3 style={{ color: T.text, fontWeight: 600, fontSize: '13px', lineHeight: 1.4 }}>{campus.name}</h3>
                        </div>
                        {campus.address && (
                          <div className="flex items-start gap-1.5 mb-2">
                            <MapPin size={11} style={{ color: T.textMuted, marginTop: '2px', flexShrink: 0 }} />
                            <p style={{ color: T.textMuted, fontSize: '11px', lineHeight: 1.5 }}>{campus.address}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          <span className="px-2 py-0.5 rounded-full"
                            style={{ background: `${campusColor}18`, color: campusColor, fontSize: '10px', fontWeight: 600, border: `1px solid ${campusColor}33` }}>
                            {campus.faculty}
                          </span>
                          {campus.classrooms && campus.classrooms.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full"
                              style={{ background: T.accentGreen.bg, color: T.accentGreen.color, fontSize: '10px', fontWeight: 600, border: `1px solid ${T.accentGreen.border}` }}>
                              {campus.classrooms.length} salón{campus.classrooms.length !== 1 ? 'es' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Calendar section — API-driven */}
        {activeSection === 'calendar' && (
          <div>
            {calendarLoading ? <LoadingSpinner /> : calendarList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: T.accentIndigo.bg, border: `1px solid ${T.accentIndigo.border}` }}>
                  <Calendar size={24} style={{ color: T.accentIndigo.color }} />
                </div>
                <p style={{ color: T.text, fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Sin eventos registrados</p>
                <p style={{ color: T.textMuted, fontSize: '14px', textAlign: 'center', maxWidth: '300px' }}>
                  Los eventos del calendario académico aparecerán aquí cuando un radicador los registre.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...calendarList].sort((a, b) => a.startDate.localeCompare(b.startDate)).map(event => {
                  const display = CALENDAR_TYPE_TO_DISPLAY[event.eventType] ?? CALENDAR_TYPE_TO_DISPLAY.OTRO;
                  const c = typeColors[display.type];
                  const dateObj = new Date(event.startDate + 'T00:00:00');
                  const dateLabel = dateObj.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
                  return (
                    <div key={event.id} className="flex items-center gap-4 p-4 rounded-xl transition-all"
                      style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; }}>
                      <div className="w-16 text-center px-2 py-1 rounded-lg flex-shrink-0"
                        style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                        <span style={{ color: c.text, fontSize: '12px', fontWeight: 700 }}>{dateLabel}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ color: T.text, fontSize: '14px', fontWeight: 500 }}>{event.title}</p>
                        <span style={{ color: c.text, fontSize: '11px', fontWeight: 600 }}>{display.label}</span>
                      </div>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.text }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ Welfare section — from API ══════════════ */}
        {activeSection === 'welfare' && (
          <div>
            {welfareLoading ? <LoadingSpinner /> : welfareList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: T.accentGreen.bg, border: `1px solid ${T.accentGreen.border}` }}>
                  <Heart size={24} style={{ color: T.accentGreen.color }} />
                </div>
                <p style={{ color: T.text, fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Sin información de bienestar</p>
                <p style={{ color: T.textMuted, fontSize: '14px', textAlign: 'center', maxWidth: '340px' }}>
                  La información de bienestar institucional aparecerá aquí cuando un radicador la registre.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {welfareList.map(item => {
                  const accent = welfareCategoryAccent[item.category] || T.accentIndigo;
                  const label = welfareCategoryLabel[item.category] || item.category;
                  return (
                    <div key={item.id} className="rounded-2xl overflow-hidden transition-all"
                      style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = T.cardHoverShadow; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = T.cardShadow; }}>
                      {(() => { try { const imgs: string[] = item.images ? JSON.parse(item.images) : []; return imgs.length > 0 ? <InfoMosaic photos={imgs} /> : null; } catch { return null; } })()}
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-6 rounded-full" style={{ background: accent.color }} />
                            <span className="px-2 py-0.5 rounded-full"
                              style={{ background: T.isDark ? `${accent.color}18` : accent.bg, color: accent.color, fontSize: '10px', fontWeight: 600, border: `1px solid ${accent.border}` }}>
                              {label}
                            </span>
                          </div>
                          <span style={{ color: T.textSubtle, fontSize: '10px' }}>
                            {new Date(item.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <h3 style={{ color: T.text, fontWeight: 600, fontSize: '15px', marginBottom: '8px' }}>{item.title}</h3>
                        <p style={{ color: T.textMuted, fontSize: '13px', lineHeight: 1.6 }}>{item.description}</p>
                        {item.links && (
                          <a href={item.links} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 mt-3"
                            style={{ color: T.link, fontSize: '12px', fontWeight: 500, textDecoration: 'none' }}>
                            <ExternalLink size={11} /> Más información
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

        {/* ══════════════ Notices section — from API ══════════════ */}
        {activeSection === 'notices' && (
          <div>
            {announcementsLoading ? <LoadingSpinner /> : announcementsList.length === 0 ? (
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
            ) : (
              <div className="space-y-4">
                {announcementsList.map(item => {
                  const accent = item.type === 'ASAMBLEA' ? T.accentYellow : T.accentCyan;
                  const typeLabel = announcementTypeLabel[item.type] || item.type;
                  return (
                    <div key={item.id} className="rounded-2xl overflow-hidden transition-all"
                      style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = T.cardHoverShadow; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = T.cardShadow; }}>
                      {(() => { try { const imgs: string[] = item.images ? JSON.parse(item.images) : []; return imgs.length > 0 ? <InfoMosaic photos={imgs} /> : null; } catch { return null; } })()}
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full"
                              style={{ background: T.isDark ? `${accent.color}18` : accent.bg, color: accent.color, fontSize: '10px', fontWeight: 600, border: `1px solid ${accent.border}` }}>
                              {typeLabel}
                            </span>
                            {item.scope === 'FACULTAD' && item.faculty && (
                              <span className="px-2 py-0.5 rounded-full"
                                style={{ background: T.cardBg2, color: T.textMuted, fontSize: '10px', fontWeight: 500, border: `1px solid ${T.divider}` }}>
                                {item.faculty}
                              </span>
                            )}
                          </div>
                          <span style={{ color: T.textSubtle, fontSize: '10px' }}>
                            {new Date(item.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <h3 style={{ color: T.text, fontWeight: 600, fontSize: '15px', marginBottom: '8px' }}>{item.title}</h3>
                        <p style={{ color: T.textMuted, fontSize: '13px', lineHeight: 1.6 }}>{item.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function InfoMosaic({ photos }: { photos: string[] }) {
  if (photos.length === 1) {
    return <div style={{ aspectRatio: '16/7' }}><img src={photos[0]} alt="" className="w-full h-full object-cover" /></div>;
  }
  if (photos.length === 2) {
    return (
      <div className="flex" style={{ aspectRatio: '16/7' }}>
        {photos.map((src, i) => (
          <div key={i} className="flex-1" style={{ borderRight: i === 0 ? '2px solid white' : undefined }}>
            <img src={src} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex" style={{ aspectRatio: '16/7' }}>
      <div style={{ flex: '0 0 60%', borderRight: '2px solid white' }}>
        <img src={photos[0]} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="flex flex-col flex-1">
        {[1, 2].map(i => (
          <div key={i} className="flex-1" style={{ borderTop: i === 2 ? '2px solid white' : undefined }}>
            <img src={photos[i]} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}