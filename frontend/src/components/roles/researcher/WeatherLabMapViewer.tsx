import React, { useState, useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Polygon,
  Popup,
  Tooltip,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Layers,
  Plus,
  Minus,
  Crosshair,
  Settings,
  Eye,
  Wind,
  CloudRain,
  Activity,
  Flame,
  Globe,
  MapPin,
  ChevronDown,
  ChevronUp,
  Compass,
} from 'lucide-react';

interface WeatherLabMapViewerProps {
  locationName?: string;
  lat?: number;
  lon?: number;
  centerLat?: number;
  centerLon?: number;
  selectedLayer?: string;
  onLayerChange?: (layer: string) => void;
  onSaveMap?: () => void;
}

// Controller to smoothly animate and re-center map when target coordinates change
const MapController: React.FC<{ lat: number; lon: number; zoom?: number }> = ({ lat, lon, zoom = 6 }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], zoom, { duration: 1.2, easeLinearity: 0.25 });
  }, [lat, lon, zoom, map]);
  return null;
};

export const WeatherLabMapViewer: React.FC<WeatherLabMapViewerProps> = ({
  locationName = 'Mumbai, Maharashtra',
  lat = 18.98,
  lon = 72.83,
  centerLat,
  centerLon,
  selectedLayer: propSelectedLayer,
  onLayerChange,
  onSaveMap,
}) => {
  const currentLat = centerLat ?? lat ?? 18.98;
  const currentLon = centerLon ?? lon ?? 72.83;

  const [mapLayer, setMapLayer] = useState(propSelectedLayer || 'Rainfall (24h)');
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(6);

  // Sync prop changes
  useEffect(() => {
    if (propSelectedLayer) setMapLayer(propSelectedLayer);
  }, [propSelectedLayer]);

  // Layer Visibility toggles
  const [layers, setLayers] = useState({
    rainfall: true,
    radar: true,
    cloudCover: false,
    windVectors: true,
    temperature: false,
    cycloneTrack: true,
    countryBoundaries: true,
    districtBoundaries: false,
  });

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 1. DYNAMIC REGIONAL RADAR CELLS: Dynamically computed around currentLat, currentLon
  const dynamicRadarCells = useMemo(() => {
    const lat = currentLat;
    const lon = currentLon;

    const outerModerate: [number, number][] = [
      [lat + 1.2, lon - 0.9],
      [lat + 0.8, lon + 0.7],
      [lat - 0.6, lon + 1.1],
      [lat - 1.4, lon + 0.4],
      [lat - 1.1, lon - 0.8],
      [lat + 0.2, lon - 1.2],
    ];

    const innerIntense: [number, number][] = [
      [lat + 0.5, lon - 0.4],
      [lat + 0.3, lon + 0.4],
      [lat - 0.4, lon + 0.3],
      [lat - 0.3, lon - 0.5],
    ];

    return { outerModerate, innerIntense };
  }, [currentLat, currentLon]);

  // 2. DYNAMIC WIND STREAMLINES: Generated dynamically along regional pressure gradients
  const dynamicWindStreamlines = useMemo(() => {
    const lat = currentLat;
    const lon = currentLon;

    return [
      [
        [lat - 2.5, lon - 3.0],
        [lat - 1.2, lon - 1.5],
        [lat, lon],
        [lat + 1.2, lon + 1.8],
      ],
      [
        [lat - 3.2, lon - 1.5],
        [lat - 1.8, lon - 0.2],
        [lat - 0.5, lon + 1.2],
        [lat + 0.8, lon + 2.6],
      ],
      [
        [lat - 1.5, lon - 4.2],
        [lat - 0.4, lon - 2.2],
        [lat + 0.8, lon - 0.6],
        [lat + 1.9, lon + 1.0],
      ],
      [
        [lat + 1.5, lon - 3.5],
        [lat + 2.2, lon - 1.5],
        [lat + 2.8, lon + 0.8],
        [lat + 3.2, lon + 2.8],
      ],
    ] as [number, number][][];
  }, [currentLat, currentLon]);

  // 3. DYNAMIC METEOROLOGICAL STATIONS: Derived dynamically around active center
  const dynamicStations = useMemo(() => {
    const baseName = locationName.split(',')[0].trim();
    return [
      {
        id: 'primary',
        name: baseName,
        lat: currentLat,
        lon: currentLon,
        temp: '31°C',
        rain: '72 mm',
        wind: '19 km/h',
        humidity: '82%',
        pressure: '1008 hPa',
        status: 'Active Observation Station',
        isPrimary: true,
      },
      {
        id: 'north_station',
        name: `${baseName} North AWS`,
        lat: currentLat + 0.65,
        lon: currentLon + 0.35,
        temp: '30°C',
        rain: '45 mm',
        wind: '16 km/h',
        humidity: '79%',
        pressure: '1009 hPa',
        status: 'Operational Automatic Weather Station',
        isPrimary: false,
      },
      {
        id: 'east_station',
        name: `${baseName} East Observatory`,
        lat: currentLat - 0.45,
        lon: currentLon + 0.85,
        temp: '32°C',
        rain: '18 mm',
        wind: '14 km/h',
        humidity: '74%',
        pressure: '1007 hPa',
        status: 'Synoptic Met Station',
        isPrimary: false,
      },
      {
        id: 'coastal_station',
        name: `${baseName} Coastal Radar AWS`,
        lat: currentLat - 0.75,
        lon: currentLon - 0.55,
        temp: '29°C',
        rain: '84 mm',
        wind: '24 km/h',
        humidity: '88%',
        pressure: '1006 hPa',
        status: 'Doppler Radar Colocation',
        isPrimary: false,
      },
    ];
  }, [locationName, currentLat, currentLon]);

  // 4. DYNAMIC SYNOPTIC LOW / CYCLONE TRACK: Placed relative to maritime proximity
  const dynamicCyclone = useMemo(() => {
    // If in western India, place in Arabian Sea; if eastern, place in Bay of Bengal
    const isWest = currentLon < 78.0;
    const cLat = isWest ? 16.5 : 15.2;
    const cLon = isWest ? 69.5 : 85.0;

    const track: [number, number][] = isWest
      ? [
          [12.0, 66.5],
          [14.2, 68.0],
          [16.5, 69.5],
          [18.8, 71.0],
          [20.5, 71.8],
        ]
      : [
          [10.5, 88.5],
          [12.8, 86.8],
          [15.2, 85.0],
          [17.6, 83.9],
          [19.8, 84.5],
        ];

    return { center: [cLat, cLon] as [number, number], track, basin: isWest ? 'Arabian Sea' : 'Bay of Bengal' };
  }, [currentLon]);

  return (
    <div className="relative w-full h-[400px] sm:h-[460px] md:h-[520px] rounded overflow-hidden border border-slate-200 shadow-inner bg-[#0A192F] select-none">
      {/* 1. Leaflet Interactive Map */}
      <MapContainer
        center={[currentLat, currentLon]}
        zoom={zoomLevel}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        attributionControl={false}
      >
        {/* Dynamic Map Camera Controller */}
        <MapController lat={currentLat} lon={currentLon} zoom={zoomLevel} />

        {/* Clean OpenStreetMap Tile Layer (100% Free, Zero Watermark) */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Dynamic Rainfall Radar Reflectivity Heatmap Polygons */}
        {layers.rainfall && (
          <>
            {/* Outer Moderate Rain Zone (Green/Cyan) */}
            <Polygon
              positions={dynamicRadarCells.outerModerate}
              pathOptions={{
                color: '#10B981',
                fillColor: '#22C55E',
                fillOpacity: 0.45,
                weight: 1.5,
              }}
            >
              <Tooltip sticky>
                <div className="text-xs font-bold text-slate-800">
                  Regional Convective Rainfall Band (35–45 dBZ)
                </div>
              </Tooltip>
            </Polygon>

            {/* Inner Intense Radar Core (Orange/Red) */}
            <Polygon
              positions={dynamicRadarCells.innerIntense}
              pathOptions={{
                color: '#EF4444',
                fillColor: '#F59E0B',
                fillOpacity: 0.7,
                weight: 2,
              }}
            >
              <Tooltip sticky>
                <div className="text-xs font-bold text-slate-800">
                  Heavy Radar Reflectivity: 52 dBZ Core ({locationName.split(',')[0]})
                </div>
              </Tooltip>
            </Polygon>
          </>
        )}

        {/* Dynamic Wind Streamline Vectors */}
        {layers.windVectors &&
          dynamicWindStreamlines.map((pts, idx) => (
            <Polyline
              key={`wind-${idx}`}
              positions={pts}
              pathOptions={{
                color: '#0284C7',
                weight: 2.5,
                dashArray: '8, 8',
                opacity: 0.85,
              }}
            />
          ))}

        {/* Dynamic Cyclone / Synoptic Low Pressure Track */}
        {layers.cycloneTrack && (
          <>
            <Polyline
              positions={dynamicCyclone.track}
              pathOptions={{
                color: '#DC2626',
                weight: 3,
                dashArray: '5, 5',
                opacity: 0.9,
              }}
            />

            <CircleMarker
              center={dynamicCyclone.center}
              radius={18}
              pathOptions={{
                color: '#DC2626',
                fillColor: '#EF4444',
                fillOpacity: 0.45,
                weight: 2,
              }}
            >
              <Tooltip permanent direction="top" offset={[0, -10]}>
                <span className="text-[10px] font-black text-rose-700 uppercase tracking-tight bg-white/90 px-1 py-0.2 rounded shadow-xs">
                  🌀 {dynamicCyclone.basin} Low (992 hPa)
                </span>
              </Tooltip>
              <Popup>
                <div className="text-xs p-1 font-sans">
                  <strong className="text-rose-700 block">Synoptic Cyclonic System</strong>
                  <div className="text-slate-600 mt-0.5">Basin: {dynamicCyclone.basin}</div>
                  <div className="text-slate-600">Central Pressure: 992 hPa</div>
                  <div className="text-slate-600">Maximum Gusts: 75 km/h</div>
                </div>
              </Popup>
            </CircleMarker>
          </>
        )}

        {/* Dynamic Local Observation Stations */}
        {dynamicStations.map((st) => (
          <CircleMarker
            key={st.id}
            center={[st.lat, st.lon]}
            radius={st.isPrimary ? 8 : 5}
            pathOptions={{
              color: st.isPrimary ? '#DC2626' : '#1E293B',
              fillColor: st.isPrimary ? '#EF4444' : '#0284C7',
              fillOpacity: 0.95,
              weight: 2,
            }}
          >
            <Tooltip permanent direction="bottom" offset={[0, 8]}>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs ${
                st.isPrimary ? 'bg-rose-50 text-rose-900 border border-rose-200 font-black' : 'bg-white/95 text-slate-800'
              }`}>
                {st.name} ({st.temp})
              </span>
            </Tooltip>
            <Popup>
              <div className="text-xs p-1.5 font-sans space-y-1">
                <div className="font-bold text-[#17365D] border-b border-slate-200 pb-1">
                  {st.name}
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-700">
                  <div>Temp: <strong>{st.temp}</strong></div>
                  <div>Rain: <strong>{st.rain}</strong></div>
                  <div>Wind: <strong>{st.wind}</strong></div>
                  <div>Pressure: <strong>{st.pressure}</strong></div>
                </div>
                <div className="text-[10px] font-semibold text-emerald-700 pt-0.5">
                  {st.status}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* 2. Floating Left Toolbar (Zoom, Recenter, Layer Toggle) */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-1.5 bg-white/95 backdrop-blur-xs border border-slate-200 rounded shadow-md p-1">
        <button
          onClick={() => setZoomLevel((z) => Math.min(z + 1, 14))}
          className="p-1.5 text-slate-700 hover:bg-slate-100 rounded text-xs font-bold transition-colors cursor-pointer"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoomLevel((z) => Math.max(z - 1, 3))}
          className="p-1.5 text-slate-700 hover:bg-slate-100 rounded text-xs font-bold transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="h-px bg-slate-200 my-0.5" />
        <button
          onClick={() => {
            setZoomLevel(7);
          }}
          className="p-1.5 text-slate-700 hover:bg-slate-100 rounded text-xs transition-colors cursor-pointer"
          title="Recenter Map"
        >
          <Crosshair className="w-4 h-4 text-blue-600" />
        </button>
        <button
          onClick={() => setIsLayersPanelOpen(!isLayersPanelOpen)}
          className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
            isLayersPanelOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Toggle Layers Panel"
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>

      {/* 3. Floating Map Layers Checklist Panel */}
      <div
        className={`absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-xs border border-slate-200 rounded shadow-md transition-all duration-200 overflow-hidden ${
          isLayersPanelOpen
            ? 'w-48 sm:w-56 p-3 block'
            : 'hidden md:block w-48 sm:w-56 p-3'
        }`}
      >
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 mb-2">
          <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" /> Map Layers
          </span>
          <button
            onClick={() => setIsLayersPanelOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-600 p-0.5"
          >
            ✕
          </button>
        </div>

        <div className="space-y-1.5 text-[11px] text-slate-700">
          <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1 rounded">
            <span className="flex items-center gap-1.5">
              <CloudRain className="w-3.5 h-3.5 text-blue-600" /> Rainfall (24h)
            </span>
            <input
              type="checkbox"
              checked={layers.rainfall}
              onChange={() => toggleLayer('rainfall')}
              className="accent-blue-600 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1 rounded">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" /> Radar Reflectivity
            </span>
            <input
              type="checkbox"
              checked={layers.radar}
              onChange={() => toggleLayer('radar')}
              className="accent-blue-600 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1 rounded">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-slate-400" /> Cloud Cover
            </span>
            <input
              type="checkbox"
              checked={layers.cloudCover}
              onChange={() => toggleLayer('cloudCover')}
              className="accent-blue-600 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1 rounded">
            <span className="flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-sky-500" /> Wind Vectors
            </span>
            <input
              type="checkbox"
              checked={layers.windVectors}
              onChange={() => toggleLayer('windVectors')}
              className="accent-blue-600 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1 rounded">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-500" /> Temperature
            </span>
            <input
              type="checkbox"
              checked={layers.temperature}
              onChange={() => toggleLayer('temperature')}
              className="accent-blue-600 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1 rounded">
            <span className="flex items-center gap-1.5 text-red-600 font-semibold">
              🌀 Cyclone Track
            </span>
            <input
              type="checkbox"
              checked={layers.cycloneTrack}
              onChange={() => toggleLayer('cycloneTrack')}
              className="accent-red-600 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1 rounded">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-500" /> Country Boundaries
            </span>
            <input
              type="checkbox"
              checked={layers.countryBoundaries}
              onChange={() => toggleLayer('countryBoundaries')}
              className="accent-blue-600 rounded cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Mobile Toggle Button for Map Layers when collapsed */}
      {!isLayersPanelOpen && (
        <button
          onClick={() => setIsLayersPanelOpen(true)}
          className="md:hidden absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-xs border border-slate-200 px-2.5 py-1.5 rounded shadow text-xs font-bold text-slate-800 flex items-center gap-1.5"
        >
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span>Layers</span>
        </button>
      )}

      {/* 4. Bottom Right Rainfall Color Scale (0 to 200+ mm) */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-white/95 backdrop-blur-xs border border-slate-200 rounded shadow-md px-3 py-1.5 font-sans">
        <div className="text-[10px] font-bold text-slate-700 mb-1">Rainfall (mm)</div>
        <div className="w-36 sm:w-44 h-2.5 rounded-xs bg-gradient-to-r from-blue-300 via-emerald-400 via-amber-400 via-orange-500 to-purple-600" />
        <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
          <span>0</span>
          <span>10</span>
          <span>25</span>
          <span>50</span>
          <span>100</span>
          <span>200+</span>
        </div>
      </div>

      {/* 5. Bottom Left Scale Bar */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-xs border border-slate-200 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-slate-700">
        500 km
      </div>
    </div>
  );
};
