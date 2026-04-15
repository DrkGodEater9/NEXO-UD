import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { useThemeTokens } from '../context/useThemeTokens';
import { materiasData, getFacultades, getCarreras } from '../data/materiasData';
import { Search, Filter, ChevronDown, ChevronUp, Plus, MapPin, User, BookOpen, X } from 'lucide-react';

const CREDITOS_OPTIONS = ['1', '2', '3', '4', '5', '6'];
const FRANJAS = ['Mañana (6-12h)', 'Tarde (12-18h)', 'Noche (18-22h)'];

export default function SearchPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const T = useThemeTokens();
  const [searchText, setSearchText] = useState('');
  const [selectedFacultad, setSelectedFacultad] = useState('');
  const [selectedCarrera, setSelectedCarrera] = useState('');
  const [selectedCreditos, setSelectedCreditos] = useState('');
  const [selectedFranja, setSelectedFranja] = useState('');
  const [expandedMateria, setExpandedMateria] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  const facultades = getFacultades();
  const carreras = getCarreras(selectedFacultad);

  const filtered = useMemo(() => {
    const text = searchText.toLowerCase();
    return Object.values(materiasData)
      .filter(m => {
        const matchText = !text || m.nombre.toLowerCase().includes(text) || m.codigo.includes(text);
        const matchFacultad = !selectedFacultad || m.facultad === selectedFacultad;
        const matchCarrera = !selectedCarrera || m.carrera === selectedCarrera;
        const matchCreditos = !selectedCreditos || String(m.creditos) === selectedCreditos;
        const matchFranja = !selectedFranja || m.grupos.some(g =>
          g.horarios.some(h => {
            if (selectedFranja.startsWith('Mañana')) return h.horaInicio >= 6 && h.horaFin <= 12;
            if (selectedFranja.startsWith('Tarde')) return h.horaInicio >= 12 && h.horaFin <= 18;
            if (selectedFranja.startsWith('Noche')) return h.horaInicio >= 18;
            return true;
          })
        );
        return matchText && matchFacultad && matchCarrera && matchCreditos && matchFranja;
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
      .slice(0, 50);
  }, [searchText, selectedFacultad, selectedCarrera, selectedCreditos, selectedFranja]);

  const clearFilters = () => {
    setSelectedFacultad('');
    setSelectedCarrera('');
    setSelectedCreditos('');
    setSelectedFranja('');
  };

  const activeFilters = [selectedFacultad, selectedCarrera, selectedCreditos, selectedFranja].filter(Boolean).length;

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 style={{ color: T.text, fontWeight: 700, fontSize: '22px', letterSpacing: '-0.02em' }}>Buscar materias</h1>
          <p style={{ color: T.textMuted, fontSize: '14px', marginTop: '4px' }}>Explora el catálogo de materias de la Universidad Distrital</p>
        </div>

        {/* Search bar */}
        <div className="relative mb-4" style={{ maxWidth: '640px' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: T.inputIcon }} />
          <input
            type="text" value={searchText} onChange={e => setSearchText(e.target.value)}
            placeholder="Buscar por nombre, código o profesor..."
            className="w-full py-4 pl-12 pr-12 rounded-2xl outline-none transition-all"
            style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '15px' }}
            onFocus={e => { e.currentTarget.style.borderColor = T.inputFocusBorder; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.inputFocusShadow}`; }}
            onBlur={e => { e.currentTarget.style.borderColor = T.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
          />
          {searchText && (
            <button onClick={() => setSearchText('')}
              style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: T.inputIcon, background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
            style={{
              background: showFilters ? T.filterActiveBg : T.filterBg,
              border: `1px solid ${showFilters ? T.filterActiveBorder : T.filterBorder}`,
              color: showFilters ? T.filterActiveColor : T.filterColor,
              cursor: 'pointer', fontSize: '14px', fontWeight: 500,
            }}>
            <Filter size={15} />
            Filtros
            {activeFilters > 0 && (
              <span className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: '#C9344C', color: 'white', fontSize: '10px', fontWeight: 700 }}>
                {activeFilters}
              </span>
            )}
          </button>
          {activeFilters > 0 && (
            <button onClick={clearFilters} className="flex items-center gap-1.5"
              style={{ color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}>
              <X size={14} /> Limpiar filtros
            </button>
          )}
          <span style={{ color: T.textSubtle, fontSize: '13px', marginLeft: 'auto' }}>
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="p-5 rounded-2xl mb-5 grid grid-cols-2 md:grid-cols-4 gap-3 animate-slide-down"
            style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}>
            {[
              { label: 'Facultad', value: selectedFacultad, options: facultades, onChange: (v: string) => { setSelectedFacultad(v); setSelectedCarrera(''); } },
              { label: 'Proyecto curricular', value: selectedCarrera, options: carreras, onChange: (v: string) => setSelectedCarrera(v) },
              { label: 'Créditos', value: selectedCreditos, options: CREDITOS_OPTIONS, onChange: (v: string) => setSelectedCreditos(v) },
              { label: 'Franja horaria', value: selectedFranja, options: FRANJAS, onChange: (v: string) => setSelectedFranja(v) },
            ].map(({ label, value, options, onChange }) => (
              <div key={label}>
                <label style={{ color: T.textMuted, fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>{label}</label>
                <select value={value} onChange={e => onChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl outline-none transition-all"
                  style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: value ? T.inputText : T.inputIcon, fontSize: '13px', cursor: 'pointer', appearance: 'none' }}>
                  <option value="">Todas</option>
                  {options.map((o: string) => <option key={o} value={o} style={{ background: T.selectOptionBg }}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        <div className="space-y-3">
          {filtered.length === 0 && (searchText || activeFilters > 0) && (
            <div className="flex flex-col items-center justify-center py-16">
              <Search size={32} style={{ color: T.textSubtle, marginBottom: '12px' }} />
              <p style={{ color: T.textMuted, fontSize: '15px', fontWeight: 500 }}>No se encontraron materias</p>
              <p style={{ color: T.textSubtle, fontSize: '13px', marginTop: '4px' }}>Intenta con otros términos o filtros</p>
            </div>
          )}
          {!searchText && activeFilters === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <Search size={32} style={{ color: T.textSubtle, marginBottom: '12px' }} />
              <p style={{ color: T.textMuted, fontSize: '15px', fontWeight: 500 }}>Busca una materia para comenzar</p>
              <p style={{ color: T.textSubtle, fontSize: '13px', marginTop: '4px' }}>Escribe el nombre, código o usa los filtros</p>
            </div>
          )}
          {filtered.map(materia => (
            <div key={materia.codigo}
              className="rounded-2xl overflow-hidden transition-all duration-200"
              style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow }}>
              <div
                className="flex items-center gap-4 p-4 cursor-pointer"
                onClick={() => setExpandedMateria(expandedMateria === materia.codigo ? null : materia.codigo)}
                onMouseEnter={e => { e.currentTarget.style.background = T.cardBg2; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono-num" style={{ color: T.primary, fontSize: '11px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{materia.codigo}</span>
                    <span className="px-2 py-0.5 rounded-full" style={{ background: T.primaryBg, color: T.primary, fontSize: '10px', fontWeight: 600, border: `1px solid ${T.primaryBorder}` }}>{materia.creditos} cr.</span>
                    <span className="px-2 py-0.5 rounded-full" style={{ background: T.tagBg, color: T.tagColor, fontSize: '10px', fontWeight: 500, border: `1px solid ${T.tagBorder}` }}>{materia.facultad}</span>
                  </div>
                  <p style={{ color: T.text, fontWeight: 600, fontSize: '15px', marginTop: '4px' }}>{materia.nombre}</p>
                  <p style={{ color: T.textMuted, fontSize: '12px', marginTop: '2px' }}>{materia.grupos.length} grupo{materia.grupos.length !== 1 ? 's' : ''} disponible{materia.grupos.length !== 1 ? 's' : ''}</p>
                </div>
                {expandedMateria === materia.codigo ? <ChevronUp size={18} style={{ color: T.textMuted, flexShrink: 0 }} /> : <ChevronDown size={18} style={{ color: T.textMuted, flexShrink: 0 }} />}
              </div>

              {expandedMateria === materia.codigo && (
                <div className="px-4 pb-4" style={{ borderTop: `1px solid ${T.divider}` }}>
                  <div className="space-y-3 mt-4">
                    {materia.grupos.map(grupo => (
                      <div key={grupo.grupo} className="p-4 rounded-xl"
                        style={{ background: T.cardBg2, border: `1px solid ${T.divider}` }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded-lg"
                                style={{ background: T.primaryBg, color: T.primary, fontSize: '11px', fontWeight: 700, border: `1px solid ${T.primaryBorder}` }}>
                                Grupo {grupo.grupo}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <User size={12} style={{ color: T.textMuted }} />
                              <span style={{ color: T.textMuted, fontSize: '12px' }}>{grupo.docente}</span>
                            </div>
                            {grupo.horarios.map((h, i) => (
                              <div key={i} className="flex items-center gap-3 mt-1.5 flex-wrap">
                                <span style={{ color: T.text, fontSize: '12px', fontWeight: 500 }}>{h.dia}</span>
                                <span style={{ color: T.textMuted, fontSize: '12px' }}>{h.horaInicio}:00 – {h.horaFin}:00</span>
                                {h.ubicacion && (
                                  <div className="flex items-center gap-1">
                                    <MapPin size={10} style={{ color: T.textSubtle }} />
                                    <span style={{ color: T.textSubtle, fontSize: '11px' }}>{h.ubicacion}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => navigate('/planner')}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl flex-shrink-0 transition-all"
                            style={{ background: '#C9344C', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                            onMouseEnter={e => e.currentTarget.style.background = '#A02438'}
                            onMouseLeave={e => e.currentTarget.style.background = '#C9344C'}>
                            <Plus size={13} /> Agregar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}