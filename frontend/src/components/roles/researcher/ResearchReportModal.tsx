import React, { useState } from 'react';
import { X, Download, FileText, Printer, CheckCircle2, Share2, Sparkles } from 'lucide-react';
import { ResearchReportData } from '../../../types/researcher';

interface ResearchReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: ResearchReportData | null;
  onExportPDF: () => void;
}

export const ResearchReportModal: React.FC<ResearchReportModalProps> = ({
  isOpen,
  onClose,
  reportData,
  onExportPDF,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !reportData) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(reportData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 leading-tight">
                {reportData.title}
              </h2>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                Ref ID: {reportData.report_id} • {reportData.generated_at}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Report Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 text-sm leading-relaxed">
          {/* Executive Summary */}
          <div className="bg-blue-50/60 border border-blue-200/80 rounded-md p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Executive Summary
            </h4>
            <p className="text-xs text-blue-950 font-medium leading-relaxed">
              {reportData.executive_summary}
            </p>
          </div>

          {/* Study Area & Sources */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Study Area / Region
              </span>
              <span className="text-sm font-semibold text-slate-800">{reportData.study_area}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Data Sources
              </span>
              <div className="flex flex-wrap gap-1.5">
                {reportData.data_sources.map((src, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700"
                  >
                    {src.name} ({src.type})
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Methodology */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Methodology & Framework
            </h4>
            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-200">
              {reportData.methodology}
            </p>
          </div>

          {/* Key Findings */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Key Scientific Findings
            </h4>
            <ul className="space-y-2">
              {reportData.key_findings.map((finding, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50/50 p-2.5 rounded border border-slate-100"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Statistical Highlights */}
          {reportData.statistical_summary && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Statistical Summary
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(reportData.statistical_summary).map(([key, val]) => (
                  <div key={key} className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block truncate">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-bold font-mono text-slate-900 block mt-1">
                      {typeof val === 'number' ? val.toLocaleString() : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Limitations */}
          {reportData.limitations && reportData.limitations.length > 0 && (
            <div className="border-t border-slate-200 pt-4">
              <span className="text-[11px] font-bold text-slate-500 block mb-1">
                Data Limitations & Uncertainty
              </span>
              <ul className="list-disc list-inside text-xs text-slate-500 space-y-1">
                {reportData.limitations.map((lim, i) => (
                  <li key={i}>{lim}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 bg-white rounded hover:bg-slate-50 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            {copied ? 'Copied JSON!' : 'Copy Data'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Close
            </button>
            <button
              onClick={onExportPDF}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Export Report (PDF)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
