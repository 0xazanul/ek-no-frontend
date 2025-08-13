"use client";

import { cn } from "@/lib/utils";

type BrandProps = {
  className?: string;
};

export function Brand({ className }: BrandProps) {
  return (
    <div className={cn("select-none font-semibold tracking-tight text-foreground", className)}>
      Qasly Labs
    </div>
  );
}


