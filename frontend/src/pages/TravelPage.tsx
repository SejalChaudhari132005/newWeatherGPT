import React, { useState } from 'react';
import { ArrowLeft, Car, Sparkles, RefreshCw } from 'lucide-react';
import { useLocation } from '../hooks/useLocation';
import { useLanguage } from '../context/LanguageContext';
import { useAuthContext } from '../context/AuthContext';
import { routeService } from '../services/routeService';
import { RouteAnalysisResponse, DepartureComparisonResponse } from '../types/route';
import { RoutePlanningCard } from '../components/route/RoutePlanningCard';
import { RouteTimeline } from '../components/route/RouteTimeline';
import { DepartureComparisonCard } from '../components/route/DepartureComparisonCard';
import { RouteAlertModal } from '../components/route/RouteAlertModal';

interface Props {
  onBack?: () => void;
  onAskGpt?: (query: string) => void;
}

export const TravelPage: React.FC<Props> = ({ onBack, onAskGpt }) => {
  const { location } = useLocation();
  const { language } = useLanguage();
  const { profile } = useAuthContext();

  const [routeAnalysis, setRouteAnalysis] = useState<RouteAnalysisResponse | null>(null);
  const [departureComparison, setDepartureComparison] = useState<DepartureComparisonResponse | null>(null);
  const [analyzingRoute, setAnalyzingRoute] = useState<boolean>(false);
  const [alertModalOpen, setAlertModalOpen] = useState<boolean>(false);

  const lat = location?.latitude || profile?.latitude || 19.2437;
  const lon = location?.longitude || profile?.longitude || 73.1355;
  const city = location?.city || profile?.city || 'Kalyan-Dombivli';

  const handleAnalyzeRoute = async (params: {
    originName: string;
    originCoords: { lat: number; lon: number };
    destName: string;
    destCoords: { lat: number; lon: number };
    departureTime: string;
    travelDate: string;
  }) => {
    setAnalyzingRoute(true);
    setDepartureComparison(null);
    try {
      const res = await routeService.analyzeRoute({
        origin_lat: params.originCoords.lat,
        origin_lon: params.originCoords.lon,
        destination_lat: params.destCoords.lat,
        destination_lon: params.destCoords.lon,
        origin_name: params.originName,
        destination_name: params.destName,
        departure_time: params.departureTime,
        travel_date: params.travelDate,
        language,
        user_id: profile?.user_id,
      });
      setRouteAnalysis(res);
    } catch (err) {
      console.error('[TravelPage] Error analyzing route:', err);
    } finally {
      setAnalyzingRoute(false);
    }
  };

  const handleCompareTimes = async (params: {
    originName: string;
    originCoords: { lat: number; lon: number };
    destName: string;
    destCoords: { lat: number; lon: number };
    travelDate: string;
  }) => {
    setAnalyzingRoute(true);
    try {
      const res = await routeService.compareDepartureTimes({
        origin_lat: params.originCoords.lat,
        origin_lon: params.originCoords.lon,
        destination_lat: params.destCoords.lat,
        destination_lon: params.destCoords.lon,
        origin_name: params.originName,
        destination_name: params.destName,
        travel_date: params.travelDate,
        language,
      });
      setDepartureComparison(res);
    } catch (err) {
      console.error('[TravelPage] Error comparing departure times:', err);
    } finally {
      setAnalyzingRoute(false);
    }
  };

  const labels = {
    title: language === 'mr' ? 'प्रवास व महामार्ग हवामान' : language === 'hi' ? 'यात्रा व हाईवे मौसम' : 'Travel & Highway Route Weather',
    subtitle: language === 'mr' ? 'हवामान जोखीम, धुके, पाऊस आणि सर्वोत्तम निघण्याची वेळ' : language === 'hi' ? 'मौसम जोखिम, कोहरा, बारिश और सर्वोत्तम प्रस्थान समय' : 'Weather Risk, Fog, Rain & Optimal Departure Time Intelligence',
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] p-4 sm:p-6 font-['Arimo'] max-w-4xl mx-auto space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-white text-slate-700 border border-slate-200 shadow-2xs hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Car className="w-6 h-6 text-[#004aad]" />
              <span>{labels.title}</span>
            </h2>
            <p className="text-xs text-slate-500 font-semibold">{labels.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Route Planning Section */}
      <RoutePlanningCard
        defaultOrigin={city}
        defaultOriginCoords={{ lat, lon }}
        onAnalyze={handleAnalyzeRoute}
        onCompareTimes={handleCompareTimes}
        loading={analyzingRoute}
      />

      {/* Route Analysis Results */}
      {routeAnalysis && (
        <RouteTimeline
          analysis={routeAnalysis}
          onSetAlert={() => setAlertModalOpen(true)}
          onAskGpt={onAskGpt}
        />
      )}

      {/* Departure Comparison Results */}
      {departureComparison && (
        <DepartureComparisonCard
          comparison={departureComparison}
          onSelectTime={(time) => {
            handleAnalyzeRoute({
              originName: departureComparison.origin,
              originCoords: { lat, lon },
              destName: departureComparison.destination,
              destCoords: { lat: 18.5204, lon: 73.8567 },
              departureTime: time,
              travelDate: new Date().toISOString().split('T')[0],
            });
          }}
        />
      )}

      {/* Route Alert Modal */}
      {routeAnalysis && (
        <RouteAlertModal
          isOpen={alertModalOpen}
          onClose={() => setAlertModalOpen(false)}
          originName={routeAnalysis.origin.name}
          destinationName={routeAnalysis.destination.name}
          userId={profile?.user_id}
        />
      )}
    </div>
  );
};

