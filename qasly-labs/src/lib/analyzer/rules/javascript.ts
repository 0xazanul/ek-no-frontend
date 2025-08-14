import { Finding, Severity } from "@/types/finding";

// Simple regex rules to start; AST rules will be added with tree-sitter
const regexRules: Array<{ id: string; pattern: RegExp; severity: Severity; cwe?: string; description: string; suggestedFix?: string }> = [
  {
    id: "js-eval",
    pattern: /\beval\s*\(/g,
    severity: "high",
    cwe: "CWE-95",
    description: "Use of eval() can lead to code injection vulnerabilities.",
    suggestedFix: "Avoid eval(); use JSON.parse or safer alternatives.",
  },
  {
    id: "js-innerhtml",
    pattern: /\.innerHTML\s*=/g,
    severity: "high",
    cwe: "CWE-79",
    description: "Direct innerHTML assignment can cause XSS.",
    suggestedFix: "Use textContent or sanitize HTML before insertion.",
  },
  {
    id: "js-document-write",
    pattern: /document\.write\s*\(/g,
    severity: "medium",
    cwe: "CWE-79",
    description: "document.write can be abused for XSS.",
    suggestedFix: "Use DOM APIs to create and insert elements safely.",
  },
];

export function analyzeJavascript(file: string, source: string): Finding[] {
  const findings: Finding[] = [];
  const lines = source.split("\n");

  for (const rule of regexRules) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (rule.pattern.test(line)) {
        findings.push({
          file,
          line: i + 1,
          severity: rule.severity,
          cwe: rule.cwe,
          description: rule.description,
          suggestedFix: rule.suggestedFix,
          ruleId: rule.id,
        });
      }
    }
  }
  return findings;
}


