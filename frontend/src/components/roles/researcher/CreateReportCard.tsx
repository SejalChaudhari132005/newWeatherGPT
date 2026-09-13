import React, { useState } from 'react';
import { FileText, Sparkles, Sliders, CheckCircle2 } from 'lucide-react';

interface CreateReportCardProps {
  onSelectTemplate: (templateName: string) => void;
  onOpenCustomBuilder: () => void;
  isGenerating?: boolean;
}

const TEMPLATES = [
  {
    id: 'weather_trend',
    title: 'Weather Trend Analysis',
    desc: 'Temperature, rainfall, wind trends',
    type: 'trend',
  },
  {
    id: 'extreme_event',
    title: 'Extreme Event Analysis',
    desc: 'Cyclone, heatwave, heavy rainfall',
    type: 'extreme',
  },
  {
    id: 'climate_impact',
    title: 'Climate Change Impact',
    desc: 'Anomalies, long-term trends',
    type: 'climate',
  },
  {
    id: 'custom_report',
    title: 'Custom Research Report',
    desc: 'Define your own parameters',
    type: 'custom',
  },
];

export const CreateReportCard: React.FC<CreateReportCardProps> = ({
  onSelectTemplate,
  onOpenCustomBuilder,
  isGenerating = false,
}) => {
  const [activeTab, setActiveTab] = useState<'predefined' | 'custom'>('predefined');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('weather_trend');

  const handleGenerate = () => {
    if (activeTab === 'custom') {
      onOpenCustomBuilder();
    } else {
      const template = TEMPLATES.find((t) => t.id === selectedTemplate);
      onSelectTemplate(template?.title || 'Weather Trend Analysis');
    }
  };

  return (
    <div className="bg-white rounded-md border border-slate-200 p-4 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
          Create New Report
        </h3>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 text-xs font-semibold border-b border-slate-200 mb-3">
        <button
          onClick={() => setActiveTab('predefined')}
          className={`pb-2 transition-colors relative ${
            activeTab === 'predefined'
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Predefined Templates
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`pb-2 transition-colors relative ${
            activeTab === 'custom'
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Custom Query
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2 mb-4">
        {activeTab === 'predefined' ? (
          TEMPLATES.map((tmpl) => {
            const isSelected = selectedTemplate === tmpl.id;
            return (
              <div
                key={tmpl.id}
                onClick={() => setSelectedTemplate(tmpl.id)}
                className={`p-2.5 rounded border transition-all cursor-pointer flex items-start gap-2.5 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/40 shadow-xs'
                    : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className={`mt-0.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 block truncate">
                      {tmpl.title}
                    </span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </div>
                  <span className="text-[11px] text-slate-500 block truncate">{tmpl.desc}</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded space-y-2 text-center my-auto">
            <Sliders className="w-6 h-6 text-slate-400 mx-auto" />
            <div className="text-xs font-semibold text-slate-700">Custom Research Query</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Define custom parameters, spatial boundaries, multi-variable correlation indices, and specific NetCDF / GRIB sources.
            </p>
          </div>
        )}
      </div>

      {/* Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2 px-4 rounded text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
      >
        {isGenerating ? (
          <>
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            Generating Report...
          </>
        ) : (
          <>
            <FileText className="w-3.5 h-3.5" />
            Generate Report
          </>
        )}
      </button>
    </div>
  );
};
