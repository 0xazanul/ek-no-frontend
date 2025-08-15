"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { History, GitCommit, Clock, User, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type FileHistoryProps = {
  path?: string;
  onClose: () => void;
};

type FileVersion = {
  id: string;
  timestamp: Date;
  author: string;
  message: string;
  changes: {
    additions: number;
    deletions: number;
  };
};

// Mock data for file history
const MOCK_FILE_HISTORY: FileVersion[] = [
  {
    id: "abc123",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    author: "John Doe",
    message: "Fix security vulnerability in authentication",
    changes: { additions: 15, deletions: 7 },
  },
  {
    id: "def456",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
    author: "Alice Smith",
    message: "Refactor error handling",
    changes: { additions: 23, deletions: 18 },
  },
  {
    id: "ghi789",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    author: "Bob Johnson",
    message: "Add new validation rules",
    changes: { additions: 42, deletions: 12 },
  },
  {
    id: "jkl012",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    author: "Emma Wilson",
    message: "Initial implementation",
    changes: { additions: 156, deletions: 0 },
  },
];

export function FileHistory({ path, onClose }: FileHistoryProps) {
  const [selectedVersion, setSelectedVersion] = React.useState<string | null>(null);
  const [expandedVersion, setExpandedVersion] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleRestore = (versionId: string) => {
    setLoading(true);
    
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
      onClose();
      
      // This would be where we'd actually restore the file version
      alert(`Version ${versionId} restored!`);
    }, 1500);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    }
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours} hours ago`;
    }
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  return (
    <div className="w-80 border-l bg-background/95 flex flex-col h-full">
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-1.5">
          <History className="size-4 text-primary" />
          File History
        </h3>
        <button 
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          &times;
        </button>
      </div>
      
      {/* File info */}
      <div className="px-3 py-2 border-b">
        <div className="text-xs text-muted-foreground">Current file:</div>
        <div className="text-sm truncate font-medium">{path || "No file selected"}</div>
      </div>
      
      {/* Version list */}
      <div className="flex-1 overflow-y-auto">
        {MOCK_FILE_HISTORY.map((version) => (
          <div 
            key={version.id} 
            className={cn(
              "border-b last:border-b-0 transition-colors",
              selectedVersion === version.id ? "bg-muted/50" : "hover:bg-muted/30"
            )}
          >
            <button
              className="w-full text-left px-3 py-2 flex items-center justify-between"
              onClick={() => {
                setSelectedVersion(version.id);
                setExpandedVersion(expandedVersion === version.id ? null : version.id);
              }}
            >
              <div className="flex items-center gap-2">
                <GitCommit className="size-4 text-primary" />
                <div>
                  <div className="text-sm font-medium truncate max-w-[180px]">
                    {version.message}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <User className="size-3" />
                      {version.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatTimeAgo(version.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
              {expandedVersion === version.id ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
            </button>
            
            {expandedVersion === version.id && (
              <div className="px-3 pb-3">
                <div className="text-xs mb-2 flex items-center gap-2">
                  <span className="text-green-600 flex items-center gap-1">
                    +{version.changes.additions}
                  </span>
                  <span className="text-red-600 flex items-center gap-1">
                    -{version.changes.deletions}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs w-full"
                    onClick={() => setSelectedVersion(version.id)}
                  >
                    View Changes
                  </Button>
                  <Button 
                    size="sm" 
                    className="text-xs w-full flex items-center gap-1"
                    onClick={() => handleRestore(version.id)}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <RotateCcw className="size-3 animate-spin" />
                        Restoring...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="size-3" />
                        Restore
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
