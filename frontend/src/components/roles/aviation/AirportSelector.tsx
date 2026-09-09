import React, { useState } from 'react';
import { Plane, MapPin, Compass, Search, ChevronDown, Check } from 'lucide-react';
import { AirportCatalogItem, RunwayMeta } from '../../../types/aviationIntelligence';

interface AirportSelectorProps {
  catalog: AirportCatalogItem[];
  selectedIcao: string;
  onSelectIcao: (icao: string) => void;
  selectedRunwayId?: string;
  onSelectRunwayId?: (runwayId: string) => void;
  availableRunways: RunwayMeta[];
}

export const AirportSelector: React.FC<AirportSelectorProps> = ({
  catalog,
  selectedIcao,
  onSelectIcao,
  selectedRunwayId,
  onSelectRunwayId,
  availableRunways,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const currentAirport = catalog.find((a) => a.icao.toUpperCase() === selectedIcao.toUpperCase()) || catalog[0];

  const filteredAirports = catalog.filter(
    (a) =>
      a.icao.toLowerCase().includes(search.toLowerCase()) ||
      a.iata.toLowerCase().includes(search.toLowerCase()) ||
      a.city.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
      <div className="flex flex-col gap-3">
        {/* Left: Airport Dropdown Selector */}
        <div className="relative w-full">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
            <Plane className="w-3.5 h-3.5 text-indigo-600" />
            Selected Aerodrome (ICAO / IATA)
          </label>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200/80 text-left transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="px-2 py-0.5 rounded-xl bg-indigo-600 text-white font-mono font-black text-xs shrink-0">
                {currentAirport?.icao || 'VABB'}
              </span>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5 truncate">
                  <span className="truncate">{currentAirport?.city}</span>
                  <span className="text-[11px] font-bold text-slate-400 shrink-0">({currentAirport?.iata})</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate max-w-[200px] sm:max-w-xs">
                  {currentAirport?.name}
                </div>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Search Dropdown Modal */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <div className="p-2.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/70">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search airport (e.g. BOM, Delhi, VAPO)..."
                  className="w-full text-xs font-semibold bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
                  autoFocus
                />
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                {filteredAirports.map((airport) => {
                  const isSelected = airport.icao.toUpperCase() === selectedIcao.toUpperCase();
                  return (
                    <button
                      key={airport.icao}
                      onClick={() => {
                        onSelectIcao(airport.icao);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-indigo-50/50 transition-colors cursor-pointer ${
                        isSelected ? 'bg-indigo-50 font-bold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-xs font-extrabold text-indigo-700 bg-indigo-100/70 px-1.5 py-0.5 rounded-md shrink-0">
                          {airport.icao}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate">
                            {airport.city} ({airport.iata})
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            {airport.name}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Airport Meta Stats */}
        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-200/70">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <div>
              <div className="text-[9px] font-bold text-slate-400 uppercase">Elevation</div>
              <div className="text-xs font-black text-slate-800 whitespace-nowrap">
                {currentAirport?.elevation_ft || 0} ft MSL
              </div>
            </div>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <div>
              <div className="text-[9px] font-bold text-slate-400 uppercase">Runways</div>
              <div className="text-xs font-black text-slate-800 whitespace-nowrap">
                {availableRunways.length} Available
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Runway Chips Selector */}
      {availableRunways && availableRunways.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center justify-between">
            <span>Select Active Runway:</span>
            <span className="text-[10px] text-indigo-600 font-semibold">Auto-selects best headwind</span>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {availableRunways.map((rwy) => {
              const isSelected = selectedRunwayId?.toUpperCase() === rwy.id.toUpperCase();
              return (
                <button
                  key={rwy.id}
                  onClick={() => onSelectRunwayId && onSelectRunwayId(rwy.id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-mono">RWY {rwy.id}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                    ({rwy.heading_deg}°)
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
