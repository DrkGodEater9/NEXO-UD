import { useState, useMemo } from 'react';
import { materiasData, getFacultades, getCarreras, type Materia, type Grupo } from '../data/materiasData';
import { ConfirmModal, PromptModal, AlertModal } from './Modal';

const diasSemana = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

const colors = ['color-1', 'color-2', 'color-3', 'color-4', 'color-5',
  'color-6', 'color-7', 'color-8', 'color-9', 'color-10'];

interface SelectedMateria {
  materia: Materia;
  grupo: Grupo;
  color: string;
  customHex?: string;
}

interface ScheduleItem extends SelectedMateria {
  ubicacion: string;
  codigo: string;
}

interface PlannerProps {
  onSaveSchedule?: (materias: SelectedMateria[]) => void;
}

export default function Planner({ onSaveSchedule }: PlannerProps) {
  const [selectedMaterias, setSelectedMaterias] = useState<Record<string, SelectedMateria>>({});
  const [currentMateria, setCurrentMateria] = useState<Materia | null>(null);
  const [searchText, setSearchText] = useState('');
  const [currentFacultad, setCurrentFacultad] = useState('');
  const [currentCarrera, setCurrentCarrera] = useState('');
  const [showLocations, setShowLocations] = useState(true);
  const [colorIndex, setColorIndex] = useState(0);
  const [scheduleBackgroundColor, setScheduleBackgroundColor] = useState('#16213e');
  
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsModalData, setDetailsModalData] = useState<any>(null);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictMateriaName, setConflictMateriaName] = useState('');
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [bgColorPromptOpen, setBgColorPromptOpen] = useState(false);

  const filteredMaterias = useMemo(() => {
    return Object.values(materiasData)
      .filter(m => {
        const matchesText = m.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
          m.codigo.includes(searchText);
        const matchesFacultad = !currentFacultad || m.facultad === currentFacultad;
        const matchesCarrera = !currentCarrera || m.carrera === currentCarrera;
        return matchesText && matchesFacultad && matchesCarrera;
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [searchText, currentFacultad, currentCarrera]);

  const checkConflicts = (newMateria: Materia, newGrupo: Grupo): string | null => {
    for (const codigo in selectedMaterias) {
      if (codigo === newMateria.codigo) continue;

      const existing = selectedMaterias[codigo];

      for (const newHorario of newGrupo.horarios) {
        for (const existingHorario of existing.grupo.horarios) {
          if (newHorario.dia === existingHorario.dia) {
            if (!(newHorario.horaFin <= existingHorario.horaInicio ||
              newHorario.horaInicio >= existingHorario.horaFin)) {
              return existing.materia.nombre;
            }
          }
        }
      }
    }
    return null;
  };

  const selectMateria = (materia: Materia) => {
    setCurrentMateria(materia);
  };

  const toggleGrupo = (grupo: Grupo) => {
    if (!currentMateria) return;

    const isSelected = selectedMaterias[currentMateria.codigo]?.grupo.grupo === grupo.grupo;

    if (isSelected) {
      const newSelected = { ...selectedMaterias };
      delete newSelected[currentMateria.codigo];
      setSelectedMaterias(newSelected);
    } else {
      const conflict = checkConflicts(currentMateria, grupo);
      if (conflict) {
        setConflictMateriaName(conflict);
        setConflictModalOpen(true);
        return;
      }

      setSelectedMaterias({
        ...selectedMaterias,
        [currentMateria.codigo]: {
          materia: currentMateria,
          grupo: grupo,
          color: colors[colorIndex % colors.length] || 'color-1'
        }
      });
      setColorIndex(colorIndex + 1);
    }
  };

  const changeGrupo = (codigo: string, grupo: Grupo) => {
    const materia = selectedMaterias[codigo].materia;
    const conflict = checkConflicts(materia, grupo);
    
    if (conflict) {
      setConflictMateriaName(conflict);
      setConflictModalOpen(true);
      return;
    }

    setSelectedMaterias({
      ...selectedMaterias,
      [codigo]: {
        ...selectedMaterias[codigo],
        grupo: grupo
      }
    });
  };

  const removeMateria = (codigo: string) => {
    const newSelected = { ...selectedMaterias };
    delete newSelected[codigo];
    setSelectedMaterias(newSelected);
    
    if (currentMateria && currentMateria.codigo === codigo) {
      setCurrentMateria(null);
    }
  };

  const clearAll = () => {
    setClearConfirmOpen(true);
  };

  const handleSaveSchedule = () => {
    if (Object.keys(selectedMaterias).length === 0) return;
    
    if (onSaveSchedule) {
      onSaveSchedule(Object.values(selectedMaterias));
    } else {
      alert('⚠️ Inicia sesión para guardar tu horario');
    }
  };

  const handleFacultadChange = (facultad: string) => {
    setCurrentFacultad(facultad);
    setCurrentCarrera('');
  };

  const generateSchedule = () => {
    const schedule: Record<string, Record<number, ScheduleItem[]>> = {};
    diasSemana.forEach(dia => {
      schedule[dia] = {};
    });

    let minHora = 21;
    let maxHora = 6;

    for (const codigo in selectedMaterias) {
      const { materia, grupo, color, customHex } = selectedMaterias[codigo];

      grupo.horarios.forEach(horario => {
        if (horario.horaInicio < minHora) minHora = horario.horaInicio;
        if (horario.horaFin > maxHora) maxHora = horario.horaFin;

        for (let h = horario.horaInicio; h < horario.horaFin; h++) {
          if (!schedule[horario.dia][h]) {
            schedule[horario.dia][h] = [];
          }
          schedule[horario.dia][h].push({
            materia,
            grupo,
            color,
            customHex,
            ubicacion: horario.ubicacion,
            codigo
          });
        }
      });
    }

    if (Object.keys(selectedMaterias).length === 0) {
      minHora = 6;
      maxHora = 21;
    }

    return { schedule, minHora, maxHora };
  };

  const { schedule, minHora, maxHora } = generateSchedule();

  const getColorHex = (colorClass: string): string => {
    const colorMap: Record<string, string> = {
      'color-1': '#ec4899', 'color-2': '#a855f7', 'color-3': '#3b82f6', 'color-4': '#22c55e', 'color-5': '#eab308',
      'color-6': '#f97316', 'color-7': '#06b6d4', 'color-8': '#8b5cf6', 'color-9': '#ec4899', 'color-10': '#10b981'
    };
    return colorMap[colorClass] || '#ffffff';
  };

  const getContrastColor = (hexColor: string): string => {
    const r = parseInt(hexColor.substring(1, 3), 16);
    const g = parseInt(hexColor.substring(3, 5), 16);
    const b = parseInt(hexColor.substring(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  const updateCustomColor = (codigo: string, newColor: string) => {
    setSelectedMaterias({
      ...selectedMaterias,
      [codigo]: {
        ...selectedMaterias[codigo],
        color: 'custom-color',
        customHex: newColor
      }
    });
  };

  const openDetailsModal = (item: ScheduleItem, dia: string, hora: number) => {
    const horarioEspecifico = item.grupo.horarios.find(h =>
      h.dia === dia && hora >= h.horaInicio && hora < h.horaFin
    );

    setDetailsModalData({
      materia: item.materia,
      grupo: item.grupo,
      codigo: item.codigo,
      horarioEspecifico,
      dia,
      hora
    });
    setDetailsModalOpen(true);
  };

  return (
    <>
      {/* Panel de materias seleccionadas */}
      <section className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border-color)] mb-8 shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[var(--accent-cyan)]">Materias seleccionadas</h3>
          {Object.keys(selectedMaterias).length > 0 && onSaveSchedule && (
            <button
              onClick={handleSaveSchedule}
              className="bg-gradient-to-br from-[var(--success)] to-[#22c55e] text-white font-bold px-4 py-2 rounded-lg transition-all hover:-translate-y-[2px] hover:shadow-[0_4px_15px_rgba(74,222,128,0.4)] flex items-center gap-2 text-sm"
            >
              Guardar Horario
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-[10px]">
          {Object.keys(selectedMaterias).length === 0 ? (
            <p className="text-[var(--text-muted)] italic">No hay materias seleccionadas</p>
          ) : (
            Object.keys(selectedMaterias)
              .sort((a, b) => selectedMaterias[a].materia.nombre.localeCompare(selectedMaterias[b].materia.nombre))
              .map(codigo => {
                const { materia, grupo, color, customHex } = selectedMaterias[codigo];
                const borderColor = customHex || getColorHex(color);
                
                return (
                  <div
                    key={codigo}
                    className="bg-[var(--bg-darker)] border border-[var(--border-color)] rounded-lg p-[10px_15px] flex flex-col gap-2 min-w-[250px] max-md:min-w-full"
                    style={{ borderLeftWidth: '5px', borderLeftColor: borderColor }}
                  >
                    <div className="flex justify-between items-center">
                      <strong className="text-sm">{materia.nombre}</strong>
                      <button
                        onClick={() => removeMateria(codigo)}
                        className="bg-[rgba(248,113,113,0.3)] text-[var(--danger)] w-6 h-6 rounded-full flex items-center justify-center text-base hover:bg-[var(--danger)] hover:text-white transition-all"
                        title="Eliminar"
                      >
                        ×
                      </button>
                    </div>
                    
                    <CustomSelect
                      materia={materia}
                      currentGrupo={grupo}
                      onChange={(g) => changeGrupo(codigo, g)}
                      checkConflicts={(g) => checkConflicts(materia, g)}
                    />
                    
                    <div className="flex items-center gap-3 mt-2 p-[10px] rounded-lg border border-[rgba(255,255,255,0.1)]"
                      style={{
                        background: customHex
                          ? `rgba(${parseInt(customHex.slice(1, 3), 16)}, ${parseInt(customHex.slice(3, 5), 16)}, ${parseInt(customHex.slice(5, 7), 16)}, 0.15)`
                          : 'linear-gradient(135deg, rgba(0, 212, 255, 0.05), rgba(255, 215, 0, 0.05))'
                      }}
                    >
                      <span className="text-[0.85rem] text-[var(--text-muted)]">Color:</span>
                      <input
                        type="color"
                        value={customHex || getColorHex(color)}
                        onChange={(e) => updateCustomColor(codigo, e.target.value)}
                        className="w-[45px] h-[45px] border-[3px] border-[var(--accent-cyan)] rounded-full cursor-pointer shadow-[0_4px_12px_rgba(0,212,255,0.3)] hover:scale-110 hover:rotate-[15deg] transition-all"
                        style={{ appearance: 'none', padding: 0 }}
                      />
                      <input
                        type="text"
                        value={(customHex || getColorHex(color)).toUpperCase()}
                        onChange={(e) => {
                          let val = e.target.value.trim();
                          if (!val.startsWith('#')) val = '#' + val;
                          if (/^#[0-9A-F]{6}$/i.test(val)) {
                            updateCustomColor(codigo, val);
                          }
                        }}
                        className="bg-[var(--bg-darker)] border-2 border-[var(--border-color)] text-white px-3 py-2 rounded-md text-[0.85rem] font-mono font-bold w-[95px] text-center focus:outline-none focus:border-[var(--accent-yellow)] focus:shadow-[0_0_10px_rgba(255,215,0,0.3)]"
                        maxLength={7}
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </section>

      {/* Grid principal */}
      <div className="grid grid-cols-[320px_360px_1fr] gap-10 mb-10 items-start
        max-[1600px]:grid-cols-[300px_320px_1fr] max-[1600px]:gap-5
        max-[1400px]:grid-cols-[1fr_1fr] max-[1400px]:[grid-template-areas:'selection_groups'_'schedule_schedule']
        max-[900px]:grid-cols-1 max-[900px]:[grid-template-areas:'selection'_'groups'_'schedule'] max-[900px]:gap-6"
      >
        {/* Panel de Materias */}
        <section className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)] shadow-[0_4px_15px_rgba(0,0,0,0.3)]
          max-[1400px]:[grid-area:selection]"
        >
          <h2 className="text-[var(--accent-cyan)] text-[1.1rem] mb-4 pb-[10px] border-b-2 border-[var(--border-color)]">
            Selecciona tus materias
          </h2>

          <div className="flex flex-col gap-2 mb-4">
            <select
              value={currentFacultad}
              onChange={(e) => handleFacultadChange(e.target.value)}
              className="w-full p-[10px_12px] bg-[var(--bg-darker)] border-2 border-[var(--border-color)] rounded-lg text-white text-[0.85rem] cursor-pointer transition-all hover:border-[var(--accent-cyan)] focus:outline-none focus:border-[var(--accent-yellow)] focus:shadow-[0_0_10px_rgba(255,215,0,0.2)]"
            >
              <option value="">Todas las Facultades</option>
              {getFacultades().map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>

            <select
              value={currentCarrera}
              onChange={(e) => setCurrentCarrera(e.target.value)}
              className="w-full p-[10px_12px] bg-[var(--bg-darker)] border-2 border-[var(--border-color)] rounded-lg text-white text-[0.85rem] cursor-pointer transition-all hover:border-[var(--accent-cyan)] focus:outline-none focus:border-[var(--accent-yellow)] focus:shadow-[0_0_10px_rgba(255,215,0,0.2)]"
            >
              <option value="">Todas las Carreras</option>
              {getCarreras(currentFacultad).map(c => (
                <option key={c} value={c}>{c.length > 40 ? c.substring(0, 40) + '...' : c}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Buscar materia..."
              className="w-full p-[10px_15px] bg-[var(--bg-darker)] border-2 border-[var(--border-color)] rounded-lg text-white text-[0.9rem] transition-all focus:outline-none focus:border-[var(--accent-cyan)] focus:shadow-[0_0_10px_rgba(0,212,255,0.3)]"
            />
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            {filteredMaterias.length === 0 ? (
              <p className="text-[var(--text-muted)] text-center py-10 italic">
                No se encontraron materias
              </p>
            ) : (
              filteredMaterias.map(materia => (
                <div
                  key={materia.codigo}
                  onClick={() => selectMateria(materia)}
                  className={`bg-[var(--bg-darker)] p-[12px_15px] mb-2 rounded-lg cursor-pointer border-2 transition-all hover:border-[var(--accent-cyan)] hover:translate-x-[5px] ${
                    currentMateria?.codigo === materia.codigo ? 'border-[var(--accent-yellow)] bg-[rgba(255,215,0,0.1)]' : 'border-transparent'
                  }`}
                >
                  <div className="text-[var(--accent-cyan)] font-bold text-[0.8rem]">
                    Cod: {materia.codigo}
                  </div>
                  <div className="text-white mt-1 text-[0.85rem]">{materia.nombre}</div>
                  <div className="text-[var(--accent-yellow)] text-[0.7rem] mt-1 opacity-80">
                    🏛️ {materia.facultad || 'Sin facultad'}
                  </div>
                  <div className="text-[var(--text-muted)] text-[0.7rem] italic">
                    {materia.carrera && materia.carrera.length > 35
                      ? materia.carrera.substring(0, 35) + '...'
                      : (materia.carrera || 'General')}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Panel de Grupos */}
        <section className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)] shadow-[0_4px_15px_rgba(0,0,0,0.3)]
          max-[1400px]:[grid-area:groups]"
        >
          <h2 className="text-[var(--accent-cyan)] text-[1.1rem] mb-4 pb-[10px] border-b-2 border-[var(--border-color)]">
            Grupos disponibles
          </h2>
          <div className="max-h-[500px] overflow-y-auto">
            {!currentMateria ? (
              <p className="text-[var(--text-muted)] text-center py-10 italic">
                Selecciona una materia para ver sus grupos
              </p>
            ) : (
              <>
                <h3 className="text-[var(--accent-yellow)] mb-4">{currentMateria.nombre}</h3>
                {currentMateria.grupos.map(grupo => {
                  const isSelected = selectedMaterias[currentMateria.codigo]?.grupo.grupo === grupo.grupo;
                  
                  return (
                    <div
                      key={grupo.grupo}
                      onClick={() => toggleGrupo(grupo)}
                      className={`bg-[var(--bg-darker)] p-4 mb-[10px] rounded-[10px] border-l-4 cursor-pointer transition-all hover:bg-[rgba(0,212,255,0.1)] hover:scale-[1.02] ${
                        isSelected ? 'border-l-[var(--success)] bg-[rgba(74,222,128,0.1)]' : 'border-l-[var(--accent-cyan)]'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-[10px]">
                        <span className="text-[var(--accent-yellow)] font-bold text-[0.95rem]">
                          GRP. {grupo.grupo}
                        </span>
                        <span className="bg-[var(--bg-card)] px-[10px] py-[3px] rounded-2xl text-[0.75rem] text-[var(--text-muted)]">
                          📝 {grupo.inscritos} inscritos
                        </span>
                      </div>
                      <div className="text-[var(--text-muted)] text-[0.8rem] mb-[10px]">
                        👤 {grupo.docente}
                      </div>
                      <div className="flex flex-wrap gap-[5px]">
                        {grupo.horarios.map((h, idx) => (
                          <span
                            key={idx}
                            className="bg-[var(--bg-card)] px-[10px] py-1 rounded-[5px] text-[0.75rem] text-[var(--accent-cyan)] border border-[var(--border-color)]"
                          >
                            {h.dia.substring(0, 3)} {h.horaInicio}-{h.horaFin}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </section>

        {/* Panel de Horario */}
        <section className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)] shadow-[0_4px_15px_rgba(0,0,0,0.3)] min-w-0
          max-[1400px]:[grid-area:schedule]"
        >
          <div className="flex justify-between items-center mb-4 pb-[10px] border-b-2 border-[var(--border-color)] flex-wrap gap-[10px]">
            <h2 className="text-[var(--accent-cyan)] text-[1.1rem] m-0 pb-0 border-b-0">
              Tu Horario
            </h2>
            <div className="flex items-center gap-[10px] flex-wrap">
              <div className="flex items-center gap-[6px]">
                <span className="text-white text-[0.75rem] font-medium">Salones</span>
                <div
                  onClick={() => setShowLocations(!showLocations)}
                  className={`relative w-[50px] h-[26px] rounded-[13px] cursor-pointer border-2 transition-all ${
                    showLocations
                      ? 'bg-[var(--accent-cyan)] border-[var(--accent-cyan)]'
                      : 'bg-[var(--bg-darker)] border-[var(--border-color)]'
                  }`}
                >
                  <div
                    className={`absolute w-[18px] h-[18px] rounded-full bg-white top-[2px] transition-all ${
                      showLocations ? 'left-[26px]' : 'left-[2px]'
                    }`}
                  />
                </div>
              </div>
              <button
                onClick={() => setBgColorPromptOpen(true)}
                className="bg-gradient-to-br from-[var(--accent-yellow)] to-[#e6c200] text-[var(--bg-dark)] font-bold px-[14px] py-2 rounded-lg cursor-pointer transition-all shadow-[0_4px_15px_rgba(0,212,255,0.4)] flex items-center gap-[6px] text-[0.85rem] whitespace-nowrap hover:-translate-y-[2px] hover:shadow-[0_6px_20px_rgba(0,212,255,0.6)]"
              >
                Fondo
              </button>
              <button
                className="bg-gradient-to-br from-[var(--accent-cyan)] to-[#00b8e6] text-[var(--bg-dark)] font-bold px-[14px] py-2 rounded-lg cursor-pointer transition-all shadow-[0_4px_15px_rgba(0,212,255,0.4)] flex items-center gap-[6px] text-[0.85rem] whitespace-nowrap hover:-translate-y-[2px] hover:shadow-[0_6px_20px_rgba(0,212,255,0.6)]"
              >
                Descargar
              </button>
              <button
                onClick={clearAll}
                className="bg-gradient-to-br from-[#ef4444] to-[#b91c1c] text-white font-bold px-[14px] py-2 rounded-lg cursor-pointer transition-all shadow-[0_4px_15px_rgba(0,212,255,0.4)] flex items-center gap-[6px] text-[0.85rem] whitespace-nowrap hover:-translate-y-[2px] hover:shadow-[0_6px_20px_rgba(239,68,68,0.6)]"
              >
                Limpiar
              </button>
            </div>
          </div>

          <div className="overflow-x-auto" style={{ backgroundColor: scheduleBackgroundColor }}>
            <table className="w-full border-collapse text-[0.85rem] font-['Inter','Poppins',sans-serif] font-semibold">
              <thead>
                <tr>
                  <th className="bg-[var(--bg-darker)] text-[var(--accent-cyan)] p-[10px_8px] text-center border border-[var(--border-color)] font-semibold sticky top-0">
                    HORA
                  </th>
                  {diasSemana.map(dia => (
                    <th
                      key={dia}
                      className="bg-[var(--bg-darker)] text-[var(--accent-cyan)] p-[10px_8px] text-center border border-[var(--border-color)] font-semibold sticky top-0"
                    >
                      {dia}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: maxHora - minHora }, (_, i) => minHora + i).map(hora => (
                  <tr key={hora}>
                    <td className="bg-[var(--bg-darker)] text-[var(--accent-yellow)] font-bold border border-[var(--border-color)] p-[5px] text-center align-middle min-w-[70px] h-[45px]">
                      {hora}:00
                    </td>
                    {diasSemana.map(dia => {
                      const items = schedule[dia][hora] || [];
                      
                      return (
                        <td
                          key={dia}
                          className="border border-[var(--border-color)] p-[5px] text-center align-middle min-w-[100px] h-[45px] relative"
                        >
                          {items.map((item, idx) => {
                            const bgColor = item.customHex || '';
                            const textColor = item.customHex ? getContrastColor(item.customHex) : 'inherit';
                            
                            return (
                              <div
                                key={idx}
                                onClick={() => openDetailsModal(item, dia, hora)}
                                className={`p-1 rounded-[5px] text-[0.75rem] leading-[1.3] cursor-pointer transition-all hover:scale-[1.02] hover:shadow-[0_2px_8px_rgba(0,0,0,0.3)] ${!bgColor ? item.color : ''}`}
                                style={bgColor ? {
                                  backgroundColor: bgColor,
                                  color: textColor
                                } : {}}
                                title={`${item.materia.nombre}\nGrupo: ${item.grupo.grupo}\nDocente: ${item.grupo.docente}\nUbicación: ${item.ubicacion || 'Por asignar'}`}
                              >
                                <div className="font-bold mb-[2px]">
                                  {item.materia.nombre.substring(0, 22)}
                                  {item.materia.nombre.length > 22 ? '...' : ''}
                                </div>
                                <div className="text-[0.8rem] opacity-90">{item.grupo.grupo}</div>
                                {showLocations && item.ubicacion && (
                                  <div className="text-[0.7rem] opacity-95 mt-[3px] leading-[1.2]">
                                    📍 {item.ubicacion}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Modal de Detalles */}
      {detailsModalOpen && detailsModalData && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.7)] flex justify-center items-center z-[1000] [backdrop-filter:blur(5px)]"
          onClick={() => setDetailsModalOpen(false)}
        >
          <div
            className="bg-[var(--bg-card)] w-[90%] max-w-[500px] rounded-xl border border-[var(--accent-cyan)] shadow-[0_0_20px_rgba(0,212,255,0.2)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[var(--bg-darker)] p-[15px_20px] flex justify-between items-center border-b-2 border-[var(--border-color)]">
              <h3 className="text-[var(--accent-yellow)] text-[1.2rem] m-0">
                {detailsModalData.materia.nombre}
              </h3>
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="bg-transparent border-none text-[var(--text-muted)] text-[2rem] cursor-pointer leading-none hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-[10px]">
                <span className="text-[var(--accent-cyan)] font-bold text-[0.9rem]">Grupo:</span>
                <span className="text-white text-right text-[0.95rem]">
                  {detailsModalData.grupo.grupo}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-[10px]">
                <span className="text-[var(--accent-cyan)] font-bold text-[0.9rem]">Docente:</span>
                <span className="text-white text-right text-[0.95rem]">
                  {detailsModalData.horarioEspecifico?.docente || detailsModalData.grupo.docente}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-[10px]">
                <span className="text-[var(--accent-cyan)] font-bold text-[0.9rem]">Horario:</span>
                <span className="text-white text-right text-[0.95rem]">
                  {detailsModalData.horarioEspecifico
                    ? `${detailsModalData.dia} ${detailsModalData.horarioEspecifico.horaInicio}:00 - ${detailsModalData.horarioEspecifico.horaFin}:00`
                    : ''}
                </span>
              </div>
              <div className="flex flex-col items-start gap-[5px] border-b border-[var(--border-color)] pb-[10px]">
                <span className="text-[var(--accent-cyan)] font-bold text-[0.9rem]">Ubicación:</span>
                <span className="text-white text-left bg-[var(--bg-darker)] p-[10px] rounded-lg w-full mt-[5px] border-l-[3px] border-l-[var(--accent-yellow)]">
                  {detailsModalData.horarioEspecifico?.ubicacion || 'Por asignar'}
                </span>
              </div>
            </div>
            <div className="p-[15px_20px] bg-[var(--bg-darker)] border-t border-[var(--border-color)] text-center">
              <button
                onClick={() => {
                  removeMateria(detailsModalData.codigo);
                  setDetailsModalOpen(false);
                }}
                className="bg-gradient-to-br from-[#ef4444] to-[#b91c1c] text-white px-5 py-[10px] rounded-lg cursor-pointer font-bold transition-all w-full hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(239,68,68,0.4)]"
              >
                Eliminar Materia del Horario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Conflicto */}
      {conflictModalOpen && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.7)] flex justify-center items-center z-[1000] [backdrop-filter:blur(5px)]"
          onClick={() => setConflictModalOpen(false)}
        >
          <div
            className="bg-[var(--bg-card)] w-[90%] max-w-[500px] rounded-xl border border-[var(--accent-cyan)] shadow-[0_0_20px_rgba(0,212,255,0.2)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[var(--bg-darker)] p-[15px_20px] flex justify-between items-center border-b-2 border-[var(--border-color)]">
              <h3 className="text-[var(--accent-yellow)] text-[1.2rem] m-0">
                ⚠️ Conflicto de Horario
              </h3>
              <button
                onClick={() => setConflictModalOpen(false)}
                className="bg-transparent border-none text-[var(--text-muted)] text-[2rem] cursor-pointer leading-none hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-5">
              <p className="text-white mb-4">El grupo que intentas seleccionar presenta un cruce con:</p>
              <div className="bg-[rgba(248,113,113,0.2)] border-l-4 border-l-[var(--danger)] p-4 rounded text-[var(--danger)] font-bold mb-4">
                {conflictMateriaName}
              </div>
              <p className="text-[var(--text-muted)] text-[0.9rem]">
                Por favor selecciona otro grupo o elimina la materia en conflicto.
              </p>
            </div>
            <div className="p-[15px_20px] bg-[var(--bg-darker)] border-t border-[var(--border-color)] text-center">
              <button
                onClick={() => setConflictModalOpen(false)}
                className="bg-[var(--bg-card)] text-white px-5 py-[10px] rounded-lg cursor-pointer font-bold transition-all hover:bg-[var(--border-color)]"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Limpiar */}
      <ConfirmModal
        isOpen={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        onConfirm={() => {
          setSelectedMaterias({});
          setColorIndex(0);
          setCurrentMateria(null);
        }}
        title="Confirmar"
        message="¿Estás seguro de borrar todo el horario?"
        type="danger"
      />

      {/* Modal de Prompt para Color de Fondo */}
      <PromptModal
        isOpen={bgColorPromptOpen}
        onClose={() => setBgColorPromptOpen(false)}
        onConfirm={(newColor) => {
          if (newColor && /^#[0-9A-F]{6}$/i.test(newColor)) {
            setScheduleBackgroundColor(newColor);
          }
        }}
        title="Color de Fondo"
        message="Ingresa el color de fondo en formato hexadecimal:"
        defaultValue={scheduleBackgroundColor}
        placeholder="#16213e"
      />
    </>
  );
}

// Componente CustomSelect
function CustomSelect({
  materia,
  currentGrupo,
  onChange,
  checkConflicts
}: {
  materia: Materia;
  currentGrupo: Grupo;
  onChange: (grupo: Grupo) => void;
  checkConflicts: (grupo: Grupo) => string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const docenteCorto = currentGrupo.docente
    ? currentGrupo.docente.split(' ')[0] + ' ' + (currentGrupo.docente.split(' ')[1] || '')
    : 'Sin Docente';

  return (
    <div className="relative w-full my-[10px]">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[linear-gradient(135deg,rgba(0,212,255,0.1),rgba(0,212,255,0.05))] border-2 border-[var(--accent-cyan)] p-[12px_15px] rounded-lg cursor-pointer flex justify-between items-center text-[0.9rem] text-white transition-all shadow-[0_2px_8px_rgba(0,212,255,0.2)] hover:border-[var(--accent-yellow)] hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(0,212,255,0.3)]"
      >
        <span>👥 Grp. {currentGrupo.grupo} - {docenteCorto}</span>
        <span className={`text-[1.2em] transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[999]"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-[calc(100%+5px)] left-0 w-full bg-[var(--bg-card)] border-2 border-[var(--accent-cyan)] rounded-lg shadow-[0_8px_25px_rgba(0,0,0,0.6)] z-[1000] max-h-[300px] overflow-y-auto [animation:slideDown_0.3s_ease]">
            {materia.grupos.map(g => {
              const conflict = checkConflicts(g);
              const isSelected = g.grupo === currentGrupo.grupo;
              const gDocenteCorto = g.docente
                ? g.docente.split(' ')[0] + ' ' + (g.docente.split(' ')[1] || '')
                : 'Sin Docente';

              return (
                <div
                  key={g.grupo}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!conflict) {
                      onChange(g);
                      setIsOpen(false);
                    }
                  }}
                  className={`p-[12px_15px] cursor-pointer border-b border-[rgba(255,255,255,0.05)] transition-all hover:bg-[rgba(0,212,255,0.15)] hover:pl-5 ${
                    isSelected ? 'bg-[linear-gradient(90deg,rgba(0,212,255,0.3),rgba(0,212,255,0.1))] border-l-4 border-l-[var(--accent-cyan)] font-bold' : ''
                  } ${conflict ? 'opacity-50 cursor-not-allowed border-l-4 border-l-[var(--danger)]' : ''}`}
                  style={conflict ? {
                    background: 'repeating-linear-gradient(45deg, rgba(248, 113, 113, 0.1), rgba(248, 113, 113, 0.1) 10px, rgba(40, 40, 40, 0.3) 10px, rgba(40, 40, 40, 0.3) 20px)'
                  } : {}}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <strong className="text-[0.95rem]">{g.grupo}</strong>
                      <div className="text-[0.75rem] opacity-80 mt-[2px]">{gDocenteCorto}</div>
                    </div>
                    <div className="text-[0.7rem] opacity-70">📄 {g.inscritos} inscritos</div>
                  </div>
                  {conflict && (
                    <div className="text-[0.75em] text-[var(--danger)] mt-[5px] font-bold">
                      ⚠️ Conflicto con: {conflict}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}