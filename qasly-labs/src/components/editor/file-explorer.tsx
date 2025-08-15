"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Folder, FolderOpen, File, GitBranch, Plus, Link2, Search, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type RepoNode = {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: RepoNode[];
};

type FileExplorerProps = {
  tree: RepoNode[];
  onSelect: (path: string) => void;
  onConnect: (url: string) => void;
  className?: string;
  activePath?: string;
  isConnecting?: boolean;
  connectionError?: string;
  isCollapsed?: boolean; // New prop
};

export function FileExplorer({ tree, onSelect, onConnect, className, activePath, isConnecting = false, connectionError, isCollapsed = false }: FileExplorerProps) {
  const [repoUrl, setRepoUrl] = React.useState("");
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = React.useState("");

  const toggle = (key: string) => setExpanded((p) => ({ ...p, [key]: !p[key] }));

  const filteredTree = React.useMemo(() => {
    if (!searchQuery.trim()) return tree;
    const filter = (nodes: RepoNode[]): RepoNode[] => {
      return nodes.reduce((acc: RepoNode[], node) => {
        if (node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          acc.push(node);
        } else if (node.children) {
          const filteredChildren = filter(node.children);
          if (filteredChildren.length > 0) {
            acc.push({ ...node, children: filteredChildren });
          }
        }
        return acc;
      }, []);
    };
    return filter(tree);
  }, [tree, searchQuery]);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      // Programming Languages
      case 'js': return '🟨';     // JavaScript
      case 'jsx': return '🟦';    // React JSX
      case 'ts': return '🔷';     // TypeScript
      case 'tsx': return '🔹';    // React TypeScript
      case 'py': return '🐍';     // Python
      case 'go': return '🐹';     // Go
      case 'rs': return '🦀';     // Rust
      case 'java': return '☕';    // Java
      case 'kt': return '🟣';     // Kotlin
      case 'swift': return '🍎';  // Swift
      case 'php': return '🐘';    // PHP
      case 'rb': return '💎';     // Ruby
      
      // Smart Contract Languages
      case 'sol': return '🔒';    // Solidity
      case 'move': return '🟢';   // Move
      
      // Web Technologies
      case 'html': return '🌐';   // HTML
      case 'css': return '🎨';    // CSS
      case 'scss': return '🎨';   // SCSS
      case 'less': return '🎨';   // LESS
      
      // Configuration and Data Files
      case 'json': return '📋';   // JSON
      case 'yaml': return '📄';   // YAML
      case 'yml': return '📄';    // YAML
      case 'toml': return '📄';   // TOML
      case 'xml': return '📄';    // XML
      
      // Markdown and Documentation
      case 'md': return '📝';     // Markdown
      case 'markdown': return '📝'; // Markdown
      
      // Compiled/Binary Files
      case 'exe': return '💻';    // Executable
      case 'dll': return '🧩';    // Dynamic Library
      
      // Fallback
      default: return '📄';       // Generic file
    }
  };

  // Auto-expand first level folders for better UX
  React.useEffect(() => {
    if (tree.length > 0) {
      const firstLevelFolders: Record<string, boolean> = {};
      tree.forEach(node => {
        if (node.type === "folder") {
          firstLevelFolders[node.path] = true;
        }
      });
      setExpanded(prev => ({ ...prev, ...firstLevelFolders }));
    }
  }, [tree]);

  return (
    <div className={cn("h-full min-h-0 flex flex-col", className)}>
      <div className="p-4 border-b bg-muted/20">
        <div className="flex items-center gap-3 mb-3">
          <GitBranch className="size-4 text-muted-foreground" />
          {!isCollapsed && <span className="text-micro text-muted-foreground">Repository</span>}
          {tree.length > 0 && (
            <div className={cn(
              "ml-auto flex items-center gap-1 text-xs text-green-600",
              isCollapsed ? "hidden" : ""
            )}>
              <div className="size-1.5 rounded-full bg-green-500" />
              {tree.reduce((count, node) => count + (node.children?.length || 0) + 1, 0)} files
            </div>
          )}
        </div>
        {!isCollapsed && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="https://github.com/org/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="h-9 text-[13px] focus-surgical transition-surgical"
                disabled={isConnecting}
              />
              <Button 
                size="sm" 
                className="h-9 px-3 transition-surgical focus-surgical" 
                onClick={() => onConnect(repoUrl)}
                disabled={isConnecting || !repoUrl.trim()}
              >
                {isConnecting ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <Link2 className="size-4 mr-2" />
                )}
                {isConnecting ? 'Connecting...' : 'Connect'}
              </Button>
            </div>
            {connectionError && (
              <div className="flex items-center gap-2 text-xs text-destructive bg-red-50/50 border border-red-200/50 rounded-md px-2 py-1">
                <AlertCircle className="size-3" />
                {connectionError}
              </div>
            )}
            {tree.length > 0 && !connectionError && (
              <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50/50 border border-green-200/50 rounded-md px-2 py-1">
                <CheckCircle2 className="size-3" />
                Connected successfully
              </div>
            )}
          </div>
        )}
      </div>
      {tree.length > 0 && !isCollapsed && (
        <div className="p-4 border-b bg-muted/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-9 text-[13px] focus-surgical transition-surgical bg-background/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 size-5 rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/40 flex items-center justify-center transition-colors"
              >
                <span className="text-xs">×</span>
              </button>
            )}
          </div>
        </div>
      )}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4">
          {tree.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="size-12 rounded-full bg-muted/20 flex items-center justify-center mb-3">
                <GitBranch className="size-6 text-muted-foreground" />
              </div>
              {!isCollapsed && (
                <div className="text-sm text-muted-foreground mb-2">No repository connected</div>
              )}
              {!isCollapsed && (
                <div className="text-xs text-muted-foreground/70">Enter a GitHub URL above to start</div>
              )}
            </div>
          ) : filteredTree.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="size-12 rounded-full bg-muted/20 flex items-center justify-center mb-3">
                <Search className="size-6 text-muted-foreground" />
              </div>
              {!isCollapsed && (
                <div className="text-sm text-muted-foreground mb-2">No files found</div>
              )}
              {!isCollapsed && (
                <div className="text-xs text-muted-foreground/70">Try a different search term</div>
              )}
            </div>
          ) : (
            <Tree 
              nodes={filteredTree} 
              pathPrefix="" 
              expanded={expanded} 
              onToggle={toggle} 
              onSelect={onSelect}
              activePath={activePath}
              getFileIcon={getFileIcon}
              isCollapsed={isCollapsed} // Pass collapsed state to Tree
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function Tree({
  nodes,
  pathPrefix,
  expanded,
  onToggle,
  onSelect,
  activePath,
  getFileIcon,
  isCollapsed, // New prop
}: {
  nodes: RepoNode[];
  pathPrefix: string;
  expanded: Record<string, boolean>;
  onToggle: (k: string) => void;
  onSelect: (p: string) => void;
  activePath?: string;
  getFileIcon?: (fileName: string) => string;
  isCollapsed?: boolean; // New prop
}) {
  return (
    <ul className="space-y-px text-sm">
      {nodes.map((node) => {
        const id = `${pathPrefix}/${node.name}`.replace(/^\//, "");
        if (node.type === "folder") {
          const isOpen = !!expanded[id];
          return (
            <li key={id}>
              <button
                className="w-full flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-accent/60 focus-surgical transition-all text-left group"
                onClick={() => onToggle(id)}
              >
                {isOpen ? (
                  <FolderOpen className="size-4 text-amber-600 flex-shrink-0 transition-transform group-hover:scale-110" />
                ) : (
                  <Folder className="size-4 text-amber-600 flex-shrink-0 transition-transform group-hover:scale-110" />
                )}
                {!isCollapsed && <span className="text-surgical truncate flex-1">{node.name}</span>}
                {!isCollapsed && (
                  <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    {node.children?.length || 0}
                  </span>
                )}
              </button>
              {isOpen && node.children && node.children.length > 0 && (
                <div className="ml-6 border-l border-border/50 pl-3 mt-1">
                  <Tree
                    nodes={node.children}
                    pathPrefix={id}
                    expanded={expanded}
                    onToggle={onToggle}
                    onSelect={onSelect}
                    activePath={activePath}
                    getFileIcon={getFileIcon}
                    isCollapsed={isCollapsed}
                  />
                </div>
              )}
            </li>
          );
        }
        return (
          <li key={id}>
            <button
              className={cn(
                "w-full flex items-center gap-3 px-2 py-1.5 rounded-md focus-surgical transition-all text-left group",
                activePath === id 
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
                  : "hover:bg-accent/60 hover:shadow-sm hover:translate-x-0.5"
              )}
              onClick={() => onSelect(id)}
            >
              <span className="text-lg flex-shrink-0 transition-transform group-hover:scale-110">{getFileIcon?.(node.name) || '📄'}</span>
              {!isCollapsed && <span className="text-surgical truncate flex-1">{node.name}</span>}
              {activePath === id && !isCollapsed && (
                <div className="size-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}


