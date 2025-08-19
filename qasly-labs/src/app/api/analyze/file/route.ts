import { NextRequest, NextResponse } from "next/server";
import { analyzeFile } from "@/lib/analyzer";
import { analyzeFileWithAI } from "@/lib/analyzer/gpt4free";
import { AnalyzeFileSchema, validateRequest } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Validate request body using Zod schema
    const validation = validateRequest(AnalyzeFileSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { path, content } = validation.data;
    // Run static analysis and AI reasoning in parallel
    const [findings, aiReasoning] = await Promise.all([
      analyzeFile(path, content),
      analyzeFileWithAI(path, content)
    ]);
    return NextResponse.json({ findings, aiReasoning });
  } catch (error) {
    console.error("Error analyzing file:", error);
    return NextResponse.json({ error: "Failed to analyze file" }, { status: 500 });
  }
}


