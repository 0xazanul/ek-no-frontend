"use client";

import * as React from "react";
import { Finding } from "@/types/finding";
import { cn } from "@/lib/utils";
import { Package, Shield, AlertTriangle } from "lucide-react";
import { badge } from "@/lib/utils"; // Import badge from utils

type Props = {
  findings: Finding[];
  onJump?: (line: number) => void;
  className?: string;
};

function getIssueIcon(finding: Finding) {
  if (finding.osvId) {
    return <Package className="size-3.5" />;
  } else if (finding.cwe) {
    return <Shield className="size-3.5" />;
  }
  return <AlertTriangle className="size-3.5" />;
}

export function IssuesPanel({ findings, onJump, className }: Props) {
  // Group findings by type (OSV vs regular)
  const osvFindings = findings.filter(f => f.osvId);
  const codeFindings = findings.filter(f => !f.osvId);
  
  // Calculate counts
  const osvCount = osvFindings.length;
  const codeCount = codeFindings.length;
  
  return (
    <div className={cn("h-full overflow-auto border-l bg-card/30", className)}>
      <div className="p-3 text-xs text-muted-foreground border-b flex justify-between">
        <span>Security Issues ({findings.length})</span>
        <div className="flex gap-2">
          {osvCount > 0 && (
            <span className="flex items-center gap-1">
              <Package className="size-3" />
              <span>{osvCount}</span>
            </span>
          )}
          {codeCount > 0 && (
            <span className="flex items-center gap-1">
              <Shield className="size-3" />
              <span>{codeCount}</span>
            </span>
          )}
        </div>
      </div>
      
      {/* Dependency Vulnerabilities Section */}
      {osvCount > 0 && (
        <div className="border-b">
          <div className="px-3 py-2 text-xs font-medium bg-muted/30 flex items-center gap-1.5">
            <Package className="size-3.5" />
            <span>Dependency Vulnerabilities</span>
          </div>
          <div className="divide-y">
            {osvFindings.map((f, idx) => (
              <button
                key={`${f.file}-${f.line}-${idx}-osv`}
                onClick={() => onJump?.(f.line)}
                className="w-full text-left p-3 hover:bg-accent/40 transition-colors"
              >
                <div className="flex items-center gap-2 text-xs mb-1">
                  <span className={cn("px-1.5 py-0.5 rounded border", badge(f.severity))}>{f.severity.toUpperCase()}</span>
                  {f.cveId && <span className="px-1 py-0.5 rounded bg-muted text-muted-foreground border text-[11px]">{f.cveId}</span>}
                  <span className="text-muted-foreground ml-auto">{f.packageName}@{f.packageVersion}</span>
                </div>
                <div className="text-[13px] leading-5">{f.description}</div>
                {f.suggestedFix && (
                  <div className="text-[12px] text-muted-foreground mt-1">Fix: {f.suggestedFix}</div>
                )}
                {f.references && f.references.length > 0 && (
                  <div className="mt-2 text-[11px] text-muted-foreground">
                    References:
                    {f.references.map((ref, refIdx) => (
                      <React.Fragment key={refIdx}>
                        <a 
                          href={ref.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-primary hover:underline ml-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          [{refIdx + 1}]
                        </a>
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Code Issues Section */}
      {codeCount > 0 && (
        <div>
          {osvCount > 0 && (
            <div className="px-3 py-2 text-xs font-medium bg-muted/30 flex items-center gap-1.5">
              <Shield className="size-3.5" />
              <span>Code Vulnerabilities</span>
            </div>
          )}
          <div className="divide-y">
            {codeFindings.map((f, idx) => (
              <button
                key={`${f.file}-${f.line}-${idx}-code`}
                onClick={() => onJump?.(f.line)}
                className="w-full text-left p-3 hover:bg-accent/40 transition-colors"
              >
                <div className="flex items-center gap-2 text-xs mb-1">
                  <span className={cn("px-1.5 py-0.5 rounded border", badge(f.severity))}>{f.severity.toUpperCase()}</span>
                  {f.cwe && <span className="px-1 py-0.5 rounded bg-muted text-muted-foreground border text-[11px]">CWE-{f.cwe}</span>}
                  <span className="text-muted-foreground">Line {f.line}</span>
                </div>
                <div className="text-[13px] leading-5">{f.description}</div>
                {f.suggestedFix && (
                  <div className="text-[12px] text-muted-foreground mt-1">Fix: {f.suggestedFix}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {findings.length === 0 && (
        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
          <Shield className="size-5 mb-2" />
          <p className="text-sm">No security issues found</p>
        </div>
      )}
    </div>
  );
}


