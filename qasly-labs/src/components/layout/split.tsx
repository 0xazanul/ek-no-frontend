"use client";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";

type SplitProps = {
  left: React.ReactNode;
  right: React.ReactNode;
  className?: string;
};

export function Split({ left, right, className }: SplitProps) {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className={cn("h-full w-full", className)}
    >
      <ResizablePanel defaultSize={55} minSize={35} className="min-w-[320px]">
        <div className="h-full overflow-hidden">{left}</div>
      </ResizablePanel>
      <ResizableHandle withHandle className="w-1 bg-border hover:bg-accent transition-surgical" />
      <ResizablePanel defaultSize={45} minSize={30}>
        <div className="h-full overflow-hidden">{right}</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}


