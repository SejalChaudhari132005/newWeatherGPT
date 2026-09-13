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
    <div className="gov-panel p-3.5 bg-white space-y-3 font-sans">
      {/* 1. Header & Selector Dropdown */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-none bg-[#17365D] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Plane className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-wider uppercase text-[#17365D]">
              SELECTED AERODROME (ICAO / IATA)
            </div>
            <div className="text-sm font-bold text-[#17365D]">
              {currentAirport?.city} ({currentAirport?.iata}) — {currentAirport?.name}
            </div>
          </div>
        </div>

        {/* Airport Dropdown Button */}
        <div className="relative w-full">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between px-3 py-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] rounded-xs border border-[#D6DCE1] text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="px-2 py-0.5 rounded-xs bg-[#7C3AED] text-white font-mono font-bold text-xs shrink-0">
                {currentAirport?.icao || 'VABB'}
              </span>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#1F2933] flex items-center gap-1.5 truncate">
                  <span>{currentAirport?.city}</span>
                  <span className="text-[11px] text-[#5B6770]">({currentAirport?.iata})</span>
                  <span className="text-[#5B6770] font-normal truncate">• {currentAirport?.name}</span>
                </div>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-[#5B6770] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Search Dropdown Modal */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white rounded-xs border border-[#17365D] shadow-2xl overflow-hidden font-sans">
              <div className="p-2 border-b border-[#D6DCE1] flex items-center gap-2 bg-[#F8FAFC]">
                <Search className="w-3.5 h-3.5 text-[#5B6770] shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search airport (e.g. BOM, Delhi, VAPO)..."
                  className="w-full text-xs font-semibold bg-transparent focus:outline-none text-[#1F2933] placeholder-[#5B6770]"
                  autoFocus
                />
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-[#E2E8F0]">
                {filteredAirports.map((airport) => {
                  const isSelected = airport.icao.toUpperCase() === selectedIcao.toUpperCase();
                  return (
                    <button
                      key={airport.icao}
                      type="button"
                      onClick={() => {
                        onSelectIcao(airport.icao);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      className={`w-full px-3 py-2 flex items-center justify-between text-left hover:bg-[#F5F3FF] transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#F5F3FF] font-bold text-[#6D28D9]' : 'text-[#1F2933]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-xs font-bold text-[#6D28D9] bg-[#EDE9FE] px-1.5 py-0.5 rounded-xs shrink-0">
                          {airport.icao}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">
                            {airport.city} ({airport.iata})
                          </div>
                          <div className="text-[10px] text-[#5B6770] truncate max-w-[200px]">
                            {airport.name}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#6D28D9] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. Airport Meta Elevation & Runways Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#17365D] shrink-0" />
            <div>
              <div className="text-[9px] font-bold text-[#5B6770] uppercase">Elevation</div>
              <div className="text-xs font-bold text-[#1F2933]">
                {currentAirport?.elevation_ft || 0} ft MSL ({Math.round((currentAirport?.elevation_ft || 0) * 0.3048)} m)
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-[#006B3C] shrink-0" />
            <div>
              <div className="text-[9px] font-bold text-[#5B6770] uppercase">Runways</div>
              <div className="text-xs font-bold text-[#1F2933]">
                {availableRunways.length} Available Strips
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Runway Chips Selector */}
      {availableRunways && availableRunways.length > 0 && (
        <div className="pt-2 border-t border-[#D6DCE1]">
          <div className="text-[10px] font-bold text-[#5B6770] uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Select Active Runway:</span>
            <span className="text-[10px] text-[#7C3AED] font-bold">Auto-selects best headwind</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {availableRunways.map((rwy) => {
              const isSelected = selectedRunwayId?.toUpperCase() === rwy.id.toUpperCase();
              return (
                <button
                  key={rwy.id}
                  type="button"
                  onClick={() => onSelectRunwayId && onSelectRunwayId(rwy.id)}
                  className={`px-2.5 py-1 rounded-xs border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#7C3AED] border-[#7C3AED] text-white shadow-2xs'
                      : 'bg-[#F8FAFC] border-[#D6DCE1] text-[#17365D] hover:bg-[#F5F3FF] hover:border-[#DDD6FE]'
                  }`}
                >
                  <span className="font-mono">RWY {rwy.id}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-purple-200' : 'text-[#5B6770]'}`}>
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

export default AirportSelector;
