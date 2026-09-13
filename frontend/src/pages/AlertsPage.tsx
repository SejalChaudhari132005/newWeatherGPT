import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from '../hooks/useLocation';
import { useAuthContext } from '../context/AuthContext';
import { alertService } from '../services/alertService';
import { fisherIntelligenceService } from '../services/fisherIntelligenceService';
import { CitizenAlert } from '../types/alert';
import { MarineDecisionData } from '../types/fisherIntelligence';
import { AlertDetailModal } from '../components/alerts/AlertDetailModal';
import {
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  RefreshCw,
  MapPin,
  Clock,
  History,
  Bell,
  CloudRain,
  Flame,
  Wind,
  Zap,
  Eye,
  AlertCircle,
  ArrowRight,
  Sprout,
  Bug,
  Droplets,
  MessageSquare,
  Anchor,
  Compass,
  Waves,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useWeather } from '../context/WeatherContext';
import { translatePhrase } from '../utils/dashboardTranslator';
import { MarineEmergencyCard } from '../components/roles/fisher/MarineEmergencyCard';
import { useRealtimeWeather } from '../hooks/useRealtimeWeather';
import { RealtimeStatusIndicator } from '../components/realtime/RealtimeStatusIndicator';
import { RealtimeWeatherEvent } from '../types/realtime';

interface AlertsPageProps {
  onOpenChatWithPrompt?: (prompt: string) => void;
  onOpenRealtimeControl?: () => void;
}

export interface CoastalHarborOption {
  name: string;
  lat: number;
  lon: number;
  state: string;
  region: string;
}

export const INDIAN_COASTAL_HARBORS: CoastalHarborOption[] = [
  { name: 'Sassoon Docks (Mumbai)', lat: 18.913, lon: 72.825, state: 'Maharashtra', region: 'Konkan Coast' },
  { name: 'Versova Harbor (Mumbai)', lat: 19.135, lon: 72.812, state: 'Maharashtra', region: 'North Konkan' },
  { name: 'Mirkarwada (Ratnagiri)', lat: 16.985, lon: 73.284, state: 'Maharashtra', region: 'South Konkan' },
  { name: 'Malpe Port (Udupi)', lat: 13.348, lon: 74.698, state: 'Karnataka', region: 'Canara Coast' },
  { name: 'Mangalore Old Port', lat: 12.868, lon: 74.838, state: 'Karnataka', region: 'Canara Coast' },
  { name: 'Kochi Fishing Harbor (Cochin)', lat: 9.948, lon: 76.257, state: 'Kerala', region: 'Malabar Coast' },
  { name: 'Kasimedu Harbor (Chennai)', lat: 13.125, lon: 80.298, state: 'Tamil Nadu', region: 'Coromandel Coast' },
  { name: 'Visakhapatnam Harbor', lat: 17.695, lon: 83.298, state: 'Andhra Pradesh', region: 'Andhra Coast' },
  { name: 'Porbandar Port', lat: 21.642, lon: 69.609, state: 'Gujarat', region: 'Saurashtra Coast' },
  { name: 'Veraval Harbor', lat: 20.900, lon: 70.360, state: 'Gujarat', region: 'Saurashtra Coast' },
  { name: 'Paradip Harbor', lat: 20.265, lon: 86.671, state: 'Odisha', region: 'Utkal Coast' },
];

export const AlertsPage: React.FC<AlertsPageProps> = ({ onOpenChatWithPrompt, onOpenRealtimeControl }) => {
  const { location } = useLocation();
  const { profile } = useAuthContext();
  const { language } = useLanguage();
  const { activeRole } = useWeather();

  const isFarmer = (profile?.role || activeRole || '').toLowerCase() === 'farmer';
  const isFisher =
    (profile?.role || activeRole || '').toLowerCase() === 'fisher' ||
    (profile?.role || activeRole || '').toLowerCase() === 'fisherman';

  const userRoleKey = isFisher ? 'fisherman' : isFarmer ? 'farmer' : (profile?.role || activeRole || 'citizen').toLowerCase();

  // Real-time WebSocket hook
  const { status: realtimeStatus, latestEvent } = useRealtimeWeather({
    role: userRoleKey,
    autoConnect: true,
  });

  const [activeAlerts, setActiveAlerts] = useState<CitizenAlert[]>([]);
  const [historyAlerts, setHistoryAlerts] = useState<CitizenAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedAlert, setSelectedAlert] = useState<CitizenAlert | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'rain' | 'spray' | 'pest' | 'history'>('all');

  // Chosen Coastal Area State for Fishermen
  const [selectedHarbor, setSelectedHarbor] = useState<CoastalHarborOption>(INDIAN_COASTAL_HARBORS[0]);
  const [marineData, setMarineData] = useState<MarineDecisionData | null>(null);
  const [marineLoading, setMarineLoading] = useState<boolean>(false);

  const userId = profile?.user_id || 'anonymous';
  const lat = location?.latitude || profile?.latitude || 19.2437;
  const lon = location?.longitude || profile?.longitude || 73.1355;
  const city = location?.city || profile?.city || 'Kalyan-Dombivli';
  const district = location?.district || city;
  const state = location?.state || profile?.state || 'Maharashtra';

  // Listen to WebSocket pushed alerts and prepend dynamically without page refresh
  useEffect(() => {
    if (!latestEvent) return;

    const alertEventTypes = ['WEATHER_ALERT', 'MARINE_WARNING', 'AVIATION_ALERT', 'AGRICULTURE_ALERT'];
    if (alertEventTypes.includes(latestEvent.eventType)) {
      const severityMap: Record<string, any> = {
        RED: 'EMERGENCY',
        ORANGE: 'SEVERE',
        YELLOW: 'WARNING',
        GREEN: 'INFORMATIONAL',
        INFO: 'INFORMATIONAL',
      };

      const mappedAlert: CitizenAlert = {
        id: latestEvent.eventId,
        fingerprint: latestEvent.eventId,
        title: latestEvent.title,
        description: latestEvent.message,
        severity: severityMap[latestEvent.severity] || 'WARNING',
        type: latestEvent.eventType,
        location_name: latestEvent.location?.name || city,
        district: latestEvent.location?.district || district,
        state: latestEvent.location?.state || state,
        latitude: latestEvent.location?.lat || lat,
        longitude: latestEvent.location?.lon || lon,
        created_at: latestEvent.timestamp,
        valid_from: latestEvent.validFrom || latestEvent.timestamp,
        valid_until: latestEvent.validUntil || new Date(Date.now() + 86400000).toISOString(),
        source: latestEvent.is_demo ? 'DEMO_STREAM' : latestEvent.source || 'IMD_NOWCAST',
        what_to_avoid: latestEvent.data?.what_to_avoid || [
          latestEvent.is_demo ? '[DEMO REAL-TIME EVENT] Simulated emergency response drill' : 'Avoid unnecessary outdoor transit during active warning window.'
        ],
        is_active: true,
        is_read: false,
        recommended_actions: latestEvent.data?.recommended_actions || [
          'Follow IMD district disaster management guidance immediately.',
          'Secure critical equipment and stay tuned to local emergency broadcast.'
        ],
      };

      setActiveAlerts((prev) => {
        if (prev.some((a) => a.id === mappedAlert.id)) return prev;
        return [mappedAlert, ...prev];
      });
    }
  }, [latestEvent, city, district, state, lat, lon]);

  // Load General Alerts
  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const curRes = await alertService.getCurrentAlerts(
        lat,
        lon,
        city,
        district,
        state,
        userId,
        language
      );
      setActiveAlerts(curRes.alerts || []);

      const hist = await alertService.getAlertHistory(lat, lon, city, userId, 20);
      setHistoryAlerts(hist || []);
    } catch (err) {
      console.error('[AlertsPage] Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load Marine Decisions for chosen coastal area
  const fetchMarineDecisions = useCallback(async (harbor: CoastalHarborOption) => {
    setMarineLoading(true);
    try {
      const data = await fisherIntelligenceService.getMarineDecisions({
        latitude: harbor.lat,
        longitude: harbor.lon,
        departureTime: '05:30 AM',
      });
      setMarineData(data);
    } catch (err) {
      console.error('[AlertsPage] Failed to fetch marine decisions:', err);
    } finally {
      setMarineLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [lat, lon, city, language]);

  useEffect(() => {
    if (isFisher) {
      fetchMarineDecisions(selectedHarbor);
    }
  }, [isFisher, selectedHarbor, fetchMarineDecisions]);

  const handleMarkRead = async (alertId: string) => {
    await alertService.markAlertAsRead(alertId, userId);
    setActiveAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a))
    );
    setHistoryAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a))
    );
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'EMERGENCY':
        return {
          borderAccent: 'border-l-4 border-l-[#B42318]',
          badgeClass: 'gov-badge-danger',
          iconBg: 'bg-red-50 text-[#B42318] border border-red-200',
          actionBtn: 'gov-btn-danger',
          boxBg: 'bg-red-50/70 border-red-200 text-red-950',
          label: translatePhrase('emergency', language) || 'EMERGENCY',
        };
      case 'SEVERE':
        return {
          borderAccent: 'border-l-4 border-l-[#B42318]',
          badgeClass: 'gov-badge-danger',
          iconBg: 'bg-red-50 text-[#B42318] border border-red-200',
          actionBtn: 'gov-btn-danger',
          boxBg: 'bg-red-50/70 border-red-200 text-red-950',
          label: translatePhrase('severe', language) || 'SEVERE',
        };
      case 'WARNING':
        return {
          borderAccent: 'border-l-4 border-l-[#B7791F]',
          badgeClass: 'gov-badge-warning',
          iconBg: 'bg-amber-50 text-[#B7791F] border border-amber-200',
          actionBtn: 'gov-btn-secondary',
          boxBg: 'bg-amber-50/70 border-amber-200 text-amber-950',
          label: translatePhrase('warning', language) || 'WARNING',
        };
      case 'WATCH':
        return {
          borderAccent: 'border-l-4 border-l-[#1D5F91]',
          badgeClass: 'gov-badge-info',
          iconBg: 'bg-blue-50 text-[#1D5F91] border border-blue-200',
          actionBtn: 'gov-btn-secondary',
          boxBg: 'bg-blue-50/70 border-blue-200 text-blue-950',
          label: translatePhrase('watch', language) || 'WATCH',
        };
      case 'ADVISORY':
        return {
          borderAccent: 'border-l-4 border-l-[#006B3C]',
          badgeClass: 'gov-badge-success',
          iconBg: 'bg-emerald-50 text-[#006B3C] border border-emerald-200',
          actionBtn: 'gov-btn-secondary',
          boxBg: 'bg-emerald-50/70 border-emerald-200 text-emerald-950',
          label: translatePhrase('advisory', language) || 'ADVISORY',
        };
      default:
        return {
          borderAccent: 'border-l-4 border-l-[#5B6770]',
          badgeClass: 'gov-badge-neutral',
          iconBg: 'bg-slate-50 text-[#5B6770] border border-slate-200',
          actionBtn: 'gov-btn-secondary',
          boxBg: 'bg-slate-50 border-slate-200 text-slate-900',
          label: translatePhrase('info', language) || 'INFO',
        };
    }
  };

  const getAlertIcon = (type: string) => {
    const t = (type || '').toUpperCase();
    if (t.includes('RAIN') || t.includes('FLOOD')) return <CloudRain className="w-4 h-4 shrink-0" />;
    if (t.includes('HEAT') || t.includes('TEMPERATURE')) return <Flame className="w-4 h-4 shrink-0" />;
    if (t.includes('WIND') || t.includes('CYCLONE') || t.includes('SQUALL')) return <Wind className="w-4 h-4 shrink-0" />;
    if (t.includes('FOG') || t.includes('VISIBILITY')) return <Eye className="w-4 h-4 shrink-0" />;
    if (t.includes('WAVE') || t.includes('TIDE')) return <Waves className="w-4 h-4 shrink-0" />;
    return <AlertTriangle className="w-4 h-4 shrink-0" />;
  };

  const formatTimestamp = (ts?: string) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return (
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
        ', ' +
        d.toLocaleDateString([], { month: 'short', day: 'numeric' })
      );
    } catch {
      return ts;
    }
  };

  const handleAskAI = (alertTitle: string, alertDesc: string) => {
    if (onOpenChatWithPrompt) {
      if (isFisher) {
        const prompt =
          language === 'mr'
            ? `सागरी चेतावणी: "${alertTitle}" (${selectedHarbor.name}) - ${alertDesc}. या स्थितीत मासेमारी नौकांसाठी काय सुरक्षितता बाळगावी आणि परतीची सुरक्षित वेळ कोणती?`
            : language === 'hi'
            ? `समुद्री चेतावनी: "${alertTitle}" (${selectedHarbor.name}) - ${alertDesc}. इस स्थिति में मत्स्य नौकाओं के लिए क्या सुरक्षा उपाय और सुरक्षित वापसी समय है?`
            : `Marine Warning: "${alertTitle}" (${selectedHarbor.name}) - ${alertDesc}. What safety measures should fishing vessels observe and what is the safe return window?`;
        onOpenChatWithPrompt(prompt);
      } else {
        const prompt =
          language === 'mr'
            ? `चेतावणी: "${alertTitle}" - ${alertDesc} यावर माझ्या पिकासाठी काय खबरदारी घ्यावी व काय उपाय करावेत?`
            : language === 'hi'
            ? `चेतावनी: "${alertTitle}" - ${alertDesc} इस स्थिति में मेरी फसल के लिए क्या सावधानी और उपाय करने चाहिए?`
            : `Alert: "${alertTitle}" - ${alertDesc}. What precautions and remedial actions should I take for my farm and crops right now?`;
        onOpenChatWithPrompt(prompt);
      }
    }
  };

  /**
   * Generates grounded coastal and marine warning bulletins based on:
   * 1. The Chosen Coastal Harbor / Port Area
   * 2. IMD / INCOIS criteria document (Wave Height Hs, Wind knots, Beaufort scale, Sandbar Draft, Squalls)
   */
  const getGroundedMarineAlerts = (): CitizenAlert[] => {
    const harborName = selectedHarbor.name;
    const waveHeight = marineData?.sea_state?.wave_height_m ?? 1.2;
    const windSpeedKts = marineData?.sailing_clearance?.max_wind_speed_kts ?? 13.0;
    const clearanceStatus = marineData?.sailing_clearance?.status ?? 'favorable';
    const clearanceWindow = marineData?.sailing_clearance?.clearance_window ?? '05:00 AM - 11:30 AM';
    const beaufortDesc = marineData?.sea_state?.beaufort_description ?? 'Gentle Breeze';
    const squallRisk = marineData?.sailing_clearance?.squall_risk ?? false;
    const returnTime = marineData?.return_time_intelligence?.recommended_return_time ?? '11:00 AM';
    const cutoffHour = marineData?.return_time_intelligence?.cutoff_hour ?? '11:30 AM';
    const deterReason = marineData?.return_time_intelligence?.deterioration_reason ?? 'Wind and swell build moderately after noon.';

    // Evaluate Wave Severity as per INCOIS / IMD Document
    let waveSeverity: 'ADVISORY' | 'WARNING' | 'SEVERE' = 'ADVISORY';
    if (waveHeight > 2.5 || windSpeedKts > 24.0) {
      waveSeverity = 'SEVERE';
    } else if (waveHeight >= 1.4 || windSpeedKts >= 16.0) {
      waveSeverity = 'WARNING';
    }

    const alerts: CitizenAlert[] = [
      // 1. INCOIS & IMD High Wave & Coastal Wind Warning
      {
        id: `marine-wave-${selectedHarbor.lat}-${selectedHarbor.lon}`,
        fingerprint: `wave-${selectedHarbor.name}`,
        title:
          language === 'mr'
            ? `${harborName}: लाटा व सागरी वाऱ्याचा इशारा (INCOIS / IMD)`
            : language === 'hi'
            ? `${harborName}: उच्च लहर व तटीय वायु चेतावनी (INCOIS / IMD)`
            : `${harborName}: Coastal Wave & Wind Safety Warning (INCOIS / IMD)`,
        description:
          language === 'mr'
            ? `${harborName} बंदराच्या हद्दीत लक्षणीय लाटांची उंची ${waveHeight.toFixed(1)}m असून वाऱ्याचा वेग ${windSpeedKts.toFixed(1)} नॉट्स (${beaufortDesc}) नोंदवला गेला आहे. ${
                clearanceStatus === 'no_departure'
                  ? 'समुद्र अत्यंत खवळलेला असून नौका समुद्रात नेण्यास सक्त मनाई आहे (Harbor Bound).'
                  : clearanceStatus === 'caution'
                  ? 'फक्त मोटारीयुक्त यांत्रिक नौकांना सावधगिरीने प्रवासाची मुभा आहे. लहान बिगर-यांत्रिक होड्यांनी खोल समुद्रात जाणे टाळावे.'
                  : 'सागरी स्थिती सर्वसामान्य असून सर्व मासेमारी नौकांसाठी नौकानयन सुरक्षित आहे.'
              }`
            : language === 'hi'
            ? `${harborName} बंदर क्षेत्र में सार्थक लहरों की ऊंचाई ${waveHeight.toFixed(1)}m और हवा की गति ${windSpeedKts.toFixed(1)} नॉट्स (${beaufortDesc}) दर्ज है। ${
                clearanceStatus === 'no_departure'
                  ? 'समुद्र अत्यधिक अशांत है, नौकाओं का प्रस्थान पूर्णतः प्रतिबंधित है (Harbor Bound)।'
                  : clearanceStatus === 'caution'
                  ? 'केवल मोटरयुक्त यांत्रिक नौकाओं को सतर्कता के साथ जाने की अनुमति है। छोटी नावें गहरे समुद्र में न जाएं।'
                  : 'समुद्री स्थिति सामान्य है और सभी मत्स्य नौकाओं के लिए नौवहन अनुकूल है।'
              }`
            : `Significant wave height observed at ${waveHeight.toFixed(1)}m with coastal winds at ${windSpeedKts.toFixed(1)} kts (${beaufortDesc}) off ${harborName}. ${
                clearanceStatus === 'no_departure'
                  ? 'Severe sea state: STRICT NO DEPARTURE (Harbor Bound) enforced due to high breaker danger.'
                  : clearanceStatus === 'caution'
                  ? 'CAUTION: Mechanized motorized boats permitted with VHF radio. Country crafts avoid deep waters.'
                  : 'FAVORABLE: Sea state within safe navigation limits for all registered fishing craft.'
              }`,
        severity: waveSeverity,
        type: 'WIND',
        location_name: harborName,
        district: selectedHarbor.region,
        state: selectedHarbor.state,
        latitude: selectedHarbor.lat,
        longitude: selectedHarbor.lon,
        created_at: new Date().toISOString(),
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 86400000).toISOString(),
        source: 'INCOIS Marine Hydrodynamics & IMD Decision Fusion',
        what_to_avoid: [
          language === 'mr'
            ? 'लाटांच्या मुखाजवळ आणि वाळूच्या पट्ट्यांजवळ अचानक उसळणाऱ्या लाटांमध्ये जाणे टाळा.'
            : language === 'hi'
            ? 'रेत के टीलों और बंदरगाह के मुहाने पर ऊंची लहरों में जाने से बचें।'
            : 'Avoid traversing breaking shoals near the harbor mouth during high swell transitions.',
        ],
        is_active: true,
        is_read: false,
        recommended_actions: [
          language === 'mr'
            ? `VHF रेडिओ चॅनल १६ सुरू ठेवा, लाइफ जॅकेट्स तपासा आणि प्रवासाची विंडो (${clearanceWindow}) पाळा.`
            : language === 'hi'
            ? `VHF रेडियो चैनल 16 चालू रखें, लाइफ जैकेट पहनें और प्रस्थान विंडो (${clearanceWindow}) का पालन करें।`
            : `Maintain continuous VHF Ch-16 watch, verify life-saving gear, and operate within clearance window: ${clearanceWindow}.`,
        ],
      },

      // 2. Tidal Navigation & Harbor Draft Clearance Advisory
      {
        id: `marine-tide-${selectedHarbor.lat}-${selectedHarbor.lon}`,
        fingerprint: `tide-${selectedHarbor.name}`,
        title:
          language === 'mr'
            ? `${harborName}: भरती-ओहोटी व चॅनेल मसुदा (Draft) इशारा`
            : language === 'hi'
            ? `${harborName}: ज्वार-भाटा व चैनल ड्राफ्ट चेतावनी`
            : `${harborName}: Tidal Navigation & Channel Draft Clearance Advisory`,
        description:
          language === 'mr'
            ? `${harborName} बंदराच्या प्रवेशद्वारावर आणि खाडी पट्ट्यात ओहोटीच्या काळात पाण्याची खोली कमी होण्याची शक्यता आहे. वाळूच्या पट्ट्यावर नौकेचा तळ लागू नये म्हणून किमान २.० मीटर ड्राफ्ट क्लिअरन्स राखा.`
            : language === 'hi'
            ? `${harborName} बंदरगाह के प्रवेश द्वार पर भाटे के दौरान पानी की गहराई कम हो सकती है। रेत के टीलों पर नौका के तल को टकराने से बचाने के लिए न्यूनतम 2.0 मीटर ड्राफ्ट क्लीयरेंस बनाए रखें।`
            : `Semi-diurnal tidal swing at ${harborName}. Maintain minimum 2.0m under-keel clearance when crossing harbor mouth sandbars during low tide transitions.`,
        severity: 'ADVISORY',
        type: 'TIDE',
        location_name: harborName,
        district: selectedHarbor.region,
        state: selectedHarbor.state,
        latitude: selectedHarbor.lat,
        longitude: selectedHarbor.lon,
        created_at: new Date().toISOString(),
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 86400000).toISOString(),
        source: 'IMD Hydrographic Survey & Tide Extrema Model',
        what_to_avoid: [
          language === 'mr'
            ? 'ओहोटीच्या सर्वोच्च काळात अरुंद खाडीतून भरधाव वेगाने नौका चालवणे टाळा.'
            : language === 'hi'
            ? 'भाटे के समय संकरे चैनल से तेज गति में नौका निकालना वर्जित है।'
            : 'Do not negotiate shallow harbor channels during lowest astronomical ebb.',
        ],
        is_active: true,
        is_read: false,
        recommended_actions: [
          language === 'mr'
            ? 'इको-साउंडरच्या साहाय्याने खोली तपासा आणि भरतीच्या वेळेनुसार बंदरात प्रवेशाचे नियोजन करा.'
            : language === 'hi'
            ? 'इको साउंडर से गहराई जांचें और ज्वार के समय के अनुसार बंदरगाह में प्रवेश की योजना बनाएं।'
            : 'Monitor echo-sounder depth gauges and synchronize return with flood tide windows.',
        ],
      },

      // 3. Offshore Squall & Fishermen Safety Watch (> 15-20 NM)
      {
        id: `marine-squall-${selectedHarbor.lat}-${selectedHarbor.lon}`,
        fingerprint: `squall-${selectedHarbor.name}`,
        title:
          language === 'mr'
            ? `${harborName}: खोल समुद्रातील वादळी वारे व स्क्वॉल इशारा (> १५ NM)`
            : language === 'hi'
            ? `${harborName}: गहरे समुद्र में आंधी-तूफान व स्क्वॉल निगरानी (> 15 NM)`
            : `${harborName}: Offshore Squall Watch & Deep-Sea Safety (> 15 NM)`,
        description:
          language === 'mr'
            ? `${harborName} पासून १५ नॉटिकल मैलांपलीकडील खोल सागरी क्षेत्रात वाऱ्याचा वेग तात्पुरता २०-२४ नॉट्सपर्यंत वाढण्याची शक्यता आहे. लहान होड्यांनी ५ मैलांच्या किनारी पट्ट्यातच मासेमारी करावी.`
            : language === 'hi'
            ? `${harborName} से 15 समुद्री मील से आगे गहरे समुद्र में हवा की गति अचानक 20-24 नॉट्स तक पहुंचने की संभावना है। छोटी नावें 5 मील के तटीय क्षेत्र में ही सीमित रहें।`
            : `Offshore fishing quadrants past 15 nautical miles of ${harborName} subject to sudden squall gusts reaching 20-24 kts. Non-mechanized craft restricted to Near-Shore tier (0-5 NM).`,
        severity: squallRisk ? 'WARNING' : 'WATCH',
        type: 'SQUALL',
        location_name: `${harborName} Offshore`,
        district: selectedHarbor.region,
        state: selectedHarbor.state,
        latitude: selectedHarbor.lat,
        longitude: selectedHarbor.lon,
        created_at: new Date().toISOString(),
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 86400000).toISOString(),
        source: 'Indian Coast Guard & IMD Marine Squall Radar',
        what_to_avoid: [
          language === 'mr'
            ? 'खराब हवामानात एकट्याने खोल समुद्रात जाणे किंवा जीपीएस व वायरलेस शिवाय प्रवास टाळा.'
            : language === 'hi'
            ? 'बिना जीपीएस और वायरलेस के अकेले गहरे समुद्र में जाना टालें।'
            : 'Do not venture into deep-sea zones without dual-frequency VHF and GPS distress beacon.',
        ],
        is_active: true,
        is_read: false,
        recommended_actions: [
          language === 'mr'
            ? 'भारतीय तटरक्षक दल आपत्कालीन SOS १५५४ व सागरी पोलीस १०९३ संपर्क लक्षात ठेवा.'
            : language === 'hi'
            ? 'भारतीय तटरक्षक बल आपातकालीन SOS 1554 और समुद्री पुलिस 1093 संपर्क तैयार रखें।'
            : 'Verify Coast Guard SOS Helpline 1554 and Marine Police 1093 before unmooring.',
        ],
      },

      // 4. Return-Time Cutoff & Deterioration Advisory
      {
        id: `marine-return-${selectedHarbor.lat}-${selectedHarbor.lon}`,
        fingerprint: `return-${selectedHarbor.name}`,
        title:
          language === 'mr'
            ? `${harborName}: बंदरावर सुरक्षित परतीची वेळ (Return Cutoff: ${cutoffHour})`
            : language === 'hi'
            ? `${harborName}: बंदरगाह वापसी समय सीमा (Return Cutoff: ${cutoffHour})`
            : `${harborName}: Safe Harbor Return Time Analysis (Cutoff: ${cutoffHour})`,
        description:
          language === 'mr'
            ? `शिफारस केलेली परतीची वेळ: ${returnTime} (अंतिम कटऑफ: ${cutoffHour}). ${deterReason}`
            : language === 'hi'
            ? `अनुशंसित वापसी समय: ${returnTime} (अंतिम कटऑफ: ${cutoffHour})। ${deterReason}`
            : `Recommended Return Time: ${returnTime} (Strict Cutoff: ${cutoffHour}). ${deterReason}`,
        severity: 'ADVISORY',
        type: 'RETURN_CUTOFF',
        location_name: harborName,
        district: selectedHarbor.region,
        state: selectedHarbor.state,
        latitude: selectedHarbor.lat,
        longitude: selectedHarbor.lon,
        created_at: new Date().toISOString(),
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 86400000).toISOString(),
        source: 'WeatherGPT Temporal Marine Deterioration Model',
        what_to_avoid: [
          language === 'mr'
            ? 'दुपारनंतर वाढणाऱ्या उसळत्या लाटांमध्ये समुद्रात जास्त वेळ थांबणे टाळा.'
            : language === 'hi'
            ? 'दोपहर बाद बढ़ती अशांत लहरों में अधिक देर तक समुद्र में न रुकें।'
            : 'Do not extend offshore stays past the recommended afternoon cutoff hour.',
        ],
        is_active: true,
        is_read: false,
        recommended_actions: [
          language === 'mr'
            ? `${cutoffHour} च्या आत बंदरात परतण्यासाठी जाळे ओढण्याची तयारी वेळेवर पूर्ण करा.`
            : language === 'hi'
            ? `${cutoffHour} से पहले बंदरगाह लौटने के लिए जाल समेटने का काम समय पर पूरा करें।`
            : `Begin hauling nets 90 minutes prior to ${cutoffHour} to ensure smooth harbor return.`,
        ],
      },
    ];

    return alerts;
  };

  const isAgriAlert = (a: CitizenAlert) => {
    const t = (a.type || '').toUpperCase();
    const title = (a.title || '').toUpperCase();
    const desc = (a.description || '').toUpperCase();
    return (
      t.includes('SPRAY') ||
      t.includes('PEST') ||
      t.includes('DISEASE') ||
      t.includes('FUNGAL') ||
      t.includes('CROP') ||
      t.includes('AGRICULTURE') ||
      t.includes('SOIL') ||
      t.includes('IRRIGAT') ||
      title.includes('SPRAY') ||
      title.includes('PEST') ||
      title.includes('CROP') ||
      title.includes('पिका') ||
      title.includes('फसल') ||
      desc.includes('पिका') ||
      desc.includes('फसल')
    );
  };

  const rawAlertsList = isFisher ? getGroundedMarineAlerts() : activeAlerts;

  const filteredAlerts = rawAlertsList.filter((a) => {
    if (!isFarmer && !isFisher && isAgriAlert(a)) return false;
    if (filterTab === 'all' || filterTab === 'active') return true;
    const t = (a.type || '').toUpperCase();
    if (isFisher) {
      if (filterTab === 'rain' || filterTab === 'spray') return t.includes('WIND') || t.includes('SQUALL') || t.includes('WAVE') || t.includes('TIDE');
      if (filterTab === 'pest') return t.includes('TIDE') || t.includes('DRAFT');
    }
    if (filterTab === 'rain') return t.includes('RAIN') || t.includes('FLOOD') || t.includes('PRECIPITATION');
    if (filterTab === 'spray') return t.includes('SPRAY') || t.includes('WIND') || t.includes('HEAT');
    if (filterTab === 'pest') return t.includes('PEST') || t.includes('DISEASE') || t.includes('FUNGAL');
    return true;
  });

  return (
    <div className="space-y-3.5 max-w-4xl mx-auto px-3 sm:px-4 py-2 font-sans pb-28">
      {/* 0. Coastal Emergency Broadcast & SOS Hotlines (For Fisheries) */}
      {isFisher && (
        <MarineEmergencyCard
          officialBulletin={
            marineData?.official_bulletin ||
            `INCOIS / IMD Marine Advisory for ${selectedHarbor.name}: Wave height ${
              marineData?.sea_state?.wave_height_m ?? 1.2
            }m, Wind ${marineData?.sailing_clearance?.max_wind_speed_kts ?? 13} kts. Regular seasonal conditions.`
          }
          sosContact={marineData?.sos_emergency_contact || 'Indian Coast Guard SOS: 1554 | Marine Police: 1093'}
        />
      )}

      {/* 0B. Coastal Area / Harbor Selection Control (Crucial for Marine Warnings) */}
      {isFisher && (
        <div className="gov-panel p-3 bg-gradient-to-r from-[#F0FDF4] to-[#F8FAFC] border border-[#B7E4C7]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-none bg-[#006B3C] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Anchor className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-wider uppercase text-[#006B3C]">
                  {language === 'mr' ? 'निवडलेले सागरी बंदर व किनारी क्षेत्र' : language === 'hi' ? 'चयनित समुद्री बंदरगाह व तटीय क्षेत्र' : 'Selected Coastal Harbor & Sea Sector'}
                </div>
                <div className="text-xs font-bold text-[#17365D]">
                  {selectedHarbor.name} ({selectedHarbor.state})
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-[#1F2933] shrink-0">
                {language === 'mr' ? 'बंदर बदला:' : language === 'hi' ? 'बंदरगाह बदलें:' : 'Switch Harbor:'}
              </label>
              <select
                value={selectedHarbor.name}
                onChange={(e) => {
                  const h = INDIAN_COASTAL_HARBORS.find((item) => item.name === e.target.value);
                  if (h) setSelectedHarbor(h);
                }}
                className="gov-select text-xs font-bold text-[#17365D] bg-white border border-[#D6DCE1] px-2.5 py-1.5 rounded-none cursor-pointer focus:outline-none focus:border-[#006B3C]"
              >
                {INDIAN_COASTAL_HARBORS.map((h) => (
                  <option key={h.name} value={h.name}>
                    {h.name} - {h.state}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Hydrodynamic Summary for Selected Harbor */}
          <div className="mt-2.5 pt-2 border-t border-[#D6DCE1]/60 flex flex-wrap items-center gap-2 text-[11px] text-[#1F2933]">
            <span className="inline-flex items-center gap-1 font-bold text-[#17365D]">
              <Compass className="w-3 h-3 text-[#FF9933]" />
              <span>{selectedHarbor.lat.toFixed(3)}°N, {selectedHarbor.lon.toFixed(3)}°E</span>
            </span>
            <span className="text-[#98A2B3]">•</span>
            <span>
              <strong>{language === 'mr' ? 'लाटा:' : language === 'hi' ? 'लहरें:' : 'Waves:'}</strong>{' '}
              {marineData?.sea_state?.wave_height_m?.toFixed(1) || '1.2'} m
            </span>
            <span className="text-[#98A2B3]">•</span>
            <span>
              <strong>{language === 'mr' ? 'वारा:' : language === 'hi' ? 'हवा:' : 'Wind:'}</strong>{' '}
              {marineData?.sailing_clearance?.max_wind_speed_kts?.toFixed(1) || '13.0'} kts
            </span>
            <span className="text-[#98A2B3]">•</span>
            <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase ${
              marineData?.sailing_clearance?.status === 'favorable'
                ? 'bg-[#EBF7EE] text-[#006B3C] border border-[#B7E4C7]'
                : marineData?.sailing_clearance?.status === 'caution'
                ? 'bg-[#FEF6EE] text-[#B7791F] border border-[#F9DBAF]'
                : 'bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]'
            }`}>
              {marineData?.sailing_clearance?.status === 'favorable'
                ? 'Safe to Sail'
                : marineData?.sailing_clearance?.status === 'caution'
                ? 'Caution (Motorized Only)'
                : 'Harbor Bound'}
            </span>
            {marineLoading && (
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-[#006B3C] animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Syncing IMD Marine API...</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* 1. Official National Weather & Early Warning Bulletin Header */}
      <div className="gov-panel">
        <div className="h-1 bg-gradient-to-r from-[#FF9933] via-white to-[#006B3C]" />
        <div className="p-3.5 sm:p-4 space-y-2">
          <div className="flex items-center justify-between gap-2 border-b border-[#D6DCE1] pb-2">
            <div className="flex items-center gap-2">
              <span className="gov-badge gov-badge-danger flex items-center gap-1 text-[10px]">
                <ShieldAlert className="w-3 h-3" />
                <span>{translatePhrase('liveEarlyWarning', language) || 'EARLY WARNING BULLETIN'}</span>
              </span>
              <span className="text-[11px] text-[#5B6770] font-semibold hidden sm:inline">
                {isFisher ? 'Coastal Maritime Telemetry' : 'National Weather & Disaster Information'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <RealtimeStatusIndicator
                status={realtimeStatus}
                onClick={onOpenRealtimeControl}
              />
              <button
                onClick={() => {
                  fetchAlerts();
                  if (isFisher) fetchMarineDecisions(selectedHarbor);
                }}
                disabled={loading || marineLoading}
                className="gov-btn-secondary px-2.5 py-1 text-[11px] flex items-center gap-1.5 shrink-0 cursor-pointer"
                title="Refresh Warnings"
              >
                <RefreshCw className={`w-3 h-3 ${loading || marineLoading ? 'animate-spin text-[#006B3C]' : 'text-[#1F2933]'}`} />
                <span>{translatePhrase('refreshWarnings', language) || 'Refresh'}</span>
              </button>
            </div>
          </div>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#17365D] uppercase tracking-wide">
              {isFisher
                ? (language === 'mr' ? 'सागरी हवामान व किनारी सुरक्षा चेतावणी बुलेटिन' : language === 'hi' ? 'समुद्री मौसम व तटीय सुरक्षा चेतावनी बुलेटिन' : 'COASTAL & MARINE WEATHER WARNING BULLETINS')
                : isFarmer
                ? (translatePhrase('farmAlertsTitle', language) || 'Meteorological & Agricultural Warning Bulletins')
                : 'Meteorological Hazard & Weather Warning Bulletins'}
            </h1>
            <p className="text-xs text-[#5B6770] pt-0.5">
              {isFisher
                ? (language === 'mr' ? `निवडलेले बंदर: ${selectedHarbor.name} - मासेमारी नौका, लाटांची उंची आणि वाऱ्याच्या वेगासाठी अधिकृत चेतावणी` : language === 'hi' ? `चयनित बंदरगाह: ${selectedHarbor.name} - मत्स्य नौकाओं, लहरों की ऊंचाई और हवा की गति हेतु आधिकारिक चेतावनी` : `Chosen Harbor: ${selectedHarbor.name} - Official marine advisories for vessel safety, wave heights, and sea conditions`)
                : isFarmer
                ? (translatePhrase('farmAlertsSubtitle', language) || 'Official localized advisories issued for crop protection and disaster mitigation')
                : 'Official localized alerts issued for public safety and disaster mitigation'}
            </p>
          </div>

          <div className="pt-1 flex items-center gap-1.5 text-xs text-[#1F2933] font-medium bg-[#F8FAFC] p-2 border border-[#D6DCE1]">
            <MapPin className="w-3.5 h-3.5 text-[#FF9933] shrink-0" />
            <span className="truncate">
              {isFisher
                ? (language === 'mr' ? 'लक्ष्य किनारी बंदर:' : language === 'hi' ? 'लक्षित तटीय बंदरगाह:' : 'Monitored Coastal Harbor:')
                : (translatePhrase('monitoredLocation', language) || 'Monitored Jurisdiction:')}{' '}
              <strong className="font-bold text-[#17365D]">
                {isFisher ? `${selectedHarbor.name}, ${selectedHarbor.state}` : `${city}, ${district !== city ? `${district}, ` : ''}${state}`}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Government Tab Bar */}
      <div className="flex items-center gap-1 p-1 bg-white border border-[#D6DCE1] rounded-none overflow-x-auto no-scrollbar">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            filterTab === 'all'
              ? 'bg-[#17365D] text-white border-[#17365D]'
              : 'bg-white text-[#1F2933] border-transparent hover:bg-[#F5F7F9]'
          }`}
        >
          {isFisher ? 'All Marine Bulletins' : translatePhrase('all', language) || 'All Bulletins'} ({filteredAlerts.length})
        </button>
        <button
          onClick={() => setFilterTab('active')}
          className={`px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            filterTab === 'active'
              ? 'bg-[#17365D] text-white border-[#17365D]'
              : 'bg-white text-[#1F2933] border-transparent hover:bg-[#F5F7F9]'
          }`}
        >
          <span>{translatePhrase('activeNow', language) || 'Active Warnings'}</span>
          {filteredAlerts.length > 0 && (
            <span className="w-2 h-2 rounded-none bg-[#B42318]" />
          )}
        </button>
        {isFisher ? (
          <>
            <button
              onClick={() => setFilterTab('rain')}
              className={`px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
                filterTab === 'rain'
                  ? 'bg-[#17365D] text-white border-[#17365D]'
                  : 'bg-white text-[#1F2933] border-transparent hover:bg-[#F5F7F9]'
              }`}
            >
              <Wind className="w-3.5 h-3.5 text-[#1D5F91]" />
              <span>Waves & Swell</span>
            </button>
            <button
              onClick={() => setFilterTab('pest')}
              className={`px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
                filterTab === 'pest'
                  ? 'bg-[#17365D] text-white border-[#17365D]'
                  : 'bg-white text-[#1F2933] border-transparent hover:bg-[#F5F7F9]'
              }`}
            >
              <Droplets className="w-3.5 h-3.5 text-[#006B3C]" />
              <span>Tides & Draft</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setFilterTab('rain')}
              className={`px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
                filterTab === 'rain'
                  ? 'bg-[#17365D] text-white border-[#17365D]'
                  : 'bg-white text-[#1F2933] border-transparent hover:bg-[#F5F7F9]'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5 text-[#1D5F91]" />
              <span>{translatePhrase('rainAndFlood', language) || 'Rain & Flooding'}</span>
            </button>
            {isFarmer && (
              <>
                <button
                  onClick={() => setFilterTab('spray')}
                  className={`px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
                    filterTab === 'spray'
                      ? 'bg-[#17365D] text-white border-[#17365D]'
                      : 'bg-white text-[#1F2933] border-transparent hover:bg-[#F5F7F9]'
                  }`}
                >
                  <Sprout className="w-3.5 h-3.5 text-[#006B3C]" />
                  <span>{translatePhrase('sprayingAndField', language) || 'Agromet Operations'}</span>
                </button>
                <button
                  onClick={() => setFilterTab('pest')}
                  className={`px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
                    filterTab === 'pest'
                      ? 'bg-[#17365D] text-white border-[#17365D]'
                      : 'bg-white text-[#1F2933] border-transparent hover:bg-[#F5F7F9]'
                  }`}
                >
                  <Bug className="w-3.5 h-3.5 text-[#B7791F]" />
                  <span>{translatePhrase('pestAndDisease', language) || 'Pest & Disease'}</span>
                </button>
              </>
            )}
          </>
        )}
        <button
          onClick={() => setFilterTab('history')}
          className={`px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            filterTab === 'history'
              ? 'bg-[#17365D] text-white border-[#17365D]'
              : 'bg-white text-[#1F2933] border-transparent hover:bg-[#F5F7F9]'
          }`}
        >
          {translatePhrase('recentAlerts', language) || 'Archived Records'} ({historyAlerts.length})
        </button>
      </div>

      {/* 3. Bulletins Content */}
      {loading || (isFisher && marineLoading && !marineData) ? (
        <div className="gov-panel p-8 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#006B3C]" />
          <p className="text-xs text-[#5B6770] font-medium">
            {isFisher ? 'Synthesizing INCOIS & IMD coastal marine bulletins...' : 'Querying National Disaster Management databases...'}
          </p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="gov-panel p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-none bg-[#EBF7EE] text-[#006B3C] mx-auto flex items-center justify-center border border-[#B7E4C7]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#17365D] uppercase tracking-wide">
              {isFisher
                ? 'NO ACTIVE COASTAL HAZARD BULLETINS'
                : isFarmer
                ? (translatePhrase('noAgriAlerts', language) || 'NO ACTIVE METEOROLOGICAL / AGROMET HAZARDS')
                : 'NO ACTIVE SEVERE WEATHER ADVISORIES'}
            </h3>
            <p className="text-xs text-[#5B6770] max-w-md mx-auto">
              {isFisher
                ? `Standard maritime conditions prevailing near ${selectedHarbor.name}. Wave and wind parameters remain within normal navigation limits.`
                : isFarmer
                ? (translatePhrase('allClearAgri', language) || `All monitored parameters in ${district} are within normal agricultural thresholds.`)
                : `Atmospheric conditions within standard baseline parameters across ${district}, ${state}.`}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const style = getSeverityStyle(alert.severity);

            return (
              <div
                key={alert.id}
                className={`gov-panel ${style.borderAccent} transition-all duration-150 hover:shadow-xs`}
              >
                <div className="p-3.5 sm:p-4 space-y-3">
                  {/* Alert Header Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-none shrink-0 ${style.iconBg}`}>
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className={`gov-badge ${style.badgeClass} text-[10px]`}>
                            {style.label}
                          </span>
                          <span className="text-[10px] text-[#5B6770] font-semibold bg-[#F5F7F9] px-1.5 py-0.5 border border-[#D6DCE1]">
                            {alert.type}
                          </span>
                          {!alert.is_read && (
                            <span className="w-2 h-2 rounded-full bg-[#1D5F91]" title="Unread Notice" />
                          )}
                        </div>
                        <h2 className="text-sm font-bold text-[#17365D] leading-snug">
                          {alert.title}
                        </h2>
                      </div>
                    </div>
                  </div>

                  {/* Body Description */}
                  <p className="text-xs text-[#1F2933] leading-relaxed">
                    {alert.description}
                  </p>

                  {/* Location & Time Meta */}
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] text-[#5B6770] pt-1 border-t border-[#D6DCE1]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#FF9933]" />
                      <span className="font-semibold text-[#17365D]">{alert.location_name}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#5B6770]" />
                      <span>{formatTimestamp(alert.created_at)}</span>
                    </span>
                    <span className="text-[10px] text-[#5B6770] ml-auto hidden sm:inline">
                      Source: {alert.source}
                    </span>
                  </div>

                  {/* Actions / Safety Instructions Box */}
                  {alert.recommended_actions && alert.recommended_actions.length > 0 && (
                    <div className={`p-2.5 text-xs rounded-none border ${style.boxBg}`}>
                      <p className="font-bold uppercase tracking-wider text-[10px] mb-1">
                        {isFisher ? 'Official Maritime Directive:' : translatePhrase('recommendedAction', language) || 'Safety Directives:'}
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        {alert.recommended_actions.map((act, i) => (
                          <li key={i}>{act}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Interactive Button Group */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => handleAskAI(alert.title, alert.description)}
                      className="gov-btn-secondary px-2.5 py-1 text-xs flex items-center gap-1.5 cursor-pointer bg-blue-50/50 hover:bg-blue-100/50 border-blue-200 text-[#17365D]"
                      title="Ask AI Assistant about this alert"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#1D5F91]" />
                      <span>{isFisher ? (language === 'mr' ? 'सागरी AI ला विचारा' : language === 'hi' ? 'समुद्री AI से पूछें' : 'Ask Marine AI') : translatePhrase('askAgriAI', language) || 'Agromet Query'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedAlert(alert)}
                        className="gov-btn-secondary px-2.5 py-1 text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <span>{translatePhrase('viewFullBulletin', language) || 'Full Bulletin'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      {!alert.is_read && (
                        <button
                          onClick={() => handleMarkRead(alert.id)}
                          className="gov-btn-secondary px-2 py-1 text-xs cursor-pointer text-[#5B6770]"
                        >
                          {translatePhrase('acknowledge', language) || 'Acknowledge'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Archived / Historical Bulletins */}
      {!isFisher && (
        <div className="mt-6 pt-4 border-t border-[#D6DCE1]">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-[#5B6770]" />
            <h3 className="text-xs font-bold text-[#17365D] uppercase tracking-wider">
              {translatePhrase('archivedRecords', language) || 'Archived Bulletins (Previous 72 Hours)'}
            </h3>
          </div>

          {(filterTab === 'all' || filterTab === 'history') && historyAlerts.length > 0 ? (
            <div className="space-y-2">
              {historyAlerts.slice(0, 5).map((h) => (
                <div
                  key={h.id}
                  onClick={() => setSelectedAlert(h)}
                  className="gov-panel p-2.5 flex items-center justify-between text-xs hover:bg-[#F5F7F9] cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="gov-badge gov-badge-neutral text-[9px]">{h.severity}</span>
                    <span className="font-semibold text-[#17365D] truncate">{h.title}</span>
                  </div>
                  <span className="text-[10px] text-[#5B6770] whitespace-nowrap pl-2">
                    {formatTimestamp(h.created_at)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#5B6770] italic">
              {translatePhrase('noArchivedAlerts', language) || 'No archived hazard bulletins on file.'}
            </p>
          )}
        </div>
      )}

      {/* 5. Detail Modal */}
      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          isOpen={!!selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onMarkRead={(id: string) => {
            handleMarkRead(id);
            setSelectedAlert(null);
          }}
        />
      )}
    </div>
  );
};
