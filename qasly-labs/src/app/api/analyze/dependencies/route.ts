import { NextRequest, NextResponse } from "next/server";
import { scanDependencies } from "@/lib/analyzer/trivy"; // Updated import
import { validateRequest } from "@/lib/validation";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

// Schema for dependency scanning request
const DependencyScanSchema = z.object({
  files: z.array(
    z.object({
      path: z.string().min(1),
      content: z.string()
    })
  ).min(1)
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body using Zod schema
    const validation = validateRequest(DependencyScanSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    
    const { files } = validation.data;
    
    // Process each dependency file
    const scanResults = await Promise.all(
      files.map(async ({ path, content }) => {
        // Only scan supported dependency files
        if (path.endsWith("package.json") || 
            path.endsWith("requirements.txt") || 
            path.endsWith("go.mod") ||
            path.endsWith("pom.xml") ||
            path.endsWith("build.gradle")) {
          const findings = await scanDependencies(path, content);
          return { path, findings };
        }
        return { path, findings: [] };
      })
    );
    
    // Flatten all findings
    const allFindings = scanResults.flatMap(result => result.findings);
    
    return NextResponse.json({ 
      findings: allFindings,
      scannedFiles: scanResults.map(r => r.path)
    });
  } catch (error) {
    console.error("Error scanning dependencies:", error);
    return NextResponse.json({ error: "Failed to scan dependencies" }, { status: 500 });
  }
}
