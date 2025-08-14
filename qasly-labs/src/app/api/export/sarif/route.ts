import { NextRequest, NextResponse } from "next/server";
import { analyzeFile } from "@/lib/analyzer";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const files: Array<{ path: string; content: string }> = body?.files ?? [];
  const findings = files.flatMap((f) => analyzeFile(f.path, f.content));

  const sarif = {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "Qasly Static Analyzer",
            version: "0.1",
          },
        },
        results: findings.map((f) => ({
          ruleId: f.ruleId || "custom",
          level: mapSeverity(f.severity),
          message: { text: `${f.description}${f.cwe ? ` (CWE-${f.cwe})` : ""}` },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: f.file },
                region: { startLine: f.line, endLine: f.endLine || f.line },
              },
            },
          ],
        })),
      },
    ],
  };

  return NextResponse.json(sarif);
}

function mapSeverity(sev: string | undefined) {
  switch (sev) {
    case "critical":
    case "high":
      return "error";
    case "medium":
      return "warning";
    case "low":
    case "info":
    default:
      return "note";
  }
}


