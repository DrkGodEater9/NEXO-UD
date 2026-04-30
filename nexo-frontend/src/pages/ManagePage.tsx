import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { useThemeTokens } from '../context/useThemeTokens';
import { Megaphone, Heart, MapPin, Calendar, type LucideIcon } from 'lucide-react';

const ROLE_ROUTES: { role: string; path: string; label: string; Icon: LucideIcon }[] = [
  { role: 'RADICADOR_AVISOS',      path: '/manage/announcements', label: 'Avisos',     Icon: Megaphone },
  { role: 'RADICADOR_BIENESTAR',   path: '/manage/welfare',       label: 'Bienestar',  Icon: Heart },
  { role: 'RADICADOR_SEDES',       path: '/manage/campus',        label: 'Sedes',      Icon: MapPin },
  { role: 'RADICADOR_CALENDARIO',  path: '/manage/calendar',      label: 'Calendario', Icon: Calendar },
];

export default function ManagePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isRestoring } = useAuth();
  const T = useThemeTokens();

  const userRoles = user?.roles ?? [];
  const applicableRoutes = ROLE_ROUTES.filter(r => userRoles.includes(r.role));

  useEffect(() => {
    if (isRestoring) return;
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!user) return;
    if (applicableRoutes.length === 0) { navigate('/dashboard'); return; }
    if (applicableRoutes.length === 1) {
      // Single role — redirect directly to that section
      navigate(applicableRoutes[0].path, { replace: true });
    }
    // Multiple roles — stay on this page to show a menu
  }, [isAuthenticated, isRestoring, user, navigate, applicableRoutes]);

  if (isRestoring || !isAuthenticated || !user) return null;
  if (applicableRoutes.length <= 1) return null; // redirecting

  // Multiple roles: show a selection menu
  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 style={{ color: T.text, fontWeight: 700, fontSize: '22px', letterSpacing: '-0.02em' }}>
            Administración
          </h1>
          <p style={{ color: T.textMuted, fontSize: '14px', marginTop: '4px' }}>
            Selecciona la sección que deseas gestionar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {applicableRoutes.map(({ path, label, Icon, role }) => {
            const accentMap: Record<string, { color: string; bg: string; border: string }> = {
              RADICADOR_AVISOS:     T.accentPink,
              RADICADOR_BIENESTAR:  T.accentGreen,
              RADICADOR_SEDES:      T.accentYellow,
              RADICADOR_CALENDARIO: T.accentIndigo,
            };
            const accent = accentMap[role] ?? T.accentRed;

            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="p-5 rounded-2xl text-left transition-all duration-200"
                style={{
                  background: T.cardBg,
                  border: `1px solid ${T.cardBorder}`,
                  boxShadow: T.cardShadow,
                  cursor: 'pointer',
                  width: '100%',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.border = `1px solid ${accent.border}`;
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = T.cardHoverShadow;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.border = `1px solid ${T.cardBorder}`;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = T.cardShadow;
                }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: accent.bg, border: `1px solid ${accent.border}` }}>
                  <Icon size={22} />
                </div>
                <h3 style={{ color: T.text, fontWeight: 600, fontSize: '15px' }}>
                  Gestionar {label}
                </h3>
              </button>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}

