import React from 'react';
import { FileText, Download, ExternalLink } from 'lucide-react';

interface ReportItem {
  id: string;
  title: string;
  date: string;
  format: string;
}

const RECENT_REPORTS: ReportItem[] = [
  {
    id: 'rep_1',
    title: 'Monsoon 2025 - Rainfall Analysis',
    date: '12 Sep 2025',
    format: 'PDF',
  },
  {
    id: 'rep_2',
    title: 'Cyclone Impact Assessment - Bay of Bengal',
    date: '10 Sep 2025',
    format: 'PDF',
  },
  {
    id: 'rep_3',
    title: 'Temperature Anomaly Report - India',
    date: '08 Sep 2025',
    format: 'PDF',
  },
];

interface RecentReportsCardProps {
  onDownloadReport: (report: ReportItem) => void;
  onViewAll?: () => void;
}

export const RecentReportsCard: React.FC<RecentReportsCardProps> = ({
  onDownloadReport,
  onViewAll,
}) => {
  return (
    <div className="bg-white rounded-md border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">Recent Reports</h3>
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
          >
            View All
          </button>
        </div>

        <div className="space-y-2">
          {RECENT_REPORTS.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between p-2 rounded hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="text-slate-400 p-1 bg-slate-100 rounded shrink-0">
                  <FileText className="w-4 h-4 text-slate-600" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-800 block truncate">
                    {report.title}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {report.date} • {report.format}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onDownloadReport(report)}
                className="text-slate-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50 transition-colors cursor-pointer shrink-0"
                title={`Download ${report.title}`}
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
