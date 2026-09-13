import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Clock,
  MapPin,
  ChevronDown,
  RefreshCw,
  Search,
  Sliders,
  Globe,
  Layers,
  FileText,
  BarChart3,
  Download,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { useUI } from '../context/UIContext';
import { WeatherLabMapViewer } from '../components/roles/researcher/WeatherLabMapViewer';
import { NWPModelComparisonPanel } from '../components/roles/researcher/NWPModelComparisonPanel';
import { ForecastComparisonChart } from '../components/roles/researcher/ForecastComparisonChart';
import { SatelliteRadarPreview } from '../components/roles/researcher/SatelliteRadarPreview';
import { ClimateAnalyticsCard } from '../components/roles/researcher/ClimateAnalyticsCard';
import { AvailableDatasetsCard } from '../components/roles/researcher/AvailableDatasetsCard';
import { CreateReportCard } from '../components/roles/researcher/CreateReportCard';
import { MapGalleryCard } from '../components/roles/researcher/MapGalleryCard';
import { QuickActionsCard } from '../components/roles/researcher/QuickActionsCard';
import { RecentReportsCard } from '../components/roles/researcher/RecentReportsCard';
import { ResearchReportModal } from '../components/roles/researcher/ResearchReportModal';
import { ResearchAssistantModal } from '../components/roles/researcher/ResearchAssistantModal';
import { CitizenAskFloatingBar } from '../components/dashboard/CitizenAskFloatingBar';
import { researcherService } from '../services/researcherService';
import { useRealtimeWeather } from '../hooks/useRealtimeWeather';
import { RealtimeStatusIndicator } from '../components/realtime/RealtimeStatusIndicator';
import { LiveEventPanel } from '../components/realtime/LiveEventPanel';
import {
  NWPComparisonResponse,
  ClimateAnomalyMetrics,
  DatasetItem,
  ResearchReportData,
} from '../types/researcher';

const AVAILABLE_LOCATIONS = [
  { name: 'Mumbai, Maharashtra', lat: 18.98, lon: 72.83 },
  { name: 'Delhi, NCR', lat: 28.61, lon: 77.23 },
  { name: 'Bengaluru, Karnataka', lat: 12.97, lon: 77.59 },
  { name: 'Kolkata, West Bengal', lat: 22.57, lon: 88.36 },
  { name: 'Chennai, Tamil Nadu', lat: 13.08, lon: 80.27 },
  { name: 'Bhubaneswar, Odisha', lat: 20.29, lon: 85.82 },
];

export const WeatherLabPage: React.FC = () => {
  const { setActiveTab } = useUI();

  // Real-time WebSocket hook for Researcher persona
  const { status: realtimeStatus, events: realtimeEvents } = useRealtimeWeather({
    role: 'researcher',
    autoConnect: true,
  });

  // Navigation tabs
  const [activeSubTab, setActiveSubTab] = useState<string>('nwp_comparison');

  // Selected Location
  const [selectedLocation, setSelectedLocation] = useState(AVAILABLE_LOCATIONS[0]);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  // Active layer for map
  const [activeMapLayer, setActiveMapLayer] = useState<string>('rainfall_24h');

  // Initial baseline fallback data for instant zero-latency render
  const defaultSummary = researcherService.getFallbackSummary(
    AVAILABLE_LOCATIONS[0].name.split(',')[0],
    AVAILABLE_LOCATIONS[0].lat,
    AVAILABLE_LOCATIONS[0].lon
  );

  // Data states
  const [nwpData, setNwpData] = useState<NWPComparisonResponse | null>(defaultSummary.nwp_comparison);
  const [climateData, setClimateData] = useState<ClimateAnomalyMetrics | null>(defaultSummary.climate_anomalies);
  const [datasets, setDatasets] = useState<DatasetItem[]>(defaultSummary.available_datasets);
  const [loading, setLoading] = useState<boolean>(false);

  // Report Modal states
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [activeReport, setActiveReport] = useState<ResearchReportData | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);

  // Research Assistant Modal state
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch all initial data
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [nwp, climate, dsets] = await Promise.all([
          researcherService.getNWPComparison(
            selectedLocation.name.split(',')[0],
            selectedLocation.lat,
            selectedLocation.lon
          ),
          researcherService.getClimateAnomalies(
            selectedLocation.name.split(',')[0],
            selectedLocation.lat,
            selectedLocation.lon
          ),
          researcherService.getAvailableDatasets(),
        ]);

        if (isMounted) {
          setNwpData(nwp);
          setClimateData(climate);
          setDatasets(dsets);
        }
      } catch (err) {
        console.error('Failed to load researcher lab data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [selectedLocation]);

  // Handle Generate Report from Template
  const handleGenerateTemplateReport = async (templateName: string) => {
    setIsGeneratingReport(true);
    showToast(`Generating ${templateName}...`);
    try {
      const rep = await researcherService.generateReport({
        title: `${templateName} - ${selectedLocation.name}`,
        report_type: templateName.toLowerCase().replace(/\s+/g, '_'),
        location_name: selectedLocation.name,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lon,
        period: '2025 Seasonal Monsoon',
        parameters: ['temperature', 'precipitation', 'wind_vectors', 'geopotential_height'],
        include_maps: true,
        include_charts: true,
        include_nwp: true,
        include_findings: true,
      });
      setActiveReport(rep);
      setIsReportModalOpen(true);
    } catch (err) {
      console.error(err);
      showToast('Error generating report. Using grounded fallback report.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Handle Download Dataset CSV
  const handleDownloadDataset = async (dataset: DatasetItem) => {
    showToast(`Downloading ${dataset.name} (${dataset.format})...`);
    await researcherService.downloadDatasetFile(dataset.id, dataset.name);
  };

  // Handle Recent Report Download
  const handleRecentReportDownload = (rep: { title: string }) => {
    handleGenerateTemplateReport(rep.title);
  };

  // Handle Export PDF
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F5F7F9] text-[#1F2933] pb-16 font-sans">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-16 right-4 z-50 bg-[#17365D] text-white text-xs font-semibold px-4 py-2.5 rounded-xs shadow-lg border border-[#0F233D] animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-[1600px] mx-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-5">
        {/* 1. Official WeatherLab Hero Banner Card */}
        <div className="bg-white border border-[#D6DCE1] rounded-xs p-3.5 sm:p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D6DCE1]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xs bg-[#17365D] text-white flex items-center justify-center shrink-0 shadow-xs">
                <FlaskConical className="w-5 h-5 sm:w-6 sm:h-6 text-[#38BDF8]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black text-[#17365D] tracking-tight">
                    WeatherLab
                  </h1>
                  <span className="text-[10px] font-bold bg-[#E2E8F0] text-[#17365D] px-1.5 py-0.2 rounded-xs uppercase">
                    Research Suite
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-[#5B6770] font-medium">
                  Advanced weather analysis, numerical model comparison and atmospheric research tools
                </p>
              </div>
            </div>

            {/* Right Controls: Timestamp & Location */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
              <RealtimeStatusIndicator status={realtimeStatus} />

              <div className="flex items-center gap-1.5 bg-[#F8FAFC] px-2.5 py-1.5 rounded-xs border border-[#D6DCE1] text-[#5B6770]">
                <Clock className="w-3.5 h-3.5 text-[#5B6770]" />
                <span className="font-mono text-[11px]">13 Sep 2025, 14:32 IST</span>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                  className="flex items-center gap-1.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] px-2.5 py-1.5 rounded-xs border border-[#D6DCE1] text-[#17365D] font-bold cursor-pointer transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#006B3C]" />
                  <span>{selectedLocation.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#5B6770]" />
                </button>

                {locationDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-56 bg-white border border-[#D6DCE1] rounded-xs shadow-lg z-50 py-1">
                    {AVAILABLE_LOCATIONS.map((loc) => (
                      <button
                        key={loc.name}
                        type="button"
                        onClick={() => {
                          setSelectedLocation(loc);
                          setLocationDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-sky-50 transition-colors flex items-center justify-between ${
                          selectedLocation.name === loc.name
                            ? 'bg-sky-50 font-bold text-[#0284C7]'
                            : 'text-[#1F2933]'
                        }`}
                      >
                        <span>{loc.name}</span>
                        <span className="text-[10px] text-[#5B6770] font-mono">
                          {loc.lat}°N, {loc.lon}°E
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sub Navigation Bar Tabs */}
          <div className="mt-3 pt-1 flex items-center gap-4 sm:gap-6 overflow-x-auto text-xs font-bold border-t border-[#E2E8F0] no-scrollbar">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'nwp_comparison', label: 'NWP Model Comparison' },
              { id: 'maps_layers', label: 'Maps & Layers' },
              { id: 'time_series', label: 'Time Series Analysis' },
              { id: 'reports', label: 'Reports' },
              { id: 'data_download', label: 'Data Download' },
            ].map((tab) => {
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`pb-2 pt-1 transition-all whitespace-nowrap relative cursor-pointer ${
                    isActive
                      ? 'text-[#0284C7] border-b-2 border-[#0284C7] font-black'
                      : 'text-[#5B6770] hover:text-[#17365D]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Floating Ask WeatherGPT Assistant Banner */}
        <CitizenAskFloatingBar
          onOpenChat={() => setIsAssistantOpen(true)}
          onOpenVoice={() => setIsAssistantOpen(true)}
        />

        {/* 3. ROW 1: Multi-Layer Map (65%) + NWP Model Comparison Panel (35%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 md:gap-5">
          {/* Multi-Layer Map Card */}
          <div className="lg:col-span-8 bg-white rounded-xs border border-[#D6DCE1] p-3 sm:p-4 shadow-xs flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-[#D6DCE1] mb-2.5 gap-2">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-[#17365D] uppercase tracking-wide flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#0284C7]" />
                  Multi-Layer Weather Map
                </h2>
                <p className="text-[11px] text-[#5B6770]">
                  Explore high-resolution radar, wind vectors, and cyclone kinematics
                </p>
              </div>

              {/* Map Controls: Layer, Date, Time */}
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <div className="flex items-center gap-1 bg-[#F8FAFC] px-2 py-1 rounded-xs border border-[#D6DCE1]">
                  <span className="text-[10px] text-[#5B6770] font-bold uppercase">Layer:</span>
                  <select
                    value={activeMapLayer}
                    onChange={(e) => setActiveMapLayer(e.target.value)}
                    className="bg-transparent font-bold text-[#17365D] focus:outline-none cursor-pointer text-[11px]"
                  >
                    <option value="rainfall_24h">Rainfall (24h)</option>
                    <option value="radar_reflectivity">Radar Reflectivity</option>
                    <option value="cloud_cover">Cloud Cover</option>
                    <option value="wind_vectors">Wind Vectors</option>
                    <option value="temperature">Temperature</option>
                    <option value="cyclone_track">Cyclone Track</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-[#F8FAFC] px-2 py-1 rounded-xs border border-[#D6DCE1] text-[#17365D] font-mono text-[11px] font-bold">
                  <span>13 Sep 2025</span>
                </div>

                <div className="flex items-center gap-1 bg-[#F8FAFC] px-2 py-1 rounded-xs border border-[#D6DCE1] text-[#17365D] font-mono text-[11px] font-bold">
                  <span>14:00 IST</span>
                </div>
              </div>
            </div>

            {/* Map Canvas */}
            <div className="flex-1 w-full min-h-[360px] sm:min-h-[420px] md:min-h-[480px]">
              <WeatherLabMapViewer
                locationName={selectedLocation.name}
                selectedLayer={activeMapLayer}
                onLayerChange={setActiveMapLayer}
                centerLat={selectedLocation.lat}
                centerLon={selectedLocation.lon}
              />
            </div>
          </div>

          {/* NWP Model Comparison Panel */}
          <div className="lg:col-span-4 h-full">
            <NWPModelComparisonPanel
              comparisonData={nwpData}
              locationName={selectedLocation.name.split(',')[0]}
            />
          </div>
        </div>

        {/* 4. Real-Time Meteorological Ingestion Feed (WIS2.0-Compatible Push) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 md:gap-5">
          <div className="lg:col-span-8">
            <LiveEventPanel
              events={realtimeEvents}
              title="WeatherLab Live Meteorological Feed (IMD / WIS2.0 Push Pipeline)"
            />
          </div>
          <div className="lg:col-span-4">
            <SatelliteRadarPreview />
          </div>
        </div>

        {/* 5. ROW 2: Forecast Comparison + Climate Analytics + Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
          {/* Card 1: Forecast Comparison */}
          <div className="min-h-[290px]">
            <ForecastComparisonChart
              data={nwpData}
              locationName={selectedLocation.name.split(',')[0]}
            />
          </div>

          {/* Card 2: Climate Analytics */}
          <div className="min-h-[290px]">
            <ClimateAnalyticsCard metrics={climateData} />
          </div>

          {/* Card 3: Quick Actions */}
          <div className="min-h-[290px]">
            <QuickActionsCard
              onGenerateReport={() => handleGenerateTemplateReport('Weather Trend Analysis')}
              onDownloadDataset={() =>
                datasets.length > 0 && handleDownloadDataset(datasets[0])
              }
              onSaveMapView={() => showToast('Map view & layer configuration saved to workspace.')}
              onOpenAssistant={() => setIsAssistantOpen(true)}
            />
          </div>
        </div>

        {/* 5. ROW 3: Available Datasets + Create New Report + Map Gallery + Recent Reports */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {/* Card 1: Available Datasets */}
          <div className="min-h-[290px]">
            <AvailableDatasetsCard
              datasets={datasets}
              onDownloadDataset={handleDownloadDataset}
            />
          </div>

          {/* Card 2: Create New Report */}
          <div className="min-h-[290px]">
            <CreateReportCard
              onSelectTemplate={handleGenerateTemplateReport}
              onOpenCustomBuilder={() =>
                handleGenerateTemplateReport('Custom Atmospheric Parameters')
              }
              isGenerating={isGeneratingReport}
            />
          </div>

          {/* Card 3: Map Gallery */}
          <div className="min-h-[290px]">
            <MapGalleryCard
              onSelectMapLayer={(layerId) => {
                setActiveMapLayer(layerId);
                showToast(`Loaded map layer: ${layerId.toUpperCase()}`);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>

          {/* Card 4: Recent Reports */}
          <div className="min-h-[290px]">
            <RecentReportsCard
              onDownloadReport={handleRecentReportDownload}
              onViewAll={() => handleGenerateTemplateReport('Climatology Archive 2025')}
            />
          </div>
        </div>
      </div>

      {/* Research Report Modal */}
      <ResearchReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportData={activeReport}
        onExportPDF={handleExportPDF}
      />

      {/* Research AI Assistant Modal */}
      <ResearchAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        locationName={selectedLocation.name}
      />
    </div>
  );
};
