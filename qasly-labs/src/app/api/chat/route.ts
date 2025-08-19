import { NextRequest, NextResponse } from "next/server";
import { ChatRequestSchema, validateRequest } from "@/lib/validation";
import { aiManager } from "@/lib/ai/providers";
import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const SYSTEM_PROMPT = `🔬 Qasly — Elite AI Security Researcher & Code Auditor (v4.0)

IDENTITY & MISSION:
You are Qasly, an autonomous AI security researcher with PhD-level expertise in vulnerability research, reverse engineering, and advanced threat modeling. You think like a world-class security researcher, combining deep technical analysis with creative attack scenario modeling.

CORE REASONING FRAMEWORK:
🧠 **Deep Chain-of-Thought Process:**
1. **Initial Assessment** - What am I looking at? What are the core components?
2. **Threat Modeling** - Where are the attack surfaces? What would an attacker target?
3. **Evidence Gathering** - What specific patterns/anti-patterns do I observe?
4. **Vulnerability Analysis** - Map findings to CWE/OWASP with severity scoring
5. **Attack Scenario Development** - How would this be exploited in practice?
6. **Defensive Recommendations** - Concrete, implementable security improvements
7. **Follow-up Questions** - What additional context would enhance this analysis?

RESPONSE STRUCTURE:
🎯 **Analysis Request:** [Restate what I'm analyzing]

🔍 **Initial Reconnaissance:**
[My first observations and hypotheses about the code/system]

🧠 **Deep Reasoning Chain:**
> **Thinking Process:** [Show my actual reasoning steps]
> **Pattern Recognition:** [Security patterns I'm identifying]  
> **Threat Vectors:** [Attack scenarios I'm considering]
> **Evidence Correlation:** [How different findings connect]

⚠️ **Security Findings:**
[Detailed vulnerability analysis with CWE mappings, severity, and exploitation scenarios]

🛡️ **Defensive Strategy:**
[Concrete code fixes, architecture improvements, and security controls]

❓ **Investigative Questions:**
[Specific questions that would help me provide even better analysis]

📚 **Research References:**
[CWE, OWASP, CVE, academic papers, industry standards]

INTERACTION STYLE:
- Show your actual reasoning process transparently
- Ask probing questions to understand context better
- Provide multiple perspectives on security issues
- Give practical, implementable solutions
- Use rich markdown with emojis, tables, diagrams, and code blocks
- Be conversational but authoritative
- Connect findings to real-world attack scenarios

COMMAND HANDLING:
For commands like /audit-file, /scan, /suggest-fixes:
1. Execute the command with enhanced analysis
2. Show step-by-step reasoning for findings
3. Provide multiple fix approaches with pros/cons
4. Ask follow-up questions for deeper analysis

Remember: You're not just identifying issues—you're teaching security through deep, transparent reasoning.`;


function getPrompt(userMessage: string, currentFile?: string, language?: string, source?: string) {
  let context = "";
  if (currentFile && source) {
    context = `\n\nFile: ${currentFile}\nLanguage: ${language}\nContent:\n${source}`;
  }
  return `${SYSTEM_PROMPT}\n\nUser: ${userMessage}${context}`;
}

function getTruncatedSource(source: string, maxLines = 200, maxChars = 8000) {
  const lines = source.split("\n");
  if (lines.length > maxLines) {
    return lines.slice(0, maxLines).join("\n");
  }
  if (source.length > maxChars) {
    return source.slice(0, maxChars);
  }
  return source;
}

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

// Utility to recursively read up to N files in the repo (skipping node_modules/.git)
async function getRepoContext(repoDir: string, maxFiles = 20, maxFileSize = 20000) {
  const files: { path: string; content: string }[] = [];
  async function walk(dir: string) {
    const list = await fs.readdir(dir, { withFileTypes: true });
    for (const d of list) {
      if (d.name === ".git" || d.name === "node_modules") continue;
      const full = path.join(dir, d.name);
      const rel = path.relative(repoDir, full);
      if (d.isDirectory()) {
        await walk(full);
      } else if (files.length < maxFiles) {
        try {
          const stat = await fs.stat(full);
          if (stat.size > maxFileSize) continue;
          const content = await fs.readFile(full, "utf8");
          files.push({ path: rel, content });
        } catch {}
      }
      if (files.length >= maxFiles) break;
    }
  }
  await walk(repoDir);
  return files;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = validateRequest(ChatRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { messages, currentFile, code: source } = validation.data;
    const language = currentFile ? getLanguageFromPath(currentFile) : undefined;
    const last = messages[messages.length - 1]?.content?.trim() || "";
    const truncatedSource = source ? getTruncatedSource(source) : undefined;

    // Command detection
    const commandMatch = last.match(/^\s*\/(\w+)(.*)$/);
    let command = commandMatch ? commandMatch[1].toLowerCase() : null;
    let commandArgs = commandMatch ? commandMatch[2].trim() : null;

    // Detect repo-wide commands
    const repoCommands = ["scan", "audit-all", "deep-research", "repo"]; // add more as needed
    const isRepoCommand = command && (repoCommands.includes(command) || last.includes("repo"));

    let prompt = SYSTEM_PROMPT;
    let repoContextSummary = "";
    if (isRepoCommand) {
      // Try to get repoDir from cookie or use sample repo
      let repoDir = process.cwd() + "/public/sample-repo";
      try {
        // Try to get from cookies if available (not available in API route directly, so fallback to sample)
        // TODO: Enhance to get real user repo if session/cookie is available
        const files = await getRepoContext(repoDir);
        repoContextSummary = files.map(f => `File: ${f.path}\n---\n${f.content.substring(0, 1000)}\n`).join("\n\n");
      } catch (e) {
        repoContextSummary = "(Failed to read repository files for context.)";
      }
      prompt += `\n\n--- Repository Context (showing up to 20 files) ---\n${repoContextSummary}\n--- End Repository Context ---\n`;
    } else if (currentFile && truncatedSource) {
      prompt += `\n\n--- File Context ---\nFile: ${currentFile}\nLanguage: ${language}\nContent:\n${truncatedSource}\n--- End File Context ---\n`;
    } else if (currentFile) {
      prompt += `\n\n--- Context ---\nFile: ${currentFile}\nLanguage: ${language}\n(No content provided for analysis)\n--- End Context ---\n`;
    } else {
      prompt += `\n\n--- Context ---\n(No specific file selected, responding based on general knowledge or repository overview if available)\n--- End Context ---\n`;
    }

    // Add command-specific instructions
    if (command) {
      prompt += `\n\nUser Command: /${command}${commandArgs ? " " + commandArgs : ""}`;
      prompt += `\nFollow the output template for this command. Use chain-of-thought, stepwise reasoning, and markdown-rich output.`;
    } else {
      prompt += `\n\nUser Query: ${last}\nUse chain-of-thought, stepwise reasoning, and markdown-rich output. If relevant, analyze the file or repo context above.`;
    }

    try {
      const messages = [
        { role: 'system' as const, content: prompt },
        { role: 'user' as const, content: last }
      ];
      
      const aiReply = await aiManager.chat(messages, {
        temperature: 0.7,
        maxTokens: 4000
      });
      
      if (!aiReply || typeof aiReply !== "string" || aiReply.trim() === "") {
        throw new Error("AI response missing or malformed");
      }
      
      return NextResponse.json({ reply: aiReply });
    } catch (e) {
      // Static fallback markdown, always chain-of-thought and markdown-rich
      const fallback = `# ⚠️ AI Reasoning Unavailable\n\n**Sorry, I couldn’t process your request right now.**\n\n---\n\n## What Happened?\n- The AI backend (model/provider) did not return a response.\n- This could be due to:\n  - Provider/model is temporarily unavailable or rate-limited.\n  - The request was too large or complex.\n  - A network or configuration issue.\n\n---\n\n## What You Can Do Next\n\n1. **Retry your request** (sometimes it works on the second try).\n2. **Try a shorter or simpler message.**\n3. **Check your AI backend logs** for errors (e.g., provider/model issues).\n4. **Switch to a different free model/provider** if available.\n\n---\n\n## Example: Chain-of-Thought Analysis\n\n> **User Query:**  \n> _\"${last || 'No query provided.'}\"_\n\n**Restate the request:**  \n${last ? `You asked: \
> ${last}` : 'No specific request detected.'}\n\n**Key logic & risks:**\n- Identify critical modules, trust boundaries, and data flows.\n- Check for common vulnerabilities (e.g., SQLi, XSS, secrets in code).\n- Review dependencies for known CVEs.\n\n**Actionable next steps:**\n- Share the repository path or upload code for analysis.\n- Specify any files or areas of concern.\n- I’ll provide a detailed, step-by-step audit report.\n\n---\n\n## Troubleshooting\n\n- If this issue persists, try:\n  - Restarting your AI backend with a free provider/model.\n  - Checking for API key or browser automation errors.\n  - Reviewing the project setup guide for more help.\n\n---\n\n_**Need help with something else?** Just ask! I’m here for code audits, security reviews, and more._`;
      return NextResponse.json({ reply: fallback });
    }
  } catch (error) {
    return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
  }
}



