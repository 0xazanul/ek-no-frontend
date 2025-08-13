"use client";

import * as React from "react";
import { FileExplorer, RepoNode } from "@/components/editor/file-explorer";
import { CodeEditor } from "@/components/editor/code-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { ChatPanel } from "@/components/chat/chat-panel";
import { generateId } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Props = {
  tree: RepoNode[];
  onConnect: (url: string) => void;
  onSelect: (path: string) => void;
  code: string;
  setCode: (s: string) => void;
  activePath?: string;
  onSave: () => void;
  theme: "light" | "dark" | undefined;
  language?: string;
};

export function EditorComposite({
  tree,
  onConnect,
  onSelect,
  code,
  setCode,
  activePath,
  onSave,
  theme,
  language,
}: Props) {
  const [mode, setMode] = React.useState<"code" | "chat">("code");
  const [messages, setMessages] = React.useState<Message[]>([
    { id: "m1", role: "assistant", content: "I’ll analyze the current file for common smart-contract risks as you explore. Type / to see audit options." },
  ]);

  function handleSend(content: string) {
    const id = generateId();
    setMessages((m) => [...m, { id, role: "user", content }]);
    // Simulate deep reasoning response; in real version, call /api/chat with file context
    const response = `Analyzing ${activePath ?? "the selected file"}…\n\n` +
      `- Reentrancy surface: check external calls (call/value/transfer).\n` +
      `- Access control: verify onlyOwner/role guards.\n` +
      `- Arithmetic: pre-0.8 overflow/underflow risk. Use SafeMath or ^0.8.\n` +
      `- Randomness: avoid block variables; prefer VRF/commit-reveal.\n` +
      `- External calls: check return values and CEI pattern.\n\n` +
      `Deeper reasoning… if withdraw() uses call before state update, attacker can reenter. If tx.origin is used for auth, phishing risk. If delegatecall target is user-controlled, full takeover possible.`;
    setTimeout(() => setMessages((m) => [...m, { id: generateId(), role: "assistant", content: response }]), 500);
  }

  return (
    <div className="h-full grid grid-rows-[auto_1fr] overflow-hidden">
      <CommandBar onSwitch={(next) => setMode(next)} />
      <div className="h-full flex overflow-hidden">
        <div className="w-80 border-r bg-card/50 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <div className="h-full">
              <FileExplorer tree={tree} onConnect={onConnect} onSelect={onSelect} />
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-10 border-b bg-muted/30 px-4 flex items-center justify-between">
            <div className="text-micro text-muted-foreground truncate">
              {activePath ?? "No file selected"}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant={mode === "code" ? "default" : "outline"} onClick={() => setMode("code")}>Code</Button>
              <Button size="sm" variant={mode === "chat" ? "default" : "outline"} onClick={() => setMode("chat")}>AI</Button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            {mode === "code" ? (
              <CodeEditor 
                path={activePath} 
                value={code} 
                language={language} 
                theme={theme === "dark" ? "dark" : "light"} 
                onChange={setCode} 
                onSave={onSave} 
              />
            ) : (
              <ChatPanel messages={messages} onSend={handleSend} showHeader={false} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CommandBar({ className, onSwitch }: { className?: string; onSwitch?: (mode: "code" | "chat") => void }) {
  const [value, setValue] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const suggestions = [
    { k: "/audit-all", d: "Full audit for common bug classes" },
    { k: "/audit-reentrancy", d: "Focus on reentrancy and external calls" },
    { k: "/audit-access", d: "Access control and auth review" },
  ];

  const handleChange = (v: string) => {
    setValue(v);
    setOpen(v.startsWith("/"));
  };

  function choose(s: string) {
    setValue(s);
    setOpen(false);
    onSwitch?.("chat");
  }

  return (
    <div className={cn("border-b bg-muted/10 px-3 py-2", className)}>
      <div className="max-w-[980px] mx-auto flex items-center gap-2">
        <Sparkles className="size-4 text-muted-foreground" />
        <div className="flex-1 relative">
          <Input
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Type / to see audit options…"
            className="h-9 text-[13px]"
          />
          {open && (
            <div className="absolute z-10 mt-2 w-full rounded-md border bg-background shadow-sm">
              {suggestions.map((s) => (
                <div key={s.k} className="px-3 py-2 text-sm hover:bg-accent/50 cursor-pointer" onClick={() => choose(s.k)}>
                  <span className="font-medium mr-2">{s.k}</span>
                  <span className="text-muted-foreground">{s.d}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


