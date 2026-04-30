import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useThemeTokens } from '../context/useThemeTokens';
import { scheduleApi, SubjectResponse, SubjectGroupResponse } from '../services/api';
import {
  Zap, ArrowLeft, Search, X, AlertTriangle, Save, Clock, Loader2,
  Download, ChevronDown, ChevronUp, Info, FileImage, FileText, LogIn, UserPlus,
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

const SLOT_H = 68;
const QUICK_STORAGE_KEY = 'nexoud_quick_schedule';

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

export default function QuickPage() {
  const navigate = useNavigate();
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

  const [colorPickerFor, setColorPickerFor] = useState<string | null>(null);
  const [colorPickerPos, setColorPickerPos] = useState({ top: 0, left: 0 });
  const [blockInfo, setBlockInfo] = useState<BlockInfo | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showExport, setShowExport] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'png' | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    scheduleApi.getOfferSubjects()
      .then(res => setSubjects(res || []))
      .catch(err => console.error('Error fetching subjects:', err))
      .finally(() => setLoading(false));
  }, []);

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
      if (text && !m.nombre.toLowerCase().includes(text) && !m.codigo.toLowerCase().includes(text)) return false;
      if (hasFac && m.facultad !== selectedFacultad) return false;
      if (hasCarrera && m.carrera !== selectedCarrera) return false;
      return true;
    });

    if (!hasCarrera) {
      const seen = new Map<string, SubjectResponse & { _allGrupos: SubjectGroupResponse[] }>();
      filtered.forEach(m => {
        const key = m.nombre.trim().toUpperCase();
        if (!seen.has(key)) {
          seen.set(key, { ...m, _allGrupos: [...(m.grupos || [])] });
        } else {
          const existing = seen.get(key)!;
          (m.grupos || []).forEach(g => {
            if (!existing._allGrupos.find(eg => eg.grupoCode === g.grupoCode))
              existing._allGrupos.push(g);
          });
        }
      });
      return Array.from(seen.values()).map(m => ({ ...m, grupos: m._allGrupos })).slice(0, 20);
    }
    return filtered.slice(0, 20);
  }, [subjects, searchText, selectedFacultad, selectedCarrera]);

  const horasOcupadas = useMemo(() => {
    const map: Record<string, SelectedGroup[]> = {};
    selected.forEach(s => s.horarios.forEach(h => {
      for (let hr = h.horaInicio; hr < h.horaFin; hr++) {
        const key = `${h.dia}-${hr}`;
        if (!map[key]) map[key] = [];
        map[key].push(s);
      }
    }));
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

    setSelected(prev => [...prev, {
      nombre: materia.nombre,
      codigo: materia.codigo,
      grupo: grupo.grupoCode,
      color: COLORS[colorIdx % COLORS.length],
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

  // Persist horario to sessionStorage so login/register can restore it
  const handleSaveIntent = () => {
    if (selected.length === 0) return;
    const payload = {
      materias: selected.map(s => ({
        ...s,
        creditos: 0,
        customHex: s.color,
      })),
    };
    sessionStorage.setItem(QUICK_STORAGE_KEY, JSON.stringify(payload));
    setShowSaveModal(true);
  };

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
    const pickerH = 120;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow < pickerH + 12 ? rect.top - pickerH - 6 : rect.bottom + 6;
    const left = Math.min(rect.left, window.innerWidth - 172);
    setColorPickerPos({ top, left });
    setColorPickerFor(codigo);
  };

  const HORAS = Array.from({ length: 17 }, (_, i) => i + 6);

  const parseUbicacion = (ubicacion: string): { sede: string; salon: string } => {
    if (!ubicacion) return { sede: '', salon: '' };
    const upper = ubicacion.trim().toUpperCase();
    const salonIdx = upper.lastIndexOf(' SALON ');
    if (salonIdx !== -1) return { sede: ubicacion.substring(0, salonIdx).trim(), salon: 'Salón ' + ubicacion.substring(salonIdx + 7).trim() };
    const salonEnd = upper.lastIndexOf(' SALON');
    if (salonEnd !== -1) return { sede: ubicacion.substring(0, salonEnd).trim(), salon: 'Salón' };
    return { sede: ubicacion, salon: '' };
  };

  const renderGrid = (forExport = false) => {
    const timeColW = forExport ? 60 : 52;
    const bg = T.isDark ? '#16162a' : '#ffffff';
    const border1 = T.divider;
    const border2 = T.divider2;

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
      if (usedDias.size > 0 && forExport) diasToRender = diasSemana.filter(d => usedDias.has(d));
    }

    const colCount = diasToRender.length;
    return (
      <div style={{ background: bg, borderRadius: forExport ? '0' : '16px', overflow: 'hidden', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `${timeColW}px repeat(${colCount}, 1fr)` }}>
          <div style={{ borderBottom: `1px solid ${border1}`, padding: '10px 8px', background: bg }} />
          {diasToRender.map(dia => (
            <div key={dia} style={{ borderBottom: `1px solid ${border1}`, borderLeft: `1px solid ${border2}`, background: bg, textAlign: 'center', padding: '10px 4px' }}>
              <span style={{ color: T.textMuted, fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em' }}>{diasCortos[dia]}</span>
            </div>
          ))}
        </div>
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
                          position: 'absolute', inset: '2px', borderRadius: '6px',
                          display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
                          padding: '3px 5px',
                          background: `color-mix(in srgb, ${item.color} 18%, #0d0d1a)`,
                          border: `1.5px solid ${item.color}${isConflict ? '' : 'cc'}`,
                          outline: isConflict ? `2px solid ${T.error.text}` : 'none',
                          cursor: forExport ? 'default' : 'pointer',
                          overflow: 'hidden', zIndex: idx + 1, boxSizing: 'border-box', gap: '1px',
                        }}>
                        <span style={{ color: item.color, fontSize: forExport ? '9px' : '8px', fontWeight: 700, lineHeight: 1.25, wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal', display: 'block', filter: 'brightness(1.6) saturate(1.2)' }}>
                          {item.nombre}
                        </span>
                        {sede && <span style={{ color: item.color, fontSize: forExport ? '8px' : '7px', lineHeight: 1.2, wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal', display: 'block', filter: 'brightness(1.4) saturate(1.1)', opacity: 0.9 }}>{sede}</span>}
                        {salon && <span style={{ color: item.color, fontSize: forExport ? '8px' : '7px', lineHeight: 1.2, fontWeight: 600, wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal', display: 'block', filter: 'brightness(1.3) saturate(1.1)', opacity: 0.8 }}>{salon}</span>}
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
    <div className="min-h-screen" style={{ backgroundImage: T.pageBg, backgroundColor: T.pageBgColor }}>
      {/* Header */}
      <header className="sticky top-0 z-50 px-4 py-3"
        style={{ background: T.isDark ? 'rgba(15,11,30,0.88)' : 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${T.divider}` }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')}
              style={{ color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}
              onMouseEnter={e => e.currentTarget.style.color = T.text}
              onMouseLeave={e => e.currentTarget.style.color = T.textMuted}>
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <Zap size={18} style={{ color: T.primary }} />
              <span style={{ color: T.text, fontWeight: 700, fontSize: '16px' }}>Modo rápido</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {selected.length > 0 && (
              <button onClick={() => setShowExport(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{ background: T.cardBg2, color: T.text, border: `1px solid ${T.cardBorder}`, cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                <Download size={14} /> Exportar
              </button>
            )}
            <button onClick={handleSaveIntent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ background: '#C9344C', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
              onMouseEnter={e => e.currentTarget.style.background = '#A02438'}
              onMouseLeave={e => e.currentTarget.style.background = '#C9344C'}>
              <Save size={14} /> Guardar horario
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Info banner */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl mb-5"
          style={{ background: T.accentIndigo.bg, border: `1px solid ${T.accentIndigo.border}` }}>
          <Info size={15} style={{ color: T.accentIndigo.color, flexShrink: 0, marginTop: '1px' }} />
          <p style={{ color: T.accentIndigo.color, fontSize: '13px', lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600 }}>Modo rápido — </span>
            sin cuenta. Arma tu horario y regístrate o inicia sesión para guardarlo permanentemente.
          </p>
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

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
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
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {selected.map(s => {
                    const conflicted = conflictos.some(c => c.materias.some(m => m.nombre === s.nombre));
                    const isExpanded = expandedGroups.has(s.codigo);
                    const subjectData = subjects.find(sub => sub.codigo === s.codigo);
                    return (
                      <div key={s.codigo} className="rounded-xl overflow-visible"
                        style={{ background: T.cardBg2, border: `1.5px solid ${conflicted ? T.error.text : s.color}30` }}>
                        <div className="flex items-center gap-2 p-2.5">
                          <button onClick={(e) => openColorPicker(s.codigo, e)} title="Cambiar color"
                            style={{ width: '14px', height: '14px', borderRadius: '50%', background: s.color, border: 'none', cursor: 'pointer', flexShrink: 0, padding: 0 }} />
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <p style={{ color: T.text, fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nombre}</p>
                            <p style={{ color: T.textSubtle, fontSize: '10px' }}>G-{s.grupo}{s.docente ? ` · ${s.docente.split(' ').slice(0, 2).join(' ')}` : ''}</p>
                          </div>
                          {conflicted && <AlertTriangle size={12} style={{ color: T.error.text, flexShrink: 0 }} />}
                          {subjectData && subjectData.grupos && subjectData.grupos.length > 1 && (
                            <button onClick={() => toggleExpanded(s.codigo)} title="Cambiar grupo"
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

          {/* Weekly grid */}
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

      {/* Hidden export grid */}
      <div ref={exportRef} style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '900px', background: T.isDark ? '#16162a' : '#ffffff', padding: '16px' }}>
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

      {/* Color picker */}
      {colorPickerFor && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setColorPickerFor(null)} />
          <div className="fixed z-[9999] p-2 rounded-xl shadow-2xl"
            style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, top: `${colorPickerPos.top}px`, left: `${colorPickerPos.left}px`, width: '164px' }}>
            <p style={{ color: T.textMuted, fontSize: '10px', fontWeight: 600, marginBottom: '6px' }}>Elige un color</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
              {COLOR_PRESETS.map(c => {
                const currentColor = selected.find(s => s.codigo === colorPickerFor)?.color;
                return (
                  <button key={c} onClick={() => { changeColor(colorPickerFor!, c); setColorPickerFor(null); }}
                    style={{ width: '24px', height: '24px', borderRadius: '6px', background: c, border: currentColor === c ? '2px solid white' : '2px solid transparent', cursor: 'pointer', padding: 0, outline: currentColor === c ? `2px solid ${c}` : 'none' }} />
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Block info modal */}
      {blockInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={() => setBlockInfo(null)}>
          <div className="w-full max-w-md rounded-2xl p-5"
            style={{ background: T.isDark ? 'rgba(30,30,52,0.97)' : 'rgba(255,255,255,0.97)', border: `1px solid ${blockInfo.item.color}55`, boxShadow: `0 24px 60px rgba(0,0,0,0.5)`, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2" style={{ flex: 1, paddingRight: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: blockInfo.item.color, flexShrink: 0 }} />
                <h3 style={{ color: T.text, fontWeight: 700, fontSize: '15px', lineHeight: 1.3, wordBreak: 'break-word' }}>{blockInfo.item.nombre}</h3>
              </div>
              <button onClick={() => setBlockInfo(null)} style={{ color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>
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
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={() => !exporting && setShowExport(false)}>
          <div className="w-full max-w-xs rounded-2xl p-6"
            style={{ background: T.isDark ? 'rgba(30,30,52,0.97)' : 'rgba(255,255,255,0.97)', border: `1px solid ${T.cardBorder}`, boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 style={{ color: T.text, fontWeight: 700, fontSize: '16px' }}>Exportar horario</h3>
              {!exporting && <button onClick={() => setShowExport(false)} style={{ color: T.textSubtle, background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>}
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

      {/* Save / auth modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowSaveModal(false)}>
          <div className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: T.isDark ? 'rgba(22,22,42,0.98)' : '#FFFFFF', border: `1px solid ${T.cardBorder}`, boxShadow: T.modalShadow }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Save size={18} style={{ color: T.primary }} />
                <h3 style={{ color: T.text, fontWeight: 700, fontSize: '16px' }}>Guardar horario</h3>
              </div>
              <button onClick={() => setShowSaveModal(false)} style={{ color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div className="mb-5 p-3.5 rounded-xl" style={{ background: T.accentIndigo.bg, border: `1px solid ${T.accentIndigo.border}` }}>
              <p style={{ color: T.accentIndigo.color, fontSize: '13px', lineHeight: 1.5 }}>
                Tu horario con <strong>{selected.length} materia{selected.length !== 1 ? 's' : ''}</strong> está listo. Inicia sesión o crea una cuenta para guardarlo en tu perfil.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setShowSaveModal(false); navigate('/login', { state: { from: '/quick', returnAfterLogin: true } }); }}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl"
                style={{ background: '#C9344C', color: 'white', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
                onMouseEnter={e => e.currentTarget.style.background = '#A02438'}
                onMouseLeave={e => e.currentTarget.style.background = '#C9344C'}>
                <LogIn size={16} /> Iniciar sesión
              </button>
              <button
                onClick={() => { setShowSaveModal(false); navigate('/register', { state: { from: '/quick', returnAfterLogin: true } }); }}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl"
                style={{ background: T.cardBg2, color: T.text, border: `1px solid ${T.cardBorder}`, cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
                onMouseEnter={e => { e.currentTarget.style.background = T.btnGhostHoverBg; }}
                onMouseLeave={e => { e.currentTarget.style.background = T.cardBg2; }}>
                <UserPlus size={16} /> Crear cuenta
              </button>
            </div>

            <p style={{ color: T.textSubtle, fontSize: '11px', textAlign: 'center', marginTop: '14px' }}>
              Tu horario se guardará automáticamente después de iniciar sesión.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
