import { useTheme } from './ThemeContext';

/**
 * Centralized design token system for NexoUD.
 * Dark  → current glass/neon style
 * Light → Apple / Airbnb / Jira clean style
 */
export function useThemeTokens() {
  const { theme, toggleTheme } = useTheme();
  const d = theme === 'dark';

  return {
    // ── Meta ──────────────────────────────────────────────────────────────────
    isDark: d,
    theme,
    toggleTheme,

    // ── Page backgrounds ──────────────────────────────────────────────────────
    pageBg:      d ? 'linear-gradient(135deg, #0F0B1E 0%, #1A1333 60%, #0D1117 100%)' : '#F5F5F7',
    pageBgColor: d ? '#0F0B1E' : '#F5F5F7',
    showBlobs:   d,

    // ── Typography ────────────────────────────────────────────────────────────
    text:        d ? '#F1F0F5' : '#1D1D1F',
    textMuted:   d ? '#8B8A97' : '#6E6E73',
    textSubtle:  d ? '#5C5B66' : '#86868B',

    // ── Cards / surfaces ──────────────────────────────────────────────────────
    cardBg:         d ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
    cardBg2:        d ? 'rgba(255,255,255,0.06)' : '#F9F9FB',
    cardBorder:     d ? 'rgba(255,255,255,0.07)' : '#E5E5EA',
    cardBorder2:    d ? 'rgba(255,255,255,0.10)' : '#D2D2D7',
    cardShadow:     d ? 'none'                    : '0 1px 8px rgba(0,0,0,0.06)',
    cardHoverShadow:d ? 'none'                    : '0 4px 16px rgba(0,0,0,0.09)',
    cardBlur:       d ? 'blur(20px)'              : 'none',

    // ── Auth pages ────────────────────────────────────────────────────────────
    authCardBg:     d ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
    authCardBorder: d ? 'rgba(255,255,255,0.09)' : '#E5E5EA',
    authCardShadow: d ? '0 20px 60px rgba(0,0,0,0.4)' : '0 4px 32px rgba(0,0,0,0.08)',
    authCardBlur:   d ? 'blur(24px)'             : 'none',

    // ── Inputs ────────────────────────────────────────────────────────────────
    inputBg:         d ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
    inputBorder:     d ? 'rgba(255,255,255,0.1)'  : '#D1D1D6',
    inputText:       d ? '#F1F0F5'                : '#1D1D1F',
    inputIcon:       d ? '#8B8A97'                : '#86868B',
    inputFocusBorder:d ? '#6366F1'                : '#4F46E5',
    inputFocusShadow:d ? 'rgba(99,102,241,0.15)'  : 'rgba(79,70,229,0.12)',
    selectOptionBg:  d ? '#1A1333'                : '#FFFFFF',

    // ── Primary (Wine Red) ────────────────────────────────────────────────────
    primary:        d ? '#E8485F'                 : '#C9344C',
    primaryDark:    '#A02438',
    primaryBg:      d ? 'rgba(201,52,76,0.12)'    : 'rgba(201,52,76,0.07)',
    primaryBorder:  d ? 'rgba(201,52,76,0.22)'    : 'rgba(201,52,76,0.18)',
    primaryShadow:  d ? '0 6px 24px rgba(201,52,76,0.42)' : '0 4px 16px rgba(201,52,76,0.22)',

    // ── Secondary (Indigo) ────────────────────────────────────────────────────
    secondary:      d ? '#818CF8'                 : '#4F46E5',
    secondaryDark:  '#4F46E5',
    secondaryBg:    d ? 'rgba(99,102,241,0.12)'   : 'rgba(79,70,229,0.07)',
    secondaryBorder:d ? 'rgba(99,102,241,0.25)'   : 'rgba(79,70,229,0.18)',

    // ── Accent palette (semantic colors) ──────────────────────────────────────
    accentRed: {
      color:  d ? '#E8485F' : '#C9344C',
      bg:     d ? 'rgba(201,52,76,0.10)'  : '#FFF1F2',
      border: d ? 'rgba(201,52,76,0.20)'  : 'rgba(201,52,76,0.16)',
    },
    accentIndigo: {
      color:  d ? '#818CF8' : '#4F46E5',
      bg:     d ? 'rgba(99,102,241,0.10)' : '#EEF2FF',
      border: d ? 'rgba(99,102,241,0.20)' : 'rgba(79,70,229,0.16)',
    },
    accentGreen: {
      color:  d ? '#34D399' : '#16A34A',
      bg:     d ? 'rgba(52,211,153,0.10)' : '#F0FDF4',
      border: d ? 'rgba(52,211,153,0.20)' : 'rgba(22,163,74,0.16)',
    },
    accentYellow: {
      color:  d ? '#FBBF24' : '#D97706',
      bg:     d ? 'rgba(251,191,36,0.10)' : '#FFFBEB',
      border: d ? 'rgba(251,191,36,0.20)' : 'rgba(217,119,6,0.16)',
    },
    accentPink: {
      color:  d ? '#F472B6' : '#DB2777',
      bg:     d ? 'rgba(244,114,182,0.10)': '#FDF2F8',
      border: d ? 'rgba(244,114,182,0.20)': 'rgba(219,39,119,0.15)',
    },
    accentCyan: {
      color:  d ? '#60A5FA' : '#2563EB',
      bg:     d ? 'rgba(96,165,250,0.10)' : '#EFF6FF',
      border: d ? 'rgba(96,165,250,0.20)' : 'rgba(37,99,235,0.15)',
    },

    // ── Semantic states ───────────────────────────────────────────────────────
    error: {
      bg:     d ? 'rgba(248,113,113,0.10)' : '#FFF1F2',
      border: d ? 'rgba(248,113,113,0.20)' : 'rgba(220,38,38,0.20)',
      text:   d ? '#F87171'                : '#DC2626',
    },
    success: {
      bg:     d ? 'rgba(52,211,153,0.10)'  : '#F0FDF4',
      border: d ? 'rgba(52,211,153,0.20)'  : 'rgba(22,163,74,0.20)',
      text:   d ? '#34D399'                : '#16A34A',
    },
    warning: {
      bg:     d ? 'rgba(251,191,36,0.10)'  : '#FFFBEB',
      border: d ? 'rgba(251,191,36,0.20)'  : 'rgba(217,119,6,0.20)',
      text:   d ? '#FBBF24'                : '#D97706',
    },

    // ── Dividers / borders ────────────────────────────────────────────────────
    divider:      d ? 'rgba(255,255,255,0.07)' : '#E5E5EA',
    divider2:     d ? 'rgba(255,255,255,0.05)' : '#F2F2F7',

    // ── Buttons (ghost / secondary) ───────────────────────────────────────────
    btnGhostBg:     d ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
    btnGhostBorder: d ? 'rgba(255,255,255,0.10)' : '#D2D2D7',
    btnGhostColor:  d ? '#F1F0F5'                : '#1D1D1F',
    btnGhostHoverBg:d ? 'rgba(255,255,255,0.09)' : '#F5F5F7',

    // ── Action rows (e.g. quick action items) ─────────────────────────────────
    actionBg:       d ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
    actionBorder:   d ? 'rgba(255,255,255,0.06)' : '#EEEEEF',
    actionHoverBg:  d ? 'rgba(255,255,255,0.07)' : '#F5F5F7',
    actionText:     d ? '#F1F0F5'                : '#1D1D1F',
    actionArrow:    d ? '#5C5B66'                : '#86868B',

    // ── Filter button ─────────────────────────────────────────────────────────
    filterBg:           d ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
    filterBorder:       d ? 'rgba(255,255,255,0.10)' : '#D2D2D7',
    filterColor:        d ? '#8B8A97'                : '#6E6E73',
    filterActiveBg:     d ? 'rgba(99,102,241,0.15)'  : 'rgba(79,70,229,0.08)',
    filterActiveBorder: d ? 'rgba(99,102,241,0.30)'  : 'rgba(79,70,229,0.25)',
    filterActiveColor:  d ? '#818CF8'                : '#4F46E5',

    // ── Tags / badges ─────────────────────────────────────────────────────────
    tagBg:     d ? 'rgba(255,255,255,0.06)' : '#F2F2F7',
    tagBorder: d ? 'rgba(255,255,255,0.10)' : '#D2D2D7',
    tagColor:  d ? '#8B8A97'                : '#6E6E73',

    // ── Modals ────────────────────────────────────────────────────────────────
    overlayBg:    d ? 'rgba(0,0,0,0.65)'          : 'rgba(0,0,0,0.40)',
    modalBg:      d ? 'rgba(26,19,51,0.95)'        : '#FFFFFF',
    modalBorder:  d ? 'rgba(255,255,255,0.10)'     : '#E5E5EA',
    modalShadow:  d ? '0 20px 60px rgba(0,0,0,0.6)' : '0 8px 40px rgba(0,0,0,0.12)',
    modalBlur:    d ? 'blur(40px)'                 : 'none',
    modalCloseBg: d ? 'rgba(255,255,255,0.04)'     : '#F5F5F7',
    modalCloseBorder: d ? 'rgba(255,255,255,0.07)' : '#E5E5EA',

    // ── Links ─────────────────────────────────────────────────────────────────
    link: d ? '#818CF8' : '#4F46E5',

    // ── Password strength bar inactive ────────────────────────────────────────
    strengthBarInactive: d ? 'rgba(255,255,255,0.08)' : '#E5E5EA',

    // ── Pensum grid header ────────────────────────────────────────────────────
    pensumHeaderBg:     d ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
    pensumHeaderBorder: d ? 'rgba(255,255,255,0.07)' : '#E5E5EA',
    pensumCellLocked:   d ? 'rgba(255,255,255,0.02)' : '#F9F9FB',
    pensumCellLockedBorder: d ? 'rgba(255,255,255,0.05)' : '#EEEEEF',
  } as const;
}
