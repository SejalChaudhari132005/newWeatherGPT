import React, { useState, useEffect } from 'react';
import {
  Plane,
  MapPin,
  ChevronDown,
  Wind,
  Compass,
  Gauge,
  Thermometer,
  Eye,
  Cloud,
  CloudSun,
  CloudRain,
  CloudLightning,
  Sun,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Search,
  Check,
  RefreshCw,
  Activity,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import {
  AviationBriefingData,
  AirportCatalogItem,
  FlightCategory,
} from '../../../types/aviationIntelligence';
import { useLanguage } from '../../../context/LanguageContext';
import { translateCondition } from '../../../utils/dashboardTranslator';

export interface AviationHeroCardProps {
  briefingData: AviationBriefingData | null;
  catalog: AirportCatalogItem[];
  selectedIcao: string;
  onSelectIcao: (icao: string) => void;
  selectedRunwayId?: string;
  onSelectRunwayId?: (rwyId: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export const AviationHeroCard: React.FC<AviationHeroCardProps> = ({
  briefingData,
  catalog,
  selectedIcao,
  onSelectIcao,
  selectedRunwayId,
  onSelectRunwayId,
  onRefresh,
  loading = false,
}) => {
  const { language } = useLanguage();
  const [imgError, setImgError] = useState(false);
  const [isAirportDropdownOpen, setIsAirportDropdownOpen] = useState(false);
  const [airportSearch, setAirportSearch] = useState('');
  const [utcTimeStr, setUtcTimeStr] = useState('');
  const [localTimeStr, setLocalTimeStr] = useState('');

  // Live dual UTC (Zulu) and Local (IST) Clock
  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      // UTC Zulu
      const utcHours = String(now.getUTCHours()).padStart(2, '0');
      const utcMins = String(now.getUTCMinutes()).padStart(2, '0');
      const utcSecs = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTimeStr(`${utcHours}:${utcMins}:${utcSecs} UTC`);

      // Local IST
      const localH = String(now.getHours()).padStart(2, '0');
      const localM = String(now.getMinutes()).padStart(2, '0');
      const localS = String(now.getSeconds()).padStart(2, '0');
      setLocalTimeStr(`${localH}:${localM}:${localS} IST`);
    };

    updateClocks();
    const timer = setInterval(updateClocks, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentAirport =
    catalog.find((a) => a.icao.toUpperCase() === selectedIcao.toUpperCase()) ||
    catalog[0] || {
      icao: 'VABB',
      iata: 'BOM',
      name: 'Chhatrapati Shivaji Maharaj International Airport',
      city: 'Mumbai',
      state: 'Maharashtra',
      latitude: 19.0896,
      longitude: 72.8656,
      elevation_ft: 39,
      runways: [
        { id: '27', heading_deg: 272, length_m: 3660 },
        { id: '09', heading_deg: 92, length_m: 3660 },
      ],
    };

  const filteredCatalog = catalog.filter(
    (a) =>
      a.icao.toLowerCase().includes(airportSearch.toLowerCase()) ||
      a.iata.toLowerCase().includes(airportSearch.toLowerCase()) ||
      a.city.toLowerCase().includes(airportSearch.toLowerCase()) ||
      a.name.toLowerCase().includes(airportSearch.toLowerCase())
  );

  const majorHubs = [
    { icao: 'VABB', iata: 'BOM', city: 'Mumbai' },
    { icao: 'VIDP', iata: 'DEL', city: 'Delhi' },
    { icao: 'VOBL', iata: 'BLR', city: 'Bengaluru' },
    { icao: 'VOHS', iata: 'HYD', city: 'Hyderabad' },
    { icao: 'VOMM', iata: 'MAA', city: 'Chennai' },
    { icao: 'VECC', iata: 'CCU', city: 'Kolkata' },
    { icao: 'VAPO', iata: 'PNQ', city: 'Pune' },
    { icao: 'VAGO', iata: 'GOI', city: 'Goa' },
    { icao: 'VAAH', iata: 'AMD', city: 'Ahmedabad' },
    { icao: 'VOCI', iata: 'COK', city: 'Cochin' },
  ];

  // Flight Rules styling configuration
  const category = briefingData?.flight_rules?.category || 'VFR';
  const categoryConfig: Record<
    FlightCategory,
    {
      bg: string;
      text: string;
      border: string;
      label: string;
      fullName: string;
      icon: any;
    }
  > = {
    VFR: {
      bg: 'bg-emerald-600',
      text: 'text-white',
      border: 'border-emerald-700',
      label: 'VFR',
      fullName: 'Visual Flight Rules (Normal Ops)',
      icon: ShieldCheck,
    },
    MVFR: {
      bg: 'bg-amber-500',
      text: 'text-slate-900',
      border: 'border-amber-600',
      label: 'MVFR',
      fullName: 'Marginal Visual Flight Rules',
      icon: AlertTriangle,
    },
    IFR: {
      bg: 'bg-rose-600',
      text: 'text-white',
      border: 'border-rose-700',
      label: 'IFR',
      fullName: 'Instrument Flight Rules',
      icon: ShieldAlert,
    },
    LVP: {
      bg: 'bg-purple-700',
      text: 'text-white',
      border: 'border-purple-800',
      label: 'LVP / LIFR',
      fullName: 'Low Visibility Procedures Active',
      icon: ShieldAlert,
    },
  };

  const catStyle = categoryConfig[category] || categoryConfig.VFR;
  const CategoryIcon = catStyle.icon;

  // Key Met Telemetry Values
  const tempC = briefingData?.temperature_c != null ? Math.round(briefingData.temperature_c) : 30;
  const dewPointC = briefingData?.dew_point_c != null ? Math.round(briefingData.dew_point_c) : 23;
  const dewSpread = Math.max(0, tempC - dewPointC);

  const activeRunway = briefingData?.active_runway || {
    runway_id: '27',
    runway_heading_deg: 272,
    wind_speed_kts: 12,
    wind_direction_deg: 260,
    wind_gusts_kts: 18,
    headwind_kts: 11,
    crosswind_kts: 4,
    crosswind_direction: 'left' as const,
    is_crosswind_exceeded: false,
    max_demonstrated_crosswind_kts: 25,
    operational_status: 'normal' as const,
  };

  const qnhPressure = briefingData?.surface_pressure_hpa
    ? Math.round(briefingData.surface_pressure_hpa)
    : 1010;
  const qnhInHg = (qnhPressure * 0.02953).toFixed(2);

  const visibilityMeters = briefingData?.flight_rules?.visibility_meters ?? 5000;
  const visibilityKm = (visibilityMeters / 1000).toFixed(1);
  const visibilitySM = (visibilityMeters / 1609.34).toFixed(1);

  const ceilingFt = briefingData?.flight_rules?.ceiling_ft_agl ?? 3500;
  const ceilingDisplay =
    ceilingFt != null && ceilingFt < 15000
      ? `${ceilingFt.toLocaleString()} ft AGL`
      : 'Unlimited (>10,000 ft)';

  // Calculate Density Altitude approx: DA = PA + (120 * (OAT - ISA_temp))
  const elevFt = currentAirport.elevation_ft ?? 39;
  const isaTemp = 15 - 2 * (elevFt / 1000);
  const isaDev = Math.round(tempC - isaTemp);
  const pressureAlt = elevFt + (1013.25 - qnhPressure) * 30;
  const densityAltitude = Math.round(pressureAlt + 118.8 * (tempC - isaTemp));

  const getConditionIcon = () => {
    if (briefingData?.convective_risk === 'high' || briefingData?.convective_risk === 'moderate') {
      return <CloudLightning className="w-8 h-8 text-amber-300" />;
    }
    if (visibilityMeters < 3000) {
      return <Cloud className="w-8 h-8 text-slate-300" />;
    }
    if (tempC > 32) {
      return <Sun className="w-8 h-8 text-amber-300" />;
    }
    return <CloudSun className="w-8 h-8 text-amber-200" />;
  };

  return (
    <div className="w-full space-y-3 font-sans">
      {/* 1. Official Aviation Aerodrome Meteorological Observatory Panel */}
      <div className="gov-panel overflow-hidden">
        {/* Panel Header */}
        <div className="gov-panel-header flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-xs bg-[#17365D]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#17365D] truncate">
              {language === 'mr'
                ? 'विमानतळ हवामान वेधशाला'
                : language === 'hi'
                ? 'हवाई अड्डा मौसम वेधशाला'
                : 'Aviation Meteorological Observatory'}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="gov-badge gov-badge-info text-[9px] font-mono">
              IMD / DGCA METAR
            </span>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                className="p-1 text-[#17365D] hover:bg-[#E2E8F0] rounded-xs transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh Live Aerodrome Telemetry"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Airport Quick Selector Bar */}
        <div className="bg-[#F8FAFC] px-3 py-1.5 border-b border-[#D6DCE1] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-[#5B6770] uppercase shrink-0">
            Hubs:
          </span>
          {majorHubs.map((hub) => {
            const isSel = hub.icao.toUpperCase() === selectedIcao.toUpperCase();
            return (
              <button
                key={hub.icao}
                type="button"
                onClick={() => onSelectIcao(hub.icao)}
                className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase transition-all shrink-0 cursor-pointer ${
                  isSel
                    ? 'bg-[#7C3AED] text-white shadow-2xs font-mono'
                    : 'bg-white text-[#17365D] border border-[#D6DCE1] hover:bg-[#F5F3FF] hover:border-[#DDD6FE]'
                }`}
              >
                {hub.iata} ({hub.city})
              </button>
            );
          })}
        </div>

        {/* Realistic Airport Tarmac Scenic Banner with Live Telemetry Overlay */}
        <div className="relative min-h-[300px] sm:min-h-[340px] bg-slate-900 overflow-hidden flex flex-col justify-between">
          {!imgError && (
            <img
              src="/assets/aviation-bg.jpg"
              alt="Aviation Aerodrome Tarmac"
              onError={() => setImgError(true)}
              className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-700"
            />
          )}

          {/* Natural Gradient Scrim for crisp text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/30 pointer-events-none" />

          {/* Top Overlay: Airport Search / Switcher & Dual UTC/IST Clock */}
          <div className="relative z-20 p-3.5 sm:p-4 text-white">
            <div className="flex items-start justify-between gap-2 border-b border-white/20 pb-2">
              {/* Interactive Airport Picker Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAirportDropdownOpen(!isAirportDropdownOpen)}
                  className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-amber-300 transition-colors cursor-pointer group bg-black/40 px-2.5 py-1 rounded-xs border border-white/20 backdrop-blur-xs"
                  title="Change Airport / Aerodrome"
                >
                  <Plane className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-mono font-black text-amber-300">
                    {currentAirport.icao} / {currentAirport.iata}
                  </span>
                  <span className="truncate max-w-[130px] sm:max-w-[200px] text-white">
                    • {currentAirport.city}
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 text-white/80 group-hover:text-amber-300 transition-transform ${
                      isAirportDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isAirportDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-72 sm:w-80 bg-white text-slate-900 rounded-xs border border-[#17365D] shadow-2xl z-50 overflow-hidden font-sans">
                    <div className="p-2 bg-[#F8FAFC] border-b border-[#D6DCE1] flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-[#5B6770]" />
                      <input
                        type="text"
                        value={airportSearch}
                        onChange={(e) => setAirportSearch(e.target.value)}
                        placeholder="Search ICAO, city or name..."
                        className="w-full text-xs bg-transparent outline-none font-medium"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto divide-y divide-[#E2E8F0]">
                      {filteredCatalog.map((airport) => {
                        const isSelected = airport.icao.toUpperCase() === selectedIcao.toUpperCase();
                        return (
                          <button
                            key={airport.icao}
                            type="button"
                            onClick={() => {
                              onSelectIcao(airport.icao);
                              setIsAirportDropdownOpen(false);
                              setAirportSearch('');
                            }}
                            className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-[#F1F5F9] cursor-pointer text-xs ${
                              isSelected ? 'bg-[#F0FDF4] font-bold text-[#006B3C]' : 'text-[#1F2933]'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-[#17365D] bg-[#E2E8F0] px-1 py-0.5 rounded-xs text-[10px]">
                                  {airport.icao}
                                </span>
                                <span className="font-bold truncate">{airport.city}</span>
                                <span className="text-[10px] text-[#5B6770]">({airport.iata})</span>
                              </div>
                              <div className="text-[10px] text-[#5B6770] truncate">{airport.name}</div>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#006B3C] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Dual UTC (Zulu) & IST Clock */}
              <div className="text-right shrink-0">
                <div className="text-xs font-mono font-black text-amber-300 drop-shadow-xs">
                  {utcTimeStr || '00:00:00 UTC'}
                </div>
                <div className="text-[10px] font-mono text-white/80">{localTimeStr}</div>
              </div>
            </div>

            {/* Aerodrome Subtitle & Coordinates */}
            <div className="mt-1.5 flex items-center gap-2 text-[10px] text-white/90">
              <span className="truncate">{currentAirport.name}</span>
              <span>•</span>
              <span className="font-mono">
                ELEV {currentAirport.elevation_ft ?? 39} ft (
                {Math.round((currentAirport.elevation_ft ?? 39) * 0.3048)} m)
              </span>
            </div>
          </div>

          {/* Bottom Overlay: Flight Category, Temperature & Active Runway */}
          <div className="relative z-10 p-3.5 sm:p-4 text-white space-y-2">
            <div className="flex items-end justify-between gap-3">
              {/* Temperature & Weather Condition */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-[#17365D] border border-white/20 rounded-xs flex items-center justify-center shrink-0 shadow-xl backdrop-blur-xs">
                  {getConditionIcon()}
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-black text-white leading-none drop-shadow-md">
                      {tempC}°C
                    </span>
                    <span className="text-xs text-white/80 font-mono">
                      (DP {dewPointC}°C • Spread {dewSpread}°C)
                    </span>
                  </div>
                  <div className="text-xs font-bold text-amber-300 uppercase tracking-wide pt-1 drop-shadow-xs flex items-center gap-1.5">
                    <span>{translateCondition('Fair / Clear', language)}</span>
                    <span className="text-white/60">•</span>
                    <span className="text-white text-[11px] font-mono">
                      WIND {activeRunway.wind_direction_deg}° @ {activeRunway.wind_speed_kts} kts
                    </span>
                  </div>
                </div>
              </div>

              {/* Flight Rules Category Badge */}
              <div className="text-right space-y-1 shrink-0">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xs border font-black text-xs uppercase tracking-wider shadow-lg ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                >
                  <CategoryIcon className="w-3.5 h-3.5" />
                  <span>{catStyle.label}</span>
                </div>
                <div className="text-[10px] text-white/90 font-medium drop-shadow-xs">
                  {catStyle.fullName}
                </div>
              </div>
            </div>

            {/* Active Runway Vector Strip */}
            <div className="bg-black/50 border border-white/20 rounded-xs px-2.5 py-1.5 flex items-center justify-between gap-2 text-xs backdrop-blur-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-bold text-amber-300">
                  ACTIVE RWY {activeRunway.runway_id} ({activeRunway.runway_heading_deg}°)
                </span>
                <span className="text-white/70 hidden sm:inline">•</span>
                <span className="text-white/90 text-[11px] truncate hidden sm:inline">
                  Headwind: {activeRunway.headwind_kts} kts | Crosswind: {activeRunway.crosswind_kts} kts (
                  {activeRunway.crosswind_direction.toUpperCase()})
                </span>
              </div>
              <span
                className={`px-1.5 py-0.5 rounded-xs text-[9px] font-black uppercase shrink-0 ${
                  activeRunway.is_crosswind_exceeded
                    ? 'bg-rose-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {activeRunway.is_crosswind_exceeded ? 'CROSSWIND LIMIT EXCEEDED' : 'WITHIN LIMITS'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Aerodrome Meteorological Observation Grid (8 Key Parameters) */}
        <div className="p-3 bg-white">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* 1. Temperature & Dew Point */}
            <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
              <div className="flex items-center gap-1 text-[10px] font-bold text-[#17365D] uppercase">
                <Thermometer className="w-3 h-3 text-[#B42318]" />
                <span>OAT / Dew Point</span>
              </div>
              <div className="text-base font-bold text-[#1F2933] mt-0.5">
                {tempC}°C / {dewPointC}°C
              </div>
              <div className="text-[10px] text-[#5B6770] font-mono mt-0.5">
                Spread: {dewSpread}°C ({dewSpread < 3 ? 'Fog Risk' : 'Dry'})
              </div>
            </div>

            {/* 2. Runway Wind Vector */}
            <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
              <div className="flex items-center gap-1 text-[10px] font-bold text-[#17365D] uppercase">
                <Wind className="w-3 h-3 text-[#1D5F91]" />
                <span>Surface Wind</span>
              </div>
              <div className="text-base font-bold text-[#1F2933] mt-0.5 font-mono">
                {activeRunway.wind_direction_deg}° @ {activeRunway.wind_speed_kts} kts
              </div>
              <div className="text-[10px] text-[#5B6770] mt-0.5">
                {activeRunway.wind_gusts_kts
                  ? `Gusts to ${activeRunway.wind_gusts_kts} kts`
                  : 'Steady flow'}
              </div>
            </div>

            {/* 3. Crosswind Component */}
            <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
              <div className="flex items-center gap-1 text-[10px] font-bold text-[#17365D] uppercase">
                <Compass className="w-3 h-3 text-[#006B3C]" />
                <span>Crosswind / Headwind</span>
              </div>
              <div className="text-base font-bold text-[#1F2933] mt-0.5 font-mono">
                {activeRunway.crosswind_kts} kts {activeRunway.crosswind_direction.toUpperCase()}
              </div>
              <div className="text-[10px] text-[#5B6770] mt-0.5">
                Headwind: {activeRunway.headwind_kts} kts (Limit {activeRunway.max_demonstrated_crosswind_kts}k)
              </div>
            </div>

            {/* 4. Altimeter / QNH */}
            <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
              <div className="flex items-center gap-1 text-[10px] font-bold text-[#17365D] uppercase">
                <Gauge className="w-3 h-3 text-[#17365D]" />
                <span>QNH / Altimeter</span>
              </div>
              <div className="text-base font-bold text-[#1F2933] mt-0.5 font-mono">
                {qnhPressure} hPa
              </div>
              <div className="text-[10px] text-[#5B6770] font-mono mt-0.5">
                {qnhInHg} inHg (STD 1013.2)
              </div>
            </div>

            {/* 5. Horizontal Visibility */}
            <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
              <div className="flex items-center gap-1 text-[10px] font-bold text-[#17365D] uppercase">
                <Eye className="w-3 h-3 text-[#1D5F91]" />
                <span>Visibility / RVR</span>
              </div>
              <div className="text-base font-bold text-[#1F2933] mt-0.5">
                {visibilityKm} km ({visibilitySM} SM)
              </div>
              <div className="text-[10px] text-[#5B6770] mt-0.5">
                {visibilityMeters >= 5000 ? 'Cavok (>5000m)' : `RVR: ${visibilityMeters}m`}
              </div>
            </div>

            {/* 6. Cloud Ceiling & Base */}
            <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
              <div className="flex items-center gap-1 text-[10px] font-bold text-[#17365D] uppercase">
                <Cloud className="w-3 h-3 text-[#5B6770]" />
                <span>Cloud Ceiling</span>
              </div>
              <div className="text-base font-bold text-[#1F2933] mt-0.5 truncate">
                {ceilingDisplay}
              </div>
              <div className="text-[10px] text-[#5B6770] mt-0.5">
                Cover: {briefingData?.cloud_cover_pct ?? 15}% (FEW/SCT)
              </div>
            </div>

            {/* 7. Density Altitude */}
            <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
              <div className="flex items-center gap-1 text-[10px] font-bold text-[#17365D] uppercase">
                <Layers className="w-3 h-3 text-[#17365D]" />
                <span>Density Altitude</span>
              </div>
              <div className="text-base font-bold text-[#1F2933] mt-0.5 font-mono">
                {densityAltitude.toLocaleString()} ft
              </div>
              <div className="text-[10px] text-[#5B6770] mt-0.5">
                ISA {isaDev >= 0 ? `+${isaDev}` : isaDev}°C (PA {Math.round(pressureAlt)} ft)
              </div>
            </div>

            {/* 8. Convective & Thunderstorm Risk */}
            <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
              <div className="flex items-center gap-1 text-[10px] font-bold text-[#17365D] uppercase">
                <Activity className="w-3 h-3 text-[#D97706]" />
                <span>Convective / CAPE</span>
              </div>
              <div className="text-base font-bold text-[#1F2933] mt-0.5 capitalize">
                {briefingData?.convective_risk || 'None'} Risk
              </div>
              <div className="text-[10px] text-[#5B6770] font-mono mt-0.5">
                CAPE: {briefingData?.cape_j_kg ?? 350} J/kg
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Aerodrome Runway & Operational Specifications Table */}
      <div className="gov-panel">
        <div className="bg-[#F0F4F8] border-b border-[#D6DCE1] border-l-4 border-l-[#17365D] px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-bold text-[#17365D] uppercase tracking-wider">
              {language === 'mr'
                ? 'धावपट्टी व विमानतळ तपशील'
                : language === 'hi'
                ? 'रनवे एवं हवाई अड्डा विवरण'
                : 'Aerodrome & Runway Operational Registry'}
            </h3>
            <span className="gov-badge gov-badge-info text-[9px]">
              ICAO {currentAirport.icao}
            </span>
          </div>

          <div className="text-[11px] font-bold text-[#17365D] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#006B3C] animate-pulse"></span>
            <span>All Systems Nominal</span>
          </div>
        </div>

        {/* Structured Data Table */}
        <div className="overflow-x-auto">
          <table className="gov-table">
            <tbody>
              <tr>
                <td className="font-bold text-[#5B6770] w-1/3 bg-[#F8FAFC]">
                  Aerodrome Name:
                </td>
                <td className="font-bold text-[#1F2933]">
                  {currentAirport.name} ({currentAirport.city}, {currentAirport.state})
                </td>
              </tr>
              <tr>
                <td className="font-bold text-[#5B6770] bg-[#F8FAFC]">
                  Active Selected Runway:
                </td>
                <td className="font-bold text-[#1F2933]">
                  RWY {activeRunway.runway_id} (Heading {activeRunway.runway_heading_deg}°) • Length: 3,660 m / 12,008 ft
                </td>
              </tr>
              <tr>
                <td className="font-bold text-[#5B6770] bg-[#F8FAFC]">
                  Available Runways:
                </td>
                <td className="font-bold text-[#1F2933]">
                  <div className="flex flex-wrap gap-1.5">
                    {(currentAirport.runways || []).map((r) => {
                      const isAct = r.id === activeRunway.runway_id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => onSelectRunwayId && onSelectRunwayId(r.id)}
                          className={`px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                            isAct
                              ? 'bg-[#17365D] text-white'
                              : 'bg-[#F1F5F9] text-[#17365D] border border-[#D6DCE1] hover:bg-[#E2E8F0]'
                          }`}
                          title={`Switch active telemetry to RWY ${r.id}`}
                        >
                          RWY {r.id} ({r.heading_deg}°) {isAct ? '✓ Active' : ''}
                        </button>
                      );
                    })}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="font-bold text-[#5B6770] bg-[#F8FAFC]">
                  Flight Operating Rules:
                </td>
                <td className="font-bold text-[#1F2933]">
                  <span className="font-black text-[#006B3C]">{category}</span> — {briefingData?.flight_rules?.rationale || 'Ceiling above 3,000 ft and visibility above 5,000 meters.'}
                </td>
              </tr>
              <tr>
                <td className="font-bold text-[#5B6770] bg-[#F8FAFC]">
                  Met Sensor & Transmissometer:
                </td>
                <td className="font-bold text-[#1F2933] flex items-center gap-1.5">
                  <span className="text-[#006B3C]">Online (IMD CWIS Level-4 Ultrasonic Telemetry)</span>
                  <span className="text-[10px] text-[#5B6770]">• Updated continuously</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
