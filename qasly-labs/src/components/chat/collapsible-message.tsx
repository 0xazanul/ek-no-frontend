"use client";

import * as React from "react";
import { MarkdownRenderer } from "./markdown-renderer";

export function CollapsibleMessage({ content, threshold = 1400 }: { content: string; threshold?: number }) {
  const isLong = content.length > threshold;
  const [open, setOpen] = React.useState(!isLong);

  return (
    <div>
      <div style={!open ? { maxHeight: 420, overflow: "hidden" } : undefined}>
        <MarkdownRenderer content={content} />
      </div>
      {isLong && (
        <button onClick={() => setOpen(!open)} className="mt-2 text-xs text-primary hover:underline">
          {open ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}


