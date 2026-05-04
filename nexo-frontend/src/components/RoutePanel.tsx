import { X, Navigation, Bus, Footprints, Clock, MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { RouteResponse, RouteStep } from '../services/api';

interface RoutePanelProps {
  loading: boolean;
  error: string | null;
  route: RouteResponse | null;
  originName: string;
  destName: string;
  onClose: () => void;
}

export default function RoutePanel({ loading, error, route, originName, destName, onClose }: RoutePanelProps) {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: '340px',
      height: '100%',
      background: '#1a1a2e',
      borderLeft: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '0 16px 16px 0',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Navigation size={14} color="#818cf8" />
            </div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>Ruta más rápida</span>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.4)', padding: '4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '6px',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Origin → Dest */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#34d399', flexShrink: 0,
            }} />
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', lineHeight: 1.3 }}>{originName}</span>
          </div>
          <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.15)', marginLeft: '3.5px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={8} color="#e8485f" style={{ flexShrink: 0 }} />
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', lineHeight: 1.3 }}>{destName}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '48px', gap: '12px' }}>
            <Loader2 size={24} color="#818cf8" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Calculando ruta...</span>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {error && !loading && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            background: 'rgba(232,72,95,0.1)', border: '1px solid rgba(232,72,95,0.25)',
            borderRadius: '10px', padding: '12px',
          }}>
            <AlertCircle size={15} color="#e8485f" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ color: '#e8485f', fontSize: '12px', lineHeight: 1.5, margin: 0 }}>{error}</p>
          </div>
        )}

        {route && !loading && (
          <>
            {/* Summary chips */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <Chip icon={<Clock size={11} color="#818cf8" />} label={route.totalDuration} color="#818cf8" />
              <Chip icon={<Navigation size={11} color="#34d399" />} label={route.totalDistance} color="#34d399" />
            </div>

            {/* Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {route.steps.map((step, i) => (
                <StepItem key={i} step={step} isLast={i === route.steps.length - 1} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Chip({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '5px',
      background: `${color}18`, border: `1px solid ${color}33`,
      borderRadius: '20px', padding: '4px 10px',
    }}>
      {icon}
      <span style={{ color, fontSize: '11px', fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function StepItem({ step, isLast }: { step: RouteStep; isLast: boolean }) {
  const isTransit = step.travelMode === 'TRANSIT';
  const isWalk    = step.travelMode === 'WALKING';

  const accentColor = isTransit ? '#818cf8' : isWalk ? '#34d399' : '#fbbf24';
  const bgColor     = isTransit ? 'rgba(129,140,248,0.08)' : isWalk ? 'rgba(52,211,153,0.08)' : 'rgba(251,191,36,0.08)';
  const borderColor = isTransit ? 'rgba(129,140,248,0.2)'  : isWalk ? 'rgba(52,211,153,0.2)'  : 'rgba(251,191,36,0.2)';

  return (
    <div style={{ display: 'flex', gap: '10px', paddingBottom: isLast ? 0 : '2px' }}>
      {/* Timeline dot + line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: '26px', height: '26px', borderRadius: '8px',
          background: bgColor, border: `1px solid ${borderColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {isTransit
            ? <Bus size={13} color={accentColor} />
            : <Footprints size={13} color={accentColor} />}
        </div>
        {!isLast && (
          <div style={{ width: '1px', flex: 1, minHeight: '12px', background: 'rgba(255,255,255,0.07)', margin: '3px 0' }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : '10px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px', marginBottom: '3px' }}>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', lineHeight: 1.45, margin: 0, flex: 1 }}>
            {step.instruction}
          </p>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', whiteSpace: 'nowrap', flexShrink: 0, marginTop: '1px' }}>
            {step.duration}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {isTransit && step.transitLine && (
            <span style={{
              background: accentColor, color: '#fff',
              fontSize: '9px', fontWeight: 700,
              padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.3px',
            }}>
              {step.transitLine}
            </span>
          )}
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>{step.distance}</span>
        </div>
      </div>
    </div>
  );
}
