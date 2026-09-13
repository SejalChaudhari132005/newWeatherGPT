import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  Send,
  Play,
  Square,
  Activity,
  AlertTriangle,
  Radar,
  CloudSun,
  Anchor,
  Plane,
  Sprout,
  Cpu,
  Layers,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { RealtimeConnectionStatus, RealtimePipelineHealth, DemoPublishRequest } from '../../types/realtime';
import { websocketService } from '../../services/websocketService';

interface RealtimeDemoControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: RealtimeConnectionStatus;
}

export const RealtimeDemoControlModal: React.FC<RealtimeDemoControlModalProps> = ({
  isOpen,
  onClose,
  status,
}) => {
  const [health, setHealth] = useState<RealtimePipelineHealth | null>(null);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastActionStatus, setLastActionStatus] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      const data = await websocketService.getHealth();
      setHealth(data);
      setIsStreamActive(data.event_bus === 'active');
    } catch {
      // Backend offline or error
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
      const interval = setInterval(fetchHealth, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendEvent = async (req: DemoPublishRequest) => {
    setIsPublishing(true);
    setLastActionStatus(null);
    try {
      await websocketService.publishDemoEvent(req);
      setLastActionStatus(`Broadcasted ${req.eventType} successfully`);
      fetchHealth();
    } catch (err: any) {
      setLastActionStatus(`Failed: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleToggleStream = async () => {
    try {
      const res = await websocketService.toggleDemoStream();
      setIsStreamActive(res.is_demo_stream_active);
      setLastActionStatus(res.message);
      fetchHealth();
    } catch (err: any) {
      setLastActionStatus(`Stream error: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground border shadow-2xl rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
            <div>
              <h2 className="text-sm font-bold tracking-wider uppercase">
                Real-Time Ingestion & WebSocket Control
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Hackathon Live Demonstration Engine & Event Dispatcher
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Connection & Health Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg border bg-muted/20 font-mono">
            <div>
              <span className="text-[10px] text-muted-foreground block">WS STATUS</span>
              <span className="font-bold text-xs uppercase text-emerald-600 dark:text-emerald-400">
                {status}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">CONNECTED CLIENTS</span>
              <span className="font-bold text-xs">
                {health ? health.connected_clients : '1 (Self)'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">EVENTS BROADCAST</span>
              <span className="font-bold text-xs">
                {health ? health.total_events_broadcast : '0'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">AUTO DEMO STREAM</span>
              <span className={`font-bold text-xs uppercase ${isStreamActive ? 'text-amber-600' : 'text-slate-500'}`}>
                {isStreamActive ? 'ACTIVE (30s)' : 'IDLE'}
              </span>
            </div>
          </div>

          {/* Action notification */}
          {lastActionStatus && (
            <div className="p-2 rounded border bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-[11px] flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{lastActionStatus}</span>
            </div>
          )}

          {/* Demo Trigger Buttons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                One-Click Event Dispatchers (Push to WebSocket)
              </h3>
              <button
                type="button"
                onClick={handleToggleStream}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded border transition-colors ${
                  isStreamActive
                    ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {isStreamActive ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                {isStreamActive ? 'STOP AUTO STREAM' : 'START AUTO DEMO STREAM'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* 1. Severe Alert */}
              <button
                type="button"
                disabled={isPublishing}
                onClick={() =>
                  handleSendEvent({
                    eventType: 'WEATHER_ALERT',
                    severity: 'ORANGE',
                    title: 'Severe Thunderstorm & Rainfall Alert',
                    message: 'Heavy precipitation (45mm/h) and lightning detected approaching Mumbai metropolitan region.',
                    location: { lat: 19.076, lon: 72.8777, name: 'Mumbai', district: 'Mumbai', state: 'Maharashtra' },
                    source: 'IMD_NOWCAST_DEMO',
                    is_demo: true,
                    targetRoles: ['citizen', 'farmer', 'disaster_manager', 'urban_planner', 'researcher'],
                  })
                }
                className="p-2.5 rounded border text-left hover:bg-muted/60 transition-colors flex items-start gap-2 group"
              >
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-foreground group-hover:text-primary">
                    Send Weather Alert (Orange)
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    Mumbai Thunderstorm • Target: All Roles
                  </div>
                </div>
              </button>

              {/* 2. Radar Update */}
              <button
                type="button"
                disabled={isPublishing}
                onClick={() =>
                  handleSendEvent({
                    eventType: 'RADAR_UPDATE',
                    severity: 'INFO',
                    title: 'Doppler Radar Scan Update',
                    message: 'New IMD DWR Mumbai sweep received. Intense reflectivity core detected at 285° azimuth.',
                    location: { lat: 18.9067, lon: 72.8147, name: 'Mumbai DWR Station' },
                    source: 'IMD_DWR_DEMO',
                    is_demo: true,
                    targetRoles: ['researcher', 'aviation', 'disaster_manager'],
                    data: { station: 'Mumbai DWR', dbzMax: 54, sweepElevation: 0.5 },
                  })
                }
                className="p-2.5 rounded border text-left hover:bg-muted/60 transition-colors flex items-start gap-2 group"
              >
                <Radar className="w-4 h-4 text-sky-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-foreground group-hover:text-primary">
                    Send Radar Update
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    IMD DWR Sweep • Target: Researcher, Aviation
                  </div>
                </div>
              </button>

              {/* 3. Marine Warning */}
              <button
                type="button"
                disabled={isPublishing}
                onClick={() =>
                  handleSendEvent({
                    eventType: 'MARINE_WARNING',
                    severity: 'RED',
                    title: 'INCOIS High Wave & Rough Sea Warning',
                    message: 'Rough sea conditions with swell waves of 3.8m to 4.2m expected along Maharashtra-Goa coast. Fishermen advised not to venture into sea.',
                    location: { lat: 18.95, lon: 72.82, name: 'Maharashtra Coastal Waters' },
                    source: 'INCOIS_DEMO',
                    is_demo: true,
                    targetRoles: ['fisherman', 'disaster_manager', 'researcher'],
                    data: { waveHeightMax: 4.2, windSpeedKnots: 28 },
                  })
                }
                className="p-2.5 rounded border text-left hover:bg-muted/60 transition-colors flex items-start gap-2 group"
              >
                <Anchor className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-foreground group-hover:text-primary">
                    Send Marine Warning (Red)
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    High Waves 4.2m • Target: Fisherman
                  </div>
                </div>
              </button>

              {/* 4. Aviation Alert */}
              <button
                type="button"
                disabled={isPublishing}
                onClick={() =>
                  handleSendEvent({
                    eventType: 'AVIATION_ALERT',
                    severity: 'ORANGE',
                    title: 'VABB/BOM Low-Level Wind Shear Alert',
                    message: 'Microburst and low-level wind shear reported on final approach runway 27 (20 knots loss below 1000ft).',
                    location: { lat: 19.0896, lon: 72.8656, name: 'VABB / Mumbai Airport' },
                    source: 'IMD_METAR_DEMO',
                    is_demo: true,
                    targetRoles: ['aviation', 'disaster_manager', 'researcher'],
                    data: { icao: 'VABB', windShearRwy: '27', headwindLoss: 20 },
                  })
                }
                className="p-2.5 rounded border text-left hover:bg-muted/60 transition-colors flex items-start gap-2 group"
              >
                <Plane className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-foreground group-hover:text-primary">
                    Send Aviation Alert (Wind Shear)
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    VABB Runway 27 • Target: Aviation (SkyRoute)
                  </div>
                </div>
              </button>

              {/* 5. Agricultural Advisory */}
              <button
                type="button"
                disabled={isPublishing}
                onClick={() =>
                  handleSendEvent({
                    eventType: 'AGRICULTURE_ALERT',
                    severity: 'YELLOW',
                    title: 'Agromet Sudden Hail & Moisture Advisory',
                    message: 'Isolated hailstorm and sudden squall likely over Nashik and Pune grape/onion belt. Delay spraying and protect standing nursery.',
                    location: { lat: 19.9975, lon: 73.7898, name: 'Nashik Region' },
                    source: 'IMD_AGROMET_DEMO',
                    is_demo: true,
                    targetRoles: ['farmer', 'citizen', 'researcher'],
                    data: { cropAdvisory: 'Grape/Onion', hailProbability: 60 },
                  })
                }
                className="p-2.5 rounded border text-left hover:bg-muted/60 transition-colors flex items-start gap-2 group"
              >
                <Sprout className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-foreground group-hover:text-primary">
                    Send Agriculture Advisory
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    Agromet Hail Warning • Target: Farmer
                  </div>
                </div>
              </button>

              {/* 6. NWP Research Update */}
              <button
                type="button"
                disabled={isPublishing}
                onClick={() =>
                  handleSendEvent({
                    eventType: 'NWP_UPDATE',
                    severity: 'INFO',
                    title: 'WRF-3km High-Res Model Run Complete',
                    message: '06Z WRF convective-permitting simulation completed. Convective Available Potential Energy (CAPE) exceedance > 2400 J/kg.',
                    location: { lat: 20.5937, lon: 78.9629, name: 'NCMRWF India Domain' },
                    source: 'NCMRWF_NWP_DEMO',
                    is_demo: true,
                    targetRoles: ['researcher'],
                    data: { model: 'WRF-ARW 3km', runCycle: '06Z', maxCape: 2420 },
                  })
                }
                className="p-2.5 rounded border text-left hover:bg-muted/60 transition-colors flex items-start gap-2 group"
              >
                <Layers className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-foreground group-hover:text-primary">
                    Send NWP Model Update
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    WRF 06Z Cycle • Target: Researcher (WeatherLab)
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* WIS2.0 Architecture Diagram */}
          <div className="p-3 rounded-lg border bg-muted/20">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              WIS2.0-Compatible Event Ingestion Pipeline Architecture
            </h4>
            <div className="font-mono text-[10px] text-muted-foreground/90 bg-muted/60 p-2.5 rounded border leading-relaxed overflow-x-auto whitespace-pre">
{`WEATHER SOURCES (IMD / INCOIS / Radar / NWP / Demo Simulator)
       │
       ▼
INGESTION & VALIDATION SERVICE (Pydantic Schema Validation)
       │
       ▼
INTERNAL EVENT BUS (Deduplication & Timestamp Latency Tracking)
       │
       ▼
WEBSOCKET MANAGER (/ws/live-alerts Asynchronous Push Broadcast)
       │
       ▼
WEATHERGPT CLIENT (Auto-Reconnect & State Synchronization)
       │
   ┌───┴───────────────────────┬──────────────────────────┐
   ▼                           ▼                          ▼
ALERTS PAGE (Prepend)   WEATHERLAB FEED (Live Stream)   ROLE DASHBOARDS`}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-muted/40 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground font-mono">
            Demo simulator endpoints are isolated for hackathon presentation.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-primary text-primary-foreground font-medium rounded text-xs hover:bg-primary/90 transition-colors"
          >
            CLOSE PANEL
          </button>
        </div>
      </div>
    </div>
  );
};
