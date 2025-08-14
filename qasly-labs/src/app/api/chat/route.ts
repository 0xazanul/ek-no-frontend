import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function getLanguageFromPath(path?: string): string {
  if (!path) return "Unknown";
  const ext = path.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    sol: "Solidity",
    js: "JavaScript",
    ts: "TypeScript",
    jsx: "React JSX",
    tsx: "React TSX",
    py: "Python",
    go: "Go",
    rs: "Rust",
    java: "Java",
    php: "PHP",
    rb: "Ruby",
    c: "C",
    cpp: "C++",
    cs: "C#",
  };
  return map[ext || ""] || "Unknown";
}

function h2(t: string) {
  return `## ${t}`;
}

function code(lang: string, c: string) {
  return `\n\n\`\`\`${lang}\n${c}\n\`\`\`\n`;
}

function narrative(repoHint: string, file?: string, language?: string, source?: string) {
  const lines = source?.split("\n").length ?? 0;
  return `# Analysis Narrative

${h2("Intent")}
User requests a thorough, human-like walkthrough of the repository.

${h2("Repository Overview")}
I’m scanning the project${repoHint ? `: ${repoHint}` : ""}. It looks like a Next.js app with an editor and chat-based security analysis. A sample repo contains intentionally vulnerable contracts.

${h2("Approach")}
1. Identify purpose of core areas (API, editor, chat)
2. Read the active file and summarize its role
3. Outline likely risks and UX improvements
4. Propose next steps

${h2("Thinking Aloud")}
- What are the entry points and data flows?\n- Which files control analysis and rendering?\n- Where could user input or external calls introduce risk?\n- Which contracts/functions deserve focused review next?

${h2("Active File Context")}
- File: ${file ?? "(none selected)"}
- Language: ${language ?? "(unknown)"}
- Lines: ${lines}
${source ? code((language || "text").toLowerCase(), source.slice(0, 500) + (source.length > 500 ? "\n// ... truncated" : "")) : ""}

${h2("Likely Concerns")}
- Long responses are hard to skim → add collapse/expand
- Assistant output should use markdown and code blocks
- Inconsistent commands confuse users
- Errors should suggest next actions
- File context should be visible in chat

${h2("Next Steps")}
1) Render markdown with copy buttons on code blocks
2) Collapse long replies with Show more/less
3) Show a chip with current file + language in chat
4) Standardize on /suggest-fixes (keep /generate-fixes as alias)
5) Replace generic errors with actionable hints
`;
}

function replyForCommand(cmd: string, file?: string, language?: string, source?: string) {
  const repoHint = "Next.js app with editor + security auditing UI (sample vulnerable contracts)";
  switch (cmd) {
    case "audit-all":
      return `# Repository Audit

${h2("Summary")}
The app is a Next.js workspace with an editor and security analysis surface. The sample contracts showcase common pitfalls.

${h2("Findings")}
- Reentrancy patterns, gas DoS loops, weak randomness, missing access control
- UX: Long responses not collapsed, missing markdown, inconsistent commands

${h2("Thinking Aloud")}
- Where are critical routes/components?\n- Which contracts are most likely to contain exploitable patterns?\n- What should be audited first for maximum risk reduction?

${h2("Recommendations")}
- Markdown rendering with copy buttons\n- Collapsible long messages\n- Standardize /suggest-fixes\n- Better error hints and file context chip`;
    case "audit-file":
    case "analyze-file":
      return `# File Audit — ${file ?? "(no file selected)"}

${h2("Context")}
- Language: ${language ?? "(unknown)"}
- Lines: ${source?.split("\n").length ?? 0}

${h2("Observations")}
- Purpose: Provide a specific UI or contract logic within the flows\n- Reading functions/blocks: handlers, effects, key code paths

${h2("Thinking Aloud")}
- Who can call these functions?\n- Are loops bounded?\n- Any external calls before state updates?\n- Any reliance on timestamps for randomness?\n- Is access control enforced?

${h2("Potential Risks")}
- UI: error handling, state consistency, accessibility\n- Solidity: CEI reentrancy, unbounded loops, timestamp randomness, access control

${h2("Next Steps")}
- Add editor line-highlighting from AI references\n- Standardize slash commands and UI hints`;
    case "list-risks":
      return `# Security Risk Assessment

${h2("Critical / High")}
- Reentrancy (fund drain), gas DoS via unbounded loops

${h2("Medium")}
- Weak randomness, missing access control

${h2("Thinking Aloud")}
- Which issues are most exploitable here?\n- What remediation yields fastest risk reduction?\n- What can be automated vs requires manual review?

${h2("UX Risks")}
- Hard-to-skim content\n- Inconsistent commands / unclear errors

${h2("Mitigation")}
- CEI + nonReentrant, bounded loops, VRF, RBAC\n- Markdown, collapsible replies, clearer quick actions`;
    case "suggest-fixes":
    case "generate-fixes":
      return `# Suggested Fixes

${h2("Code/Contracts")}
- Add nonReentrant around external calls\n- Bound loops; batch operations\n- Replace timestamp randomness with VRF/commit-reveal\n- Enforce RBAC (onlyOwner/roles)

${h2("Thinking Aloud")}
- Which fixes are minimally invasive but high impact?\n- Can we provide safe default snippets for repeated patterns?\n- How do we verify fixes (tests, static analysis)?

${h2("UX")}
- Markdown + copy buttons\n- Collapse long answers\n- File context chip\n- Actionable error hints`;
    case "explain-vuln":
      return `# Vulnerability Overview

${h2("Reentrancy")}
External calls before state updates enable recursive drains.

${h2("Gas DoS")}
Unbounded loops can exhaust block gas.

${h2("Randomness")}
Block data is predictable; use VRF.

${h2("Access Control")}
Missing role checks allow unauthorized actions.`;
    case "deep-research":
    default:
      return narrative(repoHint, file, language, source);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const messages: { role: "user" | "assistant"; content: string }[] = body?.messages ?? [];
  const currentFile: string | undefined = body?.currentFile;
  const source: string | undefined = body?.code;
  const language = currentFile ? getLanguageFromPath(currentFile) : undefined;

  const last = messages[messages.length - 1]?.content?.trim() || "";
  const cmd = last.startsWith("/") ? last.slice(1).split(/\s+/)[0] : "";

  const reply = replyForCommand(cmd || "deep-research", currentFile, language, source);
  return NextResponse.json({ reply });
}



