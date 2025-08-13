import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";

function detectLanguage(filePath: string): string | undefined {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".ts":
    case ".tsx":
      return "typescript";
    case ".js":
    case ".jsx":
      return "javascript";
    case ".c":
      return "c";
    case ".cc":
    case ".cpp":
    case ".cxx":
    case ".hpp":
      return "cpp";
    case ".java":
      return "java";
    case ".py":
      return "python";
    case ".go":
      return "go";
    case ".rs":
      return "rust";
    case ".php":
      return "php";
    case ".rb":
      return "ruby";
    case ".kt":
    case ".kts":
      return "kotlin";
    case ".swift":
      return "swift";
    case ".sh":
    case ".bash":
      return "shell";
    case ".json":
      return "json";
    case ".css":
      return "css";
    case ".md":
      return "markdown";
    case ".yaml":
    case ".yml":
      return "yaml";
    case ".toml":
      return "toml";
    case ".xml":
      return "xml";
    case ".sol":
      return "solidity";
    case ".sql":
      return "sql";
    default:
      return undefined;
  }
}

export async function GET(req: NextRequest) {
  const pathParam = req.nextUrl.searchParams.get("path");
  if (!pathParam) return NextResponse.json({ error: "Missing path" }, { status: 400 });
  // Prefer cookie-pinned repo, fallback to sample repo
  const cookie = req.cookies.get("qasly_repo")?.value;
  let repoDir: string | undefined;
  if (cookie) {
    try {
      repoDir = Buffer.from(cookie, "base64").toString("utf8");
    } catch {}
  }
  if (!repoDir) {
    repoDir = path.join(process.cwd(), "public/sample-repo");
  }

  const fullPath = path.join(repoDir, pathParam);
  const content = await fs.readFile(fullPath, "utf8").catch(() => "");
  return NextResponse.json({ content, language: detectLanguage(fullPath) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const relPath: string | undefined = body?.path;
  const content: string | undefined = body?.content;
  if (!relPath) return NextResponse.json({ error: "Missing path" }, { status: 400 });
  const cookie = req.cookies.get("qasly_repo")?.value;
  let repoDir: string | undefined;
  if (cookie) {
    try {
      repoDir = Buffer.from(cookie, "base64").toString("utf8");
    } catch {}
  }
  if (!repoDir) {
    // write to a local temp area if no cookie exists yet
    repoDir = path.join(os.tmpdir(), "qasly-repos", "local-edit");
  }
  const fullPath = path.join(repoDir, relPath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content ?? "", "utf8");
  return NextResponse.json({ ok: true });
}


