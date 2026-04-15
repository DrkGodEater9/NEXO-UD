import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, Calendar, Search, Info, User, LogOut,
  ChevronLeft, ChevronRight, Menu, X, Sun, Moon
} from 'lucide-react';
import { ConfirmModal } from './Modal';

const navItems = [
  { path: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { path: '/planner', label: 'Planeador', icon: Calendar },
  { path: '/search', label: 'Buscar materias', icon: Search },
  { path: '/info', label: 'Información', icon: Info },
  { path: '/profile', label: 'Mi Perfil', icon: User },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  const isDark = theme === 'dark';

  // Apple-inspired light / NexoUD dark token map
  const bgMain        = isDark ? 'linear-gradient(135deg, #0F0B1E 0%, #1A1333 50%, #0D1117 100%)' : '#F5F5F7';
  const bgMainColor   = isDark ? '#0F0B1E' : '#F5F5F7';
  const sidebarBg     = isDark ? 'rgba(255,255,255,0.035)' : '#FFFFFF';
  const sidebarBorder = isDark ? 'rgba(255,255,255,0.07)' : '#D2D2D7';
  const sidebarBlur   = isDark ? 'blur(24px)' : 'none';
  const userCardBg    = isDark ? 'rgba(255,255,255,0.04)' : '#F5F5F7';
  const userCardBorder = isDark ? 'rgba(255,255,255,0.07)' : '#E5E5EA';
  const mobileBarBg   = isDark ? 'rgba(15,11,30,0.92)' : 'rgba(255,255,255,0.95)';
  const mobileBarBorder = isDark ? 'rgba(255,255,255,0.07)' : '#D2D2D7';
  const textMain      = isDark ? '#F1F0F5' : '#1D1D1F';
  const textMuted     = isDark ? '#8B8A97' : '#6E6E73';
  const navActiveBg   = isDark ? 'linear-gradient(135deg, rgba(201,52,76,0.18), rgba(99,102,241,0.12))' : 'rgba(201,52,76,0.08)';
  const navActiveBorder = isDark ? 'rgba(201,52,76,0.22)' : 'rgba(201,52,76,0.18)';
  const navActiveColor = isDark ? '#F1F0F5' : '#1D1D1F';
  const navHoverBg    = isDark ? 'rgba(255,255,255,0.04)' : '#F5F5F7';
  const toggleBg      = isDark ? 'rgba(255,255,255,0.06)' : '#E5E5EA';
  const toggleBorder  = isDark ? 'rgba(255,255,255,0.1)' : '#C7C7CC';
  const collapseColor = isDark ? '#8B8A97' : '#6E6E73';
  const logoText      = isDark ? '#F1F0F5' : '#1D1D1F';
  const mobileSidebarBg = isDark ? 'rgba(15,11,30,0.97)' : '#FFFFFF';
  const mobileBottomBg  = isDark ? 'rgba(15,11,30,0.92)' : 'rgba(255,255,255,0.97)';
  const mobileBottomBorder = isDark ? 'rgba(255,255,255,0.07)' : '#D2D2D7';
  const mobileNavActive = isDark ? '#E8485F' : '#C9344C';
  const mobileNavMuted  = isDark ? '#8B8A97' : '#6E6E73';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = user?.nombre
    ? user.nombre.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
    : 'UD';

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex" style={{ backgroundImage: bgMain, backgroundAttachment: 'fixed', backgroundColor: bgMainColor }}>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0 transition-all duration-300 ease-out`}
        style={{
          width: collapsed ? '72px' : '260px',
          background: sidebarBg,
          backdropFilter: sidebarBlur,
          WebkitBackdropFilter: sidebarBlur,
          borderRight: `1px solid ${sidebarBorder}`,
          boxShadow: isDark ? 'none' : '2px 0 12px rgba(0,0,0,0.04)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5" style={{ borderBottom: `1px solid ${sidebarBorder}` }}>
          {!collapsed && (
            <Link to="/dashboard" className="flex items-center gap-2 group" style={{ textDecoration: 'none' }}>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #E8485F, #A02438)', boxShadow: isDark ? '0 4px 12px rgba(201,52,76,0.4)' : '0 2px 8px rgba(201,52,76,0.22)' }}
              >
                <span style={{ color: 'white', fontWeight: 700, fontSize: '14px', fontFamily: 'Inter' }}>N</span>
              </div>
              <span style={{ color: logoText, fontWeight: 700, fontSize: '18px', letterSpacing: '-0.02em' }}>
                NexoUD
              </span>
            </Link>
          )}
          {collapsed && (
            <Link to="/dashboard" className="mx-auto">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #E8485F, #A02438)', boxShadow: isDark ? '0 4px 12px rgba(201,52,76,0.4)' : '0 2px 8px rgba(201,52,76,0.22)' }}
              >
                <span style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>N</span>
              </div>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg transition-all"
            style={{ color: collapseColor, background: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.color = textMain)}
            onMouseLeave={e => (e.currentTarget.style.color = collapseColor)}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* User Info */}
        {!collapsed && user && (
          <div
            className="mx-3 mt-4 p-3 rounded-xl flex items-center gap-3"
            style={{ background: userCardBg, border: `1px solid ${userCardBorder}` }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', fontSize: '13px', fontWeight: 700, color: 'white' }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p style={{ color: textMain, fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.nombre.split(' ')[0]} {user.nombre.split(' ')[1] || ''}
              </p>
              <p style={{ color: textMuted, fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.correo}
              </p>
            </div>
          </div>
        )}
        {collapsed && user && (
          <div className="flex justify-center mt-4">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', fontSize: '13px', fontWeight: 700, color: 'white' }}
            >
              {initials}
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 p-3 space-y-1 mt-2">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              title={collapsed ? label : undefined}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
                style={{
                  color: isActive(path) ? navActiveColor : textMuted,
                  background: isActive(path) ? navActiveBg : 'transparent',
                  border: isActive(path) ? `1px solid ${navActiveBorder}` : '1px solid transparent',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                onMouseEnter={e => {
                  if (!isActive(path)) {
                    e.currentTarget.style.color = textMain;
                    e.currentTarget.style.background = navHoverBg;
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive(path)) {
                    e.currentTarget.style.color = textMuted;
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                {!collapsed && (
                  <span style={{ fontSize: '14px', fontWeight: isActive(path) ? 600 : 500 }}>
                    {label}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </nav>

        {/* Logout + Theme */}
        <div className="p-3 space-y-1" style={{ borderTop: `1px solid ${sidebarBorder}` }}>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Tema claro' : 'Tema oscuro'}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
            style={{
              color: textMuted,
              background: toggleBg,
              border: `1px solid ${toggleBorder}`,
              cursor: 'pointer',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = textMain; }}
            onMouseLeave={e => { e.currentTarget.style.color = textMuted; }}
          >
            {isDark ? <Sun size={18} style={{ flexShrink: 0 }} /> : <Moon size={18} style={{ flexShrink: 0 }} />}
            {!collapsed && <span style={{ fontSize: '14px', fontWeight: 500 }}>{isDark ? 'Tema claro' : 'Tema oscuro'}</span>}
          </button>

          <button
            onClick={() => setLogoutConfirm(true)}
            title={collapsed ? 'Cerrar sesión' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
            style={{
              color: textMuted,
              background: 'transparent',
              border: '1px solid transparent',
              cursor: 'pointer',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#C9344C';
              e.currentTarget.style.background = isDark ? 'rgba(248,113,113,0.08)' : 'rgba(201,52,76,0.06)';
              e.currentTarget.style.borderColor = isDark ? 'rgba(248,113,113,0.15)' : 'rgba(201,52,76,0.15)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = textMuted;
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <LogOut size={18} style={{ flexShrink: 0 }} />
            {!collapsed && <span style={{ fontSize: '14px', fontWeight: 500 }}>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 md:hidden flex flex-col transition-transform duration-300`}
        style={{
          width: '280px',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          background: mobileSidebarBg,
          backdropFilter: isDark ? 'blur(24px)' : 'none',
          borderRight: `1px solid ${sidebarBorder}`,
          boxShadow: isDark ? 'none' : '4px 0 24px rgba(0,0,0,0.10)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-5" style={{ borderBottom: `1px solid ${sidebarBorder}` }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E8485F, #A02438)' }}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>N</span>
            </div>
            <span style={{ color: logoText, fontWeight: 700, fontSize: '18px', letterSpacing: '-0.02em' }}>NexoUD</span>
          </div>
          <button onClick={() => setMobileOpen(false)} style={{ color: textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {user && (
          <div className="mx-3 mt-4 p-3 rounded-xl flex items-center gap-3" style={{ background: userCardBg, border: `1px solid ${userCardBorder}` }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', fontSize: '13px', fontWeight: 700, color: 'white' }}>
              {initials}
            </div>
            <div className="min-w-0">
              <p style={{ color: textMain, fontWeight: 600, fontSize: '13px' }}>{user.nombre.split(' ').slice(0, 2).join(' ')}</p>
              <p style={{ color: textMuted, fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.correo}</p>
            </div>
          </div>
        )}

        <nav className="flex-1 p-3 space-y-1 mt-2">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path} style={{ textDecoration: 'none' }} onClick={() => setMobileOpen(false)}>
              <div
                className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all"
                style={{
                  color: isActive(path) ? navActiveColor : textMuted,
                  background: isActive(path) ? navActiveBg : 'transparent',
                  border: isActive(path) ? `1px solid ${navActiveBorder}` : '1px solid transparent',
                }}
              >
                <Icon size={20} />
                <span style={{ fontSize: '15px', fontWeight: isActive(path) ? 600 : 500 }}>{label}</span>
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-3 space-y-1" style={{ borderTop: `1px solid ${sidebarBorder}` }}>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl"
            style={{ color: textMuted, background: toggleBg, border: `1px solid ${toggleBorder}`, cursor: 'pointer' }}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
            <span style={{ fontSize: '15px', fontWeight: 500 }}>{isDark ? 'Tema claro' : 'Tema oscuro'}</span>
          </button>
          <button
            onClick={() => { setLogoutConfirm(true); setMobileOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl"
            style={{ color: '#C9344C', background: isDark ? 'rgba(248,113,113,0.08)' : 'rgba(201,52,76,0.06)', border: isDark ? '1px solid rgba(248,113,113,0.15)' : '1px solid rgba(201,52,76,0.15)', cursor: 'pointer' }}
          >
            <LogOut size={20} />
            <span style={{ fontSize: '15px', fontWeight: 500 }}>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile Top Bar */}
        <header
          className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-30"
          style={{
            background: mobileBarBg,
            backdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${mobileBarBorder}`,
          }}
        >
          <button onClick={() => setMobileOpen(true)} style={{ color: textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E8485F, #A02438)' }}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: '11px' }}>N</span>
            </div>
            <span style={{ color: textMain, fontWeight: 700, fontSize: '16px' }}>NexoUD</span>
          </div>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Tema claro' : 'Tema oscuro'}
            className="p-1.5 rounded-lg transition-all"
            style={{ color: textMuted, background: toggleBg, border: `1px solid ${toggleBorder}`, cursor: 'pointer' }}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around px-2 py-2"
          style={{
            background: mobileBottomBg,
            backdropFilter: 'blur(20px)',
            borderTop: `1px solid ${mobileBottomBorder}`,
          }}
        >
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path} style={{ textDecoration: 'none', flex: 1 }}>
              <div
                className="flex flex-col items-center gap-1 py-1 rounded-xl transition-all"
                style={{ color: isActive(path) ? mobileNavActive : mobileNavMuted }}
              >
                <Icon size={20} />
                <span style={{ fontSize: '10px', fontWeight: isActive(path) ? 600 : 500 }}>{label.split(' ')[0]}</span>
              </div>
            </Link>
          ))}
        </nav>
      </div>

      <ConfirmModal
        isOpen={logoutConfirm}
        onClose={() => setLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Cerrar sesión"
        message="¿Estás seguro de que deseas cerrar sesión?"
        confirmText="Cerrar sesión"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
}