"use client";

import * as React from "react";
// Removed ScrollArea import - using native overflow for better control
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Bot, UserRound, Send, FileText } from "lucide-react";
import { MarkdownRenderer } from "@/components/chat/markdown-renderer";
import { CollapsibleMessage } from "@/components/chat/collapsible-message";
import { TypewriterMarkdown } from "@/components/chat/typewriter-markdown";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatPanelProps = {
  messages: Message[];
  onSend: (content: string) => void;
  className?: string;
  showHeader?: boolean;
  context?: { file?: string; language?: string };
};

export function ChatPanel({ messages, onSend, className, showHeader = true, context }: ChatPanelProps) {
  const [input, setInput] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const endRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const [showSlash, setShowSlash] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [stopToken, setStopToken] = React.useState(0);
  const slashOptions = React.useMemo(() => [
    { key: "analyze-file", label: "Analyze current file" },
    { key: "list-risks", label: "List potential risks" },
    { key: "suggest-fixes", label: "Suggest fixes" },
    { key: "explain-vuln", label: "Explain a vulnerability" },
    { key: "review-changes", label: "Review recent changes" },
    { key: "deep-research", label: "Deep research" },
  ], []);
  const quickActions = React.useMemo(() => [
    { key: "audit-all", label: "Full Scan Repo" },
    { key: "audit-file", label: "Scan Current File" },
    { key: "list-risks", label: "List Risks" },
    { key: "suggest-fixes", label: "Suggest Fixes" },
    { key: "deep-research", label: "Deep Research" },
  ], []);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const handleSubmit = async () => {
    if (!input.trim() || isSending) return;
    setIsSending(true);
    const message = input.trim();
    setInput("");
    setShowSlash(false);
    
    try {
      onSend(message);
      // Keep input focused for continuous conversation
      inputRef.current?.focus();
    } finally {
      setIsSending(false);
    }
  };

  const handleQuick = async (cmd: string) => {
    if (isSending) return;
    setIsSending(true);
    setInput("");
    setShowSlash(false);
    
    try {
      onSend(`/${cmd}`);
      // Keep input focused
      inputRef.current?.focus();
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Disable slow typing: render responses instantly

  React.useEffect(() => {
    // Always scroll to bottom on new messages with smooth behavior
    if (scrollRef.current) {
      const element = scrollRef.current;
      element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages.length]);
  
  // Auto-focus input when component mounts
  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className={cn("h-full flex flex-col bg-card/20", className)}>
      {showHeader && (
        <div className="px-4 py-3 border-b bg-muted/10">
          <div className="max-w-[820px] mx-auto flex items-center justify-between">
            <p className="text-micro text-muted-foreground tracking-wide">
              Type / for audit options. Ask about the current file or repository.
            </p>
            {context?.file && (
              <div className="text-[11px] px-2 py-1 rounded-full border bg-card text-muted-foreground flex items-center gap-1">
                <FileText className="size-3" />
                <span className="truncate max-w-[200px]">{context.file.split("/").slice(-1)[0]}</span>
                {context.language && <span className="opacity-70">({context.language})</span>}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="p-5">
          <div className="max-w-[820px] mx-auto space-y-4">
            {messages.map((m, idx) => {
              const isUser = m.role === "user";
              const isThinking = m.role === "assistant" && !m.content;
              const isDeepReasoning = m.role === "assistant" && m.content && (messages[idx-1]?.content?.includes('/deep-research') || m.content.length > 500);
              
              if (isUser) {
                return (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[70%] rounded-2xl px-4 py-3 text-[14px] leading-6 bg-primary text-primary-foreground">
                      {m.content}
                    </div>
                    <div className="flex-shrink-0 ml-3 mt-0.5">
                      <div className="size-7 rounded-full grid place-items-center border bg-gradient-to-br from-amber-500/15 to-pink-500/15 border-amber-500/30">
                        <UserRound className="size-3.5 text-amber-400" />
                      </div>
                    </div>
                  </div>
                );
              }
              
              if (isThinking) {
                return (
                  <div key={m.id} className="flex justify-start">
                    <div className="flex-shrink-0 mr-3 mt-0.5">
                      <div className="size-7 rounded-full grid place-items-center border bg-gradient-to-br from-purple-500/15 to-cyan-500/15 border-purple-500/30">
                        <Bot className="size-3.5 text-purple-400" />
                      </div>
                    </div>
                    <div className="max-w-[85%] space-y-3">
                      <DeepThinkingDisplay />
                    </div>
                  </div>
                );
              }
              
              if (isDeepReasoning) {
                return (
                  <div key={m.id} className="flex justify-start">
                    <div className="flex-shrink-0 mr-3 mt-0.5">
                      <div className="size-7 rounded-full grid place-items-center border bg-gradient-to-br from-purple-500/15 to-cyan-500/15 border-purple-500/30">
                        <Bot className="size-3.5 text-purple-400" />
                      </div>
                    </div>
                    <div className="max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-6 bg-muted/60 text-foreground border border-border/50">
                      <TypewriterMarkdown content={m.content} stopSignal={stopToken} />
                    </div>
                  </div>
                );
              }
              
              return (
                <div key={m.id} className="flex justify-start">
                  <div className="flex-shrink-0 mr-3 mt-0.5">
                    <div className="size-7 rounded-full grid place-items-center border bg-gradient-to-br from-purple-500/15 to-cyan-500/15 border-purple-500/30">
                      <Bot className="size-3.5 text-purple-400" />
                    </div>
                  </div>
                  <div className="max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-6 bg-muted/60 text-foreground border border-border/50">
                    <TypewriterMarkdown content={m.content} stopSignal={stopToken} />
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
        </div>
      </div>
      <div className="border-t bg-background/70 backdrop-blur px-4 py-3">
        <div className="max-w-[820px] mx-auto">
          {/* Quick actions */}
          <div className="mb-2 flex flex-wrap gap-2">
            {quickActions.map((qa) => (
              <button
                key={qa.key}
                onClick={() => handleQuick(qa.key)}
                disabled={isSending}
                className="h-8 px-3 text-[13px] rounded-full border bg-card hover:bg-accent/50 transition-surgical disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {qa.label}
              </button>
            ))}
          </div>
          {/* Composer */}
          <div className="flex items-end gap-2 border rounded-2xl bg-card/80 p-2 shadow-sm">
            <Textarea 
              ref={inputRef}
              placeholder="Type / for audit options, or ask me to analyze vulnerabilities..." 
              value={input} 
              onChange={(e) => {
                const v = e.target.value;
                setInput(v);
                setShowSlash(v.trim().startsWith("/"));
              }}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              className="min-h-[44px] max-h-40 resize-none border-0 shadow-none focus-visible:ring-0 focus-visible:outline-0 text-[14px] leading-6 bg-transparent disabled:opacity-50"
            />
            <Button 
              onClick={handleSubmit} 
              disabled={!input.trim() || isSending}
              className="h-10 px-3 transition-surgical focus-surgical"
              aria-label="Send message"
            >
              {isSending ? (
                <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
            <Button
              onClick={() => setStopToken((t) => t + 1)}
              variant="ghost"
              className="h-10 px-3"
              aria-label="Stop generation"
            >
              Stop
            </Button>
          </div>
          {showSlash && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {slashOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setInput(`/${opt.key} `);
                    setShowSlash(false);
                  }}
                  className="text-left text-[13px] px-3 py-2 rounded-md border bg-card hover:bg-accent/50 transition-surgical"
                >
                  /{opt.key} – {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DeepThinkingDisplay() {
  return (
    <div className="rounded-2xl bg-muted/30 border border-border/50 p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
        <div className="size-1.5 rounded-full bg-muted-foreground animate-pulse" />
        Analyzing...
      </div>
      
      <div className="space-y-2">
        <div className="h-3 bg-muted/50 rounded animate-pulse" />
        <div className="h-3 bg-muted/50 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-muted/50 rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}

// DeepReasoningResponse was replaced by markdown-only rendering above


