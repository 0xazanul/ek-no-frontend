import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { FileGetSchema, FilePostSchema, validateRequest } from "@/lib/validation";

// Security helper to prevent path traversal attacks
function sanitizePath(basePath: string, userPath: string): string | null {
  try {
    // Normalize and resolve the paths to prevent directory traversal
    const normalizedUserPath = path.normalize(userPath).replace(/^(\.\.[\/\\])+/, '');
    const resolvedPath = path.resolve(basePath, normalizedUserPath);
    const resolvedBase = path.resolve(basePath);
    
    // Ensure the resolved path is within the base directory
    if (!resolvedPath.startsWith(resolvedBase + path.sep) && resolvedPath !== resolvedBase) {
      return null;
    }
    
    return resolvedPath;
  } catch {
    return null;
  }
}

// File size limit (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
  
  // Validate path parameter using Zod schema
  const validation = validateRequest(FileGetSchema, { path: pathParam });
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  
  // Prefer cookie-pinned repo, fallback to sample repo
  const cookie = req.cookies.get("qasly_repo")?.value;
  let repoDir: string | undefined;
  if (cookie) {
    try {
      repoDir = Buffer.from(cookie, "base64").toString("utf8");
    } catch {
      return NextResponse.json({ error: "Invalid repository session" }, { status: 400 });
    }
  }
  if (!repoDir) {
    repoDir = path.join(process.cwd(), "public/sample-repo");
  }

  // Sanitize path to prevent directory traversal
  const fullPath = sanitizePath(repoDir, pathParam);
  if (!fullPath) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }

  try {
    const stats = await fs.stat(fullPath);
    if (stats.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }
    
    const content = await fs.readFile(fullPath, "utf8");
    return NextResponse.json({ content, language: detectLanguage(fullPath) });
  } catch (error) {
    return NextResponse.json({ error: "File not found or unreadable" }, { status: 404 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body using Zod schema
    const validation = validateRequest(FilePostSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    
    const { path: relPath, content } = validation.data;
    
    const cookie = req.cookies.get("qasly_repo")?.value;
    let repoDir: string | undefined;
    if (cookie) {
      try {
        repoDir = Buffer.from(cookie, "base64").toString("utf8");
      } catch {
        return NextResponse.json({ error: "Invalid repository session" }, { status: 400 });
      }
    }
    if (!repoDir) {
      // write to a local temp area if no cookie exists yet
      repoDir = path.join(os.tmpdir(), "qasly-repos", "local-edit");
    }
    
    // Sanitize path to prevent directory traversal and arbitrary file write
    const fullPath = sanitizePath(repoDir, relPath);
    if (!fullPath) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }
    
    // Additional safety check - ensure we're not writing to sensitive system files
    const dirPath = path.dirname(fullPath);
    const allowedExtensions = ['.js', '.ts', '.tsx', '.jsx', '.py', '.go', '.sol', '.c', '.cpp', '.java', '.php', '.rb', '.rs', '.kt', '.swift', '.sql', '.json', '.md', '.txt', '.yaml', '.yml', '.toml', '.css', '.html'];
    const fileExt = path.extname(relPath).toLowerCase();
    
    if (fileExt && !allowedExtensions.includes(fileExt)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }
    
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(fullPath, content ?? "", "utf8");
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('File write error:', error);
    return NextResponse.json({ error: "Failed to write file" }, { status: 500 });
  }
}


