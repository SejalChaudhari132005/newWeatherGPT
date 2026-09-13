import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Layers,
  Crosshair,
  Maximize2,
  Minimize2,
  Clock,
  Play,
  Pause,
  Compass,
  Wind,
  Waves,
  Radio,
  Thermometer,
  ShieldAlert,
  Calendar,
  Check,
} from 'lucide-react';
import {
  FishFinderData,
  FishingZoneProperties,
  FishFinderLayerToggles,
  TimelineSlot,
} from '../../../../types/fishFinder';

interface Props {
  data: FishFinderData;
  selectedZone: FishingZoneProperties | null;
  onSelectZone: (z: FishingZoneProperties) => void;
  userCoords: { latitude: number; longitude: number };
  onRecenter: () => void;
  dateFilter: 'today' | 'tomorrow' | '3days';
  onChangeDateFilter: (d: 'today' | 'tomorrow' | '3days') => void;
  hourOffset: number;
  onChangeHourOffset: (offset: number) => void;
  heightClass?: string;
}

const createVesselIcon = () => {
  return L.divIcon({
    className: '!bg-transparent !border-0 !p-0 !m-0 pointer-events-auto',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); pointer-events: auto;">
        <div style="background: #17365D; border: 1.5px solid #FF9933; border-radius: 4px; padding: 2px 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; gap: 4px; white-space: nowrap; margin-bottom: 2px; cursor: pointer;">
          <span style="font-size: 11px;">🛥️</span>
          <span style="font-size: 10px; font-weight: 900; color: #FFFFFF; letter-spacing: 0.5px;">MY VESSEL</span>
        </div>
        <div style="width: 12px; height: 12px; border-radius: 50%; background: #FF9933; border: 2px solid #FFFFFF; box-shadow: 0 0 8px rgba(255, 153, 51, 0.9);"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

const createZoneCenterIcon = (name: string, potential: string, score: number, isSelected: boolean) => {
  const bgColor =
    potential === 'high'
      ? '#059669'
      : potential === 'moderate'
      ? '#D97706'
      : '#DC2626';

  return L.divIcon({
    className: '!bg-transparent !border-0 !p-0 !m-0 pointer-events-auto',
    html: `
      <div style="position: relative; transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center; pointer-events: auto;">
        <div style="background: ${bgColor}; color: #ffffff; border: ${isSelected ? '2px solid #FFFFFF' : '1px solid rgba(255,255,255,0.9)'}; border-radius: 4px; padding: 2px 6px; font-size: 10px; font-weight: 900; box-shadow: 0 2px 8px rgba(0,0,0,0.35); display: flex; align-items: center; gap: 4px; white-space: nowrap; ${isSelected ? 'transform: scale(1.1); box-shadow: 0 0 12px rgba(0,0,0,0.6);' : ''}">
          <span>${name}</span>
          <span style="background: rgba(0,0,0,0.28); padding: 1px 4px; border-radius: 2px; font-size: 9px;">${score}</span>
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
};

export const FishFinderMap: React.FC<Props> = ({
  data,
  selectedZone,
  onSelectZone,
  userCoords,
  onRecenter,
  dateFilter,
  onChangeDateFilter,
  hourOffset,
  onChangeHourOffset,
  heightClass = 'h-[440px] sm:h-[500px]',
}) => {
  const [layers, setLayers] = useState<FishFinderLayerToggles>({
    fishingPotential: true,
    pfz: true,
    sst: true,
    chlorophyll: true,
    currents: false,
    wind: true,
    waves: true,
    warnings: true,
  });

  const [showLayerPanel, setShowLayerPanel] = useState<boolean>(false);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);

  const seawardLonOffset = (data.location?.seaward_bearing || 260) < 180 ? 0.2 : -0.22;
  const mapCenter: [number, number] = [
    data.location?.latitude || userCoords.latitude || 18.913,
    (data.location?.longitude || userCoords.longitude || 72.825) + seawardLonOffset,
  ];

  // Auto-cycle timeline when playing
  useEffect(() => {
    if (!isPlayingTimeline) return;
    const interval = setInterval(() => {
      const slots = data.timeline_slots || [];
      if (slots.length === 0) return;
      const currentIdx = slots.findIndex((s) => s.hour === hourOffset);
      const nextIdx = (currentIdx + 1) % slots.length;
      onChangeHourOffset(slots[nextIdx]?.hour ?? 0);
    }, 2000);
    return () => clearInterval(interval);
  }, [isPlayingTimeline, data.timeline_slots, hourOffset, onChangeHourOffset]);

  const toggleLayer = (key: keyof FishFinderLayerToggles) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getFeatureStyle = (feature: any) => {
    const pot = feature.properties.fishing_potential;
    const isSelected = selectedZone?.zone_id === feature.properties.zone_id;

    let fillColor = '#059669';
    let borderColor = '#047857';

    if (pot === 'moderate') {
      fillColor = '#EAB308';
      borderColor = '#CA8A04';
    } else if (pot === 'avoid') {
      fillColor = '#EF4444';
      borderColor = '#B91C1C';
    } else if (pot === 'nodata') {
      fillColor = '#94A3B8';
      borderColor = '#64748B';
    }

    return {
      fillColor,
      fillOpacity: isSelected ? 0.5 : 0.3,
      color: isSelected ? '#17365D' : borderColor,
      weight: isSelected ? 3 : 1.5,
      dashArray: isSelected ? '4, 4' : undefined,
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    layer.on({
      click: () => {
        onSelectZone(feature.properties);
      },
    });
  };

  return (
    <div className={`relative w-full ${heightClass} border border-[#D6DCE1] bg-[#E5EEF5] select-none overflow-hidden`}>
      {/* 1. Top Overlay: Date Filters & Layer Button */}
      <div className="absolute top-2 left-2 right-2 z-[400] flex items-center justify-between pointer-events-none">
        {/* Left: Day Selector Pills */}
        <div className="flex items-center gap-1 bg-white/95 border border-[#D6DCE1] p-0.5 rounded-xs shadow-xs pointer-events-auto">
          {(['today', 'tomorrow', '3days'] as const).map((d) => (
            <button
              key={d}
              onClick={() => onChangeDateFilter(d)}
              className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer ${
                dateFilter === d
                  ? 'bg-[#17365D] text-white'
                  : 'text-[#1F2933] hover:bg-[#F1F5F9]'
              }`}
            >
              {d === 'today' ? 'Today' : d === 'tomorrow' ? 'Tomorrow' : '3 Days'}
            </button>
          ))}
        </div>

        {/* Right: Layer Control & Recenter */}
        <div className="flex items-center gap-1 pointer-events-auto">
          <button
            onClick={() => setShowLayerPanel(!showLayerPanel)}
            className={`p-1.5 border rounded-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold ${
              showLayerPanel
                ? 'bg-[#17365D] text-white border-[#17365D]'
                : 'bg-white/95 text-[#17365D] border-[#D6DCE1] hover:bg-white'
            }`}
            title="Toggle Marine Map Layers"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">LAYERS</span>
          </button>

          <button
            onClick={onRecenter}
            className="p-1.5 bg-white/95 hover:bg-white border border-[#D6DCE1] text-[#006B3C] rounded-xs shadow-xs transition-colors cursor-pointer"
            title="Recenter to Harbor"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Expandable Rectangular Layer Selection Modal */}
      {showLayerPanel && (
        <div className="absolute top-12 right-2 z-[450] bg-white border border-[#D6DCE1] shadow-lg p-2.5 w-56 rounded-xs space-y-1.5 text-xs font-medium">
          <div className="text-[10px] font-bold text-[#5B6770] uppercase tracking-wider border-b border-[#E2E8F0] pb-1">
            Marine Geographic Layers
          </div>
          {[
            { key: 'fishingPotential', label: 'Fishing Potential Zones' },
            { key: 'pfz', label: 'INCOIS PFZ Lines' },
            { key: 'sst', label: 'Sea Surface Temp (SST)' },
            { key: 'chlorophyll', label: 'Chlorophyll Bloom' },
            { key: 'currents', label: 'Ocean Currents & Drift' },
            { key: 'wind', label: 'Wind Direction / Speed' },
            { key: 'waves', label: 'Wave Heights & Swell' },
            { key: 'warnings', label: 'IMD Coastal Warnings' },
          ].map((item) => {
            const active = (layers as any)[item.key];
            return (
              <label
                key={item.key}
                onClick={() => toggleLayer(item.key as any)}
                className="flex items-center justify-between p-1 hover:bg-[#F8FAFC] rounded-xs cursor-pointer"
              >
                <span className="text-[#1F2933]">{item.label}</span>
                <input
                  type="checkbox"
                  checked={active}
                  readOnly
                  className="rounded-xs accent-[#006B3C] w-3.5 h-3.5 cursor-pointer"
                />
              </label>
            );
          })}
        </div>
      )}

      {/* 3. Real Interactive Leaflet Marine Map */}
      <MapContainer
        center={mapCenter}
        zoom={9}
        zoomControl={false}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Basemap: 100% Free OpenStreetMap / Esri - No API key required, zero watermarks */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController center={mapCenter} zoom={9} />

        {/* Fishing Opportunity GeoJSON Polygons */}
        {layers.fishingPotential && data.feature_collection && (
          <GeoJSON
            key={`geojson-${dateFilter}-${hourOffset}`}
            data={data.feature_collection as any}
            style={getFeatureStyle}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Zone Center Label Badges */}
        {layers.fishingPotential &&
          data.feature_collection?.features.map((f) => {
            const isSel = selectedZone?.zone_id === f.properties.zone_id;
            return (
              <Marker
                key={f.properties.zone_id}
                position={f.properties.center}
                icon={createZoneCenterIcon(
                  f.properties.short_name,
                  f.properties.fishing_potential,
                  f.properties.score,
                  isSel
                )}
                eventHandlers={{
                  click: () => onSelectZone(f.properties),
                }}
              />
            );
          })}

        {/* User / Harbor Vessel Marker */}
        <Marker
          position={[userCoords.latitude, userCoords.longitude]}
          icon={createVesselIcon()}
        >
          <Popup>
            <div className="text-xs p-1">
              <div className="font-bold text-[#17365D]">{data.location?.harbor_name}</div>
              <div className="text-[#5B6770]">Departure Point & Coast Guard Station</div>
            </div>
          </Popup>
        </Marker>

        {/* Distance Vector to Selected Zone */}
        {selectedZone && (
          <Polyline
            positions={[
              [userCoords.latitude, userCoords.longitude],
              selectedZone.center,
            ]}
            pathOptions={{
              color: '#17365D',
              weight: 2,
              dashArray: '5, 8',
              opacity: 0.8,
            }}
          />
        )}
      </MapContainer>

      {/* 4. Bottom-Left Map Legend (Compact Government Style) */}
      <div className="absolute bottom-16 left-2 z-[400] bg-white/95 border border-[#D6DCE1] px-2.5 py-1.5 rounded-xs shadow-xs space-y-1 text-[10px] font-bold">
        <div className="text-[#5B6770] uppercase tracking-wider text-[9px]">FISHING POTENTIAL</div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[#065F46]">
            <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
            <span>High</span>
          </div>
          <div className="flex items-center gap-1 text-[#92400E]">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
            <span>Moderate</span>
          </div>
          <div className="flex items-center gap-1 text-[#991B1B]">
            <span className="w-2 h-2 rounded-full bg-[#EF4444]"></span>
            <span>Avoid</span>
          </div>
        </div>
      </div>

      {/* 5. Bottom Time Scrubber / Slider Bar */}
      <div className="absolute bottom-2 left-2 right-2 z-[400] bg-white/95 border border-[#D6DCE1] p-1.5 rounded-xs shadow-md flex items-center gap-2">
        <button
          onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
          className="p-1 bg-[#17365D] text-white rounded-xs hover:bg-[#002855] transition-colors cursor-pointer shrink-0"
          title={isPlayingTimeline ? 'Pause timeline animation' : 'Play timeline animation'}
        >
          {isPlayingTimeline ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        <div className="flex items-center gap-1 shrink-0 text-xs font-bold text-[#17365D]">
          <Clock className="w-3.5 h-3.5 text-[#006B3C]" />
          <span>{data.time_label}</span>
        </div>

        {/* Hourly progression timeline pills */}
        <div className="flex-1 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
          {(data.timeline_slots || []).map((slot: TimelineSlot) => {
            const isSelected = slot.hour === hourOffset;
            const dotColor =
              slot.potential === 'high'
                ? 'bg-[#10B981]'
                : slot.potential === 'moderate'
                ? 'bg-[#F59E0B]'
                : 'bg-[#EF4444]';

            return (
              <button
                key={slot.hour}
                onClick={() => onChangeHourOffset(slot.hour)}
                className={`flex-1 py-1 px-1 text-[10px] font-bold rounded-xs flex flex-col items-center justify-center transition-colors cursor-pointer min-w-[44px] ${
                  isSelected
                    ? 'bg-[#17365D] text-white'
                    : 'bg-[#F1F5F9] text-[#1F2933] hover:bg-[#E2E8F0]'
                }`}
              >
                <span>{slot.label}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor} mt-0.5`}></span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
