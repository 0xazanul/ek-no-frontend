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
  const body = await req.json();
  const url: string | undefined = body?.url;
  // If no URL provided, use bundled sample repo under public
  const usingSample = !url;

  const repoBase = path.join(os.tmpdir(), "qasly-repos");
  await fs.mkdir(repoBase, { recursive: true });
  const repoDir = usingSample
    ? path.join(process.cwd(), "public/sample-repo")
    : path.join(repoBase, Buffer.from(url).toString("hex"));

  try {
    if (!usingSample) {
      const git = simpleGit();
      try {
        await fs.access(repoDir);
        await git.cwd(repoDir).pull();
      } catch {
        await git.clone(url!, repoDir);
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
    const tree = buildTree(repoDir, entries);
    const res = NextResponse.json({ tree, repoDir });
    try {
      const encoded = Buffer.from(repoDir).toString("base64");
      res.cookies.set("qasly_repo", encoded, { path: "/" });
    } catch {}
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Clone failed" }, { status: 500 });
  }
}


