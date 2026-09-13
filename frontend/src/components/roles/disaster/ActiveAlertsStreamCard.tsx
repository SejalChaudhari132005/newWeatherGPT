import React from 'react';
import { AlertCircle, AlertTriangle, ShieldAlert, Clock, MapPin } from 'lucide-react';
import { ActiveAlertItem } from '../../../types/disasterIntelligence';

interface ActiveAlertsStreamCardProps {
  alerts: ActiveAlertItem[];
  onOpenChatWithPrompt?: (prompt: string) => void;
}

export const ActiveAlertsStreamCard: React.FC<ActiveAlertsStreamCardProps> = ({
  alerts,
  onOpenChatWithPrompt,
}) => {
  const getSeverityPill = (sev: string) => {
    switch (sev.toUpperCase()) {
      case 'RED':
        return 'bg-[#B42318] text-white border-[#912018]';
      case 'ORANGE':
        return 'bg-[#DC2626] text-white border-[#B91C1C]';
      case 'YELLOW':
        return 'bg-[#D97706] text-white border-[#B45309]';
      default:
        return 'bg-[#006B3C] text-white border-[#005530]';
    }
  };

  return (
    <div className="gov-panel bg-white border border-[#D6DCE1] rounded-xs shadow-xs text-[#1F2933] overflow-hidden font-sans">
      <div className="gov-panel-header flex items-center justify-between px-3 py-2 bg-[#F8FAFC] border-b border-[#D6DCE1]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-xs bg-[#B42318] shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#17365D] truncate">
            Active Warning Stream ({alerts.length})
          </h3>
        </div>
        <span className="text-[10px] font-bold text-[#5B6770] uppercase tracking-widest shrink-0">
          IMD Official
        </span>
      </div>

      <div className="p-3 space-y-2.5">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="p-3 rounded-xs bg-[#F8FAFC] border border-[#E2E8F0] space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span
                  className={`inline-block px-1.5 py-0.5 rounded-xs text-[9px] font-black uppercase tracking-wider border ${getSeverityPill(
                    alert.severity
                  )}`}
                >
                  IMD {alert.severity} • {alert.hazard_type}
                </span>
                <h4 className="text-xs font-black text-[#1F2933] mt-1 leading-snug">{alert.headline}</h4>
              </div>
              <span className="text-[10px] text-[#5B6770] shrink-0 flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-[#5B6770]" />
                {alert.issued_at}
              </span>
            </div>

            {alert.affected_areas.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#5B6770]">
                <MapPin className="w-3 h-3 text-[#17365D] shrink-0" />
                <span className="font-semibold text-[#1F2933]">Impact Zones:</span>
                {alert.affected_areas.map((area, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.2 rounded-xs bg-white text-[10px] font-bold text-[#17365D] border border-[#CBD5E1]"
                  >
                    {area}
                  </span>
                ))}
              </div>
            )}

            <p className="text-xs text-[#1F2933] bg-white p-2.5 rounded-xs border border-[#CBD5E1] leading-relaxed">
              <span className="text-[#B42318] font-bold">Action Directive: </span>
              {alert.action_advisory}
            </p>

            <div className="flex items-center justify-between text-[10px] text-[#5B6770] pt-0.5">
              <span>Source: {alert.source}</span>
              {onOpenChatWithPrompt && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenChatWithPrompt(
                      `Explain emergency operational guidelines for ${alert.headline} in ${alert.affected_areas.join(
                        ', '
                      )}.`
                    )
                  }
                  className="text-[#17365D] hover:underline font-bold transition-colors cursor-pointer"
                >
                  Ask EOC Assistant &rarr;
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
