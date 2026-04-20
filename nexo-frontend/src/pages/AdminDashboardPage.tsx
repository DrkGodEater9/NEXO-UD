import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { useThemeTokens } from '../context/useThemeTokens';
import {
  UploadCloud, FileJson, CheckCircle, AlertCircle, Loader2, Database,
  AlertTriangle, Users, Shield, Megaphone, Heart, MapPin, Search,
  Plus, Trash2, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
  academicOfferApi, AcademicOfferUploadResponse, ApiError,
  adminApi, UserSummary, RoleInfo, PageResponse,
  announcementsApi, AnnouncementData, AnnouncementPayload,
  welfareApi, WelfareData, WelfarePayload,
  campusApi, CampusData, CampusPayload,
} from '../services/api';

type Section = 'upload' | 'roles' | 'announcements' | 'welfare' | 'campus';

const sidebarSections: { key: Section; label: string; icon: typeof Database }[] = [
  { key: 'upload', label: 'Carga Académica', icon: Database },
  { key: 'roles', label: 'Gestión de Roles', icon: Shield },
  { key: 'announcements', label: 'Avisos Generales', icon: Megaphone },
  { key: 'welfare', label: 'Bienestar', icon: Heart },
  { key: 'campus', label: 'Sedes', icon: MapPin },
];

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const T = useThemeTokens();
  const [section, setSection] = useState<Section>('upload');

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
    if (user && !user.roles.includes('ADMINISTRADOR')) navigate('/dashboard');
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated || !user || !user.roles.includes('ADMINISTRADOR')) return null;

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
          {section === 'upload' && <UploadSection T={T} />}
          {section === 'roles' && <RolesSection T={T} />}
          {section === 'announcements' && <AnnouncementsSection T={T} />}
          {section === 'welfare' && <WelfareSection T={T} />}
          {section === 'campus' && <CampusSection T={T} />}
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
  const [semester, setSemester] = useState('2026-1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<AcademicOfferUploadResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) { setError('Selecciona un archivo JSON.'); return; }
    if (!semester) { setError('Ingresa un semestre.'); return; }
    setLoading(true); setError(null); setSuccess(null);
    try {
      const res = await academicOfferApi.upload(file, semester);
      setSuccess(res); setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Error inesperado al subir.');
    } finally { setLoading(false); }
  };

  return (
    <>
      <SectionHeader icon={Database} title="Carga Académica" subtitle="Sube el JSON generado por el extractor de horarios." T={T} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block mb-2 text-sm font-medium" style={{ color: T.text }}>Periodo Académico</label>
          <input
            type="text" value={semester} onChange={e => setSemester(e.target.value)}
            placeholder="Ejemplo: 2026-1"
            className="w-full py-3 px-4 rounded-xl outline-none transition-all mb-4"
            style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText }}
            onFocus={e => { e.currentTarget.style.borderColor = T.inputFocusBorder; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.inputFocusShadow}`; }}
            onBlur={e => { e.currentTarget.style.borderColor = T.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
          />
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
            onClick={handleUpload} disabled={loading || !file}
            className="w-full mt-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            style={{
              background: (loading || !file) ? T.cardBg2 : '#C9344C',
              color: (loading || !file) ? T.textMuted : 'white',
              border: (loading || !file) ? `1px solid ${T.cardBorder}` : 'none',
              cursor: (loading || !file) ? 'not-allowed' : 'pointer',
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
                <li className="flex gap-2"><span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: T.divider, color: T.text, fontSize: '11px', fontWeight: 600 }}>1</span>Ejecuta <code style={{ color: T.primary }}>extractor_horarios.py</code> con los PDFs.</li>
                <li className="flex gap-2"><span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: T.divider, color: T.text, fontSize: '11px', fontWeight: 600 }}>2</span>Busca el <code style={{ color: T.primary }}>data.json</code> generado.</li>
                <li className="flex gap-2"><span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: T.divider, color: T.text, fontSize: '11px', fontWeight: 600 }}>3</span>Selecciona el periodo académico correcto.</li>
              </ol>
            </div>
          )}
        </div>
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
          {items.map(item => (
            <div key={item.id} className="p-4 rounded-2xl transition-all" style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}` }}>
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
          ))}
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) { setError('Título y contenido son obligatorios.'); return; }
    setSaving(true); setError(null);
    try { await onSave({ title, body, scope, type, faculty: scope === 'FACULTAD' ? faculty : undefined }); }
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
            return (
              <div key={item.id} className="p-4 rounded-2xl" style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}` }}>
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) { setError('Título y descripción son obligatorios.'); return; }
    setSaving(true); setError(null);
    try { await onSave({ title, description, category, links: links || undefined }); }
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

function CampusForm({ T, initial, onSave, onCancel }: { T: ReturnType<typeof useThemeTokens>; initial: CampusData | null; onSave: (d: CampusPayload) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [faculty, setFaculty] = useState(initial?.faculty ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [mapUrl, setMapUrl] = useState(initial?.mapUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim() || !faculty.trim()) { setError('Nombre y facultad son obligatorios.'); return; }
    setSaving(true); setError(null);
    try { await onSave({ name, faculty, address: address || undefined, mapUrl: mapUrl || undefined }); }
    catch (e: any) { setError(e.message || 'Error guardando'); setSaving(false); }
  };

  return (
    <div className="mb-4 p-5 rounded-2xl" style={{ background: T.cardBg, border: `1px solid ${T.primaryBorder}` }}>
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ color: T.text, fontSize: '15px', fontWeight: 600 }}>{initial ? 'Editar Sede' : 'Nueva Sede'}</h3>
        <button onClick={onCancel} style={{ color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
      </div>
      <div className="space-y-3">
        <FormInput label="Nombre" value={name} onChange={setName} T={T} placeholder="Ej: Sede Macarena A" />
        <FormInput label="Facultad" value={faculty} onChange={setFaculty} T={T} placeholder="Ej: Ingeniería" />
        <FormInput label="Dirección (opcional)" value={address} onChange={setAddress} T={T} />
        <FormInput label="URL del Mapa (opcional)" value={mapUrl} onChange={setMapUrl} T={T} />
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
/*  SHARED COMPONENTS                                                          */
/* ════════════════════════════════════════════════════════════════════════════ */

function SectionHeader({ icon: Icon, title, subtitle, T, action }: { icon: typeof Database; title: string; subtitle: string; T: ReturnType<typeof useThemeTokens>; action?: { label: string; onClick: () => void } }) {
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
          <Plus size={14} /> {action.label}
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
