import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import simpleGit from "simple-git";

type RepoNode = {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: RepoNode[];
};

function buildTree(baseDir: string, entries: { path: string; type: "file" | "folder" }[]): RepoNode[] {
  const root: RepoNode[] = [];
  const map = new Map<string, RepoNode>();
  for (const entry of entries) {
    const parts = entry.path.split("/").filter(Boolean);
    let currentList = root;
    let currentPath = "";
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const key = currentPath;
      let node = map.get(key);
      const isLeaf = i === parts.length - 1;
      if (!node) {
        node = {
          name: part,
          path: currentPath,
          type: isLeaf ? entry.type : "folder",
          children: [],
        };
        map.set(key, node);
        currentList.push(node);
      }
      if (!isLeaf) {
        currentList = node.children!;
      }
    }
  }
  return root;
}

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
  }
  
  const url: string | undefined = body?.url;
  // If no URL provided, use bundled sample repo under public
  const usingSample = !url || url.trim() === "";
  
  // Validate GitHub URL format
  if (!usingSample && url) {
    const githubUrlPattern = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/;
    if (!githubUrlPattern.test(url.trim())) {
      return NextResponse.json({ error: "Please provide a valid GitHub repository URL (e.g., https://github.com/owner/repo)" }, { status: 400 });
    }
  }

  const repoBase = path.join(os.tmpdir(), "qasly-repos");
  await fs.mkdir(repoBase, { recursive: true });
  const repoDir = usingSample
    ? path.join(process.cwd(), "public/sample-repo")
    : path.join(repoBase, Buffer.from(url).toString("hex"));

  try {
    if (!usingSample) {
      const git = simpleGit();
      
      try {
        // Check if repo directory already exists
        await fs.access(repoDir);
        console.log(`Repository already exists at ${repoDir}, pulling latest changes...`);
        await git.cwd(repoDir).pull();
      } catch (accessError) {
        console.log(`Cloning repository from ${url} to ${repoDir}...`);
        try {
          await git.clone(url!.trim(), repoDir);
        } catch (cloneError: any) {
          console.error('Git clone error:', cloneError);
          
          // Handle specific git errors
          if (cloneError.message?.includes('not found') || cloneError.message?.includes('404')) {
            throw new Error('Repository not found. Please check the URL and ensure the repository is public.');
          } else if (cloneError.message?.includes('timeout') || cloneError.message?.includes('timed out')) {
            throw new Error('Repository clone timed out. The repository might be too large or the connection is slow.');
          } else if (cloneError.message?.includes('Permission denied') || cloneError.message?.includes('authentication')) {
            throw new Error('Permission denied. Please ensure the repository is public or provide proper authentication.');
          } else {
            throw new Error(`Failed to clone repository: ${cloneError.message || 'Unknown error'}`);
          }
        }
      }
    }

    // Build tree of files/folders, ignore node_modules/.git
    const entries: { path: string; type: "file" | "folder" }[] = [];
    async function walk(dir: string, relat = ""): Promise<void> {
      const list = await fs.readdir(dir, { withFileTypes: true });
      for (const d of list) {
        if (d.name === ".git" || d.name === "node_modules") continue;
        const rel = relat ? `${relat}/${d.name}` : d.name;
        const full = path.join(dir, d.name);
        if (d.isDirectory()) {
          entries.push({ path: rel, type: "folder" });
          await walk(full, rel);
        } else {
          entries.push({ path: rel, type: "file" });
        }
      }
    }
    await walk(repoDir);
    
    if (entries.length === 0) {
      throw new Error('Repository appears to be empty or contains no accessible files.');
    }
    
    const tree = buildTree(repoDir, entries);
    console.log(`Successfully processed ${entries.length} files/folders`);
    
    const res = NextResponse.json({ 
      tree, 
      repoDir,
      stats: {
        totalFiles: entries.filter(e => e.type === 'file').length,
        totalFolders: entries.filter(e => e.type === 'folder').length
      }
    });
    
    try {
      const encoded = Buffer.from(repoDir).toString("base64");
      res.cookies.set("qasly_repo", encoded, { path: "/" });
    } catch (cookieError) {
      console.warn('Failed to set repo cookie:', cookieError);
    }
    
    return res;
  } catch (e: any) {
    console.error('Repository connection error:', e);
    
    // Ensure we always return valid JSON
    const errorMessage = e?.message || 'Repository connection failed';
    
    // Handle different types of errors
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      return NextResponse.json({ error: errorMessage }, { status: 404 });
    } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      return NextResponse.json({ error: errorMessage }, { status: 408 });
    } else if (errorMessage.includes('Permission denied') || errorMessage.includes('authentication')) {
      return NextResponse.json({ error: errorMessage }, { status: 403 });
    } else {
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  }
}


