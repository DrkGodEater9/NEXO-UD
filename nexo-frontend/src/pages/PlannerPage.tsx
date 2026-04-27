import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { useThemeTokens } from '../context/useThemeTokens';
import { scheduleApi, SubjectResponse, SubjectGroupResponse } from '../services/api';
import { PromptModal, AlertModal } from '../components/Modal';
import {
  Search, X, AlertTriangle, Save, Clock, Loader2, Download, ChevronDown, ChevronUp, Info, FileImage, FileText,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const diasSemana = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
const diasCortos: Record<string, string> = { LUNES: 'LUN', MARTES: 'MAR', MIERCOLES: 'MIE', JUEVES: 'JUE', VIERNES: 'VIE', SABADO: 'SAB' };

const COLORS = [
  '#E8485F', '#818CF8', '#34D399', '#FBBF24', '#F472B6',
  '#60A5FA', '#A78BFA', '#FB923C', '#2DD4BF', '#E879F9',
];

const COLOR_PRESETS = [
  '#E8485F', '#818CF8', '#34D399', '#FBBF24', '#F472B6',
  '#60A5FA', '#A78BFA', '#FB923C', '#2DD4BF', '#E879F9',
  '#EF4444', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899',
  '#3B82F6', '#6366F1', '#F97316', '#14B8A6', '#D946EF',
];

// Height per hour slot in px — tall enough for 3 lines of text (nombre + sede + salon)
const SLOT_H = 68;

interface SelectedGroup {
  nombre: string;
  codigo: string;
  grupo: string;
  color: string;
  horarios: { dia: string; horaInicio: number; horaFin: number; ubicacion?: string }[];
  docente?: string;
}

interface BlockInfo {
  item: SelectedGroup;
  dia: string;
  hora: number;
}

export default function PlannerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, updateUser } = useAuth();
  const T = useThemeTokens();
  const exportRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedFacultad, setSelectedFacultad] = useState('');
  const [selectedCarrera, setSelectedCarrera] = useState('');
  const [selected, setSelected] = useState<SelectedGroup[]>([]);
  const [colorIdx, setColorIdx] = useState(0);
  const [conflictMsg, setConflictMsg] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [colorPickerFor, setColorPickerFor] = useState<string | null>(null);
  const [colorPickerPos, setColorPickerPos] = useState({ top: 0, left: 0 });
  const [blockInfo, setBlockInfo] = useState<BlockInfo | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showExport, setShowExport] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'png' | null>(null);

  useEffect(() => {
    scheduleApi.getOfferSubjects()
      .then(res => setSubjects(res || []))
      .catch(err => console.error('Error fetching subjects:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (subjects.length > 0 && location.state?.editSchedule) {
      const editSchedule = location.state.editSchedule;
      setEditingId(editSchedule.id || null);
      if (editSchedule.materias) {
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
            docente: grupo.docente,
          });
          ci++;
        });
        setSelected(reconstructed);
        setColorIdx(ci);
      }
    }
  }, [subjects, location.state]);

  const facultades = useMemo(() =>
    Array.from(new Set(subjects.map(s => s.facultad).filter(Boolean))).sort(),
    [subjects]);

  const carreras = useMemo(() => {
    if (!selectedFacultad) return [];
    return Array.from(new Set(
      subjects.filter(s => s.facultad === selectedFacultad).map(s => s.carrera).filter(Boolean)
    )).sort();
  }, [subjects, selectedFacultad]);

  const searchResults = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    const hasFac = !!selectedFacultad;
    const hasCarrera = !!selectedCarrera;
    if (!text && !hasFac && !hasCarrera) return [];

    const filtered = subjects.filter(m => {
      if (text) {
        const matchNombre = m.nombre.toLowerCase().includes(text);
        const matchCodigo = m.codigo.toLowerCase().includes(text);
        if (!matchNombre && !matchCodigo) return false;
      }
      if (hasFac && m.facultad !== selectedFacultad) return false;
      if (hasCarrera && m.carrera !== selectedCarrera) return false;
      return true;
    });

    // When no carrera filter, deduplicate by nombre — merge all grupos into the first entry
    // so "ALGEBRA LINEAL" from 18 different study plans doesn't flood results
    if (!hasCarrera) {
      const seen = new Map<string, SubjectResponse & { _allGrupos: SubjectGroupResponse[] }>();
      filtered.forEach(m => {
        const key = m.nombre.trim().toUpperCase();
        if (!seen.has(key)) {
          seen.set(key, { ...m, _allGrupos: [...(m.grupos || [])] });
        } else {
          // Merge grupos avoiding duplicates by grupoCode
          const existing = seen.get(key)!;
          (m.grupos || []).forEach(g => {
            if (!existing._allGrupos.find(eg => eg.grupoCode === g.grupoCode)) {
              existing._allGrupos.push(g);
            }
          });
        }
      });
      return Array.from(seen.values()).map(m => ({ ...m, grupos: m._allGrupos })).slice(0, 20);
    }

    return filtered.slice(0, 20);
  }, [subjects, searchText, selectedFacultad, selectedCarrera]);

  // Build occupied slots map — one entry per hour slot
  const horasOcupadas = useMemo(() => {
    const map: Record<string, SelectedGroup[]> = {};
    selected.forEach(s => {
      s.horarios.forEach(h => {
        for (let hr = h.horaInicio; hr < h.horaFin; hr++) {
          const key = `${h.dia}-${hr}`;
          if (!map[key]) map[key] = [];
          map[key].push(s);
        }
      });
    });
    return map;
  }, [selected]);

  const conflictos = useMemo(() =>
    Object.entries(horasOcupadas)
      .filter(([, arr]) => arr.length > 1)
      .map(([key, arr]) => ({ key, materias: arr })),
    [horasOcupadas]);

  const addGroup = (materia: SubjectResponse, grupo: SubjectGroupResponse) => {
    const existing = selected.find(s => s.codigo === materia.codigo);
    if (existing) {
      setSelected(prev => prev.map(s => s.codigo === materia.codigo
        ? { ...s, grupo: grupo.grupoCode, horarios: grupo.horarios, docente: grupo.docente }
        : s
      ));
      setConflictMsg('');
      return;
    }
    const hasConflict = grupo.horarios.some(h =>
      selected.some(s => s.horarios.some(sh =>
        sh.dia === h.dia && sh.horaInicio < h.horaFin && sh.horaFin > h.horaInicio
      ))
    );
    if (hasConflict) setConflictMsg(`⚠️ Conflicto detectado al agregar "${materia.nombre}"`);
    else setConflictMsg('');

    const color = COLORS[colorIdx % COLORS.length];
    setSelected(prev => [...prev, {
      nombre: materia.nombre,
      codigo: materia.codigo,
      grupo: grupo.grupoCode,
      color,
      horarios: grupo.horarios,
      docente: grupo.docente,
    }]);
    setColorIdx(prev => prev + 1);
  };

  const removeGroup = (codigo: string) => {
    setSelected(prev => prev.filter(s => s.codigo !== codigo));
    setConflictMsg('');
    setExpandedGroups(prev => { const n = new Set(prev); n.delete(codigo); return n; });
  };

  const changeColor = (codigo: string, color: string) => {
    setSelected(prev => prev.map(s => s.codigo === codigo ? { ...s, color } : s));
  };

  const switchGroup = (materia: SubjectResponse, grupo: SubjectGroupResponse) => {
    const hasConflict = grupo.horarios.some(h =>
      selected.some(s => s.codigo !== materia.codigo && s.horarios.some(sh =>
        sh.dia === h.dia && sh.horaInicio < h.horaFin && sh.horaFin > h.horaInicio
      ))
    );
    if (hasConflict) {
      setConflictMsg(`⚠️ El grupo ${grupo.grupoCode} de "${materia.nombre}" tiene conflicto`);
      return;
    }
    setSelected(prev => prev.map(s => s.codigo === materia.codigo
      ? { ...s, grupo: grupo.grupoCode, horarios: grupo.horarios, docente: grupo.docente }
      : s
    ));
    setConflictMsg('');
  };

  const saveSchedule = (name: string) => {
    if (!isAuthenticated || !user) { navigate('/login'); return; }
    const horarios = user.horariosGuardados || [];
    const materiasSave = selected.map(s => ({
      ...s,
      creditos: 0,
      docente: s.docente || subjects.find(sub => sub.codigo === s.codigo)?.grupos?.find(g => g.grupoCode === s.grupo)?.docente || '',
      customHex: s.color,
    }));

    if (editingId) {
      const updated = horarios.map((h: any) => h.id === editingId ? { ...h, nombre: name, materias: materiasSave } : h);
      updateUser({ horariosGuardados: updated });
      setAlertMessage(`¡Horario "${name}" actualizado correctamente!`);
    } else {
      if (horarios.length >= 5) {
        setAlertMessage('Solo puedes guardar hasta 5 horarios. Elimina uno desde tu perfil para continuar.');
        setShowAlert(true);
        return;
      }
      const newH = { id: Date.now().toString(), nombre: name, semestre: 'Activo', materias: materiasSave };
      updateUser({ horariosGuardados: [...horarios, newH] });
      setEditingId(newH.id);
      setAlertMessage(`¡Horario "${name}" guardado correctamente! Puedes verlo en tu perfil.`);
    }
    setShowAlert(true);
  };

  // Export: renders a full static grid (no scroll) off-screen, captures it
  const exportGrid = useCallback(async (format: 'pdf' | 'png') => {
    if (!exportRef.current) return;
    setExporting(format);
    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: T.isDark ? '#16162a' : '#ffffff',
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: exportRef.current.scrollWidth,
        windowHeight: exportRef.current.scrollHeight,
      });

      if (format === 'png') {
        const link = document.createElement('a');
        link.download = 'horario.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        const imgData = canvas.toDataURL('image/png');
        const w = canvas.width / 2;
        const h = canvas.height / 2;
        const pdf = new jsPDF({ orientation: w > h ? 'landscape' : 'portrait', unit: 'px', format: [w, h] });
        pdf.addImage(imgData, 'PNG', 0, 0, w, h);
        pdf.save('horario.pdf');
      }
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setExporting(null);
      setShowExport(false);
    }
  }, [T.isDark]);

  const toggleExpanded = (codigo: string) => {
    setExpandedGroups(prev => {
      const n = new Set(prev);
      if (n.has(codigo)) n.delete(codigo); else n.add(codigo);
      return n;
    });
  };

  const openColorPicker = (codigo: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (colorPickerFor === codigo) { setColorPickerFor(null); return; }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pickerH = 120; // approximate height of color picker
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow < pickerH + 12 ? rect.top - pickerH - 6 : rect.bottom + 6;
    const left = Math.min(rect.left, window.innerWidth - 172);
    setColorPickerPos({ top, left });
    setColorPickerFor(codigo);
  };

  const HORAS = Array.from({ length: 17 }, (_, i) => i + 6);

  // Parse ubicacion string into { sede, salon }
  // Format: "SEDE NAME SALON 302" or "SEDE NAME SALON A 105" etc.
  const parseUbicacion = (ubicacion: string): { sede: string; salon: string } => {
    if (!ubicacion) return { sede: '', salon: '' };
    const upper = ubicacion.trim().toUpperCase();
    const salonIdx = upper.lastIndexOf(' SALON ');
    if (salonIdx !== -1) {
      return {
        sede: ubicacion.substring(0, salonIdx).trim(),
        salon: 'Salón ' + ubicacion.substring(salonIdx + 7).trim(),
      };
    }
    // "SALON" at the very end without a number
    const salonEnd = upper.lastIndexOf(' SALON');
    if (salonEnd !== -1) {
      return { sede: ubicacion.substring(0, salonEnd).trim(), salon: 'Salón' };
    }
    return { sede: ubicacion, salon: '' };
  };

  // Shared grid renderer — used both for display and for export
  const renderGrid = (forExport = false) => {
    const timeColW = forExport ? 60 : 52;
    const bg = T.isDark ? '#16162a' : '#ffffff';
    const border1 = T.divider;
    const border2 = T.divider2;

    // Trim hours and days to content range (both display and export)
    let horasToRender = HORAS;
    let diasToRender = diasSemana;
    if (selected.length > 0) {
      const usedHoras = new Set<number>();
      const usedDias = new Set<string>();
      selected.forEach(s => s.horarios.forEach(h => {
        for (let hr = h.horaInicio; hr < h.horaFin; hr++) usedHoras.add(hr);
        usedDias.add(h.dia);
      }));
      if (usedHoras.size > 0) {
        const minH = Math.max(6, Math.min(...usedHoras));
        const maxH = Math.min(22, Math.max(...usedHoras) + 1);
        horasToRender = HORAS.filter(h => h >= minH && h <= maxH);
      }
      if (usedDias.size > 0 && forExport) {
        diasToRender = diasSemana.filter(d => usedDias.has(d));
      }
    }

    const colCount = diasToRender.length;

    return (
      <div style={{ background: bg, borderRadius: forExport ? '0' : '16px', overflow: 'hidden', width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: `${timeColW}px repeat(${colCount}, 1fr)` }}>
          <div style={{ borderBottom: `1px solid ${border1}`, padding: '10px 8px', background: bg }} />
          {diasToRender.map(dia => (
            <div key={dia} style={{ borderBottom: `1px solid ${border1}`, borderLeft: `1px solid ${border2}`, background: bg, textAlign: 'center', padding: '10px 4px' }}>
              <span style={{ color: T.textMuted, fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em' }}>{diasCortos[dia]}</span>
            </div>
          ))}
        </div>

        {/* Rows */}
        {horasToRender.map(hora => (
          <div key={hora} style={{ display: 'grid', gridTemplateColumns: `${timeColW}px repeat(${colCount}, 1fr)`, minHeight: `${SLOT_H}px` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '6px', borderBottom: `1px solid ${border2}`, borderRight: `1px solid ${border1}`, background: bg }}>
              <span style={{ color: T.textSubtle, fontSize: '9px', fontFamily: 'JetBrains Mono, monospace' }}>{hora}:00</span>
            </div>
            {diasToRender.map(dia => {
              const key = `${dia}-${hora}`;
              const items = horasOcupadas[key] || [];
              const isConflict = items.length > 1;
              return (
                <div key={`${dia}-${hora}`} style={{ borderBottom: `1px solid ${border2}`, borderLeft: `1px solid ${border2}`, position: 'relative', minHeight: `${SLOT_H}px`, background: bg }}>
                  {items.map((item, idx) => {
                    const block = item.horarios.find(h => h.dia === dia && h.horaInicio <= hora && h.horaFin > hora);
                    const { sede, salon } = parseUbicacion(block?.ubicacion || '');

                    return (
                      <div
                        key={`${item.codigo}-${idx}`}
                        onClick={forExport ? undefined : () => setBlockInfo({ item, dia, hora })}
                        style={{
                          position: 'absolute',
                          inset: '2px',
                          borderRadius: '6px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'flex-start',
                          padding: '3px 5px',
                          background: `color-mix(in srgb, ${item.color} 18%, #0d0d1a)`,
                          border: `1.5px solid ${item.color}${isConflict ? '' : 'cc'}`,
                          outline: isConflict ? `2px solid ${T.error.text}` : 'none',
                          cursor: forExport ? 'default' : 'pointer',
                          overflow: 'hidden',
                          zIndex: idx + 1,
                          boxSizing: 'border-box',
                          gap: '1px',
                        }}>
                        {/* Materia name */}
                        <span style={{
                          color: item.color,
                          fontSize: forExport ? '9px' : '8px',
                          fontWeight: 700,
                          lineHeight: 1.25,
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          whiteSpace: 'normal',
                          display: 'block',
                          filter: 'brightness(1.6) saturate(1.2)',
                        }}>
                          {item.nombre}
                        </span>
                        {/* Sede */}
                        {sede && (
                          <span style={{
                            color: item.color,
                            fontSize: forExport ? '8px' : '7px',
                            lineHeight: 1.2,
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace: 'normal',
                            display: 'block',
                            filter: 'brightness(1.4) saturate(1.1)',
                            opacity: 0.9,
                          }}>
                            {sede}
                          </span>
                        )}
                        {/* Salon */}
                        {salon && (
                          <span style={{
                            color: item.color,
                            fontSize: forExport ? '8px' : '7px',
                            lineHeight: 1.2,
                            fontWeight: 600,
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace: 'normal',
                            display: 'block',
                            filter: 'brightness(1.3) saturate(1.1)',
                            opacity: 0.8,
                          }}>
                            {salon}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 style={{ color: T.text, fontWeight: 700, fontSize: '22px', letterSpacing: '-0.02em' }}>Planeador de horarios</h1>
            <p style={{ color: T.textMuted, fontSize: '14px', marginTop: '2px' }}>Arma tu horario ideal</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {selected.length > 0 && (
              <>
                <button onClick={() => setShowExport(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
                  style={{ background: T.cardBg2, color: T.text, border: `1px solid ${T.cardBorder}`, cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                  <Download size={14} /> Exportar
                </button>
                <button
                  onClick={() => { if (!isAuthenticated) { navigate('/login'); return; } setShowPrompt(true); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
                  style={{ background: '#C9344C', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, boxShadow: T.primaryShadow }}
                  onMouseEnter={e => e.currentTarget.style.background = '#A02438'}
                  onMouseLeave={e => e.currentTarget.style.background = '#C9344C'}>
                  <Save size={14} /> {editingId ? 'Actualizar horario' : 'Guardar horario'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Conflicts */}
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
          <div className="flex items-center gap-2 p-3 rounded-xl mb-5"
            style={{ background: T.warning.bg, border: `1px solid ${T.warning.border}`, color: T.warning.text, fontSize: '13px', fontWeight: 500 }}>
            <AlertTriangle size={14} />
            {conflictMsg}
            <button onClick={() => setConflictMsg('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: T.warning.text, cursor: 'pointer' }}>
              <X size={14} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Search panel */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="p-4 rounded-2xl flex flex-col"
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

              <select value={selectedFacultad} onChange={e => { setSelectedFacultad(e.target.value); setSelectedCarrera(''); }}
                className="w-full px-3 py-2.5 rounded-xl outline-none mb-2 flex-shrink-0"
                style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: selectedFacultad ? T.inputText : T.inputIcon, fontSize: '13px', appearance: 'none', cursor: 'pointer' }}>
                <option value="">Todas las facultades</option>
                {facultades.map(f => <option key={f} value={f} style={{ background: T.selectOptionBg }}>{f}</option>)}
              </select>

              {carreras.length > 0 && (
                <select value={selectedCarrera} onChange={e => setSelectedCarrera(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl outline-none mb-3 flex-shrink-0"
                  style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: selectedCarrera ? T.inputText : T.inputIcon, fontSize: '13px', appearance: 'none', cursor: 'pointer' }}>
                  <option value="">Todas las carreras</option>
                  {carreras.map(c => <option key={c} value={c} style={{ background: T.selectOptionBg }}>{c}</option>)}
                </select>
              )}

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {loading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 size={24} className="animate-spin" style={{ color: T.primary }} />
                  </div>
                ) : searchResults.map(materia => (
                  <div key={materia.codigo} className="p-3 rounded-xl"
                    style={{ background: T.cardBg2, border: `1px solid ${T.divider}` }}>
                    <p style={{ color: T.text, fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>{materia.nombre}</p>
                    <p style={{ color: T.textSubtle, fontSize: '10px', marginBottom: '4px' }}>{materia.carrera}</p>
                    <p style={{ color: T.primary, fontSize: '10px', fontWeight: 600, marginBottom: '8px', fontFamily: 'JetBrains Mono, monospace' }}>
                      {materia.codigo}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {materia.grupos?.map(grupo => {
                        const alreadySelected = selected.find(s => s.codigo === materia.codigo);
                        const isCurrentGroup = alreadySelected?.grupo === grupo.grupoCode;
                        const hasConflict = !isCurrentGroup && grupo.horarios.some(h =>
                          selected.some(s => s.codigo !== materia.codigo && s.horarios.some(sh =>
                            sh.dia === h.dia && sh.horaInicio < h.horaFin && sh.horaFin > h.horaInicio
                          ))
                        );
                        return (
                          <button key={grupo.grupoCode}
                            onClick={() => !hasConflict && addGroup(materia, grupo)}
                            title={hasConflict ? 'Este grupo se cruza con tu horario actual' : grupo.docente}
                            className="px-2 py-1 rounded-lg transition-all"
                            style={{
                              background: isCurrentGroup ? '#C9344C' : hasConflict ? T.cardBg2 : T.primaryBg,
                              border: `1px solid ${isCurrentGroup ? '#C9344C' : hasConflict ? T.divider : T.primaryBorder}`,
                              color: isCurrentGroup ? 'white' : hasConflict ? T.textMuted : T.primary,
                              fontSize: '11px', fontWeight: 600,
                              cursor: hasConflict ? 'not-allowed' : 'pointer',
                              opacity: hasConflict ? 0.6 : 1,
                            }}
                            onMouseEnter={e => { if (!hasConflict && !isCurrentGroup) { e.currentTarget.style.background = '#C9344C'; e.currentTarget.style.color = 'white'; } }}
                            onMouseLeave={e => { if (!hasConflict && !isCurrentGroup) { e.currentTarget.style.background = T.primaryBg; e.currentTarget.style.color = T.primary; } }}>
                            G-{grupo.grupoCode}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {!loading && (searchText || selectedFacultad || selectedCarrera) && searchResults.length === 0 && (
                  <p style={{ color: T.textSubtle, fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>Sin resultados</p>
                )}
                {!loading && !searchText && !selectedFacultad && !selectedCarrera && (
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
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                  {selected.map(s => {
                    const conflicted = conflictos.some(c => c.materias.some(m => m.nombre === s.nombre));
                    const isExpanded = expandedGroups.has(s.codigo);
                    const subjectData = subjects.find(sub => sub.codigo === s.codigo);

                    return (
                      <div key={s.codigo} className="rounded-xl overflow-visible"
                        style={{ background: T.cardBg2, border: `1.5px solid ${conflicted ? T.error.text : s.color}30` }}>
                        <div className="flex items-center gap-2 p-2.5">
                          {/* Color dot */}
                          <button
                            onClick={(e) => openColorPicker(s.codigo, e)}
                            title="Cambiar color"
                            style={{ width: '14px', height: '14px', borderRadius: '50%', background: s.color, border: 'none', cursor: 'pointer', flexShrink: 0, padding: 0 }} />

                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <p style={{ color: T.text, fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nombre}</p>
                            <p style={{ color: T.textSubtle, fontSize: '10px' }}>G-{s.grupo}{s.docente ? ` · ${s.docente.split(' ').slice(0, 2).join(' ')}` : ''}</p>
                          </div>

                          {conflicted && <AlertTriangle size={12} style={{ color: T.error.text, flexShrink: 0 }} />}

                          {subjectData && subjectData.grupos && subjectData.grupos.length > 1 && (
                            <button onClick={() => toggleExpanded(s.codigo)}
                              title="Cambiar grupo"
                              style={{ color: T.textSubtle, background: 'none', border: 'none', cursor: 'pointer', padding: '2px', flexShrink: 0 }}>
                              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                          )}

                          <button onClick={() => removeGroup(s.codigo)}
                            style={{ color: T.textSubtle, background: 'none', border: 'none', cursor: 'pointer', padding: '2px', flexShrink: 0 }}
                            onMouseEnter={e => e.currentTarget.style.color = T.error.text}
                            onMouseLeave={e => e.currentTarget.style.color = T.textSubtle}>
                            <X size={13} />
                          </button>
                        </div>

                        {isExpanded && subjectData && (
                          <div className="px-2.5 pb-2.5">
                            <p style={{ color: T.textSubtle, fontSize: '10px', fontWeight: 600, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cambiar grupo</p>
                            <div className="flex flex-wrap gap-1">
                              {subjectData.grupos?.map(grupo => {
                                const isCurrent = s.grupo === grupo.grupoCode;
                                const hasConflict = !isCurrent && grupo.horarios.some(h =>
                                  selected.some(sel => sel.codigo !== s.codigo && sel.horarios.some(sh =>
                                    sh.dia === h.dia && sh.horaInicio < h.horaFin && sh.horaFin > h.horaInicio
                                  ))
                                );
                                return (
                                  <button key={grupo.grupoCode}
                                    onClick={() => !hasConflict && switchGroup(subjectData, grupo)}
                                    title={grupo.docente}
                                    style={{
                                      padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 600,
                                      background: isCurrent ? s.color : hasConflict ? T.cardBg : T.primaryBg,
                                      color: isCurrent ? 'white' : hasConflict ? T.textSubtle : T.primary,
                                      border: `1px solid ${isCurrent ? s.color : hasConflict ? T.divider : T.primaryBorder}`,
                                      cursor: hasConflict ? 'not-allowed' : 'pointer',
                                      opacity: hasConflict ? 0.5 : 1,
                                    }}>
                                    G-{grupo.grupoCode}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Weekly grid — visible, with scroll */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl overflow-hidden"
              style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}>
              <div style={{ overflowY: 'auto', maxHeight: '640px' }}>
                {renderGrid(false)}
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

      {/* Hidden export grid — full height, no scroll, captured by html2canvas */}
      <div
        ref={exportRef}
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '900px',
          background: T.isDark ? '#16162a' : '#ffffff',
          padding: '16px',
        }}>
        {/* Title row */}
        <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <p style={{ color: T.text, fontWeight: 700, fontSize: '16px', margin: 0 }}>Horario NEXO-UD</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {selected.map(s => (
              <div key={s.codigo} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
                <span style={{ color: T.textMuted, fontSize: '10px' }}>{s.nombre}</span>
              </div>
            ))}
          </div>
        </div>
        {renderGrid(true)}
      </div>

      {/* Color picker portal — fixed, always on top */}
      {colorPickerFor && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setColorPickerFor(null)} />
          <div className="fixed z-[9999] p-2 rounded-xl shadow-2xl"
            style={{
              background: T.cardBg,
              border: `1px solid ${T.cardBorder}`,
              top: `${colorPickerPos.top}px`,
              left: `${colorPickerPos.left}px`,
              width: '164px',
            }}>
            <p style={{ color: T.textMuted, fontSize: '10px', fontWeight: 600, marginBottom: '6px' }}>Elige un color</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
              {COLOR_PRESETS.map(c => {
                const currentColor = selected.find(s => s.codigo === colorPickerFor)?.color;
                return (
                  <button key={c}
                    onClick={() => { changeColor(colorPickerFor!, c); setColorPickerFor(null); }}
                    style={{
                      width: '24px', height: '24px', borderRadius: '6px', background: c,
                      border: currentColor === c ? '2px solid white' : '2px solid transparent',
                      cursor: 'pointer', padding: 0,
                      outline: currentColor === c ? `2px solid ${c}` : 'none',
                    }} />
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Block info modal */}
      {blockInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={() => setBlockInfo(null)}>
          <div className="w-full max-w-md rounded-2xl p-5"
            style={{
              background: T.isDark ? 'rgba(30,30,52,0.97)' : 'rgba(255,255,255,0.97)',
              border: `1px solid ${blockInfo.item.color}55`,
              boxShadow: `0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px ${blockInfo.item.color}22`,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2" style={{ flex: 1, overflow: 'hidden', paddingRight: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: blockInfo.item.color, flexShrink: 0, boxShadow: `0 0 8px ${blockInfo.item.color}` }} />
                <h3 style={{ color: T.text, fontWeight: 700, fontSize: '15px', lineHeight: 1.3, wordBreak: 'break-word' }}>{blockInfo.item.nombre}</h3>
              </div>
              <button onClick={() => setBlockInfo(null)}
                style={{ color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: '2px', flexShrink: 0 }}>
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-2 mb-4">
              {blockInfo.item.docente && (
                <div className="flex gap-2 p-2.5 rounded-lg" style={{ background: T.cardBg2 }}>
                  <Info size={13} style={{ color: T.textMuted, flexShrink: 0, marginTop: '1px' }} />
                  <div>
                    <p style={{ color: T.textMuted, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Docente</p>
                    <p style={{ color: T.text, fontSize: '13px' }}>{blockInfo.item.docente}</p>
                  </div>
                </div>
              )}
              <div className="flex gap-2 p-2.5 rounded-lg" style={{ background: T.cardBg2 }}>
                <span style={{ color: T.textMuted, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, width: '48px', flexShrink: 0, paddingTop: '1px' }}>Grupo</span>
                <span style={{ color: T.text, fontSize: '13px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>G-{blockInfo.item.grupo}</span>
              </div>
            </div>

            <p style={{ color: T.textMuted, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Sesiones</p>
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${T.divider}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', background: T.cardBg2, padding: '8px 12px', gap: '4px' }}>
                <span style={{ color: T.textMuted, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Día</span>
                <span style={{ color: T.textMuted, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Horario</span>
                <span style={{ color: T.textMuted, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Sede / Salón</span>
              </div>
              {blockInfo.item.horarios.map((h, i) => {
                const { sede, salon } = parseUbicacion(h.ubicacion || '');
                return (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '52px 100px 1fr', padding: '8px 12px', borderTop: `1px solid ${T.divider}`, gap: '8px', alignItems: 'start' }}>
                    <span style={{ color: T.text, fontSize: '12px', fontWeight: 600 }}>{diasCortos[h.dia] || h.dia}</span>
                    <span style={{ color: T.text, fontSize: '12px' }}>{h.horaInicio}:00–{h.horaFin}:00</span>
                    <div>
                      <p style={{ color: T.textMuted, fontSize: '11px', fontWeight: 500, wordBreak: 'break-word', margin: '0 0 2px 0' }}>{sede || '—'}</p>
                      <p style={{ color: T.text, fontSize: '12px', fontWeight: 600, wordBreak: 'break-word', margin: 0 }}>{salon || '—'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Export modal */}
      {showExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => !exporting && setShowExport(false)}>
          <div className="w-full max-w-xs rounded-2xl p-6"
            style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 style={{ color: T.text, fontWeight: 700, fontSize: '16px' }}>Exportar horario</h3>
              {!exporting && (
                <button onClick={() => setShowExport(false)}
                  style={{ color: T.textSubtle, background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              )}
            </div>
            <p style={{ color: T.textMuted, fontSize: '13px', marginBottom: '20px' }}>¿En qué formato deseas exportar tu horario?</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => exportGrid('png')} disabled={!!exporting}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: T.primaryBg, border: `1px solid ${T.primaryBorder}`, color: T.primary, cursor: exporting ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 600, opacity: exporting === 'pdf' ? 0.5 : 1 }}>
                <FileImage size={20} />
                {exporting === 'png' ? 'Exportando...' : 'Exportar como PNG'}
              </button>
              <button onClick={() => exportGrid('pdf')} disabled={!!exporting}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: T.cardBg2, border: `1px solid ${T.divider}`, color: T.text, cursor: exporting ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 600, opacity: exporting === 'png' ? 0.5 : 1 }}>
                <FileText size={20} />
                {exporting === 'pdf' ? 'Exportando...' : 'Exportar como PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      <PromptModal
        isOpen={showPrompt}
        onClose={() => setShowPrompt(false)}
        onConfirm={name => { setShowPrompt(false); saveSchedule(name); }}
        title={editingId ? 'Actualizar horario' : 'Guardar horario'}
        message={editingId ? 'Modifica el nombre si lo deseas.' : 'Dale un nombre a tu horario para identificarlo fácilmente.'}
        placeholder="Ej: Horario 2026-1 preferido"
        defaultValue={location.state?.editSchedule?.nombre || 'Horario'} />
      <AlertModal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title={alertMessage.includes('guardado') || alertMessage.includes('actualizado') ? '¡Listo!' : 'Límite alcanzado'}
        message={alertMessage}
        type={alertMessage.includes('guardado') || alertMessage.includes('actualizado') ? 'success' : 'warning'} />
    </AppLayout>
  );
}
