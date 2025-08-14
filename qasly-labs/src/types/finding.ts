export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type Finding = {
  file: string;
  line: number;
  endLine?: number;
  severity: Severity;
  cwe?: string;
  description: string;
  suggestedFix?: string;
  ruleId?: string;
};


