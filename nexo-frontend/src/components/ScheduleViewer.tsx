import { materiasData } from '../data/materiasData';

interface ScheduleViewerProps {
  schedule: {
    id: string;
    nombre: string;
    fecha: string;
    materias: {
      codigo: string;
      nombre: string;
      grupo: string;
      docente: string;
      color: string;
      customHex?: string;
    }[];
  } | null;
}

const diasSemana = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

export default function ScheduleViewer({ schedule }: ScheduleViewerProps) {
  if (!schedule) return null;

  const scheduleGrid: Record<string, Record<number, any[]>> = {};
  diasSemana.forEach(dia => { scheduleGrid[dia] = {}; });

  let minHora = 21;
  let maxHora = 6;

  schedule.materias.forEach(materia => {
    const materiaData = materiasData[materia.codigo];
    if (!materiaData) return;

    const grupo = materiaData.grupos.find((g: any) => g.grupo === materia.grupo);
    if (!grupo) return;

    grupo.horarios.forEach((horario: any) => {
      if (horario.horaInicio < minHora) minHora = horario.horaInicio;
      if (horario.horaFin > maxHora) maxHora = horario.horaFin;

      for (let h = horario.horaInicio; h < horario.horaFin; h++) {
        if (!scheduleGrid[horario.dia][h]) scheduleGrid[horario.dia][h] = [];
        scheduleGrid[horario.dia][h].push({ ...materia, ubicacion: horario.ubicacion });
      }
    });
  });

  if (schedule.materias.length === 0) { minHora = 7; maxHora = 21; }

  const getColorHex = (colorClass: string): string => {
    const colorMap: Record<string, string> = {
      'color-1': '#ec4899', 'color-2': '#a855f7', 'color-3': '#3b82f6',
      'color-4': '#22c55e', 'color-5': '#eab308', 'color-6': '#f97316',
      'color-7': '#06b6d4', 'color-8': '#8b5cf6', 'color-9': '#C9344C',
      'color-10': '#10b981',
    };
    return colorMap[colorClass] || '#6366F1';
  };

  const getContrastColor = (hexColor: string): string => {
    const r = parseInt(hexColor.substring(1, 3), 16);
    const g = parseInt(hexColor.substring(3, 5), 16);
    const b = parseInt(hexColor.substring(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  return (
    <div className="p-4">
      <div className="overflow-x-auto rounded-xl" style={{ background: 'rgba(13,17,23,0.8)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '500px' }}>
          <thead>
            <tr>
              <th
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: '#8B8A97',
                  padding: '10px 8px',
                  textAlign: 'center',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                  borderRight: '1px solid rgba(255,255,255,0.05)',
                  fontWeight: 600,
                  position: 'sticky',
                  top: 0,
                  fontSize: '10px',
                }}
              >
                HORA
              </th>
              {diasSemana.map(dia => (
                <th
                  key={dia}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    color: '#8B8A97',
                    padding: '10px 8px',
                    textAlign: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                    fontWeight: 600,
                    position: 'sticky',
                    top: 0,
                    fontSize: '10px',
                  }}
                >
                  {dia.slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxHora - minHora }, (_, i) => minHora + i).map(hora => (
              <tr key={hora}>
                <td
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    color: '#5C5B66',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 600,
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                    padding: '6px',
                    textAlign: 'center',
                    minWidth: '56px',
                    height: '50px',
                    fontSize: '11px',
                  }}
                >
                  {hora}:00
                </td>
                {diasSemana.map(dia => {
                  const items = scheduleGrid[dia][hora] || [];
                  return (
                    <td
                      key={dia}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        borderRight: '1px solid rgba(255,255,255,0.05)',
                        padding: '3px',
                        textAlign: 'center',
                        minWidth: '90px',
                        height: '50px',
                        verticalAlign: 'middle',
                      }}
                    >
                      {items.map((item, idx) => {
                        const bgColor = item.customHex || getColorHex(item.color);
                        const textColor = getContrastColor(bgColor);
                        return (
                          <div
                            key={idx}
                            style={{
                              background: `${bgColor}22`,
                              border: `1px solid ${bgColor}55`,
                              borderRadius: '6px',
                              padding: '3px 4px',
                              color: bgColor,
                              fontSize: '9px',
                              lineHeight: 1.3,
                            }}
                            title={`${item.nombre}\nGrupo: ${item.grupo}\nDocente: ${item.docente}\nUbicación: ${item.ubicacion || 'Por asignar'}`}
                          >
                            <div style={{ fontWeight: 700 }}>
                              {item.nombre.substring(0, 20)}{item.nombre.length > 20 ? '…' : ''}
                            </div>
                            <div style={{ opacity: 0.8 }}>G{item.grupo}</div>
                            {item.ubicacion && (
                              <div style={{ opacity: 0.7, fontSize: '8px' }}>📍 {item.ubicacion}</div>
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
    </div>
  );
}
