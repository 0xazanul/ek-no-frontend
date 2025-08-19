import { NextRequest, NextResponse } from "next/server";
import { analyzeFile } from "@/lib/analyzer";
import { aiManager } from "@/lib/ai/providers";
import { AnalyzeFileSchema, validateRequest } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

async function analyzeFileWithAI(path: string, content: string): Promise<string> {
  try {
    const messages = [
      {
        role: 'system' as const,
        content: `You are Qasly, an expert code auditor. Analyze the provided file for security vulnerabilities, code quality issues, and best practices. Provide a detailed analysis with specific recommendations.`
      },
      {
        role: 'user' as const,
        content: `Analyze this file: ${path}\n\nContent:\n${content}`
      }
    ];
    
    return await aiManager.chat(messages, {
      temperature: 0.7,
      maxTokens: 2000
    });
  } catch (error) {
    console.error('AI analysis failed:', error);
    return 'AI analysis unavailable. Please check the file manually for security issues.';
  }
}

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


