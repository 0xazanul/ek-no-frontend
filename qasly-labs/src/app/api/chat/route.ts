import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getRuntimeConfig } from "@/server/runtime-config";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const messages: { role: "user" | "assistant"; content: string }[] = body?.messages ?? [];
  const { apiKey, model } = getRuntimeConfig();
  const finalApiKey = apiKey || process.env.OPENAI_API_KEY;
  const finalModel = model || "gpt-4o-mini";
  if (!finalApiKey) return NextResponse.json({ error: "Missing API key" }, { status: 400 });

  const client = new OpenAI({ apiKey: finalApiKey });
  const response = await client.chat.completions.create({
    model: finalModel,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    temperature: 0.2,
  });
  const reply = response.choices[0]?.message?.content ?? "";
  return NextResponse.json({ reply });
}



