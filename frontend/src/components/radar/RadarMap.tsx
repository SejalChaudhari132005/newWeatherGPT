import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useWeather } from '../../context/WeatherContext';
import { radarService, RadarFramesResponse, RadarFrameItem } from '../../services/radarService';
import { Radar, Play, Pause, RefreshCw, Layers } from 'lucide-react';

const userMarkerIcon = L.divIcon({
  className: 'custom-gps-marker',
  html: `
    <div style="position: relative; display: flex; items-center; justify-content: center; transform: translate(-50%, -50%);">
      <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(56, 182, 255, 0.4); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width: 14px; height: 14px; border-radius: 50%; background: #004aad; border: 2.5px solid #ffffff; box-shadow: 0 0 10px #38b6ff; z-index: 10;"></div>
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

export const RadarMap: React.FC = () => {
  const { userLocation } = useWeather();
  const [radarMeta, setRadarMeta] = useState<RadarFramesResponse | null>(null);
  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [tileMode, setTileMode] = useState<'satellite' | 'voyager'>('satellite');

  const lat = userLocation?.latitude || 19.2598;
  const lng = userLocation?.longitude || 73.1339;
  const cityName = userLocation?.city || 'Your Location';

  const fetchFrames = async () => {
    setLoading(true);
    try {
      const res = await radarService.getRadarFrames();
      if (res.success && res.frames.length > 0) {
        setRadarMeta(res);
        setActiveFrameIndex(res.frames.length - 1);
      }
    } catch (e) {
      console.error('[RadarMap] Failed to load radar frames:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFrames();
  }, []);

  useEffect(() => {
    let timer: any;
    if (isPlaying && radarMeta?.frames?.length) {
      timer = setInterval(() => {
        setActiveFrameIndex((prev) => (prev + 1) % radarMeta.frames.length);
      }, 1200);
    }
    return () => clearInterval(timer);
  }, [isPlaying, radarMeta?.frames?.length]);

  const frames = radarMeta?.frames || [];
  const currentFrame = frames[activeFrameIndex] || frames[frames.length - 1];
  const radarTileUrl = currentFrame && radarMeta?.host
    ? `${radarMeta.host}${currentFrame.path}/256/{z}/{x}/{y}/2/1_1.png`
    : null;

  const formatFrameTime = (unixTime?: number) => {
    if (!unixTime) return 'Live';
    return new Date(unixTime * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const baseTileUrl = tileMode === 'satellite'
    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-md border border-slate-200/80 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-blue-50 text-[#004aad] border border-blue-100">
            <Radar className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">Live Weather Radar</h3>
            <p className="text-xs text-slate-500 font-bold">
              {cityName} ({lat.toFixed(4)}°, {lng.toFixed(4)}°)
            </p>
          </div>
        </div>

        <button
          onClick={fetchFrames}
          disabled={loading}
          className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 cursor-pointer"
          title="Refresh Radar"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#004aad]' : ''}`} />
        </button>
      </div>

      {/* Map Container */}
      <div className="relative h-96 w-full rounded-2xl overflow-hidden border border-slate-300 shadow-inner bg-slate-950">
        <MapContainer
          key={`${lat}-${lng}`}
          center={[lat, lng]}
          zoom={9}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={baseTileUrl}
          />

          {/* Real Doppler Radar Tile Layer */}
          {radarTileUrl && (
            <TileLayer
              key={`radar-tile-${currentFrame?.time || 'now'}`}
              url={radarTileUrl}
              opacity={0.8}
              zIndex={500}
            />
          )}

          {/* User Marker (Exact GPS dot, no artificial circle) */}
          <Marker position={[lat, lng]} icon={userMarkerIcon}>
            <Popup>
              <div className="text-xs font-bold p-1">
                📍 {cityName}<br />
                <span className="text-[#004aad] font-black">Your GPS Location</span>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Legend */}
        <div className="absolute top-3 left-3 z-[1000] p-2.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-white/20 text-white shadow-xl text-[10px] font-bold space-y-1">
          <div className="text-[9px] font-black uppercase text-slate-300">Precipitation</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-[#0284c7]" /> Low</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-[#22c55e]" /> Moderate</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-[#f59e0b]" /> Heavy</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-[#ef4444]" /> Extreme</div>
        </div>

        {/* Base Layer Switcher */}
        <div className="absolute top-3 right-3 z-[1000]">
          <button
            onClick={() => setTileMode(prev => prev === 'satellite' ? 'voyager' : 'satellite')}
            className="p-2 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/20 text-white shadow-lg cursor-pointer"
            title="Toggle Map Style"
          >
            <Layers className="w-4 h-4 text-sky-400" />
          </button>
        </div>

        {/* Playback Scrub Bar */}
        <div className="absolute bottom-3 left-3 right-3 z-[1000] p-2.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-white/20 text-white shadow-xl flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 rounded-full bg-[#004aad] text-white flex items-center justify-center hover:bg-blue-700 cursor-pointer shrink-0"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          <div className="flex items-center justify-between flex-1 gap-1 overflow-x-auto no-scrollbar">
            {frames.map((f, idx) => {
              const isSelected = idx === activeFrameIndex;
              const isLatest = idx === frames.length - 1;
              return (
                <button
                  key={f.time}
                  onClick={() => {
                    setIsPlaying(false);
                    setActiveFrameIndex(idx);
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isLatest ? 'Now' : formatFrameTime(f.time)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="text-[11px] text-slate-400 font-bold text-center">
        Radar visualization: RainViewer | Official weather & warnings: India Meteorological Department (IMD)
      </div>
    </div>
  );
};
