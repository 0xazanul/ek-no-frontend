import { Finding } from "@/types/finding";
import { analyzeSolidity } from "@/lib/analyzer/rules/solidity";
import { analyzeJavascript } from "@/lib/analyzer/rules/javascript";

export function inferLanguageFromPath(path: string | undefined): string {
  if (!path) return "unknown";
  const ext = path.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    sol: "solidity",
    js: "javascript",
    ts: "typescript",
    py: "python",
    go: "go",
    php: "php",
  };
  return map[ext || ""] || "unknown";
}

export function analyzeFile(path: string, source: string): Finding[] {
  const lang = inferLanguageFromPath(path);
  switch (lang) {
    case "solidity":
      return analyzeSolidity(path, source);
    case "javascript":
      return analyzeJavascript(path, source);
    // future: typescript/python/go/php
    default:
      return [];
  }
}


