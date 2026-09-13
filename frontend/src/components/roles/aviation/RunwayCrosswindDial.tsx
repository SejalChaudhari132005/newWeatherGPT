import React from 'react';
import {
  Compass,
  Wind,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Plane,
} from 'lucide-react';
import { RunwayWindComponent } from '../../../types/aviationIntelligence';

interface RunwayCrosswindDialProps {
  activeRunway: RunwayWindComponent;
  alternateRunways?: RunwayWindComponent[];
  onSelectRunway?: (runwayId: string) => void;
}

export const RunwayCrosswindDial: React.FC<RunwayCrosswindDialProps> = ({
  activeRunway,
  alternateRunways = [],
  onSelectRunway,
}) => {
  const {
    runway_id,
    runway_heading_deg,
    wind_speed_kts,
    wind_direction_deg,
    wind_gusts_kts,
    headwind_kts,
    crosswind_kts,
    crosswind_direction,
    is_crosswind_exceeded,
    operational_status,
    max_demonstrated_crosswind_kts,
  } = activeRunway;

  const isCaution = operational_status === 'caution';
  const isExceeded = operational_status === 'exceeded' || is_crosswind_exceeded;

  const statusConfig = {
    normal: {
      badge: 'bg-[#006B3C] text-white',
      border: 'border-[#006B3C]',
      label: 'NORMAL (Within Limits)',
      icon: CheckCircle2,
      crosswindColor: 'text-[#006B3C]',
      limitText: 'Within operating limits (≤15 kts)',
    },
    caution: {
      badge: 'bg-[#D97706] text-white',
      border: 'border-[#D97706]',
      label: 'CAUTION (>15 kts Crosswind)',
      icon: AlertTriangle,
      crosswindColor: 'text-[#D97706]',
      limitText: 'Moderate crosswind — pilot discretion required',
    },
    exceeded: {
      badge: 'bg-[#B42318] text-white',
      border: 'border-[#B42318]',
      label: 'EXCEEDED (>25 kts Operational Limit)',
      icon: ShieldAlert,
      crosswindColor: 'text-[#B42318]',
      limitText: 'Exceeds maximum demonstrated crosswind limit',
    },
  }[operational_status] || {
    badge: 'bg-[#006B3C] text-white',
    border: 'border-[#006B3C]',
    label: 'NORMAL (Within Limits)',
    icon: CheckCircle2,
    crosswindColor: 'text-[#006B3C]',
    limitText: 'Within operating limits (≤15 kts)',
  };

  const StatusIcon = statusConfig.icon;

  // Calculate Reciprocal Runway ID & Heading
  const reciprocalHeading = (runway_heading_deg + 180) % 360;
  const reciprocalId = String(Math.round(reciprocalHeading / 10)).padStart(2, '0');

  // Relative Wind Vector Calculations for SVG
  const dialRadius = 140; // Center is (160, 160)
  const centerX = 160;
  const centerY = 160;

  // Wind enters from wind_direction_deg and points towards center
  const windAngleRad = ((wind_direction_deg - 90) * Math.PI) / 180;
  const windSourceX = centerX + dialRadius * Math.cos(windAngleRad);
  const windSourceY = centerY + dialRadius * Math.sin(windAngleRad);

  const windTargetX = centerX + 35 * Math.cos(windAngleRad + Math.PI);
  const windTargetY = centerY + 35 * Math.sin(windAngleRad + Math.PI);

  // Compass ticks
  const compassAngles = [
    { deg: 0, label: 'N (000°)', isCardinal: true },
    { deg: 30, label: '030°' },
    { deg: 60, label: '060°' },
    { deg: 90, label: 'E (090°)', isCardinal: true },
    { deg: 120, label: '120°' },
    { deg: 150, label: '150°' },
    { deg: 180, label: 'S (180°)', isCardinal: true },
    { deg: 210, label: '210°' },
    { deg: 240, label: '240°' },
    { deg: 270, label: 'W (270°)', isCardinal: true },
    { deg: 300, label: '300°' },
    { deg: 330, label: '330°' },
  ];

  return (
    <div className="gov-panel p-4 sm:p-5 space-y-4 font-sans">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#D6DCE1]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#17365D]">
              WIND VECTOR RESOLVER
            </span>
            <span className={`px-2 py-0.5 rounded-xs text-[9px] font-black uppercase ${statusConfig.badge}`}>
              {statusConfig.label}
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-[#17365D] mt-0.5">
            Active Runway {runway_id} ({runway_heading_deg}°) Vectors
          </h3>
        </div>

        <div className="text-left sm:text-right text-[11px] text-[#5B6770] font-medium">
          Crosswind Limit: <span className="font-bold text-[#1F2933]">{max_demonstrated_crosswind_kts} kts</span>
        </div>
      </div>

      {/* 2. Realistic Cockpit Avionics Runway & Compass Display */}
      <div className="bg-[#070D18] rounded-xs border border-[#17365D] p-3 sm:p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-inner text-white select-none">
        {/* Outer Dial Container */}
        <div className="relative w-[300px] h-[300px] sm:w-[320px] sm:h-[320px] flex items-center justify-center">
          <svg
            viewBox="0 0 320 320"
            className="w-full h-full overflow-visible"
            aria-label="Realistic Runway Wind Vector Diagram"
          >
            <defs>
              {/* Runway Asphalt Texture Gradient */}
              <linearGradient id="runwayAsphalt" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#181D26" />
                <stop offset="15%" stopColor="#252B38" />
                <stop offset="50%" stopColor="#2E3646" />
                <stop offset="85%" stopColor="#252B38" />
                <stop offset="100%" stopColor="#181D26" />
              </linearGradient>

              {/* Wind Vector Arrow Marker */}
              <marker
                id="windArrowHead"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="4"
                orient="auto"
              >
                <path d="M 0 0 L 8 4 L 0 8 Z" fill="#38BDF8" />
              </marker>

              {/* Glow filter for wind arrow */}
              <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Dial Background Rings & Radar Grids */}
            <circle cx="160" cy="160" r="148" fill="#0A1220" stroke="#1E293B" strokeWidth="2" />
            <circle cx="160" cy="160" r="140" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="2,4" />
            <circle cx="160" cy="160" r="100" fill="none" stroke="#1E293B" strokeWidth="1" strokeDasharray="3,3" />
            <circle cx="160" cy="160" r="60" fill="none" stroke="#1E293B" strokeWidth="1" strokeDasharray="2,2" />

            {/* Compass Degree Ticks and Cardinal Labels */}
            {compassAngles.map((item) => {
              const rad = ((item.deg - 90) * Math.PI) / 180;
              const xOuter = 160 + 140 * Math.cos(rad);
              const yOuter = 160 + 140 * Math.sin(rad);
              const xInner = 160 + (item.isCardinal ? 128 : 133) * Math.cos(rad);
              const yInner = 160 + (item.isCardinal ? 128 : 133) * Math.sin(rad);
              const xText = 160 + 116 * Math.cos(rad);
              const yText = 160 + 116 * Math.sin(rad);

              return (
                <g key={item.deg}>
                  <line
                    x1={xOuter}
                    y1={yOuter}
                    x2={xInner}
                    y2={yInner}
                    stroke={item.isCardinal ? '#94A3B8' : '#475569'}
                    strokeWidth={item.isCardinal ? 2 : 1}
                  />
                  <text
                    x={xText}
                    y={yText + 3.5}
                    textAnchor="middle"
                    fill={item.isCardinal ? '#F8FAFC' : '#64748B'}
                    fontSize={item.isCardinal ? '9.5' : '7.5'}
                    fontWeight={item.isCardinal ? '900' : '600'}
                    fontFamily="monospace"
                  >
                    {item.label}
                  </text>
                </g>
              );
            })}

            {/* REALISTIC RUNWAY GRAPHIC (Rotated to exact Magnetic Heading) */}
            <g transform={`rotate(${runway_heading_deg}, 160, 160)`}>
              {/* Runway Overrun & Shoulder Safety Strip */}
              <rect
                x="143"
                y="40"
                width="34"
                height="240"
                rx="2"
                fill="#111827"
                stroke="#374151"
                strokeWidth="1"
              />

              {/* Main Asphalt Runway Strip */}
              <rect
                x="146"
                y="46"
                width="28"
                height="228"
                rx="1"
                fill="url(#runwayAsphalt)"
                stroke="#4B5563"
                strokeWidth="1.5"
              />

              {/* Runway White Edge Markings */}
              <line x1="147.5" y1="50" x2="147.5" y2="270" stroke="#FFFFFF" strokeWidth="1.2" />
              <line x1="172.5" y1="50" x2="172.5" y2="270" stroke="#FFFFFF" strokeWidth="1.2" />

              {/* Threshold Piano Keys - Top Landing Threshold (Active Runway ID) */}
              {[149, 153, 157, 161, 165, 169].map((pos, i) => (
                <rect key={`thr-top-${i}`} x={pos} y="54" width="2" height="12" fill="#FFFFFF" />
              ))}

              {/* Top Runway Number (Active Landing Threshold) */}
              <text
                x="160"
                y="79"
                textAnchor="middle"
                fill="#FBBF24"
                fontSize="11"
                fontWeight="900"
                fontFamily="monospace"
                letterSpacing="0.5"
              >
                {runway_id}
              </text>

              {/* Touchdown Aim Point Markings - Top */}
              <rect x="149" y="86" width="4" height="18" fill="#FFFFFF" opacity="0.9" />
              <rect x="167" y="86" width="4" height="18" fill="#FFFFFF" opacity="0.9" />

              {/* Runway Dashed Centerline */}
              <line
                x1="160"
                y1="108"
                x2="160"
                y2="212"
                stroke="#FFFFFF"
                strokeWidth="1.8"
                strokeDasharray="10,8"
              />

              {/* Touchdown Aim Point Markings - Bottom */}
              <rect x="149" y="216" width="4" height="18" fill="#FFFFFF" opacity="0.9" />
              <rect x="167" y="216" width="4" height="18" fill="#FFFFFF" opacity="0.9" />

              {/* Bottom Runway Number (Reciprocal Runway) */}
              <text
                x="160"
                y="249"
                textAnchor="middle"
                fill="#94A3B8"
                fontSize="10"
                fontWeight="900"
                fontFamily="monospace"
                transform="rotate(180, 160, 245)"
              >
                {reciprocalId}
              </text>

              {/* Threshold Piano Keys - Bottom Threshold */}
              {[149, 153, 157, 161, 165, 169].map((pos, i) => (
                <rect key={`thr-bot-${i}`} x={pos} y="254" width="2" height="12" fill="#FFFFFF" />
              ))}

              {/* Green Threshold Edge Lights at Approach End */}
              <circle cx="145" cy="54" r="2.5" fill="#22C55E" />
              <circle cx="175" cy="54" r="2.5" fill="#22C55E" />
              {/* Amber / Red End Lights */}
              <circle cx="145" cy="266" r="2.5" fill="#EF4444" />
              <circle cx="175" cy="266" r="2.5" fill="#EF4444" />
            </g>

            {/* AIRCRAFT ON FINAL APPROACH SILHOUETTE (At Center) */}
            <g transform={`translate(160, 160) rotate(${runway_heading_deg})`}>
              {/* Modern Aircraft Symbol */}
              <path
                d="M 0 -14 L 3 -6 L 15 2 L 15 5 L 3 3 L 3 10 L 7 13 L 7 15 L 0 14 L -7 15 L -7 13 L -3 10 L -3 3 L -15 5 L -15 2 L -3 -6 Z"
                fill="#FFFFFF"
                stroke="#0F172A"
                strokeWidth="1"
                filter="url(#cyanGlow)"
              />
              <circle cx="0" cy="0" r="2" fill="#38BDF8" />
            </g>

            {/* TRUE WIND VECTOR ARROW (Entering from true wind azimuth towards runway) */}
            <g filter="url(#cyanGlow)">
              <line
                x1={windSourceX}
                y1={windSourceY}
                x2={windTargetX}
                y2={windTargetY}
                stroke="#38BDF8"
                strokeWidth="3.5"
                strokeLinecap="round"
                markerEnd="url(#windArrowHead)"
              />
              {/* Wind Origin Bubble */}
              <circle cx={windSourceX} cy={windSourceY} r="4.5" fill="#38BDF8" stroke="#0F172A" strokeWidth="1.5" />
            </g>

            {/* Dynamic Wind Angle Label positioned near wind origin */}
            <g transform={`translate(${windSourceX}, ${windSourceY})`}>
              <rect
                x="-36"
                y="-18"
                width="72"
                height="15"
                rx="3"
                fill="#0F172A"
                stroke="#38BDF8"
                strokeWidth="1"
              />
              <text
                x="0"
                y="-7.5"
                textAnchor="middle"
                fill="#38BDF8"
                fontSize="8"
                fontWeight="900"
                fontFamily="monospace"
              >
                {wind_direction_deg}° @ {wind_speed_kts}k
              </text>
            </g>
          </svg>
        </div>

        {/* HUD Telemetry Summary Strip */}
        <div className="w-full mt-2 pt-2 border-t border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-1 text-center font-mono">
          <div className="text-xs">
            <span className="text-[#94A3B8]">Surface Wind: </span>
            <span className="text-[#38BDF8] font-bold">
              {wind_direction_deg}° at {wind_speed_kts} kts
            </span>
            {wind_gusts_kts ? (
              <span className="text-[#FBBF24] font-bold"> (Gusts: {wind_gusts_kts} kt)</span>
            ) : null}
          </div>
          <div className="text-[11px] text-[#64748B]">
            Runway Azimuth: <span className="text-[#F8FAFC]">{runway_heading_deg}° Magnetic</span>
          </div>
        </div>
      </div>

      {/* 3. Crosswind & Headwind Metrics Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Crosswind Component Box */}
        <div className="p-3.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#166534]">
              CROSSWIND COMPONENT
            </span>
            <span
              className={`px-2 py-0.5 rounded-xs text-[10px] font-black uppercase ${
                crosswind_direction === 'head' || crosswind_direction === 'tail'
                  ? 'bg-[#E2E8F0] text-[#17365D]'
                  : 'bg-white border border-[#166534] text-[#166534]'
              }`}
            >
              {crosswind_direction === 'head' || crosswind_direction === 'tail'
                ? 'ALIGNED'
                : `From ${crosswind_direction.toUpperCase()}`}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black ${statusConfig.crosswindColor}`}>
              {crosswind_kts}
            </span>
            <span className="text-xs font-bold text-[#1F2933]">knots</span>
          </div>

          <div className="text-[11px] text-[#166534] font-medium pt-1">
            {statusConfig.limitText}
          </div>
        </div>

        {/* Headwind / Tailwind Component Box */}
        <div className="p-3.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#17365D]">
              {headwind_kts >= 0 ? 'HEADWIND COMPONENT' : 'TAILWIND COMPONENT'}
            </span>
            <span className="px-2 py-0.5 rounded-xs text-[10px] font-black uppercase bg-[#17365D] text-white">
              {headwind_kts >= 0 ? 'OPTIMAL' : 'CAUTION'}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#17365D]">
              {Math.abs(headwind_kts)}
            </span>
            <span className="text-xs font-bold text-[#1F2933]">knots</span>
          </div>

          <div className="text-[11px] text-[#5B6770] font-medium pt-1">
            {headwind_kts >= 0
              ? `Favorable headwind component for RWY ${runway_id}`
              : `Tailwind detected — consider reciprocal RWY ${reciprocalId}`}
          </div>
        </div>
      </div>

      {/* 4. Alternate Runways Quick Switcher */}
      {alternateRunways.length > 0 && onSelectRunway && (
        <div className="p-3 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs space-y-2">
          <div className="text-[10px] font-bold text-[#5B6770] uppercase tracking-wider">
            Switch Active Runway Evaluation:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {alternateRunways.map((rwy) => (
              <button
                key={rwy.runway_id}
                type="button"
                onClick={() => onSelectRunway(rwy.runway_id)}
                className="px-2.5 py-1 bg-white hover:bg-[#F1F5F9] border border-[#D6DCE1] rounded-xs text-xs font-mono font-bold text-[#17365D] transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <span>RWY {rwy.runway_id} ({rwy.runway_heading_deg}°)</span>
                <span className="text-[10px] text-[#5B6770] font-sans">
                  • X-Wind: {rwy.crosswind_kts}k
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RunwayCrosswindDial;
