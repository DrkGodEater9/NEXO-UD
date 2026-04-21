import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { useThemeTokens } from '../context/useThemeTokens';
import { scheduleApi, SubjectResponse, SubjectGroupResponse } from '../services/api';
import { PromptModal, AlertModal } from '../components/Modal';
import {
  Search, X, AlertTriangle, Save, Clock, Loader2
} from 'lucide-react';

const diasSemana = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

const COLORS = [
  '#E8485F', '#818CF8', '#34D399', '#FBBF24', '#F472B6',
  '#60A5FA', '#A78BFA', '#FB923C', '#2DD4BF', '#E879F9',
];

interface SelectedGroup {
  nombre: string;
  codigo: string;
  grupo: string; // groupCode
  color: string;
  horarios: { dia: string; horaInicio: number; horaFin: number; ubicacion?: string }[];
}

export default function PlannerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, updateUser } = useAuth();
  const T = useThemeTokens();

  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedFacultad, setSelectedFacultad] = useState('');
  const [selected, setSelected] = useState<SelectedGroup[]>([]);
  const [colorIdx, setColorIdx] = useState(0);
  const [conflictMsg, setConflictMsg] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    scheduleApi.getOfferSubjects()
      .then(res => setSubjects(res || []))
      .catch(err => console.error("Error fetching subjects:", err))
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  // Handle edit schedule from profile page once subjects load
  useEffect(() => {
    if (subjects.length > 0 && location.state?.editSchedule) {
      const editSchedule = location.state.editSchedule;
      if (editSchedule && editSchedule.materias) {
        const reconstructed: SelectedGroup[] = [];
        let ci = 0;
        editSchedule.materias.forEach((saved: any) => {
          const materia = subjects.find(s => s.codigo === saved.codigo);
          if (!materia) return;
          const grupo = materia.grupos?.find((g) => g.grupoCode === saved.grupo);
          if (!grupo) return;
          reconstructed.push({
            nombre: materia.nombre,
            codigo: materia.codigo,
            grupo: grupo.grupoCode,
            color: saved.customHex || saved.color || COLORS[ci % COLORS.length],
            horarios: grupo.horarios,
          });
          ci++;
        });
        setSelected(reconstructed);
        setColorIdx(ci);
      }
    }
  }, [subjects, location.state]);

  const facultades = useMemo(() => Array.from(new Set(subjects.map(s => s.facultad).filter(Boolean))).sort(), [subjects]);

  const searchResults = useMemo(() => {
    const text = searchText.toLowerCase();
    if (!text && !selectedFacultad) return [];
    return subjects
      .filter(m => {
        const matchText = !text || m.nombre.toLowerCase().includes(text) || m.codigo.includes(text);
        const matchFac = !selectedFacultad || m.facultad === selectedFacultad;
        return matchText && matchFac;
      })
      .slice(0, 15);
  }, [subjects, searchText, selectedFacultad]);

  const horasOcupadas: Record<string, { nombre: string; color: string }[]> = {};
  selected.forEach(s => {
    s.horarios.forEach(h => {
      const key = `${h.dia}-${h.horaInicio}`;
      if (!horasOcupadas[key]) horasOcupadas[key] = [];
      horasOcupadas[key].push({ nombre: s.nombre, color: s.color });
    });
  });

  const conflictos = Object.entries(horasOcupadas)
    .filter(([, arr]) => arr.length > 1)
    .map(([key, arr]) => ({ key, materias: arr }));

  const addGroup = (materia: SubjectResponse, grupo: SubjectGroupResponse) => {
    const existing = selected.find(s => s.codigo === materia.codigo);
    if (existing) {
      setConflictMsg(`"${materia.nombre}" ya está en tu horario.`);
      return;
    }
    const color = COLORS[colorIdx % COLORS.length];
    const newItem: SelectedGroup = { nombre: materia.nombre, codigo: materia.codigo, grupo: grupo.grupoCode, color, horarios: grupo.horarios };

    const hasConflict = grupo.horarios.some(h =>
      selected.some(s => s.horarios.some(sh => sh.dia === h.dia && sh.horaInicio < h.horaFin && sh.horaFin > h.horaInicio))
    );
    if (hasConflict) setConflictMsg(`⚠️ Conflicto detectado al agregar "${materia.nombre}"`);
    else setConflictMsg('');

    setSelected(prev => [...prev, newItem]);
    setColorIdx(prev => prev + 1);
    setSearchText('');
    setSelectedFacultad('');
  };

  const removeGroup = (codigo: string) => {
    setSelected(prev => prev.filter(s => s.codigo !== codigo));
    setConflictMsg('');
  };

  const saveSchedule = (name: string) => {
    if (!user) return;
    const horarios = user.horariosGuardados || [];
    if (horarios.length >= 5) {
      setAlertMessage('Solo puedes guardar hasta 5 horarios. Elimina uno desde tu perfil para continuar.');
      setShowAlert(true);
      return;
    }
    const newHorario = {
      id: Date.now().toString(),
      nombre: name,
      semestre: 'Activo', // Would be better to get active semester name, but this works for now
      materias: selected.map(s => {
        const mat = subjects.find(sub => sub.codigo === s.codigo);
        return { 
          ...s, 
          creditos: 0, 
          docente: mat?.grupos?.find(g => g.grupoCode === s.grupo)?.docente || '', 
          customHex: s.color 
        };
      }),
    };
    updateUser({ horariosGuardados: [...horarios, newHorario] });
    setShowAlert(true);
    setAlertMessage(`¡Horario "${name}" guardado correctamente! Puedes verlo en tu perfil.`);
  };

  const HORAS = Array.from({ length: 17 }, (_, i) => i + 6);

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 style={{ color: T.text, fontWeight: 700, fontSize: '22px', letterSpacing: '-0.02em' }}>Planeador de horarios</h1>
            <p style={{ color: T.textMuted, fontSize: '14px', marginTop: '2px' }}>Arma tu horario ideal</p>
          </div>
          <div className="flex items-center gap-3">
            {selected.length > 0 && (
              <button onClick={() => setShowPrompt(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
                style={{ background: '#C9344C', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, boxShadow: T.primaryShadow }}
                onMouseEnter={e => e.currentTarget.style.background = '#A02438'}
                onMouseLeave={e => e.currentTarget.style.background = '#C9344C'}>
                <Save size={14} /> Guardar horario
              </button>
            )}
          </div>
        </div>

        {conflictos.length > 0 && (
          <div className="flex items-start gap-3 p-4 rounded-xl mb-5"
            style={{ background: T.warning.bg, border: `1px solid ${T.warning.border}` }}>
            <AlertTriangle size={16} style={{ color: T.warning.text, flexShrink: 0, marginTop: '1px' }} />
            <div>
              <p style={{ color: T.warning.text, fontSize: '13px', fontWeight: 600 }}>
                {conflictos.length} conflicto{conflictos.length > 1 ? 's' : ''} detectado{conflictos.length > 1 ? 's' : ''}
              </p>
              {conflictos.map(({ key, materias }) => (
                <p key={key} style={{ color: T.warning.text, fontSize: '12px', opacity: 0.85 }}>
                  {materias.map(m => m.nombre).join(' ↔ ')}
                </p>
              ))}
            </div>
          </div>
        )}

        {conflictMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl mb-5 animate-fade-in"
            style={{ background: T.warning.bg, border: `1px solid ${T.warning.border}`, color: T.warning.text, fontSize: '13px', fontWeight: 500 }}>
            <AlertTriangle size={14} />
            {conflictMsg}
            <button onClick={() => setConflictMsg('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: T.warning.text, cursor: 'pointer', padding: '2px' }}>
              <X size={14} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Search panel */}
          <div className="lg:col-span-1">
            <div className="p-4 rounded-2xl mb-4 flex flex-col h-full"
              style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow, maxHeight: '600px' }}>
              <h2 className="mb-3" style={{ color: T.text, fontWeight: 600, fontSize: '15px' }}>Agregar materias</h2>

              <div className="relative mb-3 flex-shrink-0">
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: T.inputIcon }} />
                <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)}
                  placeholder="Buscar materia..."
                  className="w-full py-2.5 pl-9 pr-9 rounded-xl outline-none transition-all"
                  style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '13px' }}
                  onFocus={e => { e.currentTarget.style.borderColor = T.inputFocusBorder; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.inputFocusShadow}`; }}
                  onBlur={e => { e.currentTarget.style.borderColor = T.inputBorder; e.currentTarget.style.boxShadow = 'none'; }} />
                {searchText && (
                  <button onClick={() => setSearchText('')}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: T.inputIcon, background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              <select value={selectedFacultad} onChange={e => setSelectedFacultad(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl outline-none mb-3 flex-shrink-0"
                style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: selectedFacultad ? T.inputText : T.inputIcon, fontSize: '13px', appearance: 'none', cursor: 'pointer' }}>
                <option value="">Todas las facultades</option>
                {facultades.map(f => <option key={f} value={f} style={{ background: T.selectOptionBg }}>{f}</option>)}
              </select>

              {/* Search results */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {loading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 size={24} className="animate-spin" style={{ color: T.primary }} />
                  </div>
                ) : searchResults.map(materia => (
                  <div key={materia.codigo} className="p-3 rounded-xl"
                    style={{ background: T.cardBg2, border: `1px solid ${T.divider}` }}>
                    <p style={{ color: T.text, fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>{materia.nombre}</p>
                    <p style={{ color: T.primary, fontSize: '10px', fontWeight: 600, marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace' }}>
                      {materia.codigo}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {materia.grupos?.map(grupo => {
                        const hasConflict = grupo.horarios.some(h =>
                          selected.some(s => s.horarios.some(sh => sh.dia === h.dia && sh.horaInicio < h.horaFin && sh.horaFin > h.horaInicio))
                        );
                        return (
                          <button key={grupo.grupoCode}
                            onClick={() => !hasConflict && addGroup(materia, grupo)}
                            className="px-2 py-1 rounded-lg transition-all"
                            title={hasConflict ? "Este grupo se cruza con tu horario actual" : ""}
                            style={{ 
                              background: hasConflict ? T.cardBg2 : T.primaryBg, 
                              border: `1px solid ${hasConflict ? T.divider : T.primaryBorder}`, 
                              color: hasConflict ? T.textMuted : T.primary, 
                              fontSize: '11px', 
                              fontWeight: 600, 
                              cursor: hasConflict ? 'not-allowed' : 'pointer',
                              opacity: hasConflict ? 0.6 : 1
                            }}
                            onMouseEnter={e => { if (!hasConflict) { e.currentTarget.style.background = '#C9344C'; e.currentTarget.style.color = 'white'; } }}
                            onMouseLeave={e => { if (!hasConflict) { e.currentTarget.style.background = T.primaryBg; e.currentTarget.style.color = T.primary; } }}>
                            G-{grupo.grupoCode}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {!loading && (searchText || selectedFacultad) && searchResults.length === 0 && (
                  <p style={{ color: T.textSubtle, fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>Sin resultados</p>
                )}
                {!loading && !searchText && !selectedFacultad && (
                  <p style={{ color: T.textSubtle, fontSize: '12px', textAlign: 'center', padding: '12px 0' }}>Escribe para buscar materias</p>
                )}
              </div>
            </div>

            {/* Selected list */}
            {selected.length > 0 && (
              <div className="p-4 rounded-2xl"
                style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}>
                <h2 className="mb-3" style={{ color: T.text, fontWeight: 600, fontSize: '15px' }}>
                  Materias seleccionadas ({selected.length})
                </h2>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selected.map(s => {
                    const conflicted = conflictos.some(c => c.materias.some(m => m.nombre === s.nombre));
                    return (
                      <div key={s.codigo} className="flex items-center gap-2 p-2.5 rounded-xl"
                        style={{ background: T.cardBg2, border: `1.5px solid ${conflicted ? T.error.text : s.color}30` }}>
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                        <span style={{ color: T.text, fontSize: '12px', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nombre}</span>
                        {conflicted && <AlertTriangle size={12} style={{ color: T.error.text, flexShrink: 0 }} />}
                        <button onClick={() => removeGroup(s.codigo)}
                          style={{ color: T.textSubtle, background: 'none', border: 'none', cursor: 'pointer', padding: '2px', flexShrink: 0 }}
                          onMouseEnter={e => e.currentTarget.style.color = T.error.text}
                          onMouseLeave={e => e.currentTarget.style.color = T.textSubtle}>
                          <X size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Weekly grid */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl overflow-hidden"
              style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}>
              {/* Day headers */}
              <div className="grid" style={{ gridTemplateColumns: '56px repeat(6, 1fr)' }}>
                <div style={{ borderBottom: `1px solid ${T.divider}`, padding: '10px 8px' }} />
                {diasSemana.map(dia => (
                  <div key={dia} className="text-center py-2.5 px-1" style={{ borderBottom: `1px solid ${T.divider}`, borderLeft: `1px solid ${T.divider2}` }}>
                    <span style={{ color: T.textMuted, fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em' }}>{dia.slice(0, 3)}</span>
                  </div>
                ))}
              </div>

              {/* Hour rows */}
              <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
                {HORAS.map(hora => (
                  <div key={hora} className="grid" style={{ gridTemplateColumns: '56px repeat(6, 1fr)', minHeight: '48px' }}>
                    <div className="flex items-center justify-center px-2"
                      style={{ borderBottom: `1px solid ${T.divider2}`, borderRight: `1px solid ${T.divider}` }}>
                      <span className="font-mono-num" style={{ color: T.textSubtle, fontSize: '10px', fontFamily: 'JetBrains Mono, monospace' }}>{hora}:00</span>
                    </div>
                    {diasSemana.map(dia => {
                      const key = `${dia}-${hora}`;
                      const items = horasOcupadas[key] || [];
                      const isConflict = items.length > 1;
                      return (
                        <div key={dia} style={{ borderBottom: `1px solid ${T.divider2}`, borderLeft: `1px solid ${T.divider2}`, position: 'relative', minHeight: '48px' }}>
                          {items.map((item, idx) => (
                            <div key={idx} className="absolute inset-0.5 rounded-md flex items-center justify-center p-1"
                              style={{ background: `${item.color}${T.isDark ? '30' : '20'}`, border: `1.5px solid ${item.color}${isConflict ? '' : '80'}`, outline: isConflict ? `2px solid ${T.error.text}` : 'none' }}>
                              <span style={{ color: item.color, fontSize: '9px', fontWeight: 700, textAlign: 'center', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                                {item.nombre.split(' ').slice(0, 2).join(' ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {selected.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 mt-4 rounded-2xl"
                style={{ background: T.cardBg2, border: `1px solid ${T.divider}` }}>
                <Clock size={28} style={{ color: T.textSubtle, marginBottom: '8px' }} />
                <p style={{ color: T.textMuted, fontSize: '14px' }}>Tu horario aparecerá aquí</p>
                <p style={{ color: T.textSubtle, fontSize: '12px', marginTop: '4px' }}>Busca materias y agrégalas al horario</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <PromptModal isOpen={showPrompt} onClose={() => setShowPrompt(false)} onConfirm={name => { setShowPrompt(false); saveSchedule(name); }}
        title="Guardar horario" message="Dale un nombre a tu horario para identificarlo fácilmente."
        placeholder="Ej: Horario 2026-1 preferido" defaultValue={`Horario`} />
      <AlertModal isOpen={showAlert} onClose={() => setShowAlert(false)}
        title={alertMessage.includes('guardado') ? '¡Guardado!' : 'Límite alcanzado'}
        message={alertMessage} type={alertMessage.includes('guardado') ? 'success' : 'warning'} />
    </AppLayout>
  );
}