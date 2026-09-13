import React from 'react';
import { PhoneCall, Radio } from 'lucide-react';

interface EmergencyContact {
  title: string;
  number: string;
  channel: string;
}

interface EmergencyBroadcastHelplineCardProps {
  contacts?: EmergencyContact[];
}

export const EmergencyBroadcastHelplineCard: React.FC<EmergencyBroadcastHelplineCardProps> = ({
  contacts = [
    { title: 'National Disaster Response Force (NDRF)', number: '1078', channel: 'HQ 24x7 Control' },
    { title: 'State Disaster Management Authority (SDMA)', number: '1070', channel: 'State Toll Free' },
    { title: 'District Emergency Operations Center (DEOC)', number: '1077', channel: 'District EOC' },
    { title: 'Emergency Police / Fire Dispatch', number: '112 / 101', channel: 'First Responders' },
    { title: 'Flood Rescue & Boat Control', number: '020-26123371', channel: 'Water Rescue Dispatch' },
  ],
}) => {
  return (
    <div className="gov-panel bg-white border border-[#D6DCE1] rounded-xs shadow-xs text-[#1F2933]">
      <div className="gov-panel-header bg-white border-b border-[#D6DCE1] px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-[#B42318]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#17365D]">
            Emergency Operations & Rescue Helplines
          </h3>
        </div>
        <span className="text-[10px] font-bold text-[#B42318] uppercase tracking-widest flex items-center gap-1">
          <Radio className="w-2.5 h-2.5 text-[#B42318] animate-pulse" />
          24x7 Hotlines
        </span>
      </div>

      <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {contacts.map((c, idx) => (
          <a
            key={idx}
            href={`tel:${c.number.split('/')[0].trim()}`}
            className="p-2.5 rounded-xs bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#17365D] hover:bg-white transition-all flex items-center justify-between gap-2 group cursor-pointer"
          >
            <div className="min-w-0 flex-1">
              <div className="text-[11.5px] font-bold text-[#1F2933] group-hover:text-[#17365D] transition-colors truncate">
                {c.title}
              </div>
              <div className="text-[9.5px] text-[#5B6770] mt-0.5 truncate">{c.channel}</div>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-xs bg-[#FEF2F2] text-[#B42318] border border-[#FCA5A5] text-[11px] font-black shrink-0">
              <PhoneCall className="w-3 h-3" />
              <span>{c.number}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
