"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function MarkdownRenderer({ content, className }: { content: string; className?: string }) {
  return <div className={cn("prose prose-sm max-w-none text-foreground prose-table:border prose-table:border-border prose-th:bg-muted/40 prose-th:text-foreground prose-td:border prose-td:border-border prose-code:bg-muted/30 prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-pre:bg-muted/40 prose-pre:rounded-lg prose-pre:p-3 prose-pre:overflow-x-auto", className)}>{render(content)}</div>;
}

function render(text: string) {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // Tables
    if (line.includes("|") && lines[i + 1]?.includes("|") && lines[i + 1]?.includes("-")) {
      const tableLines: string[] = [line];
      i++;
      // Header separator
      tableLines.push(lines[i]);
      i++;
      // Table rows
      while (i < lines.length && lines[i].includes("|")) { 
        tableLines.push(lines[i]); 
        i++; 
      }
      i--;
      out.push(<Table key={`table-${i}`} lines={tableLines} />);
    }
    // Code blocks
    else if (line.startsWith("```")) {
      const lang = line.slice(3).trim() || "text";
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { 
        code.push(lines[i]); 
        i++; 
      }
      out.push(<CodeBlock key={`code-${i}`} lang={lang} code={code.join("\n")} />);
    }
    // Enhanced blockquotes with styling based on content
    else if (/^>{1,}/.test(line)) {
      const quoteLines: string[] = [];
      let quoteType = 'default';
      
      while (i < lines.length && /^>{1,}/.test(lines[i])) { 
        const quoteLine = lines[i].replace(/^>{1,}\s*/, "");
        quoteLines.push(quoteLine);
        
        // Detect quote type for styling
        if (quoteLine.includes('**Thinking Process:**') || quoteLine.includes('**Pattern Recognition:**')) {
          quoteType = 'thinking';
        } else if (quoteLine.includes('**Warning:**') || quoteLine.includes('**Alert:**')) {
          quoteType = 'warning';
        } else if (quoteLine.includes('**Success:**') || quoteLine.includes('**Fixed:**')) {
          quoteType = 'success';
        }
        
        i++; 
      }
      i--;
      out.push(<EnhancedBlockquote key={`bq-${i}`} type={quoteType} content={quoteLines.join(" ")} />);
    }
    // Headings with emoji support
    else if (/^#{1,6}\s+/.test(line)) {
      const level = (line.match(/^#+/)?.[0].length || 1) as 1|2|3|4|5|6;
      const Tag = (["h1","h2","h3","h4","h5","h6"] as const)[level - 1];
      const content = line.replace(/^#{1,6}\s+/, "");
      out.push(
        <Tag key={`h-${i}`} className={cn(
          level===1&&"text-2xl font-bold mt-6 mb-4 text-primary border-b border-border/50 pb-2",
          level===2&&"text-xl font-semibold mt-5 mb-3 text-foreground",
          level===3&&"text-lg font-semibold mt-4 mb-2 text-foreground",
          level===4&&"text-base font-semibold mt-3 mb-2 text-muted-foreground",
          level===5&&"text-sm font-semibold mt-2 mb-1 text-muted-foreground",
          level===6&&"text-xs font-semibold mt-2 mb-1 text-muted-foreground"
        )}>
          {parseInlineElements(content)}
        </Tag>
      );
    }
    // Ordered lists
    else if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) { 
        items.push(lines[i].replace(/^\d+\.\s+/, "")); 
        i++; 
      }
      i--;
      out.push(
        <ol key={`ol-${i}`} className="list-decimal list-inside space-y-2 my-3 pl-4">
          {items.map((it, idx) => (
            <li key={idx} className="text-foreground leading-relaxed">
              {parseInlineElements(it)}
            </li>
          ))}
        </ol>
      );
    }
    // Unordered lists
    else if (/^(-|•|\*)\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^(-|•|\*)\s+/.test(lines[i])) { 
        items.push(lines[i].replace(/^(-|•|\*)\s+/, "")); 
        i++; 
      }
      i--;
      out.push(
        <ul key={`ul-${i}`} className="list-disc list-inside space-y-2 my-3 pl-4">
          {items.map((it, idx) => (
            <li key={idx} className="text-foreground leading-relaxed">
              {parseInlineElements(it)}
            </li>
          ))}
        </ul>
      );
    }
    // Enhanced paragraphs with inline elements
    else if (line.trim()) {
      out.push(
        <p key={`p-${i}`} className="mb-3 leading-relaxed text-foreground">
          {parseInlineElements(line)}
        </p>
      );
    }
    // Empty lines
    else {
      out.push(<div key={`br-${i}`} className="h-2" />);
    }
    i++;
  }
  return out;
}

// Parse inline elements like bold, italic, code, links
function parseInlineElements(text: string): React.ReactNode {
  // Handle inline code first
  const codeRegex = /`([^`]+)`/g;
  const parts = text.split(codeRegex);
  
  return parts.map((part, idx) => {
    if (idx % 2 === 1) {
      // This is code
      return (
        <code key={idx} className="bg-muted/60 px-1.5 py-0.5 rounded text-sm font-mono text-primary border">
          {part}
        </code>
      );
    }
    
    // Handle bold text **text**
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const boldParts = part.split(boldRegex);
    
    return boldParts.map((boldPart, boldIdx) => {
      if (boldIdx % 2 === 1) {
        return <strong key={`${idx}-${boldIdx}`} className="font-semibold text-foreground">{boldPart}</strong>;
      }
      
      // Handle italic text *text*
      const italicRegex = /\*([^*]+)\*/g;
      const italicParts = boldPart.split(italicRegex);
      
      return italicParts.map((italicPart, italicIdx) => {
        if (italicIdx % 2 === 1) {
          return <em key={`${idx}-${boldIdx}-${italicIdx}`} className="italic">{italicPart}</em>;
        }
        return italicPart;
      });
    });
  });
}

// Enhanced blockquote component
function EnhancedBlockquote({ type, content }: { type: string; content: string }) {
  const getStyles = () => {
    switch (type) {
      case 'thinking':
        return "border-l-4 border-blue-500/70 bg-blue-50/50 dark:bg-blue-950/30 px-4 py-3 my-4 rounded-r-lg";
      case 'warning':
        return "border-l-4 border-yellow-500/70 bg-yellow-50/50 dark:bg-yellow-950/30 px-4 py-3 my-4 rounded-r-lg";
      case 'success':
        return "border-l-4 border-green-500/70 bg-green-50/50 dark:bg-green-950/30 px-4 py-3 my-4 rounded-r-lg";
      default:
        return "border-l-4 border-primary/60 bg-muted/30 px-4 py-3 my-4 italic text-muted-foreground rounded-r-lg";
    }
  };
  
  return (
    <blockquote className={getStyles()}>
      {parseInlineElements(content)}
    </blockquote>
  );
}

// Table component
function Table({ lines }: { lines: string[] }) {
  const headers = lines[0].split("|").map(h => h.trim()).filter(h => h);
  const rows = lines.slice(2).map(line => 
    line.split("|").map(cell => cell.trim()).filter(cell => cell)
  );
  
  return (
    <div className="my-4 overflow-x-auto">
      <table className="min-w-full border border-border rounded-lg overflow-hidden">
        <thead className="bg-muted/50">
          <tr>
            {headers.map((header, idx) => (
              <th key={idx} className="px-4 py-2 text-left font-semibold text-foreground border-b border-border">
                {parseInlineElements(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-muted/30 transition-colors">
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="px-4 py-2 border-b border-border/50 text-foreground">
                  {parseInlineElements(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = React.useState(false);
  const onCopy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch {}
  };
  return (
    <div className="my-3 bg-muted/40 rounded-lg border overflow-hidden">
      <div className="px-3 py-1 bg-muted/60 border-b text-xs text-muted-foreground flex items-center justify-between">
        <span className="font-mono">{lang}</span>
        <button onClick={onCopy} className="px-2 py-0.5 rounded border hover:bg-accent/50 text-foreground text-xs">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto"><code className="text-sm font-mono whitespace-pre">{code}</code></pre>
    </div>
  );
}


