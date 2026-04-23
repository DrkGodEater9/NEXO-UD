interface Horario {
  dia: string;
  horaInicio: number;
  horaFin: number;
  ubicacion?: string;
}

interface MateriaSaved {
  codigo: string;
  nombre: string;
  grupo: string;
  docente?: string;
  color?: string;
  customHex?: string;
  horarios?: Horario[];
}

interface ScheduleViewerProps {
  schedule: {
    id: string;
    nombre: string;
    materias: MateriaSaved[];
  } | null;
}

const diasSemana = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
const diasCortos: Record<string, string> = { LUNES: 'LUN', MARTES: 'MAR', MIERCOLES: 'MIE', JUEVES: 'JUE', VIERNES: 'VIE', SABADO: 'SAB' };

export default function ScheduleViewer({ schedule }: ScheduleViewerProps) {
  if (!schedule) return null;

  // Build grid from horarios stored directly in each materia
  const scheduleGrid: Record<string, Record<number, MateriaSaved[]>> = {};
  diasSemana.forEach(dia => { scheduleGrid[dia] = {}; });

  let minHora = 22;
  let maxHora = 6;

  schedule.materias.forEach(materia => {
    const horarios: Horario[] = materia.horarios || [];
    horarios.forEach(h => {
      if (h.horaInicio < minHora) minHora = h.horaInicio;
      if (h.horaFin > maxHora) maxHora = h.horaFin;
      for (let hr = h.horaInicio; hr < h.horaFin; hr++) {
        if (!scheduleGrid[h.dia][hr]) scheduleGrid[h.dia][hr] = [];
        scheduleGrid[h.dia][hr].push({ ...materia, horarios: undefined });
      }
    });
  });

  if (minHora > maxHora) { minHora = 7; maxHora = 21; }

  const horasToRender = Array.from({ length: maxHora - minHora }, (_, i) => minHora + i);

  return (
    <div className="p-4">
      <div className="overflow-x-auto rounded-xl" style={{ background: 'rgba(13,17,23,0.8)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '500px' }}>
          <thead>
            <tr>
              <th style={{
                background: 'rgba(255,255,255,0.04)', color: '#8B8A97', padding: '10px 8px',
                textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.07)',
                borderRight: '1px solid rgba(255,255,255,0.05)', fontWeight: 600,
                position: 'sticky', top: 0, fontSize: '10px',
              }}>
                HORA
              </th>
              {diasSemana.map(dia => (
                <th key={dia} style={{
                  background: 'rgba(255,255,255,0.04)', color: '#8B8A97', padding: '10px 8px',
                  textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.07)',
                  borderRight: '1px solid rgba(255,255,255,0.05)', fontWeight: 600,
                  position: 'sticky', top: 0, fontSize: '10px',
                }}>
                  {diasCortos[dia]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {horasToRender.map(hora => (
              <tr key={hora}>
                <td style={{
                  background: 'rgba(255,255,255,0.02)', color: '#5C5B66',
                  fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
                  borderBottom: '1px solid rgba(255,255,255,0.04)', borderRight: '1px solid rgba(255,255,255,0.05)',
                  padding: '6px', textAlign: 'center', minWidth: '56px', height: '50px', fontSize: '11px',
                }}>
                  {hora}:00
                </td>
                {diasSemana.map(dia => {
                  const items = scheduleGrid[dia][hora] || [];
                  return (
                    <td key={dia} style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)', borderRight: '1px solid rgba(255,255,255,0.05)',
                      padding: '3px', textAlign: 'center', minWidth: '90px', height: '50px', verticalAlign: 'middle',
                    }}>
                      {items.map((item, idx) => {
                        const bgColor = item.customHex || item.color || '#6366F1';
                        return (
                          <div key={idx} style={{
                            background: `${bgColor}22`, border: `1px solid ${bgColor}55`,
                            borderRadius: '6px', padding: '3px 4px', color: bgColor,
                            fontSize: '9px', lineHeight: 1.3,
                          }}
                            title={`${item.nombre}\nGrupo: ${item.grupo}${item.docente ? `\nDocente: ${item.docente}` : ''}`}>
                            <div style={{ fontWeight: 700 }}>
                              {item.nombre.substring(0, 20)}{item.nombre.length > 20 ? '…' : ''}
                            </div>
                            <div style={{ opacity: 0.8 }}>G{item.grupo}</div>
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
