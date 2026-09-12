import React from 'react';
import { PromptSuggestion } from '../../types/chat';

interface Props {
  suggestion: PromptSuggestion;
  onClick: (text: string) => void;
}

export const SuggestionCard: React.FC<Props> = ({ suggestion, onClick }) => {
  return (
    <button
      onClick={() => onClick(suggestion.text || suggestion.prompt || '')}
      className="p-2.5 sm:p-3 rounded-2xl bg-white hover:bg-sky-50/80 border border-slate-200/90 hover:border-[#004aad]/50 shadow-2xs hover:shadow-xs transition-all text-left flex items-center gap-2.5 group cursor-pointer font-['Arimo'] w-full"
    >
      <span className="text-lg p-1.5 rounded-xl bg-slate-50 group-hover:bg-sky-100/60 shrink-0 text-center">
        {suggestion.icon}
      </span>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-bold text-slate-800 group-hover:text-[#004aad] transition-colors leading-snug block line-clamp-2">
          {suggestion.text}
        </span>
      </div>
    </button>
  );
};

