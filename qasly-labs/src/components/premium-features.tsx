"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Shield,
  MoreHorizontal
} from "lucide-react";

type PremiumFeaturesProps = {
  className?: string;
};

export function SecurityPanel({ className }: PremiumFeaturesProps) {
  const [activeTab, setActiveTab] = React.useState("vulnerabilities");
  
  const tabs = [
    { id: "vulnerabilities", label: "Vulnerabilities", count: 23 },
    { id: "recommendations", label: "Recommendations", count: 156 },
    { id: "compliance", label: "Compliance", count: 8 },
    { id: "dependencies", label: "Dependencies", count: 45 }
  ];

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Tab Navigation */}
      <div className="flex border-b bg-muted/20">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
              activeTab === tab.id
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {tab.label}
            <span className="px-1.5 py-0.5 text-xs bg-muted rounded-full">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "vulnerabilities" && (
          <div className="space-y-4">
            <VulnerabilityItem
              severity="critical"
              title="SQL Injection"
              description="User input not properly sanitized in login endpoint"
              file="auth/login.js:42"
            />
            <VulnerabilityItem
              severity="high"
              title="Cross-Site Scripting (XSS)"
              description="Unescaped user data rendered in template"
              file="views/profile.html:156"
            />
            <VulnerabilityItem
              severity="medium"
              title="Insecure Randomness"
              description="Math.random() used for session token generation"
              file="utils/session.js:23"
            />
          </div>
        )}
        
        {activeTab === "recommendations" && (
          <div className="space-y-4">
            <RecommendationItem
              title="Implement Input Validation"
              description="Add comprehensive input validation to all user-facing endpoints"
              impact="Prevents 15 potential vulnerabilities"
            />
            <RecommendationItem
              title="Enable CSRF Protection"
              description="Configure CSRF tokens for state-changing operations"
              impact="Secures 8 vulnerable endpoints"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function VulnerabilityItem({ 
  severity, 
  title, 
  description, 
  file 
}: { 
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  file: string;
}) {
  const severityColors = {
    critical: "bg-red-500",
    high: "bg-orange-500", 
    medium: "bg-yellow-500",
    low: "bg-blue-500"
  };

  return (
    <div className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className={cn("size-2 rounded-full mt-2 flex-shrink-0", severityColors[severity])} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium">{title}</h4>
            <span className="text-xs px-2 py-0.5 bg-muted rounded-full capitalize">
              {severity}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{description}</p>
          <p className="text-xs text-muted-foreground font-mono">{file}</p>
        </div>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function RecommendationItem({ 
  title, 
  description, 
  impact 
}: { 
  title: string;
  description: string;
  impact: string;
}) {
  return (
    <div className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-3">
        <Shield className="size-4 text-primary mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-medium mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground mb-2">{description}</p>
          <p className="text-xs text-primary">{impact}</p>
        </div>
        <Button variant="ghost" size="sm">
          Apply Fix
        </Button>
      </div>
    </div>
  );
}
