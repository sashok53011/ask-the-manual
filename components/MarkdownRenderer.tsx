/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import katex from 'katex';
import { CodeBlock } from './CodeBlock';
import { useTheme } from '../themes/themeContext';

interface MarkdownRendererProps {
  content: string;
}

/**
 * Safely render KaTeX math expressions
 */
function renderMath(expr: string, displayMode: boolean): string {
  try {
    return katex.renderToString(expr.trim(), {
      displayMode,
      throwOnError: false,
    });
  } catch (e) {
    return `<span class="text-amber-400 font-mono">${expr}</span>`;
  }
}

/**
 * Parse text that may contain inline math ($...$) or inline code (`...`) or bold/italic
 */
function formatInlineContent(text: string): React.ReactNode {
  if (!text) return null;

  // First handle inline math: $formula$
  // Avoid matching escaped \$ or currency like $100
  const mathRegex = /\$([^\$\n]+?)\$/g;
  const segments: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push(renderFormatting(text.slice(lastIndex, match.index)));
    }
    const mathExpr = match[1];
    const html = renderMath(mathExpr, false);
    segments.push(
      <span
        key={`math-${match.index}`}
        className="inline-math px-1 mx-0.5 rounded text-indigo-300"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
    lastIndex = mathRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push(renderFormatting(text.slice(lastIndex)));
  }

  return <>{segments}</>;
}

function renderFormatting(str: string): React.ReactNode {
  // Split by inline code `code`
  const codeParts = str.split(/`([^`]+)`/g);
  return codeParts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded font-mono text-xs font-semibold bg-black/25 text-emerald-300 border border-white/10"
        >
          {part}
        </code>
      );
    }

    // Replace bold, italic, links
    return (
      <span
        key={i}
        dangerouslySetInnerHTML={{
          __html: part
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-sky-400 underline underline-offset-2 hover:text-sky-300">$1</a>'),
        }}
      />
    );
  });
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const { activeColors, rainbowGradientStyle } = useTheme();

  if (!content) return null;

  // Split into blocks: code blocks, block math ($$ ... $$), tables, lists, headers, paragraphs
  const blocks: React.ReactNode[] = [];
  const lines = content.split('\n');

  let inCode = false;
  let codeBuffer: string[] = [];
  let codeLang = '';
  let codeFilename = '';

  let inBlockMath = false;
  let mathBuffer: string[] = [];

  let inTable = false;
  let tableBuffer: string[] = [];

  let listBuffer: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flushList = (key: string) => {
    if (!listBuffer) return;
    const ListTag = listBuffer.type;
    blocks.push(
      <ListTag
        key={key}
        className={`my-3 pl-6 space-y-1 ${
          listBuffer.type === 'ol' ? 'list-decimal' : 'list-disc'
        }`}
      >
        {listBuffer.items.map((it, idx) => (
          <li key={idx} className="leading-relaxed">
            {formatInlineContent(it)}
          </li>
        ))}
      </ListTag>
    );
    listBuffer = null;
  };

  const flushTable = (key: string) => {
    if (tableBuffer.length === 0) return;
    const rows = tableBuffer
      .map((r) => r.trim())
      .filter((r) => r.startsWith('|'))
      .map((r) =>
        r
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim())
      );

    if (rows.length > 0) {
      const header = rows[0];
      const dataRows = rows.slice(1).filter((r) => !r.every((c) => /^-+$/.test(c)));

      blocks.push(
        <div key={key} className="my-4 overflow-x-auto rounded-lg border border-white/10 shadow-sm">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead className="bg-white/10 border-b border-white/10">
              <tr>
                {header.map((col, idx) => (
                  <th key={idx} className="px-4 py-2 font-bold text-slate-200">
                    {formatInlineContent(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dataRows.map((r, rIdx) => (
                <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                  {r.map((col, cIdx) => (
                    <td key={cIdx} className="px-4 py-2">
                      {formatInlineContent(col)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    tableBuffer = [];
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check code fence start / end
    if (trimmed.startsWith('```')) {
      if (!inCode) {
        flushList(`list-before-code-${i}`);
        flushTable(`table-before-code-${i}`);
        inCode = true;
        codeBuffer = [];

        // Parse language and optional filename e.g. ```typescript:src/app.ts or ```bash file=test.sh
        const rest = trimmed.slice(3).trim();
        let lang = rest;
        let fname = '';

        if (rest.includes(':')) {
          const [l, f] = rest.split(':');
          lang = l.trim();
          fname = f.trim();
        } else if (rest.includes('file=')) {
          const parts = rest.split(/\s+/);
          lang = parts[0];
          const fPart = parts.find((p) => p.startsWith('file='));
          if (fPart) fname = fPart.replace('file=', '').replace(/["']/g, '');
        }

        codeLang = lang;
        codeFilename = fname;
      } else {
        inCode = false;
        const fullCode = codeBuffer.join('\n');
        blocks.push(
          <CodeBlock
            key={`code-${i}`}
            code={fullCode}
            language={codeLang}
            filename={codeFilename || undefined}
          />
        );
        codeBuffer = [];
        codeLang = '';
        codeFilename = '';
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(rawLine);
      continue;
    }

    // Check block math start/end ($$)
    if (trimmed.startsWith('$$')) {
      if (!inBlockMath) {
        flushList(`list-before-math-${i}`);
        flushTable(`table-before-math-${i}`);
        inBlockMath = true;
        mathBuffer = [];
        const contentAfter = trimmed.slice(2).trim();
        if (contentAfter.endsWith('$$') && contentAfter.length > 2) {
          // Single line block math $$ formula $$
          const formula = contentAfter.slice(0, -2).trim();
          const html = renderMath(formula, true);
          blocks.push(
            <div
              key={`math-block-${i}`}
              className="my-3 py-3 px-4 bg-black/20 rounded-lg text-center overflow-x-auto border border-white/10"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
          inBlockMath = false;
        } else if (contentAfter) {
          mathBuffer.push(contentAfter);
        }
      } else {
        inBlockMath = false;
        const formula = mathBuffer.join('\n');
        const html = renderMath(formula, true);
        blocks.push(
          <div
            key={`math-block-${i}`}
            className="my-3 py-3 px-4 bg-black/20 rounded-lg text-center overflow-x-auto border border-white/10"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
        mathBuffer = [];
      }
      continue;
    }

    if (inBlockMath) {
      if (trimmed.endsWith('$$')) {
        inBlockMath = false;
        const lastPart = trimmed.slice(0, -2);
        if (lastPart) mathBuffer.push(lastPart);
        const formula = mathBuffer.join('\n');
        const html = renderMath(formula, true);
        blocks.push(
          <div
            key={`math-block-${i}`}
            className="my-3 py-3 px-4 bg-black/20 rounded-lg text-center overflow-x-auto border border-white/10"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
        mathBuffer = [];
      } else {
        mathBuffer.push(rawLine);
      }
      continue;
    }

    // Check table row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList(`list-before-table-${i}`);
      inTable = true;
      tableBuffer.push(trimmed);
      continue;
    } else if (inTable) {
      flushTable(`table-${i}`);
    }

    // Check headings
    if (trimmed.startsWith('#')) {
      flushList(`list-before-h-${i}`);
      const hMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
      if (hMatch) {
        const level = hMatch[1].length;
        const text = hMatch[2];
        if (level === 1) {
          blocks.push(
            <div key={`h1-${i}`} className="mt-5 mb-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight pb-1">
                {formatInlineContent(text)}
              </h1>
              <div className="h-[2px] w-24 rounded-full mt-1" style={{ background: rainbowGradientStyle }} />
            </div>
          );
        } else if (level === 2) {
          blocks.push(
            <h2 key={`h2-${i}`} className="text-lg sm:text-xl font-bold mt-4 mb-2 text-slate-100 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full" style={{ backgroundColor: activeColors.rainbow[1] }} />
              {formatInlineContent(text)}
            </h2>
          );
        } else if (level === 3) {
          blocks.push(
            <h3 key={`h3-${i}`} className="text-base sm:text-lg font-semibold mt-3 mb-1.5 text-slate-200">
              {formatInlineContent(text)}
            </h3>
          );
        } else {
          blocks.push(
            <h4 key={`h4-${i}`} className="text-sm sm:text-base font-semibold mt-2 mb-1 text-slate-300">
              {formatInlineContent(text)}
            </h4>
          );
        }
        continue;
      }
    }

    // Check Blockquote
    if (trimmed.startsWith('>')) {
      flushList(`list-before-quote-${i}`);
      const quoteText = trimmed.replace(/^>\s*/, '');
      blocks.push(
        <blockquote
          key={`quote-${i}`}
          className="my-3 pl-4 py-1 border-l-4 italic bg-white/5 rounded-r"
          style={{ borderColor: activeColors.accent }}
        >
          {formatInlineContent(quoteText)}
        </blockquote>
      );
      continue;
    }

    // Check unordered list item (* or -)
    const ulMatch = trimmed.match(/^[\*\-]\s+(.+)$/);
    if (ulMatch) {
      if (!listBuffer || listBuffer.type !== 'ul') {
        flushList(`list-switch-${i}`);
        listBuffer = { type: 'ul', items: [] };
      }
      listBuffer.items.push(ulMatch[1]);
      continue;
    }

    // Check ordered list item (1.)
    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (!listBuffer || listBuffer.type !== 'ol') {
        flushList(`list-switch-${i}`);
        listBuffer = { type: 'ol', items: [] };
      }
      listBuffer.items.push(olMatch[1]);
      continue;
    }

    // Empty line separates blocks
    if (trimmed === '') {
      flushList(`list-empty-${i}`);
      continue;
    }

    // Regular paragraph
    flushList(`list-p-${i}`);
    blocks.push(
      <p key={`p-${i}`} className="my-2 leading-relaxed">
        {formatInlineContent(rawLine)}
      </p>
    );
  }

  // Cleanup pending
  flushList('list-end');
  flushTable('table-end');
  if (inCode && codeBuffer.length > 0) {
    blocks.push(
      <CodeBlock
        key="code-final"
        code={codeBuffer.join('\n')}
        language={codeLang}
        filename={codeFilename || undefined}
      />
    );
  }

  return <div className="markdown-body space-y-1 text-inherit">{blocks}</div>;
};
