"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RefreshCcw } from "lucide-react";
import VisualSummaryDashboard from "./visual-summary-dashboard";
import type { Finding } from "@/types/finding";

type AuditPanelProps = {
  className?: string;
  findings: Finding[];
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

export function AuditPanel({ className, findings }: AuditPanelProps) {
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
      {/* Visual Summary Dashboard - only show if findings exist */}
      {findings && findings.length > 0 && (
        <VisualSummaryDashboard findings={findings} />
      )}
      <div className="h-10 px-4 border-b bg-muted/20 flex items-center justify-between">
        <div className="text-micro text-muted-foreground">AI Audit</div>
        <div>
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleRegenerate}>
            <RefreshCcw className="size-4 mr-1" />
            Rerun
          </Button>
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


