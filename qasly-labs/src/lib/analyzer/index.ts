import { Finding } from "@/types/finding";
import { scanDependencies } from "@/lib/analyzer/trivy";
import { runSemgrepAnalysis } from "@/lib/analyzer/semgrep"; // New import

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
    java: "java", // Added Java
    rb: "ruby",   // Added Ruby
    cs: "csharp", // Added C#
    c: "c",     // Added C
    cpp: "cpp",   // Added C++
  };
  return map[ext || ""] || "unknown";
}

export async function analyzeFile(path: string, source: string): Promise<Finding[]> {
  // Check if this is a dependency file that should be scanned for vulnerabilities
  if (path.endsWith("package.json") || path.endsWith("requirements.txt") || path.endsWith("go.mod") || path.endsWith("pom.xml") || path.endsWith("build.gradle")) {
    return await scanDependencies(path, source);
  }

  // Use Semgrep for all other code analysis
  const lang = inferLanguageFromPath(path);
  if (lang === "unknown") {
    console.warn(`Unknown language for path: ${path}, skipping Semgrep analysis.`);
    return [];
  }
  return await runSemgrepAnalysis(path, source, lang);
}


