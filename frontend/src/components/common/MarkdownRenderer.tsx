import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isUser?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  isUser = false,
}) => {
  if (!content) return null;

  // Helper to parse inline markdown (bold, italic, code)
  const parseInline = (text: string) => {
    // Regex for bold **text**, code `text`, italic *text*
    const tokens: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Bold match: **text**
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      // Code match: `text`
      const codeMatch = remaining.match(/`(.+?)`/);
      // Italic match: *text* (single asterisk)
      const italicMatch = remaining.match(/(?<!\*)\*([^*]+?)\*(?!\*)/);

      // Find first matching token
      let firstMatch: { type: 'bold' | 'code' | 'italic'; index: number; length: number; content: string } | null = null;

      if (boldMatch && boldMatch.index !== undefined) {
        firstMatch = { type: 'bold', index: boldMatch.index, length: boldMatch[0].length, content: boldMatch[1] };
      }
      if (codeMatch && codeMatch.index !== undefined) {
        if (!firstMatch || codeMatch.index < firstMatch.index) {
          firstMatch = { type: 'code', index: codeMatch.index, length: codeMatch[0].length, content: codeMatch[1] };
        }
      }
      if (italicMatch && italicMatch.index !== undefined) {
        if (!firstMatch || italicMatch.index < firstMatch.index) {
          firstMatch = { type: 'italic', index: italicMatch.index, length: italicMatch[0].length, content: italicMatch[1] };
        }
      }

      if (!firstMatch) {
        tokens.push(remaining);
        break;
      }

      // Add text before match
      if (firstMatch.index > 0) {
        tokens.push(remaining.substring(0, firstMatch.index));
      }

      // Add styled component
      if (firstMatch.type === 'bold') {
        tokens.push(
          <strong
            key={`b_${key++}`}
            className={isUser ? 'font-black text-white' : 'font-extrabold text-slate-950'}
          >
            {firstMatch.content}
          </strong>
        );
      } else if (firstMatch.type === 'code') {
        tokens.push(
          <code
            key={`c_${key++}`}
            className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
              isUser ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-900 border border-slate-200/80'
            }`}
          >
            {firstMatch.content}
          </code>
        );
      } else if (firstMatch.type === 'italic') {
        tokens.push(
          <em key={`i_${key++}`} className="italic">
            {firstMatch.content}
          </em>
        );
      }

      remaining = remaining.substring(firstMatch.index + firstMatch.length);
    }

    return tokens;
  };

  // Split lines and parse blocks
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let listKey = 0;

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul_${listKey++}`} className="space-y-1 my-1.5 pl-1.5">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      elements.push(<div key={`gap_${idx}`} className="h-1.5" />);
      return;
    }

    // Header match: ### or ##
    if (line.startsWith('### ') || line.startsWith('## ') || line.startsWith('# ')) {
      flushList();
      const headerText = line.replace(/^#+\s*/, '');
      elements.push(
        <div
          key={`h_${idx}`}
          className={`font-black text-xs sm:text-sm tracking-tight pt-1.5 pb-0.5 ${
            isUser ? 'text-white' : 'text-slate-900'
          }`}
        >
          {parseInline(headerText)}
        </div>
      );
      return;
    }

    // Bullet match: - or * or •
    if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
      const bulletText = line.replace(/^[-*•]\s*/, '');
      currentList.push(
        <li key={`li_${idx}`} className="flex items-start gap-1.5 text-xs leading-relaxed">
          <span className={`inline-block w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
            isUser ? 'bg-white' : 'bg-blue-600'
          }`} />
          <div className="flex-1 min-w-0">{parseInline(bulletText)}</div>
        </li>
      );
      return;
    }

    // Numbered list match: 1. or 2.
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      flushList();
      elements.push(
        <div key={`num_${idx}`} className="flex items-start gap-1.5 text-xs leading-relaxed my-0.5 pl-1">
          <span className={`font-black text-[11px] shrink-0 ${isUser ? 'text-blue-100' : 'text-blue-700'}`}>
            {numMatch[1]}.
          </span>
          <div className="flex-1 min-w-0">{parseInline(numMatch[2])}</div>
        </div>
      );
      return;
    }

    // Normal paragraph
    flushList();
    elements.push(
      <p key={`p_${idx}`} className="text-xs leading-relaxed my-0.5">
        {parseInline(line)}
      </p>
    );
  });

  flushList();

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
};
