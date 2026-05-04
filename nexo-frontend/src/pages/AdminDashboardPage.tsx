import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { useThemeTokens } from '../context/useThemeTokens';
import {
  UploadCloud, FileJson, CheckCircle, AlertCircle, Loader2, Database,
  AlertTriangle, Users, Shield, Megaphone, Heart, MapPin, Search,
  Plus, Trash2, X, ChevronLeft, ChevronRight, ChevronDown, Settings, Calendar, Star, Bug,
  ImageOff, RotateCcw
} from 'lucide-react';
import {
  academicOfferApi, AcademicOfferUploadResponse, ApiError,
  adminApi, UserSummary, RoleInfo, PageResponse,
  announcementsApi, AnnouncementData, AnnouncementPayload,
  welfareApi, WelfareData, WelfarePayload,
  campusApi, CampusData, CampusPayload,
  semesterApi, SemesterData,
  calendarApi, CalendarEventData, CalendarEventPayload, CalendarEventType,
  reportApi, ReportData, ReportStatus, ReportType,
} from '../services/api';
import { PhotoPicker } from '../components/PhotoPicker';

type Section = 'config' | 'upload' | 'roles' | 'announcements' | 'welfare' | 'campus' | 'calendar' | 'bugs';

const sidebarSections: { key: Section; label: string; icon: typeof Database }[] = [
  { key: 'config', label: 'Configuración', icon: Settings },
  { key: 'upload', label: 'Carga Académica', icon: Database },
  { key: 'roles', label: 'Gestión de Roles', icon: Shield },
  { key: 'announcements', label: 'Avisos Generales', icon: Megaphone },
  { key: 'welfare', label: 'Bienestar', icon: Heart },
  { key: 'campus', label: 'Sedes', icon: MapPin },
  { key: 'calendar', label: 'Calendario', icon: Calendar },
  { key: 'bugs', label: 'Reportes', icon: Bug },
];

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isRestoring } = useAuth();
  const T = useThemeTokens();
  const [section, setSection] = useState<Section>('config');

  useEffect(() => {
    if (isRestoring) return;
    if (!isAuthenticated) navigate('/login');
    if (user && !user.roles.includes('ADMINISTRADOR')) navigate('/dashboard');
  }, [isAuthenticated, isRestoring, user, navigate]);

  if (isRestoring || !isAuthenticated || !user || !user.roles.includes('ADMINISTRADOR')) return null;

  return (
    <AppLayout>
      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Internal Admin Sidebar */}
        <div
          className="hidden lg:flex flex-col flex-shrink-0 w-56 p-3 space-y-1"
          style={{ borderRight: `1px solid ${T.divider}` }}
        >
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: T.textMuted }}>
            Administración
          </p>
          {sidebarSections.map(({ key, label, icon: Icon }) => {
            const active = section === key;
            return (
              <button
                key={key}
                onClick={() => setSection(key)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all w-full text-left"
                style={{
                  background: active ? T.primaryBg : 'transparent',
                  border: active ? `1px solid ${T.primaryBorder}` : '1px solid transparent',
                  color: active ? T.primary : T.textMuted,
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: active ? 600 : 500,
                }}
              >
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Mobile section selector */}
        <div className="lg:hidden w-full px-4 pt-4 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {sidebarSections.map(({ key, label, icon: Icon }) => {
              const active = section === key;
              return (
                <button
                  key={key}
                  onClick={() => setSection(key)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-all"
                  style={{
                    background: active ? T.primaryBg : T.cardBg,
                    border: `1px solid ${active ? T.primaryBorder : T.cardBorder}`,
                    color: active ? T.primary : T.textMuted,
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8 max-w-5xl">
          {section === 'config' && <ConfigSection T={T} />}
          {section === 'upload' && <UploadSection T={T} />}
          {section === 'roles' && <RolesSection T={T} />}
          {section === 'announcements' && <AnnouncementsSection T={T} />}
          {section === 'welfare' && <WelfareSection T={T} />}
          {section === 'campus' && <CampusSection T={T} />}
          {section === 'calendar' && <CalendarSection T={T} />}
          {section === 'bugs' && <BugsSection T={T} />}
        </div>
      </div>
    </AppLayout>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
/*  UPLOAD SECTION                                                             */
/* ════════════════════════════════════════════════════════════════════════════ */

function UploadSection({ T }: { T: ReturnType<typeof useThemeTokens> }) {
  const [file, setFile] = useState<File | null>(null);
  const [activeSemester, setActiveSemester] = useState<SemesterData | null>(null);
  const [semesterLoading, setSemesterLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<AcademicOfferUploadResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [offers, setOffers] = useState<AcademicOfferResponse[]>([]);
  const [offersLoading, setOffersLoading] = useState(true);

  const fetchOffers = useCallback(async () => {
    setOffersLoading(true);
    try { setOffers(await academicOfferApi.list()); }
    catch (e) { console.error("Error loading offers", e); }
    finally { setOffersLoading(false); }
  }, []);

  useEffect(() => {
    setSemesterLoading(true);
    semesterApi.getActive()
      .then(s => setActiveSemester(s))
      .catch(() => setActiveSemester(null))
      .finally(() => setSemesterLoading(false));
    fetchOffers();
  }, [fetchOffers]);

  const canUpload = !!file && !!activeSemester && !loading;

  const handleUpload = async () => {
    if (!file || !activeSemester) return;
    setLoading(true); setError(null); setSuccess(null);
    try {
      const res = await academicOfferApi.upload(file, activeSemester.name);
      setSuccess(res); setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchOffers();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Error inesperado al subir.');
    } finally { setLoading(false); }
  };

  const handleDeleteOffer = async (id: number, semesterName: string) => {
    if (!confirm(`¿Estás seguro de eliminar TODOS los datos cargados para el semestre ${semesterName}? Esto borrará todas las materias y grupos.`)) return;
    setError(null); setSuccess(null);
    try {
      await academicOfferApi.delete(id);
      await fetchOffers();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Error al eliminar la carga.');
    }
  };

  return (
    <>
      <SectionHeader icon={Database} title="Carga Académica" subtitle="Sube el JSON generado por el extractor de horarios." T={T} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block mb-2 text-sm font-medium" style={{ color: T.text }}>Periodo Académico</label>
          {semesterLoading ? (
            <div className="flex items-center gap-2 py-3 px-4 rounded-xl mb-4" style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}` }}>
              <Loader2 size={14} className="animate-spin" style={{ color: T.textMuted }} />
              <span style={{ color: T.textMuted, fontSize: '13px' }}>Cargando semestre...</span>
            </div>
          ) : activeSemester ? (
            <div className="flex items-center gap-2 py-3 px-4 rounded-xl mb-4" style={{ background: T.accentGreen.bg, border: `1px solid ${T.accentGreen.border}` }}>
              <Calendar size={14} style={{ color: T.accentGreen.color }} />
              <span style={{ color: T.accentGreen.color, fontSize: '14px', fontWeight: 600 }}>{activeSemester.name}</span>
              <span style={{ color: T.textMuted, fontSize: '11px', marginLeft: 'auto' }}>Semestre activo</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 py-3 px-4 rounded-xl mb-4" style={{ background: T.error.bg, border: `1px solid ${T.error.border}` }}>
              <AlertCircle size={14} style={{ color: T.error.text }} />
              <span style={{ color: T.error.text, fontSize: '13px' }}>No hay semestre activo. Ve a <strong>Configuración</strong> para activar uno.</span>
            </div>
          )}
          <div
            className="w-full rounded-2xl flex flex-col items-center justify-center p-8 transition-all cursor-pointer"
            style={{
              height: '200px',
              background: file ? (T.isDark ? 'rgba(16,185,129,0.05)' : 'rgba(16,185,129,0.02)') : T.cardBg2,
              border: `2px dashed ${file ? T.accentGreen.color : T.divider}`,
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" accept=".json" ref={fileInputRef} onChange={e => { if (e.target.files?.[0]) { setFile(e.target.files[0]); setError(null); setSuccess(null); } }} className="hidden" />
            {file ? (
              <>
                <FileJson size={28} style={{ color: T.accentGreen.color, marginBottom: '12px' }} />
                <p style={{ color: T.text, fontWeight: 600, fontSize: '14px' }}>{file.name}</p>
                <p style={{ color: T.textMuted, fontSize: '12px' }}>{(file.size / 1024).toFixed(1)} KB</p>
              </>
            ) : (
              <>
                <UploadCloud size={28} style={{ color: T.textMuted, marginBottom: '12px' }} />
                <p style={{ color: T.text, fontWeight: 600, fontSize: '14px' }}>Seleccionar data.json</p>
                <p style={{ color: T.textMuted, fontSize: '12px', textAlign: 'center' }}>Haz clic para buscar el archivo.</p>
              </>
            )}
          </div>
          <button
            onClick={handleUpload} disabled={!canUpload}
            className="w-full mt-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            style={{
              background: !canUpload ? T.cardBg2 : '#C9344C',
              color: !canUpload ? T.textMuted : 'white',
              border: !canUpload ? `1px solid ${T.cardBorder}` : 'none',
              cursor: !canUpload ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: 600,
            }}
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Procesando...</> : 'Importar a la Base de Datos'}
          </button>
          {error && <ErrorBanner message={error} T={T} />}
        </div>
        <div>
          {success ? (
            <div className="rounded-2xl p-6" style={{ background: T.isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.05)', border: `1px solid ${T.accentGreen.border}` }}>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={20} style={{ color: T.accentGreen.color }} />
                <h3 style={{ color: T.text, fontSize: '16px', fontWeight: 600 }}>Carga Exitosa</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Facultades', value: success.facultades },
                  { label: 'Carreras', value: success.carreras },
                  { label: 'Materias', value: success.materias },
                  { label: 'Grupos', value: success.grupos },
                ].map(s => (
                  <div key={s.label} className="p-3 rounded-xl" style={{ background: T.cardBg }}>
                    <p style={{ color: T.textMuted, fontSize: '11px' }}>{s.label}</p>
                    <p style={{ color: T.text, fontSize: '22px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</p>
                  </div>
                ))}
              </div>
              {success.warnings?.length > 0 && (
                <div className="mt-4 space-y-1">
                  <div className="flex items-center gap-1 mb-2"><AlertTriangle size={14} style={{ color: T.accentYellow.color }} /><span style={{ color: T.text, fontSize: '13px', fontWeight: 600 }}>Advertencias ({success.warnings.length})</span></div>
                  {success.warnings.slice(0, 5).map((w, i) => (
                    <p key={i} className="p-2 rounded-lg" style={{ background: T.cardBg, fontSize: '11px', color: T.textMuted }}>{w}</p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl p-6 h-full flex flex-col justify-center" style={{ background: T.cardBg2, border: `1px solid ${T.cardBorder}` }}>
              <h3 className="mb-3" style={{ color: T.text, fontSize: '15px', fontWeight: 600 }}>Instrucciones</h3>
              <ol className="space-y-3" style={{ color: T.textMuted, fontSize: '13px', lineHeight: 1.6 }}>
                <li className="flex gap-2"><span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: T.divider, color: T.text, fontSize: '11px', fontWeight: 600 }}>1</span>Ve a <strong style={{ color: T.primary }}>Configuración</strong> y activa el semestre correspondiente.</li>
                <li className="flex gap-2"><span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: T.divider, color: T.text, fontSize: '11px', fontWeight: 600 }}>2</span>Ejecuta <code style={{ color: T.primary }}>extractor_horarios.py</code> con los PDFs.</li>
                <li className="flex gap-2"><span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: T.divider, color: T.text, fontSize: '11px', fontWeight: 600 }}>3</span>Busca el <code style={{ color: T.primary }}>data.json</code> generado y súbelo aquí.</li>
              </ol>
            </div>
          )}
        </div>
      </div>
      
      {/* Existing uploaded offers */}
      <div className="mt-8">
        <div className="px-5 py-3 rounded-t-2xl" style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderBottom: 'none' }}>
          <p style={{ color: T.text, fontWeight: 600, fontSize: '14px' }}>Cargas Anteriores ({offers.length})</p>
        </div>
        <div className="rounded-b-2xl overflow-hidden" style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}` }}>
          {offersLoading ? (
            <div className="flex justify-center p-8"><Loader2 size={24} className="animate-spin" style={{ color: T.primary }} /></div>
          ) : offers.length === 0 ? (
            <div className="p-8 text-center" style={{ color: T.textSubtle, fontSize: '13px' }}>No hay cargas previas registradas.</div>
          ) : (
            <div>
              {offers.map(offer => (
                <div key={offer.id} className="flex items-center gap-4 px-5 py-4 transition-all" style={{ borderBottom: `1px solid ${T.divider}` }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span style={{ color: T.text, fontSize: '15px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>Semestre: {offer.semester}</span>
                    </div>
                    <p style={{ color: T.textSubtle, fontSize: '11px', marginTop: '2px' }}>
                      Cargado el {new Date(offer.uploadedAt).toLocaleString('es-CO')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleDeleteOffer(offer.id, offer.semester)}
                      className="px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                      style={{ background: '#C9344C10', border: `1px solid #C9344C30`, color: T.error.text, cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
                    >
                      <Trash2 size={12} /> Eliminar materias
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
/*  CONFIG SECTION                                                             */
/* ════════════════════════════════════════════════════════════════════════════ */

function ConfigSection({ T }: { T: ReturnType<typeof useThemeTokens> }) {
  const [semesters, setSemesters] = useState<SemesterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchSemesters = useCallback(async () => {
    setLoading(true); setError(null);
    try { setSemesters(await semesterApi.list()); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Error cargando semestres'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSemesters(); }, [fetchSemesters]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true); setError(null);
    try {
      await semesterApi.create(newName.trim());
      setNewName('');
      await fetchSemesters();
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Error creando semestre'); }
    finally { setCreating(false); }
  };

  const handleActivate = async (id: number) => {
    setError(null);
    try { await semesterApi.activate(id); await fetchSemesters(); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Error activando semestre'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este semestre?')) return;
    setError(null);
    try { await semesterApi.delete(id); await fetchSemesters(); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Error eliminando semestre'); }
  };

  const activeSemester = semesters.find(s => s.active);

  return (
    <>
      <SectionHeader icon={Settings} title="Configuración" subtitle="Gestiona los periodos académicos del sistema." T={T} />

      {/* Active semester highlight */}
      <div className="mb-6 p-5 rounded-2xl" style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}` }}>
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={16} style={{ color: T.primary }} />
          <h3 style={{ color: T.text, fontSize: '15px', fontWeight: 600 }}>Semestre Activo</h3>
        </div>
        {activeSemester ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: T.accentGreen.bg, border: `1px solid ${T.accentGreen.border}` }}>
              <Star size={14} style={{ color: T.accentGreen.color }} />
              <span style={{ color: T.accentGreen.color, fontSize: '18px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{activeSemester.name}</span>
            </div>
            <p style={{ color: T.textMuted, fontSize: '12px' }}>Este periodo se usará para la carga académica y las búsquedas de materias.</p>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: T.error.bg, border: `1px solid ${T.error.border}` }}>
            <AlertCircle size={14} style={{ color: T.error.text }} />
            <span style={{ color: T.error.text, fontSize: '13px' }}>No hay semestre activo. Crea uno y actívalo.</span>
          </div>
        )}
      </div>

      {error && <ErrorBanner message={error} T={T} />}

      {/* Create semester */}
      <div className="mb-6 p-5 rounded-2xl" style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}` }}>
        <h3 className="mb-3" style={{ color: T.text, fontSize: '14px', fontWeight: 600 }}>Crear Nuevo Semestre</h3>
        <div className="flex gap-2">
          <input
            type="text" value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Ej: 2026-2"
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            className="flex-1 py-2.5 px-4 rounded-xl outline-none transition-all"
            style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '14px' }}
            onFocus={e => { e.currentTarget.style.borderColor = T.inputFocusBorder; }}
            onBlur={e => { e.currentTarget.style.borderColor = T.inputBorder; }}
          />
          <button
            onClick={handleCreate} disabled={creating || !newName.trim()}
            className="px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all"
            style={{
              background: (!newName.trim() || creating) ? T.cardBg2 : '#C9344C',
              color: (!newName.trim() || creating) ? T.textMuted : 'white',
              border: (!newName.trim() || creating) ? `1px solid ${T.cardBorder}` : 'none',
              cursor: (!newName.trim() || creating) ? 'not-allowed' : 'pointer',
              fontSize: '13px', fontWeight: 600,
            }}
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Crear
          </button>
        </div>
      </div>

      {/* Semester list */}
      <div className="rounded-2xl overflow-hidden" style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}` }}>
        <div className="px-5 py-3" style={{ borderBottom: `1px solid ${T.divider}` }}>
          <p style={{ color: T.text, fontWeight: 600, fontSize: '14px' }}>Semestres Registrados ({semesters.length})</p>
        </div>
        {loading ? <LoadingIndicator T={T} /> : semesters.length === 0 ? (
          <EmptyState label="No hay semestres creados aún." T={T} />
        ) : (
          <div>
            {semesters.map(sem => (
              <div
                key={sem.id}
                className="flex items-center gap-4 px-5 py-4 transition-all"
                style={{ borderBottom: `1px solid ${T.divider}`, background: sem.active ? T.accentGreen.bg : 'transparent' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span style={{ color: T.text, fontSize: '15px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{sem.name}</span>
                    {sem.active && (
                      <span className="px-2 py-0.5 rounded-full" style={{ background: T.accentGreen.color, color: 'white', fontSize: '10px', fontWeight: 700 }}>ACTIVO</span>
                    )}
                  </div>
                  <p style={{ color: T.textSubtle, fontSize: '11px', marginTop: '2px' }}>
                    Creado el {new Date(sem.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {!sem.active && (
                    <button
                      onClick={() => handleActivate(sem.id)}
                      className="px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                      style={{ background: T.accentGreen.bg, border: `1px solid ${T.accentGreen.border}`, color: T.accentGreen.color, cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
                    >
                      <Star size={12} /> Activar
                    </button>
                  )}
                  {!sem.active && (
                    <button
                      onClick={() => handleDelete(sem.id)}
                      className="p-1.5 rounded-lg transition-all"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.error.text }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
/*  ROLES SECTION                                                              */
/* ════════════════════════════════════════════════════════════════════════════ */

function RolesSection({ T }: { T: ReturnType<typeof useThemeTokens> }) {
  const [users, setUsers] = useState<PageResponse<UserSummary> | null>(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [userRoles, setUserRoles] = useState<RoleInfo[]>([]);
  const [allRoles, setAllRoles] = useState<string[]>([]);
  const [roleLoading, setRoleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (p: number, email?: string) => {
    setLoading(true); setError(null);
    try { setUsers(await adminApi.listUsers(p, 15, email || undefined)); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Error cargando usuarios'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(0); adminApi.listRoles().then(setAllRoles).catch(() => {}); }, [fetchUsers]);

  const handleSearch = () => { setPage(0); fetchUsers(0, searchEmail); };
  const handlePageChange = (p: number) => { setPage(p); fetchUsers(p, searchEmail); };

  const selectUser = async (u: UserSummary) => {
    setSelectedUser(u);
    setRoleLoading(true);
    try { setUserRoles(await adminApi.getUserRoles(u.id)); }
    catch { setUserRoles([]); }
    finally { setRoleLoading(false); }
  };

  const assignRole = async (roleName: string) => {
    if (!selectedUser) return;
    setRoleLoading(true);
    try {
      await adminApi.assignRole(selectedUser.id, roleName);
      setUserRoles(await adminApi.getUserRoles(selectedUser.id));
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Error asignando rol'); }
    finally { setRoleLoading(false); }
  };

  const revokeRole = async (roleId: number) => {
    if (!selectedUser) return;
    setRoleLoading(true);
    try {
      await adminApi.revokeRole(selectedUser.id, roleId);
      setUserRoles(await adminApi.getUserRoles(selectedUser.id));
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Error revocando rol'); }
    finally { setRoleLoading(false); }
  };

  const assignedNames = userRoles.map(r => r.roleName);
  const availableRoles = allRoles.filter(r => !assignedNames.includes(r));

  return (
    <>
      <SectionHeader icon={Shield} title="Gestión de Roles" subtitle="Busca usuarios y gestiona sus permisos." T={T} />
      {error && <ErrorBanner message={error} T={T} />}
      <div className="flex gap-2 mb-4">
        <input
          type="text" value={searchEmail} onChange={e => setSearchEmail(e.target.value)}
          placeholder="Buscar por email..." onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="flex-1 py-2.5 px-4 rounded-xl outline-none transition-all"
          style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '13px' }}
          onFocus={e => { e.currentTarget.style.borderColor = T.inputFocusBorder; }}
          onBlur={e => { e.currentTarget.style.borderColor = T.inputBorder; }}
        />
        <button onClick={handleSearch} className="px-4 py-2.5 rounded-xl flex items-center gap-1.5" style={{ background: T.primary, color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
          <Search size={14} /> Buscar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Users Table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}` }}>
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${T.divider}` }}>
            <p style={{ color: T.text, fontWeight: 600, fontSize: '14px' }}>Usuarios {users ? `(${users.totalElements})` : ''}</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 size={20} className="animate-spin" style={{ color: T.textMuted }} /></div>
            ) : users?.content.length === 0 ? (
              <p className="py-8 text-center" style={{ color: T.textMuted, fontSize: '13px' }}>No se encontraron usuarios.</p>
            ) : users?.content.map(u => (
              <div
                key={u.id} onClick={() => selectUser(u)}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all"
                style={{
                  borderBottom: `1px solid ${T.divider}`,
                  background: selectedUser?.id === u.id ? T.primaryBg : 'transparent',
                }}
                onMouseEnter={e => { if (selectedUser?.id !== u.id) e.currentTarget.style.background = T.actionHoverBg; }}
                onMouseLeave={e => { if (selectedUser?.id !== u.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: T.secondaryBg, border: `1px solid ${T.secondaryBorder}` }}>
                  <Users size={14} style={{ color: T.secondary }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p style={{ color: T.text, fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nickname}</p>
                  <p style={{ color: T.textMuted, fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                </div>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: u.active ? T.accentGreen.color : T.error.text }} title={u.active ? 'Activo' : 'Inactivo'} />
              </div>
            ))}
          </div>
          {users && users.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 px-4 py-3" style={{ borderTop: `1px solid ${T.divider}` }}>
              <button disabled={page === 0} onClick={() => handlePageChange(page - 1)} className="p-1.5 rounded-lg" style={{ background: T.btnGhostBg, border: `1px solid ${T.btnGhostBorder}`, cursor: page === 0 ? 'not-allowed' : 'pointer', color: T.textMuted }}><ChevronLeft size={14}/></button>
              <span style={{ color: T.textMuted, fontSize: '12px' }}>{page + 1} / {users.totalPages}</span>
              <button disabled={page >= users.totalPages - 1} onClick={() => handlePageChange(page + 1)} className="p-1.5 rounded-lg" style={{ background: T.btnGhostBg, border: `1px solid ${T.btnGhostBorder}`, cursor: page >= users.totalPages - 1 ? 'not-allowed' : 'pointer', color: T.textMuted }}><ChevronRight size={14}/></button>
            </div>
          )}
        </div>

        {/* Role Manager */}
        <div className="rounded-2xl p-5" style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}` }}>
          {selectedUser ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Shield size={16} style={{ color: T.secondary }} />
                <h3 style={{ color: T.text, fontSize: '15px', fontWeight: 600 }}>Roles de {selectedUser.nickname}</h3>
              </div>
              {roleLoading ? (
                <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin" style={{ color: T.textMuted }} /></div>
              ) : (
                <>
                  <p className="mb-2" style={{ color: T.textMuted, fontSize: '12px', fontWeight: 500 }}>Roles actuales</p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {userRoles.length === 0 ? (
                      <p style={{ color: T.textMuted, fontSize: '12px' }}>Sin roles asignados</p>
                    ) : userRoles.map(r => (
                      <div key={r.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: T.accentIndigo.bg, border: `1px solid ${T.accentIndigo.border}` }}>
                        <span style={{ color: T.accentIndigo.color, fontSize: '12px', fontWeight: 600 }}>{formatRoleName(r.roleName)}</span>
                        <button onClick={() => revokeRole(r.id)} className="p-0.5 rounded hover:opacity-70 transition-opacity" style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.error.text }}><X size={12}/></button>
                      </div>
                    ))}
                  </div>
                  {availableRoles.length > 0 && (
                    <>
                      <p className="mb-2" style={{ color: T.textMuted, fontSize: '12px', fontWeight: 500 }}>Asignar rol</p>
                      <div className="flex flex-wrap gap-2">
                        {availableRoles.map(r => (
                          <button key={r} onClick={() => assignRole(r)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all" style={{ background: T.accentGreen.bg, border: `1px solid ${T.accentGreen.border}`, cursor: 'pointer', color: T.accentGreen.color, fontSize: '12px', fontWeight: 600 }}>
                            <Plus size={12} /> {formatRoleName(r)}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <Users size={32} style={{ color: T.textMuted, marginBottom: '12px' }} />
              <p style={{ color: T.textMuted, fontSize: '13px' }}>Selecciona un usuario de la lista</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
/*  ANNOUNCEMENTS SECTION                                                      */
/* ════════════════════════════════════════════════════════════════════════════ */

function AnnouncementsSection({ T }: { T: ReturnType<typeof useThemeTokens> }) {
  const [items, setItems] = useState<AnnouncementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AnnouncementData | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { setItems(await announcementsApi.list()); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Error cargando avisos'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este aviso?')) return;
    try { await announcementsApi.delete(id); await fetch(); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Error eliminando'); }
  };

  const handleSave = async (data: AnnouncementPayload) => {
    try {
      if (editing) await announcementsApi.update(editing.id, data);
      else await announcementsApi.create(data);
      setShowForm(false); setEditing(null); await fetch();
    } catch (e) { throw e; }
  };

  const scopeLabel = (s: string) => s === 'UNIVERSIDAD' ? 'Universidad' : 'Facultad';
  const typeLabel = (t: string) => t === 'ASAMBLEA' ? 'Asamblea' : 'General';

  return (
    <>
      <SectionHeader icon={Megaphone} title="Avisos Generales" subtitle="Gestiona avisos para la comunidad." T={T} action={{ label: 'Nuevo Aviso', onClick: () => { setEditing(null); setShowForm(true); } }} />
      {error && <ErrorBanner message={error} T={T} />}
      {showForm && (
        <AnnouncementForm T={T} initial={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />
      )}
      {loading ? <LoadingIndicator T={T} /> : items.length === 0 ? <EmptyState label="No hay avisos registrados." T={T} /> : (
        <div className="space-y-3">
          {items.map(item => {
            const parsedImgs: string[] = (() => { try { return item.images ? JSON.parse(item.images) : []; } catch { return []; } })();
            return (
              <div key={item.id} className="rounded-2xl overflow-hidden transition-all" style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}` }}>
                {parsedImgs.length > 0 && <AdminMosaic photos={parsedImgs} />}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h3 style={{ color: T.text, fontSize: '14px', fontWeight: 600 }}>{item.title}</h3>
                        <span className="px-2 py-0.5 rounded-full" style={{ background: T.accentIndigo.bg, border: `1px solid ${T.accentIndigo.border}`, color: T.accentIndigo.color, fontSize: '10px', fontWeight: 600 }}>{scopeLabel(item.scope)}</span>
                        <span className="px-2 py-0.5 rounded-full" style={{ background: item.type === 'ASAMBLEA' ? T.accentYellow.bg : T.accentCyan.bg, border: `1px solid ${item.type === 'ASAMBLEA' ? T.accentYellow.border : T.accentCyan.border}`, color: item.type === 'ASAMBLEA' ? T.accentYellow.color : T.accentCyan.color, fontSize: '10px', fontWeight: 600 }}>{typeLabel(item.type)}</span>
                        {item.faculty && <span className="px-2 py-0.5 rounded-full" style={{ background: T.tagBg, border: `1px solid ${T.tagBorder}`, color: T.tagColor, fontSize: '10px', fontWeight: 600 }}>{item.faculty}</span>}
                      </div>
                      <p style={{ color: T.textMuted, fontSize: '13px', lineHeight: 1.5 }} className="line-clamp-2">{item.body}</p>
                      <p style={{ color: T.textSubtle, fontSize: '11px', marginTop: '6px' }}>{new Date(item.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => { setEditing(item); setShowForm(true); }} className="p-2 rounded-lg transition-all" style={{ background: T.btnGhostBg, border: `1px solid ${T.btnGhostBorder}`, cursor: 'pointer', color: T.textMuted, fontSize: '11px' }}>Editar</button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg transition-all" style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.error.text }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function AnnouncementForm({ T, initial, onSave, onCancel }: { T: ReturnType<typeof useThemeTokens>; initial: AnnouncementData | null; onSave: (d: AnnouncementPayload) => Promise<void>; onCancel: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [scope, setScope] = useState<'FACULTAD' | 'UNIVERSIDAD'>(initial?.scope as any ?? 'UNIVERSIDAD');
  const [type, setType] = useState<'GENERAL' | 'ASAMBLEA'>(initial?.type as any ?? 'GENERAL');
  const [faculty, setFaculty] = useState(initial?.faculty ?? '');
  const [photos, setPhotos] = useState<string[]>(() => {
    try { return initial?.images ? JSON.parse(initial.images) : []; } catch { return []; }
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) { setError('Título y contenido son obligatorios.'); return; }
    setSaving(true); setError(null);
    try {
      await onSave({
        title, body, scope, type,
        faculty: scope === 'FACULTAD' ? faculty : undefined,
        images: photos.length > 0 ? JSON.stringify(photos) : undefined,
      });
    }
    catch (e: any) { setError(e.message || 'Error guardando'); setSaving(false); }
  };

  return (
    <div className="mb-4 p-5 rounded-2xl" style={{ background: T.cardBg, border: `1px solid ${T.primaryBorder}` }}>
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ color: T.text, fontSize: '15px', fontWeight: 600 }}>{initial ? 'Editar Aviso' : 'Nuevo Aviso'}</h3>
        <button onClick={onCancel} style={{ color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
      </div>
      <div className="space-y-3">
        <FormInput label="Título" value={title} onChange={setTitle} T={T} />
        <FormTextarea label="Contenido" value={body} onChange={setBody} T={T} />
        <div className="grid grid-cols-2 gap-3">
          <FormSelect label="Alcance" value={scope} options={[{ val: 'UNIVERSIDAD', label: 'Universidad' }, { val: 'FACULTAD', label: 'Facultad' }]} onChange={v => setScope(v as any)} T={T} />
          <FormSelect label="Tipo" value={type} options={[{ val: 'GENERAL', label: 'General' }, { val: 'ASAMBLEA', label: 'Asamblea' }]} onChange={v => setType(v as any)} T={T} />
        </div>
        {scope === 'FACULTAD' && <FormInput label="Facultad" value={faculty} onChange={setFaculty} T={T} placeholder="Ej: Ingeniería" />}
        <PhotoPicker photos={photos} onChange={setPhotos} />
        {error && <ErrorBanner message={error} T={T} />}
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl" style={{ background: T.btnGhostBg, border: `1px solid ${T.btnGhostBorder}`, color: T.btnGhostColor, cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 rounded-xl flex items-center gap-1.5" style={{ background: '#C9344C', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
            {saving && <Loader2 size={14} className="animate-spin" />} {initial ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
/*  WELFARE SECTION                                                            */
/* ════════════════════════════════════════════════════════════════════════════ */

const welfareCategoryLabels: Record<string, string> = {
  APOYO_ALIMENTARIO: 'Apoyo Alimentario',
  BECAS: 'Becas',
  SALUD_MENTAL: 'Salud Mental',
  SERVICIOS_SALUD: 'Servicios de Salud',
};

const welfareCategoryAccents: Record<string, (T: any) => any> = {
  APOYO_ALIMENTARIO: T => T.accentYellow,
  BECAS: T => T.accentGreen,
  SALUD_MENTAL: T => T.accentPink,
  SERVICIOS_SALUD: T => T.accentCyan,
};

function WelfareSection({ T }: { T: ReturnType<typeof useThemeTokens> }) {
  const [items, setItems] = useState<WelfareData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<WelfareData | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { setItems(await welfareApi.list()); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Error cargando bienestar'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este contenido de bienestar?')) return;
    try { await welfareApi.delete(id); await fetch(); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Error eliminando'); }
  };

  const handleSave = async (data: WelfarePayload) => {
    if (editing) await welfareApi.update(editing.id, data);
    else await welfareApi.create(data);
    setShowForm(false); setEditing(null); await fetch();
  };

  return (
    <>
      <SectionHeader icon={Heart} title="Bienestar" subtitle="Gestiona contenido de bienestar institucional." T={T} action={{ label: 'Nuevo Contenido', onClick: () => { setEditing(null); setShowForm(true); } }} />
      {error && <ErrorBanner message={error} T={T} />}
      {showForm && (
        <WelfareForm T={T} initial={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />
      )}
      {loading ? <LoadingIndicator T={T} /> : items.length === 0 ? <EmptyState label="No hay contenido de bienestar." T={T} /> : (
        <div className="space-y-3">
          {items.map(item => {
            const accent = (welfareCategoryAccents[item.category] || (() => T.accentIndigo))(T);
            const parsedImgs: string[] = (() => { try { return item.images ? JSON.parse(item.images) : []; } catch { return []; } })();
            return (
              <div key={item.id} className="rounded-2xl overflow-hidden" style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}` }}>
                {parsedImgs.length > 0 && <AdminMosaic photos={parsedImgs} />}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h3 style={{ color: T.text, fontSize: '14px', fontWeight: 600 }}>{item.title}</h3>
                        <span className="px-2 py-0.5 rounded-full" style={{ background: accent.bg, border: `1px solid ${accent.border}`, color: accent.color, fontSize: '10px', fontWeight: 600 }}>{welfareCategoryLabels[item.category] || item.category}</span>
                      </div>
                      <p style={{ color: T.textMuted, fontSize: '13px', lineHeight: 1.5 }} className="line-clamp-2">{item.description}</p>
                      {item.links && <p style={{ color: T.link, fontSize: '12px', marginTop: '4px' }}>{item.links}</p>}
                      <p style={{ color: T.textSubtle, fontSize: '11px', marginTop: '6px' }}>{new Date(item.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => { setEditing(item); setShowForm(true); }} className="p-2 rounded-lg" style={{ background: T.btnGhostBg, border: `1px solid ${T.btnGhostBorder}`, cursor: 'pointer', color: T.textMuted, fontSize: '11px' }}>Editar</button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg" style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.error.text }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function WelfareForm({ T, initial, onSave, onCancel }: { T: ReturnType<typeof useThemeTokens>; initial: WelfareData | null; onSave: (d: WelfarePayload) => Promise<void>; onCancel: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState<WelfarePayload['category']>(initial?.category as any ?? 'APOYO_ALIMENTARIO');
  const [links, setLinks] = useState(initial?.links ?? '');
  const [photos, setPhotos] = useState<string[]>(() => {
    try { return initial?.images ? JSON.parse(initial.images) : []; } catch { return []; }
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) { setError('Título y descripción son obligatorios.'); return; }
    setSaving(true); setError(null);
    try {
      await onSave({
        title, description, category,
        links: links || undefined,
        images: photos.length > 0 ? JSON.stringify(photos) : undefined,
      });
    }
    catch (e: any) { setError(e.message || 'Error guardando'); setSaving(false); }
  };

  return (
    <div className="mb-4 p-5 rounded-2xl" style={{ background: T.cardBg, border: `1px solid ${T.primaryBorder}` }}>
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ color: T.text, fontSize: '15px', fontWeight: 600 }}>{initial ? 'Editar Contenido' : 'Nuevo Contenido'}</h3>
        <button onClick={onCancel} style={{ color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
      </div>
      <div className="space-y-3">
        <FormInput label="Título" value={title} onChange={setTitle} T={T} />
        <FormTextarea label="Descripción" value={description} onChange={setDescription} T={T} />
        <FormSelect label="Categoría" value={category} options={Object.entries(welfareCategoryLabels).map(([val, label]) => ({ val, label }))} onChange={v => setCategory(v as any)} T={T} />
        <FormInput label="Enlaces (opcional)" value={links} onChange={setLinks} T={T} placeholder="URL de recurso relacionado" />
        <PhotoPicker photos={photos} onChange={setPhotos} />
        {error && <ErrorBanner message={error} T={T} />}
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl" style={{ background: T.btnGhostBg, border: `1px solid ${T.btnGhostBorder}`, color: T.btnGhostColor, cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 rounded-xl flex items-center gap-1.5" style={{ background: '#C9344C', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
            {saving && <Loader2 size={14} className="animate-spin" />} {initial ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
/*  CAMPUS SECTION                                                             */
/* ════════════════════════════════════════════════════════════════════════════ */

function CampusSection({ T }: { T: ReturnType<typeof useThemeTokens> }) {
  const [items, setItems] = useState<CampusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CampusData | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { setItems(await campusApi.list()); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Error cargando sedes'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta sede?')) return;
    try { await campusApi.delete(id); await fetch(); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Error eliminando'); }
  };

  const handleSave = async (data: CampusPayload) => {
    if (editing) await campusApi.update(editing.id, data);
    else await campusApi.create(data);
    setShowForm(false); setEditing(null); await fetch();
  };

  return (
    <>
      <SectionHeader icon={MapPin} title="Sedes" subtitle="Gestiona las sedes de la universidad." T={T} action={{ label: 'Nueva Sede', onClick: () => { setEditing(null); setShowForm(true); } }} />
      {error && <ErrorBanner message={error} T={T} />}
      {showForm && (
        <CampusForm T={T} initial={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />
      )}
      {loading ? <LoadingIndicator T={T} /> : items.length === 0 ? <EmptyState label="No hay sedes registradas." T={T} /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map(item => (
            <div key={item.id} className="p-4 rounded-2xl" style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}` }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 style={{ color: T.text, fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{item.name}</h3>
                  <span className="inline-block px-2 py-0.5 rounded-full mb-2" style={{ background: T.accentYellow.bg, border: `1px solid ${T.accentYellow.border}`, color: T.accentYellow.color, fontSize: '10px', fontWeight: 600 }}>{item.faculty}</span>
                  {item.address && <p style={{ color: T.textMuted, fontSize: '12px' }}>{item.address}</p>}
                  <p style={{ color: T.textSubtle, fontSize: '11px', marginTop: '4px' }}>{item.classrooms.length} salón(es)</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditing(item); setShowForm(true); }} className="p-2 rounded-lg" style={{ background: T.btnGhostBg, border: `1px solid ${T.btnGhostBorder}`, cursor: 'pointer', color: T.textMuted, fontSize: '11px' }}>Editar</button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg" style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.error.text }}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Leaflet icon fix (runs once at module level) ─────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CAMPUS_PIN_ICON = L.divIcon({
  className: '',
  html: `<div style="
    width:28px;height:28px;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    background:#C9344C;
    border:3px solid rgba(255,255,255,0.9);
    box-shadow:0 4px 14px rgba(0,0,0,0.5),0 0 0 3px #C9344C44;
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -32],
});

function CampusMapPicker({ lat, lng, onChange }: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: lat && lng ? [lat, lng] : [4.610000, -74.082000],
      zoom: lat && lng ? 15 : 12,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    if (lat && lng) {
      markerRef.current = L.marker([lat, lng], { icon: CAMPUS_PIN_ICON, draggable: true }).addTo(map);
      markerRef.current.on('dragend', () => {
        const pos = markerRef.current!.getLatLng();
        onChange(parseFloat(pos.lat.toFixed(6)), parseFloat(pos.lng.toFixed(6)));
      });
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      const rounded: [number, number] = [
        parseFloat(e.latlng.lat.toFixed(6)),
        parseFloat(e.latlng.lng.toFixed(6)),
      ];
      if (markerRef.current) {
        markerRef.current.setLatLng(rounded);
      } else {
        markerRef.current = L.marker(rounded, { icon: CAMPUS_PIN_ICON, draggable: true }).addTo(map);
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current!.getLatLng();
          onChange(parseFloat(pos.lat.toFixed(6)), parseFloat(pos.lng.toFixed(6)));
        });
      }
      onChange(rounded[0], rounded[1]);
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
  }, []);

  useEffect(() => {
    if (!mapRef.current || lat === null || lng === null) return;
    const pos: [number, number] = [lat, lng];
    if (markerRef.current) {
      markerRef.current.setLatLng(pos);
    } else {
      markerRef.current = L.marker(pos, { icon: CAMPUS_PIN_ICON, draggable: true }).addTo(mapRef.current);
      markerRef.current.on('dragend', () => {
        const p = markerRef.current!.getLatLng();
        onChange(parseFloat(p.lat.toFixed(6)), parseFloat(p.lng.toFixed(6)));
      });
    }
    mapRef.current.setView(pos, Math.max(mapRef.current.getZoom(), 14), { animate: true });
  }, [lat, lng]);

  return (
    <>
      <style>{`
        .nexo-admin-picker .leaflet-tile-pane {
          filter: brightness(1.55) contrast(0.88) saturate(0.7) hue-rotate(195deg);
        }
        .nexo-admin-picker .leaflet-control-zoom a {
          background: rgba(22,22,42,0.95) !important;
          color: #aaa !important;
          border-color: rgba(255,255,255,0.12) !important;
        }
        .nexo-admin-picker .leaflet-control-zoom a:hover { color: #fff !important; }
      `}</style>
      <div
        ref={containerRef}
        className="nexo-admin-picker"
        style={{ width: '100%', height: '200px', borderRadius: '10px', cursor: 'crosshair' }}
      />
    </>
  );
}

function CampusForm({ T, initial, onSave, onCancel }: { T: ReturnType<typeof useThemeTokens>; initial: CampusData | null; onSave: (d: CampusPayload) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [faculty, setFaculty] = useState(initial?.faculty ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [lat, setLat] = useState<number | null>(initial?.latitude ?? null);
  const [lng, setLng] = useState<number | null>(initial?.longitude ?? null);
  const [latInput, setLatInput] = useState(initial?.latitude?.toString() ?? '');
  const [lngInput, setLngInput] = useState(initial?.longitude?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputStyle = { background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '13px' };
  const labelStyle = { color: T.textMuted, fontSize: '12px', fontWeight: 600 as const, marginBottom: '5px', display: 'block' as const };

  const handleMapChange = (newLat: number, newLng: number) => {
    setLat(newLat); setLng(newLng);
    setLatInput(newLat.toString()); setLngInput(newLng.toString());
  };

  const handleLatInput = (val: string) => {
    setLatInput(val);
    const n = parseFloat(val);
    if (!isNaN(n)) setLat(n);
  };

  const handleLngInput = (val: string) => {
    setLngInput(val);
    const n = parseFloat(val);
    if (!isNaN(n)) setLng(n);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !faculty.trim()) { setError('Nombre y facultad son obligatorios.'); return; }
    const parsedLat = latInput ? parseFloat(latInput) : undefined;
    const parsedLng = lngInput ? parseFloat(lngInput) : undefined;
    if ((latInput && isNaN(parsedLat!)) || (lngInput && isNaN(parsedLng!))) {
      setError('Latitud y longitud deben ser números válidos.'); return;
    }
    setSaving(true); setError(null);
    try { await onSave({ name, faculty, address: address || undefined, latitude: parsedLat, longitude: parsedLng }); }
    catch (e: any) { setError(e.message || 'Error guardando'); setSaving(false); }
  };

  return (
    <div className="mb-4 p-5 rounded-2xl" style={{ background: T.cardBg, border: `1px solid ${T.primaryBorder}` }}>
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ color: T.text, fontSize: '15px', fontWeight: 600 }}>{initial ? 'Editar Sede' : 'Nueva Sede'}</h3>
        <button onClick={onCancel} style={{ color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label style={labelStyle}>Nombre <span style={{ color: '#E8485F' }}>*</span></label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Sede Macarena A" className="w-full py-2.5 px-3 rounded-xl outline-none" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Facultad <span style={{ color: '#E8485F' }}>*</span></label>
            <input type="text" value={faculty} onChange={e => setFaculty(e.target.value)} placeholder="Ej: Ingeniería" className="w-full py-2.5 px-3 rounded-xl outline-none" style={inputStyle} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Dirección</label>
          <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Ej: Calle 40 Sur No. 8B-84" className="w-full py-2.5 px-3 rounded-xl outline-none" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>
            <MapPin size={11} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            Ubicación en el mapa
          </label>
          <div style={{ border: `1px solid ${T.inputBorder}`, borderRadius: '10px', overflow: 'hidden', marginBottom: '8px' }}>
            <CampusMapPicker lat={lat} lng={lng} onChange={handleMapChange} />
          </div>
          <p style={{ color: T.textSubtle, fontSize: '11px', marginBottom: '8px' }}>
            Haz clic en el mapa para colocar el marcador, o arrástralo. También puedes escribir las coordenadas.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ ...labelStyle, marginBottom: '4px' }}>Latitud</label>
              <input type="number" step="any" value={latInput} onChange={e => handleLatInput(e.target.value)} placeholder="Ej: 4.628055" className="w-full py-2 px-3 rounded-xl outline-none" style={inputStyle} />
            </div>
            <div>
              <label style={{ ...labelStyle, marginBottom: '4px' }}>Longitud</label>
              <input type="number" step="any" value={lngInput} onChange={e => handleLngInput(e.target.value)} placeholder="Ej: -74.065277" className="w-full py-2 px-3 rounded-xl outline-none" style={inputStyle} />
            </div>
          </div>
        </div>
        {error && <ErrorBanner message={error} T={T} />}
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl" style={{ background: T.btnGhostBg, border: `1px solid ${T.btnGhostBorder}`, color: T.btnGhostColor, cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 rounded-xl flex items-center gap-1.5" style={{ background: '#C9344C', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
            {saving && <Loader2 size={14} className="animate-spin" />} {initial ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
/*  CALENDAR SECTION                                                           */
/* ════════════════════════════════════════════════════════════════════════════ */

const CALENDAR_EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  INSCRIPCION:   'Inscripción',
  INICIO_CLASES: 'Inicio de clases',
  FIN_CLASES:    'Fin de clases',
  PARCIAL:       'Parcial',
  FESTIVO:       'Festivo',
  PARO:          'Paro',
  OTRO:          'Otro',
};

const CALENDAR_EVENT_TYPE_COLORS: Record<CalendarEventType, { bg: string; color: string; border: string }> = {
  INSCRIPCION:   { bg: 'rgba(99,102,241,0.12)',  color: '#818CF8', border: 'rgba(99,102,241,0.22)' },
  INICIO_CLASES: { bg: 'rgba(52,211,153,0.12)',  color: '#34D399', border: 'rgba(52,211,153,0.22)' },
  FIN_CLASES:    { bg: 'rgba(244,114,182,0.12)', color: '#F472B6', border: 'rgba(244,114,182,0.22)' },
  PARCIAL:       { bg: 'rgba(201,52,76,0.12)',   color: '#E8485F', border: 'rgba(201,52,76,0.22)' },
  FESTIVO:       { bg: 'rgba(251,191,36,0.12)',  color: '#FBBF24', border: 'rgba(251,191,36,0.22)' },
  PARO:          { bg: 'rgba(248,113,113,0.12)', color: '#F87171', border: 'rgba(248,113,113,0.22)' },
  OTRO:          { bg: 'rgba(139,138,151,0.12)', color: '#8B8A97', border: 'rgba(139,138,151,0.22)' },
};

const ALL_CALENDAR_TYPES: CalendarEventType[] = [
  'INSCRIPCION', 'INICIO_CLASES', 'FIN_CLASES', 'PARCIAL', 'FESTIVO', 'PARO', 'OTRO',
];

function CalendarSection({ T }: { T: ReturnType<typeof useThemeTokens> }) {
  const [items, setItems] = useState<CalendarEventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CalendarEventData | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try { setItems(await calendarApi.list()); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Error cargando eventos'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este evento?')) return;
    try { await calendarApi.delete(id); fetchItems(); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Error eliminando'); }
  };

  const handleSave = async (data: CalendarEventPayload) => {
    if (editing) await calendarApi.update(editing.id, data);
    else await calendarApi.create(data);
    setShowForm(false);
    setEditing(null);
    fetchItems();
  };

  const sortedItems = [...items].sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <div>
      <SectionHeader
        icon={Calendar}
        title="Calendario académico"
        subtitle="Gestiona los eventos del calendario institucional."
        T={T}
        action={{ label: 'Nuevo evento', onClick: () => { setEditing(null); setShowForm(true); } }}
      />
      {error && <ErrorBanner message={error} T={T} />}
      {loading ? <LoadingIndicator T={T} /> : sortedItems.length === 0 ? (
        <EmptyState label="No hay eventos registrados." T={T} />
      ) : (
        <div className="space-y-2">
          {sortedItems.map(item => {
            const accent = CALENDAR_EVENT_TYPE_COLORS[item.eventType] ?? CALENDAR_EVENT_TYPE_COLORS.OTRO;
            const dateLabel = new Date(item.startDate + 'T00:00:00')
              .toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
            return (
              <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl"
                style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}` }}>
                <div className="w-20 text-center px-2 py-1.5 rounded-lg flex-shrink-0"
                  style={{ background: accent.bg, border: `1px solid ${accent.border}` }}>
                  <span style={{ color: accent.color, fontSize: '11px', fontWeight: 700 }}>{dateLabel}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ color: T.text, fontSize: '14px', fontWeight: 500 }}>{item.title}</p>
                  <span className="px-2 py-0.5 rounded-full mt-1 inline-block"
                    style={{ background: accent.bg, color: accent.color, fontSize: '10px', fontWeight: 600, border: `1px solid ${accent.border}` }}>
                    {CALENDAR_EVENT_TYPE_LABELS[item.eventType] ?? item.eventType}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(item); setShowForm(true); }}
                    className="p-2 rounded-lg" style={{ background: T.cardBg2, border: `1px solid ${T.cardBorder}`, color: T.textMuted, cursor: 'pointer' }}
                    title="Editar"><ChevronRight size={14} /></button>
                  <button onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg" style={{ background: T.error.bg, border: `1px solid ${T.error.border}`, color: T.error.text, cursor: 'pointer' }}
                    title="Eliminar"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && createPortal(
        <CalendarEventForm
          initial={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
          T={T}
        />,
        document.body
      )}
    </div>
  );
}

function CalendarEventForm({ initial, onSave, onClose, T }: {
  initial: CalendarEventData | null;
  onSave: (data: CalendarEventPayload) => Promise<void>;
  onClose: () => void;
  T: ReturnType<typeof useThemeTokens>;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [eventType, setEventType] = useState<CalendarEventType>(initial?.eventType ?? 'OTRO');
  const [startDate, setStartDate] = useState(initial?.startDate ?? '');
  const [endDate, setEndDate] = useState(initial?.endDate ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '10px',
    background: T.inputBg, border: `1px solid ${T.inputBorder}`,
    color: T.text, fontSize: '14px', outline: 'none',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate) { setError('Título y fecha de inicio son obligatorios'); return; }
    setSaving(true);
    try {
      const payload: CalendarEventPayload = { title, eventType, startDate };
      if (description) payload.description = description;
      if (endDate) payload.endDate = endDate;
      await onSave(payload);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al guardar');
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: T.isDark ? 'rgba(30,30,52,0.97)' : 'rgba(255,255,255,0.97)',
        border: `1px solid ${T.cardBorder}`, borderRadius: '20px', padding: '28px',
        width: '100%', maxWidth: '480px', boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ color: T.text, fontWeight: 700, fontSize: '18px' }}>
            {initial ? 'Editar evento' : 'Nuevo evento'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted }}>
            <X size={20} />
          </button>
        </div>
        {error && <ErrorBanner message={error} T={T} />}
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput label="Título" value={title} onChange={setTitle} T={T} placeholder="Ej. Inicio inscripciones 2026-2" />
          <FormSelect label="Tipo de evento" value={eventType} onChange={v => setEventType(v as CalendarEventType)}
            options={ALL_CALENDAR_TYPES.map(t => ({ val: t, label: CALENDAR_EVENT_TYPE_LABELS[t] }))} T={T} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5" style={{ color: T.text, fontSize: '12px', fontWeight: 500 }}>Fecha inicio</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label className="block mb-1.5" style={{ color: T.text, fontSize: '12px', fontWeight: 500 }}>Fecha fin (opcional)</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <FormTextarea label="Descripción (opcional)" value={description} onChange={setDescription} T={T} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '10px', borderRadius: '10px', background: T.cardBg2, border: `1px solid ${T.cardBorder}`, color: T.textMuted, fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              style={{ flex: 1, padding: '10px', borderRadius: '10px', background: '#C9344C', border: 'none', color: 'white', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Guardando...' : initial ? 'Guardar cambios' : 'Crear evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
/*  SHARED COMPONENTS                                                          */
/* ════════════════════════════════════════════════════════════════════════════ */

function SectionHeader({ icon: Icon, title, subtitle, T, action }: { icon: typeof Database; title: string; subtitle: string; T: ReturnType<typeof useThemeTokens>; action?: { label: string; onClick: () => void; actionIcon?: typeof Plus } }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: T.accentRed.bg, border: `1px solid ${T.accentRed.border}` }}>
          <Icon size={18} style={{ color: T.accentRed.color }} />
        </div>
        <div>
          <h2 style={{ color: T.text, fontWeight: 700, fontSize: '18px' }}>{title}</h2>
          <p style={{ color: T.textMuted, fontSize: '13px' }}>{subtitle}</p>
        </div>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl"
          style={{ background: '#C9344C', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
        >
          {action.actionIcon ? <action.actionIcon size={14} /> : <Plus size={14} />} {action.label}
        </button>
      )}
    </div>
  );
}

function ErrorBanner({ message, T }: { message: string; T: ReturnType<typeof useThemeTokens> }) {
  return (
    <div className="mb-4 p-3 rounded-xl flex items-center gap-2" style={{ background: T.error.bg, border: `1px solid ${T.error.border}` }}>
      <AlertCircle size={16} style={{ color: T.error.text, flexShrink: 0 }} />
      <p style={{ color: T.error.text, fontSize: '13px' }}>{message}</p>
    </div>
  );
}

function LoadingIndicator({ T }: { T: ReturnType<typeof useThemeTokens> }) {
  return <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: T.textMuted }} /></div>;
}

function EmptyState({ label, T }: { label: string; T: ReturnType<typeof useThemeTokens> }) {
  return <p className="py-12 text-center" style={{ color: T.textMuted, fontSize: '14px' }}>{label}</p>;
}

function FormInput({ label, value, onChange, T, placeholder }: { label: string; value: string; onChange: (v: string) => void; T: ReturnType<typeof useThemeTokens>; placeholder?: string }) {
  return (
    <div>
      <label className="block mb-1.5" style={{ color: T.text, fontSize: '12px', fontWeight: 500 }}>{label}</label>
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full py-2.5 px-3 rounded-xl outline-none transition-all"
        style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '13px' }}
        onFocus={e => { e.currentTarget.style.borderColor = T.inputFocusBorder; }}
        onBlur={e => { e.currentTarget.style.borderColor = T.inputBorder; }}
      />
    </div>
  );
}

function FormTextarea({ label, value, onChange, T }: { label: string; value: string; onChange: (v: string) => void; T: ReturnType<typeof useThemeTokens> }) {
  return (
    <div>
      <label className="block mb-1.5" style={{ color: T.text, fontSize: '12px', fontWeight: 500 }}>{label}</label>
      <textarea
        value={value} onChange={e => onChange(e.target.value)} rows={4}
        className="w-full py-2.5 px-3 rounded-xl outline-none transition-all resize-none"
        style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '13px' }}
        onFocus={e => { e.currentTarget.style.borderColor = T.inputFocusBorder; }}
        onBlur={e => { e.currentTarget.style.borderColor = T.inputBorder; }}
      />
    </div>
  );
}

function FormSelect({ label, value, options, onChange, T }: { label: string; value: string; options: { val: string; label: string }[]; onChange: (v: string) => void; T: ReturnType<typeof useThemeTokens> }) {
  return (
    <div>
      <label className="block mb-1.5" style={{ color: T.text, fontSize: '12px', fontWeight: 500 }}>{label}</label>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        className="w-full py-2.5 px-3 rounded-xl outline-none cursor-pointer"
        style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText, fontSize: '13px' }}
      >
        {options.map(o => <option key={o.val} value={o.val} style={{ background: T.selectOptionBg }}>{o.label}</option>)}
      </select>
    </div>
  );
}

function formatRoleName(role: string): string {
  return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/* ════════════════════════════════════════════════════════════════════════════ */
/*  BUGS / REPORTS SECTION                                                      */
/* ════════════════════════════════════════════════════════════════════════════ */

const reportTypeLabels: Record<string, string> = {
  ERROR_HORARIO: 'Error en horario',
  CAMBIO_SALON: 'Cambio de salón',
  INFORMACION_INCORRECTA: 'Información incorrecta',
  OTRO: 'Otro',
};

const reportStatusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDIENTE:     { label: 'Pendiente',    color: '#D97706', bg: 'rgba(217,119,6,0.1)',  border: 'rgba(217,119,6,0.25)' },
  EN_REVISION:   { label: 'En revisión',  color: '#6366F1', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.25)' },
  RESUELTO:      { label: 'Resuelto',     color: '#16A34A', bg: 'rgba(22,163,74,0.1)',  border: 'rgba(22,163,74,0.25)' },
  DESCARTADO:    { label: 'Descartado',   color: '#6B7280', bg: 'rgba(107,114,128,0.1)',border: 'rgba(107,114,128,0.25)' },
};

function BugsSection({ T }: { T: ReturnType<typeof useThemeTokens> }) {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<ReportType | ''>('');
  const [updating, setUpdating] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      setReports(await reportApi.listAll(
        statusFilter as ReportStatus || undefined,
        typeFilter as ReportType || undefined,
      ));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error cargando reportes');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleStatus = async (id: number, status: ReportStatus) => {
    setUpdating(id);
    try {
      const updated = await reportApi.updateStatus(id, status);
      setReports(prev => prev.map(r => r.id === id ? updated : r));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error actualizando');
    } finally {
      setUpdating(null);
    }
  };

  const pendingCount = reports.filter(r => r.status === 'PENDIENTE').length;

  return (
    <>
      <SectionHeader
        icon={Bug}
        title="Reportes de problemas"
        subtitle={`${reports.length} reporte${reports.length !== 1 ? 's' : ''} · ${pendingCount} pendiente${pendingCount !== 1 ? 's' : ''}`}
        T={T}
        action={{ label: 'Actualizar', onClick: fetchReports, actionIcon: RotateCcw }}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Status filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setStatusOpen(o => !o); setTypeOpen(false); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: T.cardBg, border: `1px solid ${statusFilter ? '#C9344C' : T.cardBorder}`, color: statusFilter ? '#C9344C' : T.textMuted, fontSize: '12px', fontWeight: 500, cursor: 'pointer', minWidth: '148px', justifyContent: 'space-between' }}
          >
            <span>{statusFilter ? reportStatusConfig[statusFilter]?.label : 'Todos los estados'}</span>
            <ChevronDown size={13} style={{ transition: 'transform 0.15s', transform: statusOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }} />
          </button>
          {statusOpen && (
            <div className="absolute top-full left-0 mt-1 rounded-xl overflow-hidden z-20" style={{ background: T.isDark ? 'rgb(30,26,48)' : '#FFFFFF', border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow, minWidth: '160px' }}>
              {[{ val: '', label: 'Todos los estados' }, ...Object.entries(reportStatusConfig).map(([val, { label }]) => ({ val, label }))].map(({ val, label }) => (
                <button key={val} type="button"
                  onClick={() => { setStatusFilter(val as any); setStatusOpen(false); }}
                  className="w-full text-left px-3 py-2.5 transition-all"
                  style={{ background: val === statusFilter ? (T.isDark ? 'rgba(201,52,76,0.12)' : 'rgba(201,52,76,0.06)') : 'transparent', color: val === statusFilter ? '#C9344C' : T.text, fontSize: '12px', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => { if (val !== statusFilter) e.currentTarget.style.background = T.isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F7'; }}
                  onMouseLeave={e => { if (val !== statusFilter) e.currentTarget.style.background = 'transparent'; }}
                >{label}</button>
              ))}
            </div>
          )}
        </div>

        {/* Type filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setTypeOpen(o => !o); setStatusOpen(false); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: T.cardBg, border: `1px solid ${typeFilter ? '#C9344C' : T.cardBorder}`, color: typeFilter ? '#C9344C' : T.textMuted, fontSize: '12px', fontWeight: 500, cursor: 'pointer', minWidth: '148px', justifyContent: 'space-between' }}
          >
            <span>{typeFilter ? reportTypeLabels[typeFilter] : 'Todos los tipos'}</span>
            <ChevronDown size={13} style={{ transition: 'transform 0.15s', transform: typeOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }} />
          </button>
          {typeOpen && (
            <div className="absolute top-full left-0 mt-1 rounded-xl overflow-hidden z-20" style={{ background: T.isDark ? 'rgb(30,26,48)' : '#FFFFFF', border: `1px solid ${T.cardBorder}`, boxShadow: T.cardShadow, minWidth: '200px' }}>
              {[{ val: '', label: 'Todos los tipos' }, ...Object.entries(reportTypeLabels).map(([val, label]) => ({ val, label }))].map(({ val, label }) => (
                <button key={val} type="button"
                  onClick={() => { setTypeFilter(val as any); setTypeOpen(false); }}
                  className="w-full text-left px-3 py-2.5 transition-all"
                  style={{ background: val === typeFilter ? (T.isDark ? 'rgba(201,52,76,0.12)' : 'rgba(201,52,76,0.06)') : 'transparent', color: val === typeFilter ? '#C9344C' : T.text, fontSize: '12px', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => { if (val !== typeFilter) e.currentTarget.style.background = T.isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F7'; }}
                  onMouseLeave={e => { if (val !== typeFilter) e.currentTarget.style.background = 'transparent'; }}
                >{label}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && <ErrorBanner message={error} T={T} />}

      {loading ? <LoadingIndicator T={T} /> : reports.length === 0 ? (
        <EmptyState label="No hay reportes con los filtros seleccionados." T={T} />
      ) : (
        <div className="space-y-3">
          {reports.map(report => {
            const sc = reportStatusConfig[report.status] || reportStatusConfig.OTRO;
            const typeLabel = reportTypeLabels[report.reportType] || report.reportType;
            const isExpanded = expandedId === report.id;
            let images: string[] = [];
            try { images = report.evidenceUrl ? JSON.parse(report.evidenceUrl) : []; } catch { /* not json */ }
            const hasImages = images.length > 0;

            return (
              <div key={report.id} className="rounded-2xl overflow-hidden" style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}` }}>
                <div className="p-4">
                  {/* Top row */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: T.isDark ? 'rgba(201,52,76,0.12)' : 'rgba(201,52,76,0.07)', border: '1px solid rgba(201,52,76,0.18)' }}>
                      <Bug size={14} style={{ color: '#C9344C' }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="px-2 py-0.5 rounded-full" style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color, fontSize: '10px', fontWeight: 600 }}>{sc.label}</span>
                        <span className="px-2 py-0.5 rounded-full" style={{ background: T.tagBg, border: `1px solid ${T.tagBorder}`, color: T.tagColor, fontSize: '10px', fontWeight: 600 }}>{typeLabel}</span>
                        <span style={{ color: T.textSubtle, fontSize: '10px' }}>#{report.id} · {new Date(report.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p style={{ color: T.text, fontSize: '13px', lineHeight: 1.5 }} className={isExpanded ? '' : 'line-clamp-2'}>{report.description}</p>
                      {report.description.length > 120 && (
                        <button onClick={() => setExpandedId(isExpanded ? null : report.id)} style={{ color: T.link, fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', marginTop: '2px' }}>
                          {isExpanded ? 'Ver menos' : 'Ver más'}
                        </button>
                      )}
                      {report.resolvedAt && (
                        <p style={{ color: T.textSubtle, fontSize: '11px', marginTop: '4px' }}>
                          Resuelto: {new Date(report.resolvedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Images */}
                  {hasImages && isExpanded && (
                    <div className="mt-3 rounded-xl overflow-hidden" style={{ border: `1px solid ${T.cardBorder}` }}>
                      <AdminMosaic photos={images} />
                    </div>
                  )}
                  {hasImages && !isExpanded && (
                    <button onClick={() => setExpandedId(report.id)} className="mt-2 flex items-center gap-1.5 text-left" style={{ color: T.textMuted, fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <ImageOff size={12} />
                      {images.length} imagen{images.length !== 1 ? 'es' : ''} adjunta{images.length !== 1 ? 's' : ''} — clic para ver
                    </button>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    {updating === report.id ? (
                      <div className="flex items-center gap-1.5" style={{ color: T.textMuted, fontSize: '12px' }}>
                        <Loader2 size={12} className="animate-spin" /> Actualizando...
                      </div>
                    ) : (
                      <>
                        {report.status !== 'EN_REVISION' && report.status !== 'RESUELTO' && report.status !== 'DESCARTADO' && (
                          <button onClick={() => handleStatus(report.id, 'EN_REVISION')} className="px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#6366F1', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                            Marcar en revisión
                          </button>
                        )}
                        {report.status !== 'RESUELTO' && (
                          <button onClick={() => handleStatus(report.id, 'RESUELTO')} className="px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.25)', color: '#16A34A', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                            Marcar resuelto
                          </button>
                        )}
                        {report.status !== 'DESCARTADO' && report.status !== 'RESUELTO' && (
                          <button onClick={() => handleStatus(report.id, 'DESCARTADO')} className="px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(107,114,128,0.08)', border: '1px solid rgba(107,114,128,0.2)', color: '#6B7280', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                            Descartar
                          </button>
                        )}
                        {(report.status === 'RESUELTO' || report.status === 'DESCARTADO') && (
                          <button onClick={() => handleStatus(report.id, 'PENDIENTE')} className="px-2.5 py-1.5 rounded-lg flex items-center gap-1" style={{ background: T.btnGhostBg, border: `1px solid ${T.btnGhostBorder}`, color: T.textMuted, fontSize: '11px', fontWeight: 500, cursor: 'pointer' }}>
                            <RotateCcw size={10} /> Reabrir
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function AdminMosaic({ photos }: { photos: string[] }) {
  if (photos.length === 1) {
    return <div style={{ aspectRatio: '16/7' }}><img src={photos[0]} alt="" className="w-full h-full object-cover" /></div>;
  }
  if (photos.length === 2) {
    return (
      <div className="flex" style={{ aspectRatio: '16/7' }}>
        {photos.map((src, i) => (
          <div key={i} className="flex-1" style={{ borderRight: i === 0 ? '2px solid white' : undefined }}>
            <img src={src} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex" style={{ aspectRatio: '16/7' }}>
      <div style={{ flex: '0 0 60%', borderRight: '2px solid white' }}>
        <img src={photos[0]} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="flex flex-col flex-1">
        {[1, 2].map(i => (
          <div key={i} className="flex-1" style={{ borderTop: i === 2 ? '2px solid white' : undefined }}>
            <img src={photos[i]} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
