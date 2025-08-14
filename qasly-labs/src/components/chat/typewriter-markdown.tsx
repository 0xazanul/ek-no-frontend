"use client";

import * as React from "react";
import { MarkdownRenderer } from "@/components/chat/markdown-renderer";

type Props = {
  content: string;
  typingIntervalMs?: number;
  onComplete?: () => void;
  stopSignal?: number; // when changed, finish immediately
};

export function TypewriterMarkdown({ content, typingIntervalMs = 12, onComplete, stopSignal }: Props) {
  const [visible, setVisible] = React.useState("");
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    let i = 0;
    setVisible("");
    setDone(false);
    const timer = setInterval(() => {
      if (i <= content.length) {
        setVisible(content.slice(0, i));
        i += 2; // speed up a bit by revealing 2 chars per tick
      } else {
        clearInterval(timer);
        setDone(true);
        onComplete?.();
      }
    }, typingIntervalMs);
    return () => clearInterval(timer);
  }, [content, typingIntervalMs, onComplete]);

  // Allow external stop: finish immediately
  React.useEffect(() => {
    if (stopSignal !== undefined) {
      setVisible(content);
      setDone(true);
      onComplete?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopSignal]);

  return (
    <div>
      {/* Optional tiny thinking ribbon while typing */}
      {!done && (
        <div className="mb-2 flex items-center gap-2 text-[12px] text-muted-foreground">
          <span className="inline-block size-1.5 rounded-full bg-muted-foreground animate-pulse" />
          Generating analysis...
        </div>
      )}
      <MarkdownRenderer content={visible} />
    </div>
  );
}


