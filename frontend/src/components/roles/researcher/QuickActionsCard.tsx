import React from 'react';
import { FileText, Download, Bookmark, Sparkles, HelpCircle } from 'lucide-react';

interface QuickActionsCardProps {
  onGenerateReport: () => void;
  onDownloadDataset: () => void;
  onSaveMapView: () => void;
  onOpenAssistant?: () => void;
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  onGenerateReport,
  onDownloadDataset,
  onSaveMapView,
  onOpenAssistant,
}) => {
  return (
    <div className="bg-white rounded-md border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
          Quick Actions
        </h3>
      </div>

      <div className="space-y-2">
        <button
          onClick={onGenerateReport}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-slate-700 hover:text-blue-700 text-xs font-semibold transition-all cursor-pointer text-left"
        >
          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Generate Research Report</span>
        </button>

        <button
          onClick={onDownloadDataset}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-slate-700 hover:text-blue-700 text-xs font-semibold transition-all cursor-pointer text-left"
        >
          <Download className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Download Dataset</span>
        </button>

        <button
          onClick={onSaveMapView}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-slate-700 hover:text-blue-700 text-xs font-semibold transition-all cursor-pointer text-left"
        >
          <Bookmark className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Save Map View</span>
        </button>

        {onOpenAssistant && (
          <button
            onClick={onOpenAssistant}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded border border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 text-purple-800 text-xs font-semibold transition-all cursor-pointer text-left"
          >
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Ask Research AI Assistant</span>
          </button>
        )}
      </div>
    </div>
  );
};
