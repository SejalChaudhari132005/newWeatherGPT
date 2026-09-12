import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  Layers,
  Crosshair,
  Map as MapIcon,
  Info,
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { translatePhrase } from '../../../utils/dashboardTranslator';

// Leaflet marker icon
const customFarmMarkerIcon = L.divIcon({
  className: 'custom-farm-pin',
  html: `
    <div style="
      background-color: #006B3C;
      width: 26px;
      height: 26px;
      border-radius: 2px;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    ">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  popupAnchor: [0, -26],
});

interface FarmMapCardProps {
  latitude: number;
  longitude: number;
  farmName?: string;
  cropName?: string;
  farmSize?: number;
  farmSizeUnit?: string;
  boundaryGeoJson?: any;
}

const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export const FarmMapCard: React.FC<FarmMapCardProps> = ({
  latitude,
  longitude,
  farmName = 'My Farm',
  cropName = 'Rice / Paddy',
  farmSize = 2.5,
  farmSizeUnit = 'Acres',
  boundaryGeoJson,
}) => {
  const { language } = useLanguage();
  const [mapType, setMapType] = useState<'map' | 'satellite'>('satellite');
  const [zoomLevel, setZoomLevel] = useState(16);

  const center: [number, number] = [latitude || 19.2437, longitude || 73.1355];

  const delta = 0.0018;
  const defaultBoundary: [number, number][] = [
    [center[0] + delta * 0.8, center[1] - delta * 1.1],
    [center[0] + delta * 1.2, center[1] + delta * 0.5],
    [center[0] - delta * 0.3, center[1] + delta * 1.2],
    [center[0] - delta * 1.1, center[1] - delta * 0.2],
    [center[0] - delta * 0.4, center[1] - delta * 1.0],
  ];

  const polygonPositions: [number, number][] =
    boundaryGeoJson && Array.isArray(boundaryGeoJson)
      ? boundaryGeoJson
      : defaultBoundary;

  const handleRecenter = () => {
    setZoomLevel(16);
  };

  return (
    <div className="gov-panel h-full min-h-[320px] flex flex-col justify-between overflow-hidden">
      {/* Official Section Header */}
      <div className="gov-panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapIcon className="w-4 h-4 text-[#006B3C]" />
          <span>FARM GEOPORTAL & BOUNDARY DELINEATION</span>
        </div>

        {/* Map Type Rectangular Toggles */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMapType('map')}
            className={`px-2.5 py-0.5 text-[11px] font-bold rounded-xs transition-colors cursor-pointer ${
              mapType === 'map'
                ? 'bg-[#006B3C] text-white'
                : 'bg-white text-[#1F2933] border border-[#D6DCE1] hover:bg-[#F1F5F9]'
            }`}
          >
            {language === 'mr' ? 'नकाशा' : language === 'hi' ? 'मानचित्र' : 'MAP'}
          </button>
          <button
            type="button"
            onClick={() => setMapType('satellite')}
            className={`px-2.5 py-0.5 text-[11px] font-bold rounded-xs transition-colors cursor-pointer ${
              mapType === 'satellite'
                ? 'bg-[#006B3C] text-white'
                : 'bg-white text-[#1F2933] border border-[#D6DCE1] hover:bg-[#F1F5F9]'
            }`}
          >
            {language === 'mr' ? 'उपग्रह' : language === 'hi' ? 'सैटेलाइट' : 'SATELLITE'}
          </button>
        </div>
      </div>

      {/* Map Body */}
      <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
        {/* Map Canvas */}
        <div className="relative w-full flex-1 min-h-[220px] sm:min-h-[250px] border border-[#D6DCE1] rounded-xs overflow-hidden">
          <MapContainer
            center={center}
            zoom={zoomLevel}
            scrollWheelZoom={false}
            className="w-full h-full z-0"
            style={{ height: '100%', width: '100%', minHeight: '220px' }}
          >
            <MapController center={center} zoom={zoomLevel} />

            {mapType === 'satellite' ? (
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com">Esri</a> World Imagery'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
              />
            ) : (
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
            )}

            {/* Farm Boundary Polygon */}
            <Polygon
              positions={polygonPositions}
              pathOptions={{
                color: '#006B3C',
                weight: 2.5,
                fillColor: '#006B3C',
                fillOpacity: 0.25,
                dashArray: '3, 4',
              }}
            >
              <Popup>
                <div className="text-left font-sans p-1 text-xs">
                  <div className="font-bold text-[#17365D]">{farmName}</div>
                  <div className="text-[#006B3C] font-semibold">{cropName}</div>
                  <div className="text-[#5B6770]">{farmSize} {farmSizeUnit}</div>
                </div>
              </Popup>
            </Polygon>

            {/* Farm Pinpoint Marker */}
            <Marker position={center} icon={customFarmMarkerIcon}>
              <Popup>
                <div className="text-left font-sans p-1 text-xs">
                  <span className="font-bold text-[#17365D]">{farmName}</span>
                  <p className="text-[#5B6770] text-[10px]">
                    {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
                  </p>
                </div>
              </Popup>
            </Marker>
          </MapContainer>

          {/* Bottom Left Compass & Scale Overlay */}
          <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 pointer-events-none">
            <div className="w-6 h-6 rounded-xs bg-[#17365D]/90 text-white flex items-center justify-center font-bold text-[10px] border border-white/40 shadow-xs">
              N
            </div>
            <div className="px-1.5 py-0.5 rounded-xs bg-[#17365D]/90 text-white text-[10px] font-medium border border-white/40 shadow-xs">
              Scale 1:5000
            </div>
          </div>

          {/* Bottom Right Recenter Button */}
          <div className="absolute bottom-2 right-2 z-10 flex flex-col gap-1 pointer-events-auto">
            <button
              type="button"
              onClick={handleRecenter}
              className="p-1.5 rounded-xs bg-white hover:bg-[#F1F5F9] text-[#17365D] border border-[#D6DCE1] shadow-xs cursor-pointer"
              title="Recenter"
            >
              <Crosshair className="w-4 h-4 text-[#006B3C]" />
            </button>
          </div>
        </div>

        {/* Legend & Geographic Metadata Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-[#5B6770]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-[#006B3C] rounded-xs inline-block" />
              Plot Boundary
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-[#17365D] rounded-xs inline-block" />
              Sensor Origin
            </span>
          </div>
          <span>Cadastral Coordinate Reference: WGS-84</span>
        </div>
      </div>
    </div>
  );
};
