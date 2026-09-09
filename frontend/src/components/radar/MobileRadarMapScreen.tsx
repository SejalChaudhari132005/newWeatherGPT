import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useWeather } from '../../context/WeatherContext';

const userMarkerIcon = L.divIcon({
  className: 'custom-gps-marker',
  html: `
    <div style="position: relative; display: flex; items-center; justify-content: center; transform: translate(-50%, -50%);">
      <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(56, 182, 255, 0.4); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width: 12px; height: 12px; border-radius: 50%; background: #004aad; border: 2px solid #ffffff; box-shadow: 0 0 8px #38b6ff; z-index: 10;"></div>
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

export const MobileRadarMapScreen: React.FC = () => {
  const { userLocation } = useWeather();
  const [activeFilter, setActiveFilter] = useState<'recent' | 'm5' | 'felt'>('recent');

  const lat = userLocation?.latitude || 19.2598;
  const lng = userLocation?.longitude || 73.1339;
  const locationName = userLocation?.city || 'Your Location';

  return (
    <div className="relative min-h-[750px] w-full flex flex-col justify-between overflow-hidden">
      {/* Top Map Overlay Filter Pills */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center justify-center gap-2">
        <button
          onClick={() => setActiveFilter('recent')}
          className={`px-4 py-2 rounded-full text-xs font-extrabold shadow-md backdrop-blur-md border transition-all cursor-pointer ${
            activeFilter === 'recent'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white/90 text-slate-700 border-white'
          }`}
        >
          Recent
        </button>

        <button
          onClick={() => setActiveFilter('m5')}
          className={`px-4 py-2 rounded-full text-xs font-extrabold shadow-md backdrop-blur-md border transition-all cursor-pointer ${
            activeFilter === 'm5'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white/90 text-slate-700 border-white'
          }`}
        >
          M ≥ 5
        </button>

        <button
          onClick={() => setActiveFilter('felt')}
          className={`px-4 py-2 rounded-full text-xs font-extrabold shadow-md backdrop-blur-md border transition-all cursor-pointer ${
            activeFilter === 'felt'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white/90 text-slate-700 border-white'
          }`}
        >
          Felt
        </button>
      </div>

      {/* Interactive Map View */}
      <div className="h-[480px] w-full relative z-1">
        <MapContainer
          key={`${lat}-${lng}`}
          center={[lat, lng]}
          zoom={9}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />

          <Marker position={[lat, lng]} icon={userMarkerIcon}>
            <Popup>
              <div className="text-xs font-bold">
                📍 {locationName}<br />
                <span className="text-sky-600">Detected User GPS</span>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
};
