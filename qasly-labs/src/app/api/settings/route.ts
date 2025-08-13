import { NextRequest, NextResponse } from "next/server";
import { setRuntimeConfig } from "@/server/runtime-config";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const openaiApiKey: string | undefined = body?.openaiApiKey;
  const model: string | undefined = body?.model;
  setRuntimeConfig({ apiKey: openaiApiKey, model });
  return NextResponse.json({ ok: true });
}


