"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RefreshCcw } from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, XAxis, YAxis
} from "recharts";

// Example findings data for visualization
const findingsData = [
  { severity: "Critical", count: 0 },
  { severity: "High", count: 0 },
  { severity: "Medium", count: 3 },
  { severity: "Low", count: 1 },
];

const findingTypes = [
  { type: "Input Validation", count: 1 },
  { type: "Error Handling", count: 1 },
  { type: "Dependency Hygiene", count: 1 },
  { type: "Outdated Package", count: 1 },
];

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "#e11d48",
  High: "#f59e42",
  Medium: "#fbbf24",
  Low: "#10b981",
};

// Custom legend for severity
function SeverityLegend() {
  return (
    <div className="flex flex-wrap gap-3 justify-center mt-2">
      {findingsData.map((entry) => (
        <div key={entry.severity} className="flex items-center gap-1 text-xs">
          <span style={{ background: SEVERITY_COLORS[entry.severity], width: 12, height: 12, borderRadius: 3, display: 'inline-block' }} />
          <span>{entry.severity}</span>
        </div>
      ))}
    </div>
  );
}

function SeverityPieChart() {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie
          data={findingsData}
          dataKey="count"
          nameKey="severity"
          cx="50%"
          cy="50%"
          outerRadius={60}
          label={({ name, percent }: { name: string; percent: number }) => `${name} (${(percent * 100).toFixed(0)}%)`}
        >
          {findingsData.map((entry, idx) => (
            <Cell key={`cell-${idx}`} fill={SEVERITY_COLORS[entry.severity] || "#8884d8"} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

function FindingTypeBarChart() {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={findingTypes} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
        {/* <XAxis type="number" hide /> */}
        {/* <YAxis dataKey="type" type="category" width={120} /> */}
        <Bar dataKey="count" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={18} />
        <Tooltip />
      </BarChart>
    </ResponsiveContainer>
  );
}

type AuditPanelProps = {
  className?: string;
};

const SAMPLE_AUDIT = `Qasly Labs – Repository security review

Summary
- No critical secrets found in repo contents.
- 3 medium-risk patterns detected (input validation, error handling, dependency pinning).
- 1 outdated dependency with known CVE.

Key findings
1) Input validation at API boundaries
   - Several handlers accept untyped JSON; validate shape and length.
   - Prefer zod schemas and early returns.

2) Error handling leaks implementation details
   - Replace raw error messages with stable error codes.
   - Centralize logging with redaction for PII.

3) Dependency hygiene
   - Pin versions in package.json; avoid wide ranges.
   - Add weekly audit in CI (npm audit / osv).

4) Outdated package
   - simple-git < 3.x includes transitive vulnerability (low severity). Upgrade recommended.

Recommended actions
- Add request validation middleware (zod) for all routes.
- Introduce centralized error mapper with consistent status codes.
- Lock dependency versions and enable Renovate.
- Add pre-commit secret scan and CI SBOM step.
`;

export function AuditPanel({ className }: AuditPanelProps) {
  const [display, setDisplay] = React.useState<string>("");
  const [isAnimating, setIsAnimating] = React.useState<boolean>(true);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let i = 0;
    setDisplay("");
    setIsAnimating(true);
    const step = () => {
      i += Math.max(1, Math.floor(Math.random() * 3));
      const next = SAMPLE_AUDIT.slice(0, i);
      setDisplay(next);
      containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight });
      if (i < SAMPLE_AUDIT.length) {
        animation = window.setTimeout(step, 12);
      } else {
        setIsAnimating(false);
      }
    };
    let animation = window.setTimeout(step, 120);
    return () => window.clearTimeout(animation);
  }, []);

  const handleRegenerate = () => {
    // re-run the animation
    setDisplay("");
    setIsAnimating(true);
    let i = 0;
    const step = () => {
      i += Math.max(1, Math.floor(Math.random() * 3));
      const next = SAMPLE_AUDIT.slice(0, i);
      setDisplay(next);
      containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight });
      if (i < SAMPLE_AUDIT.length) {
        animation = window.setTimeout(step, 12);
      } else {
        setIsAnimating(false);
      }
    };
    let animation = window.setTimeout(step, 120);
  };

  return (
    <div className={cn("h-full flex flex-col bg-card/30 border-t", className)}>
      <div className="h-10 px-4 border-b bg-muted/20 flex items-center justify-between">
        <div className="text-micro text-muted-foreground">AI Audit</div>
        <div>
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleRegenerate}>
            <RefreshCcw className="size-4 mr-1" />
            Rerun
          </Button>
        </div>
      </div>
      {/* Charts Section */}
      <div className="flex flex-col md:flex-row gap-6 p-4 pb-0">
        <div className="flex-1 min-w-[220px] bg-background/60 rounded-lg border p-4 flex flex-col items-center">
          <div className="font-semibold mb-2 text-sm">Severity Distribution</div>
          <SeverityPieChart />
          <SeverityLegend />
        </div>
        <div className="flex-1 min-w-[220px] bg-background/60 rounded-lg border p-4 flex flex-col items-center">
          <div className="font-semibold mb-2 text-sm">Finding Types</div>
          <FindingTypeBarChart />
        </div>
      </div>
      <ScrollArea className="flex-1" viewportRef={containerRef}>
        <div className="p-4">
          <pre className={cn("whitespace-pre-wrap text-[13.5px] leading-6 text-surgical", isAnimating && "animate-pulse-[0.9]")}>{display}</pre>
        </div>
      </ScrollArea>
    </div>
  );
}


