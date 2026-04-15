import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { useThemeTokens } from '../context/useThemeTokens';
import { pensumSistemas, getTotalCreditos, getTotalCreditosPensum, getMateriasBySemestre, canTakeMateria, MateriasPensum } from '../data/pensumData';
import { materiasData } from '../data/materiasData';
import { BookOpen, Calendar, CheckCircle, Lock, Trash2, Edit, Eye, Award, TrendingUp } from 'lucide-react';
import { Modal, ConfirmModal } from '../components/Modal';
import ScheduleViewer from '../components/ScheduleViewer';

const getCourseColor = (materia: MateriasPensum): string => {
  if (materia.tipo === 'electiva') return '#9333EA';
  if (materia.tipo === 'libre') return '#EA580C';
  const n = materia.nombre.toLowerCase();
  if (n.includes('cálculo') || n.includes('integral') || n.includes('ecuacion') ||
      n.includes('probabilidad') || n.includes('numérico') || n.includes('física') ||
      n.includes('discreta') || n.includes('álgebra'))
    return '#16A34A';
  if (n.includes('programación') || n.includes('estructuras') || n.includes('algoritmos') ||
      n.includes('computación') || n.includes('compiladores') || n.includes('inteligencia') ||
      n.includes('bases de datos'))
    return '#1D4ED8';
  if (n.includes('humanidades'))
    return '#BE123C';
  if (n.includes('trabajo de grado') || n.includes('práctica'))
    return '#92400E';
  return '#6366F1';
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUser } = useAuth();
  const T = useThemeTokens();
  const [activeTab, setActiveTab] = useState<'pensum' | 'horarios'>('pensum');
  const [scheduleViewerOpen, setScheduleViewerOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const totalCreditosPensum = getTotalCreditosPensum();
  const creditosAprobados = getTotalCreditos(user.materiasVistas || []);
  const porcentajeAvance = Math.round((creditosAprobados / totalCreditosPensum) * 100);

  const initials = user.nombre
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase();

  const toggleMateriaVista = (codigo: string) => {
    const materiasVistas = user.materiasVistas || [];
    const newMateriasVistas = materiasVistas.includes(codigo)
      ? materiasVistas.filter((c: string) => c !== codigo)
      : [...materiasVistas, codigo];
    updateUser({ materiasVistas: newMateriasVistas });
  };

  const deleteHorario = (id: string) => {
    const newHorarios = user.horariosGuardados?.filter((h: any) => h.id !== id) || [];
    updateUser({ horariosGuardados: newHorarios });
    setDeleteConfirmOpen(false);
    setScheduleToDelete(null);
  };

  const viewSchedule = (horario: any) => {
    setSelectedSchedule(horario);
    setScheduleViewerOpen(true);
  };

  const editSchedule = (horario: any) => {
    navigate('/planner', { state: { editSchedule: horario } });
  };

  const tabs = [
    { key: 'pensum', label: 'Mi Pensum', icon: BookOpen, count: null },
    { key: 'horarios', label: 'Horarios guardados', icon: Calendar, count: user.horariosGuardados?.length || 0 },
  ] as const;

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        {/* Profile Card */}
        <div className="p-6 rounded-2xl mb-6"
          style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}>
          <div className="flex items-start gap-5 flex-wrap">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', boxShadow: T.isDark ? '0 4px 20px rgba(99,102,241,0.4)' : '0 2px 12px rgba(79,70,229,0.2)', fontSize: '22px', fontWeight: 700, color: 'white' }}>
              {initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 style={{ color: T.text, fontWeight: 700, fontSize: '22px', letterSpacing: '-0.02em', marginBottom: '6px' }}>{user.nombre}</h1>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 rounded-full"
                  style={{ background: T.accentIndigo.bg, border: `1px solid ${T.accentIndigo.border}`, color: T.accentIndigo.color, fontSize: '12px', fontWeight: 500 }}>
                  {user.correo}
                </span>
                <span className="px-3 py-1 rounded-full font-mono-num"
                  style={{ background: T.accentRed.bg, border: `1px solid ${T.accentRed.border}`, color: T.accentRed.color, fontSize: '12px', fontWeight: 500, fontFamily: 'JetBrains Mono, monospace' }}>
                  {user.codigo}
                </span>
                <span className="px-3 py-1 rounded-full"
                  style={{ background: T.accentGreen.bg, border: `1px solid ${T.accentGreen.border}`, color: T.accentGreen.color, fontSize: '12px', fontWeight: 500 }}>
                  Ing. de Sistemas
                </span>
              </div>
            </div>

            {/* Progress */}
            <div className="p-4 rounded-2xl min-w-[180px]"
              style={{ background: T.cardBg2, border: `1px solid ${T.cardBorder}` }}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} style={{ color: T.primary }} />
                <span style={{ color: T.textMuted, fontSize: '12px', fontWeight: 500 }}>Progreso académico</span>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className="font-mono-num" style={{ color: T.text, fontSize: '28px', fontWeight: 800, lineHeight: 1, fontFamily: 'JetBrains Mono, monospace' }}>{porcentajeAvance}%</span>
                <span style={{ color: T.textMuted, fontSize: '12px', marginBottom: '4px' }}>{creditosAprobados}/{totalCreditosPensum} cr.</span>
              </div>
              <div className="w-full rounded-full overflow-hidden" style={{ height: '6px', background: T.divider }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${porcentajeAvance}%`, background: 'linear-gradient(90deg, #C9344C, #6366F1)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: T.cardBg2, border: `1px solid ${T.cardBorder}`, width: 'fit-content' }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
              style={{
                background: activeTab === tab.key ? (T.isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF') : 'transparent',
                color: activeTab === tab.key ? T.text : T.textMuted,
                border: activeTab === tab.key ? `1px solid ${T.cardBorder}` : '1px solid transparent',
                boxShadow: activeTab === tab.key ? T.cardShadow : 'none',
                cursor: 'pointer', fontSize: '14px', fontWeight: activeTab === tab.key ? 600 : 500,
              }}>
              <tab.icon size={15} />
              {tab.label}
              {tab.count !== null && (
                <span className="px-1.5 py-0.5 rounded-full"
                  style={{ background: T.primaryBg, color: T.primary, fontSize: '10px', fontWeight: 700, border: `1px solid ${T.primaryBorder}` }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Pensum Tab */}
        {activeTab === 'pensum' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 style={{ color: T.text, fontWeight: 700, fontSize: '18px' }}>Pensum — Ing. de Sistemas</h2>
                <p style={{ color: T.textMuted, fontSize: '13px', marginTop: '2px' }}>Haz clic en una materia para marcarla como vista</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Award size={14} style={{ color: T.accentGreen.color }} />
                  <span style={{ color: T.textMuted, fontSize: '12px' }}>{creditosAprobados} cr. aprobados</span>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-5 p-3 rounded-xl" style={{ background: T.cardBg2, border: `1px solid ${T.cardBorder}` }}>
              {[
                { color: T.accentGreen.color, bg: T.accentGreen.bg, label: 'Vista / Aprobada' },
                { color: T.primary, bg: T.primaryBg, label: 'Disponible' },
                { color: T.textSubtle, bg: T.cardBg2, label: 'Bloqueada (prerreq.)' },
              ].map(({ color, bg, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ background: bg, border: `1.5px solid ${color}` }} />
                  <span style={{ color: T.textMuted, fontSize: '11px' }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Pensum grid */}
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-3 min-w-max">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(semestre => {
                  const materias = getMateriasBySemestre(semestre);
                  return (
                    <div key={semestre} className="flex flex-col gap-2" style={{ width: '160px' }}>
                      <div className="px-3 py-2 rounded-xl text-center"
                        style={{ background: T.primaryBg, border: `1px solid ${T.primaryBorder}` }}>
                        <span style={{ color: T.primary, fontSize: '11px', fontWeight: 700 }}>Semestre {semestre}</span>
                      </div>
                      {materias.map(materia => {
                        const vista = (user.materiasVistas || []).includes(materia.codigo);
                        const disponible = canTakeMateria(materia, user.materiasVistas || []);
                        const color = getCourseColor(materia);
                        return (
                          <div key={materia.codigo}
                            onClick={() => disponible && toggleMateriaVista(materia.codigo)}
                            className="p-2.5 rounded-xl transition-all duration-200 relative"
                            style={{
                              background: vista ? T.accentGreen.bg : disponible ? T.cardBg : T.pensumCellLocked,
                              border: `1.5px solid ${vista ? T.accentGreen.color : disponible ? color : T.pensumCellLockedBorder}`,
                              cursor: disponible ? 'pointer' : 'not-allowed',
                              opacity: !disponible && !vista ? 0.6 : 1,
                              boxShadow: T.cardShadow,
                            }}
                            onMouseEnter={e => { if (disponible) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = T.cardHoverShadow; } }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = T.cardShadow; }}>
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <span className="font-mono-num" style={{ color: vista ? T.accentGreen.color : disponible ? color : T.textSubtle, fontSize: '9px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                                {materia.codigo}
                              </span>
                              {vista ? <CheckCircle size={12} style={{ color: T.accentGreen.color, flexShrink: 0 }} /> : !disponible ? <Lock size={11} style={{ color: T.textSubtle, flexShrink: 0 }} /> : null}
                            </div>
                            <p style={{ color: vista ? T.accentGreen.color : disponible ? T.text : T.textSubtle, fontSize: '11px', fontWeight: 600, lineHeight: 1.3 }}>
                              {materia.nombre}
                            </p>
                            <p style={{ color: T.textSubtle, fontSize: '10px', marginTop: '4px' }}>{materia.creditos} cr.</p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Horarios Tab */}
        {activeTab === 'horarios' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ color: T.text, fontWeight: 700, fontSize: '18px' }}>Horarios guardados</h2>
              <button onClick={() => navigate('/planner')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
                style={{ background: '#C9344C', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                onMouseEnter={e => e.currentTarget.style.background = '#A02438'}
                onMouseLeave={e => e.currentTarget.style.background = '#C9344C'}>
                + Crear nuevo
              </button>
            </div>

            {(!user.horariosGuardados || user.horariosGuardados.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-20 rounded-2xl"
                style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: T.cardBg2, border: `1px solid ${T.cardBorder}` }}>
                  <Calendar size={24} style={{ color: T.textMuted }} />
                </div>
                <p style={{ color: T.textMuted, fontSize: '15px', fontWeight: 500, marginBottom: '8px' }}>No tienes horarios guardados</p>
                <p style={{ color: T.textSubtle, fontSize: '13px', marginBottom: '16px', textAlign: 'center', maxWidth: '300px' }}>
                  Crea tu primer horario en el planeador y guárdalo aquí para consultarlo cuando quieras.
                </p>
                <button onClick={() => navigate('/planner')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl"
                  style={{ background: '#C9344C', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#A02438'}
                  onMouseLeave={e => e.currentTarget.style.background = '#C9344C'}>
                  Ir al planeador
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.horariosGuardados.map((horario: any) => (
                  <div key={horario.id} className="p-5 rounded-2xl transition-all"
                    style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = T.cardHoverShadow; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = T.cardShadow; e.currentTarget.style.transform = 'translateY(0)'; }}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 style={{ color: T.text, fontWeight: 600, fontSize: '15px' }}>{horario.nombre}</h3>
                        <p style={{ color: T.textMuted, fontSize: '12px', marginTop: '2px' }}>
                          {horario.materias?.length || 0} materias · {horario.materias?.reduce((s: number, m: any) => s + (m.creditos || 0), 0)} créditos
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => viewSchedule(horario)} title="Ver horario"
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                          style={{ background: T.secondaryBg, border: `1px solid ${T.secondaryBorder}`, color: T.secondary, cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                          <Eye size={14} />
                        </button>
                        <button onClick={() => editSchedule(horario)} title="Editar"
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                          style={{ background: T.accentYellow.bg, border: `1px solid ${T.accentYellow.border}`, color: T.accentYellow.color, cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                          <Edit size={14} />
                        </button>
                        <button onClick={() => { setScheduleToDelete(horario.id); setDeleteConfirmOpen(true); }} title="Eliminar"
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                          style={{ background: T.error.bg, border: `1px solid ${T.error.border}`, color: T.error.text, cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Mini materia list */}
                    <div className="flex flex-wrap gap-1.5">
                      {(horario.materias || []).slice(0, 5).map((m: any) => (
                        <span key={m.codigo} className="px-2 py-0.5 rounded-lg"
                          style={{ background: m.customHex ? `${m.customHex}18` : T.primaryBg, color: m.customHex || T.primary, fontSize: '10px', fontWeight: 600, border: `1px solid ${m.customHex ? `${m.customHex}30` : T.primaryBorder}` }}>
                          {m.nombre?.split(' ').slice(0, 2).join(' ')}
                        </span>
                      ))}
                      {horario.materias?.length > 5 && (
                        <span className="px-2 py-0.5 rounded-lg"
                          style={{ background: T.tagBg, color: T.tagColor, fontSize: '10px', fontWeight: 600, border: `1px solid ${T.tagBorder}` }}>
                          +{horario.materias.length - 5}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => scheduleToDelete && deleteHorario(scheduleToDelete)}
        title="Eliminar horario" message="¿Estás seguro de que deseas eliminar este horario? Esta acción no se puede deshacer."
        confirmText="Eliminar" cancelText="Cancelar" type="danger" />

      <Modal isOpen={scheduleViewerOpen} onClose={() => setScheduleViewerOpen(false)} title="Ver horario" size="lg">
        {selectedSchedule && <ScheduleViewer schedule={selectedSchedule} />}
      </Modal>
    </AppLayout>
  );
}