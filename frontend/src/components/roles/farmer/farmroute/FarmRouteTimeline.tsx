import React from 'react';
import {
  RotateCcw,
  ChevronRight,
  Sun,
  Droplets,
  CloudRain,
  Tractor,
  SprayCan as Spray,
  Wheat,
  Sprout,
  AlertTriangle,
  CalendarCheck,
} from 'lucide-react';
import { FarmActivityItem } from '../../../../services/farmRouteEngine';
import { useLanguage } from '../../../../context/LanguageContext';

interface FarmRouteTimelineProps {
  activities: FarmActivityItem[];
  onReplan?: () => void;
  onSelectActivity: (activity: FarmActivityItem) => void;
  isReplanning?: boolean;
}

export const FarmRouteTimeline: React.FC<FarmRouteTimelineProps> = ({
  activities,
  onReplan,
  onSelectActivity,
  isReplanning = false,
}) => {
  const { language } = useLanguage();

  const renderActivityIcon = (iconName: FarmActivityItem['iconName']) => {
    switch (iconName) {
      case 'spray':
        return <Spray className="w-4 h-4 text-[#006B3C]" />;
      case 'tractor':
        return <Tractor className="w-4 h-4 text-[#006B3C]" />;
      case 'sun':
        return <Sun className="w-4 h-4 text-[#B7791F]" />;
      case 'water':
        return <Droplets className="w-4 h-4 text-[#1D5F91]" />;
      case 'cloud-rain':
        return <CloudRain className="w-4 h-4 text-[#1D5F91]" />;
      case 'wheat':
        return <Wheat className="w-4 h-4 text-[#B7791F]" />;
      default:
        return <Sprout className="w-4 h-4 text-[#006B3C]" />;
    }
  };

  const getStatusBadge = (statusType: FarmActivityItem['statusType'], statusText: string) => {
    switch (statusType) {
      case 'excellent':
      case 'good':
        return <span className="gov-badge gov-badge-success">{statusText.toUpperCase()}</span>;
      case 'warning':
        return <span className="gov-badge gov-badge-warning">{statusText.toUpperCase()}</span>;
      case 'rain':
      case 'caution':
        return <span className="gov-badge gov-badge-danger">{statusText.toUpperCase()}</span>;
      default:
        return <span className="gov-badge gov-badge-neutral">{statusText.toUpperCase()}</span>;
    }
  };

  return (
    <div className="gov-panel space-y-0">
      {/* Official Section Header */}
      <div className="gov-panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarCheck className="w-4 h-4 text-[#006B3C]" />
          <span>
            {language === 'mr'
              ? 'दैनिक शेतकाम वेळापत्रक (WORK SCHEDULE)'
              : language === 'hi'
              ? 'दैनिक खेत कार्य योजना (WORK SCHEDULE)'
              : "TODAY'S OPERATIONAL WORK SCHEDULE"}
          </span>
        </div>

        {/* Re-Plan Button */}
        {onReplan && (
          <button
            type="button"
            onClick={onReplan}
            disabled={isReplanning}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#006B3C] hover:bg-[#00522E] text-white text-[11px] font-bold rounded-xs transition-colors cursor-pointer uppercase tracking-wider disabled:opacity-50"
          >
            <RotateCcw className={`w-3 h-3 ${isReplanning ? 'animate-spin' : ''}`} />
            <span>{language === 'mr' ? 'पुन्हा नियोजन' : language === 'hi' ? 'री-प्लान' : 'RE-PLAN'}</span>
          </button>
        )}
      </div>

      {/* Schedule Rows with structured government styling */}
      <div className="divide-y divide-[#D6DCE1]">
        {activities.map((act, index) => {
          const actName = act.localizedActivityName?.[language] || act.activityName;
          const statusText = act.localizedStatusBadge?.[language] || act.statusBadge;
          const reasonText = act.localizedSummaryReason?.[language] || act.summaryReason;

          return (
            <div
              key={act.id}
              onClick={() => onSelectActivity(act)}
              className="p-3.5 hover:bg-[#F8FAFC] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              {/* Left Column: Time & Icon & Details */}
              <div className="flex items-start gap-3 min-w-0">
                {/* Time & Icon Box */}
                <div className="flex sm:flex-col items-center justify-center p-2 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs shrink-0 min-w-[90px] text-center gap-1">
                  <div className="p-1 bg-white border border-[#D6DCE1] rounded-xs text-[#006B3C]">
                    {renderActivityIcon(act.iconName)}
                  </div>
                  <span className="text-[11px] font-bold text-[#17365D] whitespace-nowrap">
                    {act.timeWindow}
                  </span>
                </div>

                {/* Information Content */}
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs sm:text-sm font-bold text-[#1F2933] uppercase tracking-wide">
                      {actName}
                    </h3>
                    {getStatusBadge(act.statusType, statusText)}
                  </div>

                  <p className="text-xs text-[#5B6770] font-medium leading-relaxed">
                    <strong className="text-[#1F2933]">Assessment:</strong> {reasonText}
                  </p>
                </div>
              </div>

              {/* Right Column: Suitability Index Box + Action */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-dashed border-[#D6DCE1]">
                {act.suitabilityScore !== null && (
                  <div className="px-2.5 py-1 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs text-right">
                    <span className="text-[10px] font-bold text-[#5B6770] uppercase block">
                      Suitability Index
                    </span>
                    <span className="text-sm font-bold text-[#006B3C]">
                      {act.suitabilityScore} / 100
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1 text-[11px] font-bold text-[#006B3C]">
                  <span>DETAILS</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#006B3C]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer info */}
      <div className="p-2.5 bg-[#F8FAFC] border-t border-[#D6DCE1] flex items-center justify-between text-[11px] text-[#5B6770]">
        <span>Standard: National Agromet Operational Protocol</span>
        <span>Click any row for detailed guidance</span>
      </div>
    </div>
  );
};
