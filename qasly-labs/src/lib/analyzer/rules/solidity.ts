import { Finding, Severity } from "@/types/finding";

// Initial regex heuristics; AST-based checks will be added with tree-sitter
const regexRules: Array<{ id: string; pattern: RegExp; severity: Severity; cwe?: string; description: string; suggestedFix?: string }> = [
  {
    id: "sol-call",
    pattern: /\.(call|delegatecall)\s*\{/g,
    severity: "high",
    cwe: "CWE-841",
    description: "Dangerous external call detected; potential reentrancy.",
    suggestedFix: "Adopt checks-effects-interactions; add nonReentrant guard; move state changes before external calls.",
  },
  {
    id: "sol-loop-unbounded",
    pattern: /for\s*\(.*;.*<\s*(n|.*length)/gi,
    severity: "high",
    cwe: "CWE-400",
    description: "Unbounded loop may cause gas DoS.",
    suggestedFix: "Bound iterations; limit batch size; validate inputs with require().",
  },
  {
    id: "sol-rand-timestamp",
    pattern: /block\.(timestamp|number)|\bnow\b/g,
    severity: "medium",
    cwe: "CWE-338",
    description: "Weak randomness source (miner-influenced).",
    suggestedFix: "Use Chainlink VRF or a commit-reveal scheme.",
  },
  {
    id: "sol-pragma-legacy",
    pattern: /pragma\s+solidity\s+(\^0\.[67]|<\s*0\.8)/i,
    severity: "medium",
    cwe: "CWE-682",
    description: "Legacy Solidity without built-in overflow checks.",
    suggestedFix: "Upgrade to Solidity 0.8+; re-test arithmetic and error flows.",
  },
];

export function analyzeSolidity(file: string, source: string): Finding[] {
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


