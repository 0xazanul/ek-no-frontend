"use client";

import * as React from "react";
import { RepoNode } from "@/components/editor/file-explorer";
import { FileExplorer } from "@/components/editor/file-explorer";
import { CodeEditor } from "@/components/editor/code-editor";
// Removed resizable split; using fixed sidebar layout
import { Brand } from "@/components/brand";
import { ChatPanel } from "@/components/chat/chat-panel";
import { useTheme } from "next-themes";
import { generateId, cn } from "@/lib/utils";
import { Sun, Moon, ChevronRight } from "lucide-react";

type Message = { id: string; role: "user" | "assistant"; content: string };

export default function Home() {
  const [tree, setTree] = React.useState<RepoNode[]>([]);
  const [activePath, setActivePath] = React.useState<string | undefined>(undefined);
  const [code, setCode] = React.useState<string>("// Connect a repo to begin\n");
  const [language, setLanguage] = React.useState<string | undefined>("typescript");
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [mode, setMode] = React.useState<"code" | "chat">("code");
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [connectionError, setConnectionError] = React.useState<string | undefined>();
  const [isLoadingFile, setIsLoadingFile] = React.useState(false);
  const { theme, resolvedTheme, setTheme } = useTheme();

  const handleConnect = async (url: string) => {
    if (!url.trim()) return;
    setIsConnecting(true);
    setConnectionError(undefined);
    try {
      const res = await fetch("/api/repo/connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to connect');
      }
      const data = await res.json();
      console.log('Repository data received:', data);
      setTree(data.tree);
      // auto-select a file for demo if present
      const pick = findFirstFilePath(data.tree);
      console.log('First file found:', pick);
      if (pick) handleSelect(pick);
    } catch (error: any) {
      setConnectionError(error.message || 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  // Auto-connect to bundled sample repo on first load
  React.useEffect(() => {
    console.log('Auto-connecting to sample repo...');
    handleConnect("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = async (path: string) => {
    setActivePath(path);
    setIsLoadingFile(true);
    try {
      const res = await fetch(`/api/repo/file?path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error('Failed to load file');
      const data = await res.json();
      setCode(data.content ?? "");
      setLanguage(data.language ?? undefined);
    } catch (error) {
      console.error('File load error:', error);
      setCode('// Error loading file');
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleSave = async () => {
    if (!activePath) return;
    await fetch("/api/repo/file", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: activePath, content: code }) });
  };

  const handleSend = async (content: string) => {
    const userMsg: Message = { id: generateId(), role: "user", content };
    const pendingId = generateId();
    
    // Add thinking delay for deep research commands
    const isDeepCommand = content.includes('/deep-research') || content.includes('/audit-all');
    const thinkingDelay = isDeepCommand ? 3000 : 1500;
    
    setMessages((m) => [...m, userMsg, { id: pendingId, role: "assistant", content: "" }]);
    
    try {
      const res = await fetch("/api/chat", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ 
          messages: [...messages, userMsg],
          currentFile: activePath,
          isDeepAnalysis: isDeepCommand
        }) 
      });
      if (!res.ok) throw new Error('Failed to get response');
      const data = await res.json();
      
      // Simulate thinking time for better UX
      setTimeout(() => {
        setMessages((m) => m.map((msg) => (msg.id === pendingId ? { ...msg, content: data.reply } : msg)));
      }, thinkingDelay);
    } catch (error) {
      setTimeout(() => {
        setMessages((m) => m.map((msg) => (msg.id === pendingId ? { ...msg, content: "Sorry, I encountered an error processing your request. Please try again." } : msg)));
      }, 1000);
    }
  };

  const handleSettingsSave = async (v: { openaiApiKey?: string; model?: string }) => {
    await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
  };

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <div className="h-12 border-b flex items-center justify-between px-5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-5">
          <Brand className="text-[13.5px] font-semibold tracking-[-0.02em]" />
          <div className="text-micro text-muted-foreground">Vulnerability analysis</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label="Toggle theme"
            className="h-8 w-8 rounded-md border flex items-center justify-center transition-surgical focus-surgical"
            onClick={() => {
              const next = (resolvedTheme ?? theme) === "dark" ? "light" : "dark";
              setTheme(next);
            }}
          >
            {(resolvedTheme ?? theme) === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="h-full w-full flex overflow-hidden">
          <div className="w-80 min-w-[280px] max-w-[320px] border-r bg-gradient-to-b from-card/60 to-card/30 overflow-hidden min-h-0 backdrop-blur-sm">
            <FileExplorer
              tree={tree}
              onSelect={handleSelect}
              onConnect={handleConnect}
              activePath={activePath}
              isConnecting={isConnecting}
              connectionError={connectionError}
            />
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="h-10 border-b bg-gradient-to-r from-muted/40 to-muted/20 px-4 flex items-center justify-between backdrop-blur-sm">
              <div className="text-micro text-muted-foreground flex items-center gap-2 min-w-0">
                {isLoadingFile && <div className="size-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />}
                {activePath ? (
                  <div className="flex items-center gap-1 min-w-0">
                    {activePath.split('/').map((segment, index, array) => (
                      <React.Fragment key={index}>
                        {index > 0 && <ChevronRight className="size-3 opacity-60" />}
                        <span className={cn(
                          "transition-colors",
                          index === array.length - 1 ? "font-medium text-foreground" : "truncate hover:text-foreground/80 cursor-pointer"
                        )}>
                          {segment}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <span className="opacity-60">No file selected</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className={cn(
                    "h-7 px-3 text-[12.5px] rounded-full border transition-all",
                    mode === "code" 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "bg-background/80 hover:bg-accent/50 backdrop-blur-sm"
                  )}
                  onClick={() => setMode("code")}
                >
                  Code
                </button>
                <button
                  className={cn(
                    "h-7 px-3 text-[12.5px] rounded-full border transition-all",
                    mode === "chat" 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "bg-background/80 hover:bg-accent/50 backdrop-blur-sm"
                  )}
                  onClick={() => {
                    setMode("chat");
                    // Auto-focus chat input when switching to chat mode
                    setTimeout(() => {
                      const chatInput = document.querySelector('textarea[placeholder*="audit options"]') as HTMLTextAreaElement;
                      chatInput?.focus();
                    }, 100);
                  }}
                >
                  AI
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              {mode === "code" ? (
                                  <div className="relative h-full">
                    <CodeEditor
                      path={activePath}
                      value={code}
                      onChange={setCode}
                      onSave={handleSave}
                      language={language}
                      theme={((resolvedTheme ?? theme) as "light" | "dark") ?? "light"}
                    />
                    {activePath && (
                      <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded border">
                        Ctrl+S to save
                      </div>
                    )}
                  </div>
              ) : (
                <ChatPanel
                  messages={messages}
                  onSend={handleSend}
                  showHeader={false}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function findFirstFilePath(nodes: RepoNode[]): string | undefined {
  for (const n of nodes) {
    if (n.type === "file") return n.path;
    if (n.children) {
      const r = findFirstFilePath(n.children);
      if (r) return r;
    }
  }
  return undefined;
}

// Removed 3-panel layout. Editor + AI Audit combined in a single main view.

