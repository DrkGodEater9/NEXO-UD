import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { useThemeTokens } from '../context/useThemeTokens';
import {
  Calendar, BookOpen, Clock, MapPin, ArrowRight,
  TrendingUp, Zap, Heart, Coffee, GraduationCap
} from 'lucide-react';

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  const firstName = name.split(' ')[0];
  if (hour < 12) return `Buenos días, ${firstName}`;
  if (hour < 19) return `Buenas tardes, ${firstName}`;
  return `Buenas noches, ${firstName}`;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const T = useThemeTokens();

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated || !user) return null;

  const totalHorarios = user.horariosGuardados?.length || 0;
  const totalVistas = user.materiasVistas?.length || 0;
  const activeSchedule = user.horariosGuardados?.[0] || null;

  const welfareNotices = [
    { icon: Coffee, title: 'Apoyo alimentario 2026-1', desc: 'Los subsidios de restaurante están disponibles. Inscríbete en Bienestar Institucional.', date: '15 mar', accent: T.accentYellow },
    { icon: Heart, title: 'Salud mental — Orientación gratis', desc: 'Sesiones de orientación psicológica individual. Agenda tu cita en el portal de bienestar.', date: '18 mar', accent: T.accentPink },
    { icon: GraduationCap, title: 'Becas de excelencia 2026', desc: 'Convocatoria abierta hasta el 30 de abril. Promedio mínimo 3.8.', date: '30 abr', accent: T.accentGreen },
  ];

  const summaryCards = [
    {
      icon: Calendar,
      label: 'Horarios guardados',
      value: `${totalHorarios} / 5`,
      sub: 'slots disponibles',
      accent: T.accentRed,
      onClick: () => navigate('/profile'),
    },
    {
      icon: BookOpen,
      label: 'Materias cursadas',
      value: `${totalVistas}`,
      sub: 'marcadas en pensum',
      accent: T.accentIndigo,
      onClick: () => navigate('/profile'),
    },
    {
      icon: Clock,
      label: 'Próximo evento',
      value: '15 abr',
      sub: 'Inicio inscripciones 2026-1',
      accent: T.accentGreen,
      onClick: () => navigate('/info'),
    },
    {
      icon: MapPin,
      label: 'Sedes activas',
      value: '5',
      sub: 'sedes en Bogotá',
      accent: T.accentYellow,
      onClick: () => navigate('/info'),
    },
  ];

  const quickActions = [
    { label: 'Buscar materias', path: '/search', accent: T.accentIndigo, icon: BookOpen },
    { label: 'Abrir planeador', path: '/planner', accent: T.accentRed, icon: Calendar },
    { label: 'Ver mi pensum', path: '/profile', accent: T.accentGreen, icon: TrendingUp },
    { label: 'Info de campus', path: '/info', accent: T.accentYellow, icon: MapPin },
  ];

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        {/* Greeting */}
        <div className="mb-8">
          <h1
            className="mb-1"
            style={{ color: T.text, fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.02em' }}
          >
            {getGreeting(user.nickname)} 👋
          </h1>
          <p style={{ color: T.textMuted, fontSize: '15px' }}>
            Tu resumen académico de hoy, {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {summaryCards.map(({ icon: Icon, label, value, sub, accent, onClick }) => (
            <div
              key={label}
              onClick={onClick}
              className="p-5 rounded-2xl cursor-pointer transition-all duration-200"
              style={{ background: accent.bg, border: `1px solid ${accent.border}`, boxShadow: T.cardShadow }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = T.cardHoverShadow; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = T.cardShadow; }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: T.isDark ? `${accent.color}22` : 'rgba(255,255,255,0.7)', border: `1px solid ${accent.border}` }}
              >
                <Icon size={18} style={{ color: accent.color }} />
              </div>
              <p style={{ color: T.textMuted, fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>{label}</p>
              <p
                className="font-mono-num"
                style={{ color: T.text, fontWeight: 700, fontSize: '22px', lineHeight: 1.2, fontFamily: 'JetBrains Mono, monospace' }}
              >
                {value}
              </p>
              <p style={{ color: accent.color, fontSize: '11px', marginTop: '2px' }}>{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Active Schedule Preview */}
          <div
            className="lg:col-span-2 p-6 rounded-2xl"
            style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} style={{ color: T.secondary }} />
                <h2 style={{ color: T.text, fontWeight: 600, fontSize: '16px' }}>Horario activo</h2>
              </div>
              <button
                onClick={() => navigate('/planner')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                style={{ background: '#C9344C', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                onMouseEnter={e => e.currentTarget.style.background = '#A02438'}
                onMouseLeave={e => e.currentTarget.style.background = '#C9344C'}
              >
                <Zap size={12} /> Ir al Planeador
              </button>
            </div>

            {activeSchedule ? (
              <div>
                <p style={{ color: T.secondary, fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>{activeSchedule.nombre}</p>
                <div className="space-y-2">
                  {activeSchedule.materias.slice(0, 4).map((materia: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: T.cardBg2, border: `1px solid ${T.divider}` }}
                    >
                      <div
                        className="w-2 h-8 rounded-full flex-shrink-0"
                        style={{ background: materia.customHex || T.secondary }}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          style={{ color: T.text, fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {materia.nombre}
                        </p>
                        <p style={{ color: T.textMuted, fontSize: '11px' }}>
                          Grupo {materia.grupo} · {materia.docente}
                        </p>
                      </div>
                    </div>
                  ))}
                  {activeSchedule.materias.length > 4 && (
                    <p style={{ color: T.textMuted, fontSize: '12px', textAlign: 'center', paddingTop: '4px' }}>
                      +{activeSchedule.materias.length - 4} materias más
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: T.cardBg2, border: `1px solid ${T.cardBorder}` }}
                >
                  <Calendar size={24} style={{ color: T.textMuted }} />
                </div>
                <p style={{ color: T.textMuted, fontSize: '14px', marginBottom: '12px', textAlign: 'center' }}>
                  Aún no tienes horarios guardados
                </p>
                <button
                  onClick={() => navigate('/planner')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
                  style={{ background: '#C9344C', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#A02438'}
                  onMouseLeave={e => e.currentTarget.style.background = '#C9344C'}
                >
                  Crear mi primer horario <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div
            className="p-6 rounded-2xl"
            style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}
          >
            <h2 className="mb-5" style={{ color: T.text, fontWeight: 600, fontSize: '16px' }}>
              Acciones rápidas
            </h2>
            <div className="space-y-2">
              {quickActions.map(({ label, path, accent, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl transition-all"
                  style={{ background: T.actionBg, border: `1px solid ${T.actionBorder}`, color: T.actionText, cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = T.actionHoverBg;
                    e.currentTarget.style.borderColor = accent.border;
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = T.actionBg;
                    e.currentTarget.style.borderColor = T.actionBorder;
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: accent.bg }}
                  >
                    <Icon size={15} style={{ color: accent.color }} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>{label}</span>
                  <ArrowRight size={14} style={{ color: T.actionArrow, marginLeft: 'auto' }} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Welfare Notices */}
        <div
          className="p-6 rounded-2xl"
          style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 style={{ color: T.text, fontWeight: 600, fontSize: '16px' }}>
              Avisos de bienestar
            </h2>
            <button
              onClick={() => navigate('/info')}
              style={{ color: T.link, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
            >
              Ver todos
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {welfareNotices.map(({ icon: Icon, title, desc, date, accent }) => (
              <div
                key={title}
                className="p-4 rounded-xl transition-all"
                style={{ background: accent.bg, border: `1px solid ${accent.border}` }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div className="flex items-start justify-between mb-2">
                  <Icon size={18} style={{ color: accent.color }} />
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{ background: T.isDark ? `${accent.color}18` : 'rgba(255,255,255,0.7)', color: accent.color, fontSize: '10px', fontWeight: 600, border: `1px solid ${accent.border}` }}
                  >
                    {date}
                  </span>
                </div>
                <h3 style={{ color: T.text, fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>{title}</h3>
                <p style={{ color: T.textMuted, fontSize: '12px', lineHeight: 1.5 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}