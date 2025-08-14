"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function MarkdownRenderer({ content, className }: { content: string; className?: string }) {
  return <div className={cn("prose prose-sm max-w-none text-foreground", className)}>{render(content)}</div>;
}

function render(text: string) {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```") ) {
      const lang = line.slice(3).trim() || "text";
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```") ) { code.push(lines[i]); i++; }
      out.push(<CodeBlock key={`code-${i}`} lang={lang} code={code.join("\n")} />);
    } else if (/^#{1,3}\s+/.test(line)) {
      const level = (line.match(/^#+/)?.[0].length || 1) as 1|2|3;
      const Tag = (["h1","h2","h3"] as const)[level - 1];
      out.push(
        <Tag key={`h-${i}`} className={cn(
          level===1&&"text-2xl font-bold mt-6 mb-3",
          level===2&&"text-xl font-semibold mt-5 mb-3",
          level===3&&"text-lg font-semibold mt-4 mb-2"
        )}>{line.replace(/^#{1,3}\s+/, "")}</Tag>
      );
    } else if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s+/, "")); i++; }
      i--;
      out.push(<ol key={`ol-${i}`} className="list-decimal list-inside space-y-1 my-2">{items.map((it, idx) => <li key={idx}>{it}</li>)}</ol>);
    } else if (/^(-|•)\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^(-|•)\s+/.test(lines[i])) { items.push(lines[i].slice(2)); i++; }
      i--;
      out.push(<ul key={`ul-${i}`} className="list-disc list-inside space-y-1 my-2">{items.map((it, idx) => <li key={idx}>{it}</li>)}</ul>);
    } else {
      out.push(<p key={`p-${i}`} className="mb-3">{line || <span className="inline-block h-2" />}</p>);
    }
    i++;
  }
  return out;
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


