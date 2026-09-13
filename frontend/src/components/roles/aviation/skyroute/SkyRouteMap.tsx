import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { WeatherHazardFeature, SkyRouteData } from '../../../../types/skyroute';

// Fix default Leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom airport marker icons
const createAirportIcon = (code: string, isOrigin: boolean) => {
  const bgColor = isOrigin ? '#006B3C' : '#17365D'; // Gov Green for departure, Navy for arrival
  const typeLabel = isOrigin ? 'DEP' : 'ARR';
  const iconHtml = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      transform: translate(-50%, -100%);
    ">
      <div style="
        background: ${bgColor};
        color: #FFFFFF;
        font-family: 'Noto Sans', sans-serif;
        font-weight: 700;
        font-size: 11px;
        padding: 3px 6px;
        border-radius: 2px;
        border: 1px solid #ffffff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
      ">
        <span style="font-size: 9px; opacity: 0.85;">${typeLabel}</span>
        <span>${code}</span>
      </div>
      <div style="
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 6px solid ${bgColor};
      "></div>
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-airport-pin',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

// Component to dynamically fit route bounds
function MapBoundsController({
  originCoords,
  destCoords,
}: {
  originCoords: [number, number];
  destCoords: [number, number];
}) {
  const map = useMap();

  useEffect(() => {
    if (originCoords && destCoords) {
      const bounds = L.latLngBounds([originCoords, destCoords]);
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 7,
        animate: true,
      });
    }
  }, [map, originCoords, destCoords]);

  return null;
}

interface SkyRouteMapProps {
  data: SkyRouteData;
  selectedHazardId: string | null;
  onSelectHazard: (hazard: WeatherHazardFeature | null) => void;
  visibleLayers: {
    route: boolean;
    corridor: boolean;
    thunderstorms: boolean;
    rain: boolean;
    turbulence: boolean;
    visibility: boolean;
    warnings: boolean;
  };
}

export const SkyRouteMap: React.FC<SkyRouteMapProps> = ({
  data,
  selectedHazardId,
  onSelectHazard,
  visibleLayers,
}) => {
  const { origin, destination, route_linestring, corridor_polygon, hazards } = data;

  const originCoords: [number, number] = [origin.latitude, origin.longitude];
  const destCoords: [number, number] = [destination.latitude, destination.longitude];

  // Route path coords [lat, lon]
  const routePolylineCoords: [number, number][] = useMemo(() => {
    if (!route_linestring?.coordinates) return [];
    return route_linestring.coordinates.map((coord) => [coord[1], coord[0]]);
  }, [route_linestring]);

  // Corridor polygon coords [lat, lon]
  const corridorPolygonCoords: [number, number][] = useMemo(() => {
    if (!corridor_polygon?.coordinates?.[0]) return [];
    return corridor_polygon.coordinates[0].map((coord) => [coord[1], coord[0]]);
  }, [corridor_polygon]);

  // Filter hazards by active layer toggles
  const filteredHazards = useMemo(() => {
    return hazards.filter((h) => {
      const type = h.type;
      if (type === 'thunderstorm' && !visibleLayers.thunderstorms) return false;
      if (type === 'rain' && !visibleLayers.rain) return false;
      if (type === 'turbulence' && !visibleLayers.turbulence) return false;
      if (type === 'visibility' && !visibleLayers.visibility) return false;
      if (type === 'warning' && !visibleLayers.warnings) return false;
      return true;
    });
  }, [hazards, visibleLayers]);

  // Helper for hazard styling
  const getHazardStyle = (hazard: WeatherHazardFeature) => {
    const isSelected = hazard.hazard_id === selectedHazardId;
    const { type, severity, route_impact } = hazard;

    let color = '#1D5F91'; // Information blue default
    if (type === 'thunderstorm' || severity === 'HIGH' || severity === 'SEVERE') {
      color = '#B42318'; // Gov red
    } else if (severity === 'MODERATE' || type === 'turbulence') {
      color = '#B7791F'; // Gov warning amber
    } else if (type === 'rain') {
      color = '#1D5F91'; // Gov navy/blue
    } else if (type === 'visibility') {
      color = '#5B6770'; // Neutral secondary
    }

    const isIntersection = route_impact === 'INTERSECTION';

    return {
      color: isSelected ? '#111827' : color,
      weight: isSelected ? 3 : isIntersection ? 2 : 1.5,
      opacity: isSelected ? 1 : 0.85,
      fillColor: color,
      fillOpacity: isSelected ? 0.45 : isIntersection ? 0.35 : 0.2,
      dashArray: isIntersection ? undefined : '3, 3',
    };
  };

  return (
    <div className="relative w-full h-full min-h-[380px] bg-[#EEF2F6]">
      <MapContainer
        center={[(originCoords[0] + destCoords[0]) / 2, (originCoords[1] + destCoords[1]) / 2]}
        zoom={5}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ minHeight: '380px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Dynamic Bounds Fitting */}
        <MapBoundsController originCoords={originCoords} destCoords={destCoords} />

        {/* 1. Weather Corridor Polygon Layer */}
        {visibleLayers.corridor && corridorPolygonCoords.length > 0 && (
          <Polygon
            positions={corridorPolygonCoords}
            pathOptions={{
              color: '#17365D',
              weight: 1.5,
              opacity: 0.6,
              fillColor: '#17365D',
              fillOpacity: 0.07,
              dashArray: '4, 4',
            }}
          />
        )}

        {/* 2. Flight Route Line */}
        {visibleLayers.route && routePolylineCoords.length > 0 && (
          <>
            {/* Outer casing */}
            <Polyline
              positions={routePolylineCoords}
              pathOptions={{
                color: '#006B3C',
                weight: 4,
                opacity: 0.95,
              }}
            />
            {/* Inner dashed centerline */}
            <Polyline
              positions={routePolylineCoords}
              pathOptions={{
                color: '#FFFFFF',
                weight: 1.5,
                opacity: 0.8,
                dashArray: '5, 5',
              }}
            />
          </>
        )}

        {/* 3. Weather Hazard Polygons */}
        {filteredHazards.map((hazard) => {
          if (!hazard.geometry?.coordinates?.[0]) return null;
          const positions = hazard.geometry.coordinates[0].map(
            (c: [number, number]) => [c[1], c[0]] as [number, number]
          );

          return (
            <Polygon
              key={hazard.hazard_id}
              positions={positions}
              pathOptions={getHazardStyle(hazard)}
              eventHandlers={{
                click: () => onSelectHazard(hazard),
              }}
            >
              <Popup>
                <div className="p-1 font-sans text-xs">
                  <div className="font-bold text-[#1F2933] uppercase tracking-wider mb-1 flex items-center gap-1">
                    <span>{hazard.type.toUpperCase()}</span>
                    <span
                      className={`px-1 py-0.2 text-[9px] font-bold rounded-xs ${
                        hazard.severity === 'HIGH' || hazard.severity === 'SEVERE'
                          ? 'bg-red-100 text-red-800'
                          : hazard.severity === 'MODERATE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {hazard.severity}
                    </span>
                  </div>
                  <p className="text-[#5B6770] text-[11px] mb-1">{hazard.title}</p>
                  <div className="text-[10px] text-[#1F2933] border-t border-[#D6DCE1] pt-1">
                    <div>
                      <strong>Impact:</strong> {hazard.route_impact} ({hazard.distance_from_corridor_km} km)
                    </div>
                    <div>
                      <strong>Source:</strong> {hazard.source} ({hazard.expected_time_window})
                    </div>
                  </div>
                </div>
              </Popup>
            </Polygon>
          );
        })}

        {/* 4. Origin Marker */}
        <Marker position={originCoords} icon={createAirportIcon(origin.iata || origin.icao, true)}>
          <Popup>
            <div className="text-xs">
              <div className="font-bold text-[#006B3C]">DEPARTURE</div>
              <div>{origin.name} ({origin.iata || origin.icao})</div>
              <div className="text-[#5B6770]">{origin.city}</div>
            </div>
          </Popup>
        </Marker>

        {/* 5. Destination Marker */}
        <Marker position={destCoords} icon={createAirportIcon(destination.iata || destination.icao, false)}>
          <Popup>
            <div className="text-xs">
              <div className="font-bold text-[#17365D]">ARRIVAL</div>
              <div>{destination.name} ({destination.iata || destination.icao})</div>
              <div className="text-[#5B6770]">{destination.city}</div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Floating Map Legend (Gov Style) */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white border border-[#D6DCE1] shadow-sm p-2 text-xs font-sans rounded-xs max-w-[200px] pointer-events-auto">
        <div className="text-[10px] font-bold text-[#5B6770] uppercase tracking-wider mb-1.5 pb-1 border-b border-[#D6DCE1]">
          Map Legend
        </div>
        <div className="space-y-1 text-[11px] text-[#1F2933]">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 bg-[#006B3C] inline-block"></span>
            <span>Flight Route</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-2 bg-[#17365D] opacity-30 border border-[#17365D] border-dashed inline-block"></span>
            <span>Corridor (50km)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#B42318] inline-block rounded-xs"></span>
            <span>Thunderstorm</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#1D5F91] inline-block rounded-xs"></span>
            <span>Precipitation / Rain</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#B7791F] inline-block rounded-xs"></span>
            <span>Turbulence / Wind</span>
          </div>
        </div>
      </div>
    </div>
  );
};
