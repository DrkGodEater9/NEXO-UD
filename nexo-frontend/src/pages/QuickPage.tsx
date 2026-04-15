import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useThemeTokens } from '../context/useThemeTokens';
import { materiasData, getFacultades } from '../data/materiasData';
import { Zap, ArrowLeft, Search, AlertTriangle, X, Info } from 'lucide-react';

const diasSemana = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

const COLORS = [
  '#E8485F', '#818CF8', '#34D399', '#FBBF24', '#F472B6',
  '#60A5FA', '#A78BFA', '#FB923C', '#2DD4BF', '#E879F9'
];

interface SelectedGroup {
  nombre: string;
  codigo: string;
  grupo: string;
  color: string;
  horarios: { dia: string; horaInicio: number; horaFin: number; ubicacion?: string }[];
}

export default function QuickPage() {
  const navigate = useNavigate();
  const T = useThemeTokens();
  const [searchText, setSearchText] = useState('');
  const [selectedFacultad, setSelectedFacultad] = useState('');
  const [selected, setSelected] = useState<SelectedGroup[]>([]);
  const [colorIdx, setColorIdx] = useState(0);
  const [conflictMsg, setConflictMsg] = useState('');

  const facultades = getFacultades();

  const filtered = useMemo(() => {
    const text = searchText.toLowerCase();
    if (!text && !selectedFacultad) return [];
    return Object.values(materiasData)
      .filter(m => {
        const matchText = !text || m.nombre.toLowerCase().includes(text) || m.codigo.includes(text);
        const matchFac = !selectedFacultad || m.facultad === selectedFacultad;
        return matchText && matchFac;
      })
      .slice(0, 20);
  }, [searchText, selectedFacultad]);

  const checkConflict = (newHorarios: any[]): string | null => {
    for (const sel of selected) {
      for (const nh of newHorarios) {
        for (const eh of sel.horarios) {
          if (nh.dia === eh.dia) {
            if (!(nh.horaFin <= eh.horaInicio || nh.horaInicio >= eh.horaFin)) {
              return sel.nombre;
            }
          }
        }
      }
    }
    return null;
  };

  const addGroup = (materia: any, grupo: any) => {
    const conflict = checkConflict(grupo.horarios);
    if (conflict) {
      setConflictMsg(`Conflicto de horario con: "${conflict}". Elige otro grupo.`);
      setTimeout(() => setConflictMsg(''), 3500);
      return;
    }
    if (selected.find(s => s.codigo === materia.codigo)) {
      setSelected(selected.map(s =>
        s.codigo === materia.codigo
          ? { ...s, grupo: grupo.grupo, horarios: grupo.horarios }
          : s
      ));
    } else {
      setSelected([...selected, {
        nombre: materia.nombre,
        codigo: materia.codigo,
        grupo: grupo.grupo,
        color: COLORS[colorIdx % COLORS.length],
        horarios: grupo.horarios,
      }]);
      setColorIdx(c => c + 1);
    }
  };

  const removeSubject = (codigo: string) => {
    setSelected(selected.filter(s => s.codigo !== codigo));
  };

  // Build grid
  const grid: Record<string, Record<number, SelectedGroup[]>> = {};
  diasSemana.forEach(d => { grid[d] = {}; });

  let minH = 21, maxH = 6;
  selected.forEach(s => {
    s.horarios.forEach(h => {
      if (h.horaInicio < minH) minH = h.horaInicio;
      if (h.horaFin > maxH) maxH = h.horaFin;
      for (let hh = h.horaInicio; hh < h.horaFin; hh++) {
        if (!grid[h.dia][hh]) grid[h.dia][hh] = [];
        grid[h.dia][hh].push(s);
      }
    });
  });
  if (selected.length === 0) { minH = 7; maxH = 20; }

  return (
    <div className="min-h-screen" style={{ backgroundImage: T.pageBg, backgroundColor: T.pageBgColor }}>
      {/* Header */}
      <header className="sticky top-0 z-50 px-4 py-3"
        style={{ background: T.isDark ? 'rgba(15,11,30,0.88)' : 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${T.divider}` }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-1.5 rounded-lg transition-all"
              style={{ color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.color = T.text}
              onMouseLeave={e => e.currentTarget.style.color = T.textMuted}>
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <Zap size={18} style={{ color: T.primary }} />
              <span style={{ color: T.text, fontWeight: 700, fontSize: '16px' }}>Modo rápido</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg"
              style={{ background: T.cardBg2, border: `1px solid ${T.cardBorder}` }}>
              <span style={{ color: T.textMuted, fontSize: '12px' }}>{selected.length} mat.</span>
            </div>
            <button onClick={() => navigate('/register')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
              style={{ background: '#C9344C', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
              onMouseEnter={e => e.currentTarget.style.background = '#A02438'}
              onMouseLeave={e => e.currentTarget.style.background = '#C9344C'}>
              Guardar cuenta
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 md:p-6">
        {/* Info banner */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl mb-5"
          style={{ background: T.accentIndigo.bg, border: `1px solid ${T.accentIndigo.border}` }}>
          <Info size={15} style={{ color: T.accentIndigo.color, flexShrink: 0, marginTop: '1px' }} />
          <p style={{ color: T.accentIndigo.color, fontSize: '13px', lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600 }}>Modo rápido — </span>
            sin cuenta. Crea un horario de prueba y regístrate para guardarlo.
          </p>
        </div>

        {conflictMsg && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl mb-4"
            style={{ background: T.warning.bg, border: `1px solid ${T.warning.border}` }}>
            <AlertTriangle size={15} style={{ color: T.warning.text, flexShrink: 0 }} />
            <p style={{ color: T.warning.text, fontSize: '13px' }}>{conflictMsg}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Search panel */}
          <div className="lg:col-span-1">
            <div className="p-4 rounded-2xl"
              style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}>
              <h2 className="mb-3" style={{ color: T.text, fontWeight: 600, fontSize: '15px' }}>Buscar materias</h2>

              <div className="relative mb-3">
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: T.inputIcon }} />
                <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)}
                  placeholder="Nombre o código..."
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
                className="w-full px-3 py-2.5 rounded-xl outline-none mb-3"
                style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: selectedFacultad ? T.inputText : T.inputIcon, fontSize: '13px', appearance: 'none', cursor: 'pointer' }}>
                <option value="">Todas las facultades</option>
                {facultades.map(f => <option key={f} value={f} style={{ background: T.selectOptionBg }}>{f}</option>)}
              </select>

              <div className="space-y-2 max-h-[380px] overflow-y-auto">
                {filtered.map(materia => (
                  <div key={materia.codigo} className="p-3 rounded-xl"
                    style={{ background: T.cardBg2, border: `1px solid ${T.divider}` }}>
                    <p style={{ color: T.text, fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>{materia.nombre}</p>
                    <p style={{ color: T.primary, fontSize: '10px', fontWeight: 600, marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace' }}>
                      {materia.codigo} · {materia.creditos} cr.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {materia.grupos.map(grupo => {
                        const color = COLORS[colorIdx % COLORS.length];
                        return (
                          <button key={grupo.grupo}
                            onClick={() => {
                              const existing = selected.find(s => s.codigo === materia.codigo);
                              if (existing) { setConflictMsg(`"${materia.nombre}" ya está en tu horario.`); return; }
                              const hasConflict = grupo.horarios.some(h =>
                                selected.some(s => s.horarios.some(sh => sh.dia === h.dia && sh.horaInicio < h.horaFin && sh.horaFin > h.horaInicio))
                              );
                              if (hasConflict) setConflictMsg(`⚠️ Conflicto al agregar "${materia.nombre}"`);
                              else setConflictMsg('');
                              setSelected(prev => [...prev, { nombre: materia.nombre, codigo: materia.codigo, grupo: grupo.grupo, color, horarios: grupo.horarios }]);
                              setColorIdx(prev => prev + 1);
                            }}
                            className="px-2 py-1 rounded-lg transition-all"
                            style={{ background: T.primaryBg, border: `1px solid ${T.primaryBorder}`, color: T.primary, fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#C9344C'; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = T.primaryBg; e.currentTarget.style.color = T.primary; }}>
                            G-{grupo.grupo}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {!searchText && !selectedFacultad && (
                  <p style={{ color: T.textSubtle, fontSize: '12px', textAlign: 'center', padding: '12px 0' }}>Escribe para buscar materias</p>
                )}
              </div>
            </div>
          </div>

          {/* Weekly grid */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl overflow-hidden"
              style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}>
              <div className="grid" style={{ gridTemplateColumns: '56px repeat(6, 1fr)' }}>
                <div style={{ borderBottom: `1px solid ${T.divider}`, padding: '10px 8px' }} />
                {diasSemana.map(dia => (
                  <div key={dia} className="text-center py-2.5 px-1"
                    style={{ borderBottom: `1px solid ${T.divider}`, borderLeft: `1px solid ${T.divider2}` }}>
                    <span style={{ color: T.textMuted, fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em' }}>{dia.slice(0, 3)}</span>
                  </div>
                ))}
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: '480px' }}>
                {Array.from({ length: 17 }, (_, i) => i + 6).map(hora => {
                  const horasOcupadas: Record<string, { nombre: string; color: string }[]> = {};
                  selected.forEach(s => s.horarios.forEach(h => {
                    const key = `${h.dia}-${h.horaInicio}`;
                    if (!horasOcupadas[key]) horasOcupadas[key] = [];
                    horasOcupadas[key].push({ nombre: s.nombre, color: s.color });
                  }));
                  return (
                    <div key={hora} className="grid" style={{ gridTemplateColumns: '56px repeat(6, 1fr)', minHeight: '44px' }}>
                      <div className="flex items-center justify-center px-2"
                        style={{ borderBottom: `1px solid ${T.divider2}`, borderRight: `1px solid ${T.divider}` }}>
                        <span className="font-mono-num" style={{ color: T.textSubtle, fontSize: '10px', fontFamily: 'JetBrains Mono, monospace' }}>{hora}:00</span>
                      </div>
                      {diasSemana.map(dia => {
                        const key = `${dia}-${hora}`;
                        const items = horasOcupadas[key] || [];
                        const isConflict = items.length > 1;
                        return (
                          <div key={dia} style={{ borderBottom: `1px solid ${T.divider2}`, borderLeft: `1px solid ${T.divider2}`, position: 'relative', minHeight: '44px' }}>
                            {items.map((item, idx) => (
                              <div key={idx} className="absolute inset-0.5 rounded-md flex items-center justify-center p-1"
                                style={{ background: `${item.color}${T.isDark ? '30' : '20'}`, border: `1.5px solid ${item.color}80`, outline: isConflict ? `2px solid ${T.error.text}` : 'none' }}>
                                <span style={{ color: item.color, fontSize: '9px', fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>
                                  {item.nombre.split(' ').slice(0, 2).join(' ')}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {selected.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 items-center">
                {selected.map(s => (
                  <div key={s.codigo} className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                    style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    <span style={{ color: T.text, fontSize: '12px', fontWeight: 500 }}>{s.nombre.split(' ').slice(0, 3).join(' ')}</span>
                    <button onClick={() => setSelected(prev => prev.filter(x => x.codigo !== s.codigo))}
                      style={{ color: T.textSubtle, background: 'none', border: 'none', cursor: 'pointer', padding: '1px' }}
                      onMouseEnter={e => e.currentTarget.style.color = T.error.text}
                      onMouseLeave={e => e.currentTarget.style.color = T.textSubtle}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}