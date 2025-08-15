"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Shield,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle2,
  Package,
  FileCode,
  ChevronRight,
  ArrowUpRight,
  AlertCircle,
  RefreshCw,
  Download,
  X
} from "lucide-react";
import { Finding } from "@/types/finding"; // Import Finding type
import { useNotification } from "@/components/ui/notification"; // For notifications
import { badge } from "@/lib/utils"; // Import badge function from utils

type PremiumFeaturesProps = {
  className?: string;
};

export function SecurityPanel({ className }: PremiumFeaturesProps) {
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanProgress, setScanProgress] = React.useState(0);
  const [findings, setFindings] = React.useState<Finding[]>([]);
  const [lastScanTime, setLastScanTime] = React.useState<string | null>(null);
  const { addNotification } = useNotification();
  
  const startScan = async () => {
    setIsScanning(true);
    setScanProgress(0);
    setFindings([]);
    setLastScanTime(null);

    let allNewFindings: Finding[] = [];
    let currentProgress = 0;
    const totalSteps = 2; // File analysis + Dependency analysis

    const updateProgress = (step: number, message: string) => {
      currentProgress = Math.min(Math.round((step / totalSteps) * 100), 99);
      setScanProgress(currentProgress);
      addNotification({ type: "info", title: "Scan in Progress", message, duration: 2000 });
    };

    try {
      // Step 1: Get all files from the current repo tree
      // In a real app, this would come from a global state or prop.
      // For now, we'll simulate getting some files.
      updateProgress(0.5, "Fetching repository files...");
      const repoRes = await fetch("/api/repo/connect"); // Re-use repo connect API to get tree
      if (!repoRes.ok) throw new Error("Failed to fetch repository structure.");
      const repoData = await repoRes.json();
      const allFiles: { path: string; content: string }[] = [];

      // Simple recursive function to flatten the tree and get content
      const flattenTree = async (nodes: any[]) => {
        for (const node of nodes) {
          if (node.type === "file") {
            // Fetch content for each file (simplified for sample repo)
            const fileContentRes = await fetch(`/api/repo/file?path=${encodeURIComponent(node.path)}`);
            if (fileContentRes.ok) {
              const fileData = await fileContentRes.json();
              allFiles.push({ path: node.path, content: fileData.content || "" });
            }
          } else if (node.children) {
            await flattenTree(node.children);
          }
        }
      };
      await flattenTree(repoData.tree); // Assuming repoData.tree holds the file structure

      // Step 2: Perform file analysis (Semgrep)
      updateProgress(1, "Analyzing code for vulnerabilities...");
      for (const file of allFiles) {
        const fileAnalyzeRes = await fetch("/api/analyze/file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: file.path, content: file.content }),
        });
        if (fileAnalyzeRes.ok) {
          const data = await fileAnalyzeRes.json();
          allNewFindings.push(...data.findings);
        } else {
          console.warn(`Failed to analyze file ${file.path}: ${fileAnalyzeRes.statusText}`);
        }
      }
      setScanProgress(70); // Intermediate progress

      // Step 3: Perform dependency analysis (Trivy)
      updateProgress(1.5, "Scanning dependencies for vulnerabilities...");
      const dependencyFiles = allFiles.filter(f => 
        f.path.endsWith("package.json") || 
        f.path.endsWith("requirements.txt") ||
        f.path.endsWith("go.mod") ||
        f.path.endsWith("pom.xml") ||
        f.path.endsWith("build.gradle")
      );
      
      if (dependencyFiles.length > 0) {
        const depAnalyzeRes = await fetch("/api/analyze/dependencies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ files: dependencyFiles }),
        });
        if (depAnalyzeRes.ok) {
          const data = await depAnalyzeRes.json();
          allNewFindings.push(...data.findings);
        } else {
          console.warn(`Failed to analyze dependencies: ${depAnalyzeRes.statusText}`);
        }
      }
      setScanProgress(90); // Near completion

      setFindings(allNewFindings);
      setLastScanTime(new Date().toLocaleString());
      setScanProgress(100);

      addNotification({
        type: allNewFindings.length > 0 ? "warning" : "success",
        title: allNewFindings.length > 0 ? "Scan Complete with Findings" : "Scan Complete",
        message: allNewFindings.length > 0 
          ? `Found ${allNewFindings.length} issues in your codebase.`
          : "No security issues found.",
        duration: 5000
      });

    } catch (error: any) {
      console.error("Security scan failed:", error);
      addNotification({
        type: "error",
        title: "Scan Failed",
        message: `An error occurred during the scan: ${error.message}`,
        duration: 5000
      });
      setFindings([]);
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  const codeFindings = findings.filter(f => !f.osvId); // Findings from static analysis
  const dependencyFindings = findings.filter(f => f.osvId); // Findings from dependency analysis

  const criticalCount = findings.filter(f => f.severity === "critical").length;
  const highCount = findings.filter(f => f.severity === "high").length;
  const mediumCount = findings.filter(f => f.severity === "medium").length;
  const lowCount = findings.filter(f => f.severity === "low").length;

  const totalVulnerabilities = findings.length;

  // Dummy data for Security Score (can be replaced with real calculation)
  const securityScore = totalVulnerabilities === 0 ? "100/100" : 
    totalVulnerabilities < 10 ? "90/100" : 
    totalVulnerabilities < 30 ? "70/100" : "50/100";
  const securityScoreDescription = totalVulnerabilities === 0 ? "Excellent" : 
    totalVulnerabilities < 10 ? "Good" : 
    totalVulnerabilities < 30 ? "Fair" : "Poor";

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: <Shield className="size-4" /> },
    { id: "vulnerabilities", label: "Vulnerabilities", icon: <AlertTriangle className="size-4" />, count: totalVulnerabilities },
    { id: "dependencies", label: "Dependencies", icon: <Package className="size-4" />, count: dependencyFindings.length },
    { id: "code", label: "Code Analysis", icon: <FileCode className="size-4" />, count: codeFindings.length }
  ];

  return (
    <div className={cn("flex h-full", className)}>
      {/* Side Navigation */}
      <div className="w-64 border-r bg-muted/10 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold flex items-center gap-2 text-lg">
            <Shield className="size-5 text-primary" />
            Security Center
          </h2>
        </div>
        
        <div className="flex-1 overflow-auto py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-3",
                activeTab === tab.id
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30 border-l-2 border-transparent"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="ml-auto px-1.5 py-0.5 text-xs bg-muted rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        
        <div className="p-4 border-t">
          <Button 
            className="w-full flex items-center gap-2 justify-center" 
            onClick={startScan}
            disabled={isScanning}
          >
            {isScanning ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                Scanning ({scanProgress}%)...
              </>
            ) : (
              <>
                <Shield className="size-4" />
                Run Security Scan
              </>
            )}
          </Button>
          {lastScanTime && !isScanning && (
            <p className="text-xs text-muted-foreground mt-2 text-center">Last scan: {lastScanTime}</p>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b bg-muted/5 p-4">
          {activeTab === "dashboard" && <h2 className="text-lg font-medium">Security Dashboard</h2>}
          {activeTab === "vulnerabilities" && <h2 className="text-lg font-medium">Vulnerability Report</h2>}
          {activeTab === "dependencies" && <h2 className="text-lg font-medium">Dependency Analysis</h2>}
          {activeTab === "code" && <h2 className="text-lg font-medium">Code Security Analysis</h2>}
        </div>
        
        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Dashboard View */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* Progress Indicators */}
              {isScanning ? (
                <div className="bg-muted/20 border rounded-lg p-6 text-center">
                  <div className="flex flex-col items-center">
                    <RefreshCw className="size-8 text-primary animate-spin mb-4" />
                    <h3 className="text-lg font-medium mb-2">Security Scan in Progress</h3>
                    <p className="text-sm text-muted-foreground mb-4">Analyzing code and dependencies for vulnerabilities...</p>
                    
                    <div className="w-full max-w-md h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300 ease-out"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                    <p className="text-sm mt-2">{scanProgress}% complete</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SecurityCard 
                    title="Security Score" 
                    value={securityScore} 
                    description={securityScoreDescription} 
                    icon={<Shield className="size-5" />} 
                    color={totalVulnerabilities > 20 ? "text-red-500" : totalVulnerabilities > 5 ? "text-amber-500" : "text-green-500"}
                  />
                  <SecurityCard 
                    title="Vulnerabilities" 
                    value={totalVulnerabilities.toString()} 
                    description={`${criticalCount} critical`} 
                    icon={<AlertTriangle className="size-5" />} 
                    color={criticalCount > 0 ? "text-red-500" : "text-primary"}
                  />
                  <SecurityCard 
                    title="Dependencies Issues" 
                    value={dependencyFindings.length.toString()} 
                    description={`${dependencyFindings.filter(f => f.severity === "high" || f.severity === "critical").length} high/critical`} 
                    icon={<Package className="size-5" />} 
                    color={dependencyFindings.length > 0 ? "text-amber-500" : "text-primary"}
                  />
                </div>
              )}
              
              {/* Recent Vulnerabilities (Dynamic) */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Recent Vulnerabilities</h3>
                  <Button variant="ghost" size="sm" className="text-xs flex items-center gap-1" onClick={() => setActiveTab("vulnerabilities")}>
                    View All <ChevronRight className="size-3" />
                  </Button>
                </div>
                
                {findings.length > 0 ? (
                <div className="space-y-3">
                    {findings.slice(0, 3).map((f, idx) => (
                  <VulnerabilityItem
                        key={idx}
                        severity={f.severity}
                        title={f.description}
                        description={f.suggestedFix || "No specific fix suggested."}
                        file={f.file + (f.line ? `:${f.line}` : "")}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <CheckCircle2 className="size-8 mx-auto mb-2" />
                    <p>No recent vulnerabilities found.</p>
                </div>
                )}
              </div>
              
              {/* Recommendations (Placeholder) */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Recommendations</h3>
                  <Button variant="ghost" size="sm" className="text-xs flex items-center gap-1">
                    View All <ChevronRight className="size-3" />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <RecommendationItem
                    title="Regular Security Scans"
                    description="Schedule automated security scans to catch new vulnerabilities early."
                    impact="Reduce long-term security debt."
                  />
                  <RecommendationItem
                    title="Review Access Controls"
                    description="Ensure all critical functions have proper access control mechanisms."
                    impact="Prevent unauthorized access and privilege escalation."
                  />
                </div>
              </div>
              
              {/* OSV Integration -> Trivy/SCA Overview */}
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500/20 p-3 rounded-full">
                    <Package className="size-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1">Software Composition Analysis</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Automatically scan your dependency files for known vulnerabilities using Trivy.
                    </p>
                    <div className="flex items-center gap-3">
                      <Button 
                        size="sm" 
                        className="flex items-center gap-1"
                        onClick={() => setActiveTab("dependencies")}
                      >
                        <Shield className="size-3.5" />
                        View Dependencies
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1"
                        onClick={() => window.open("https://trivy.dev/", "_blank")}
                      >
                        <ArrowUpRight className="size-3.5" />
                        Learn More
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Security Trends (Placeholder) */}
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Security Trends</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">Vulnerabilities over time</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <button className="px-2 py-1 rounded bg-muted/50 hover:bg-muted transition-colors">Week</button>
                        <button className="px-2 py-1 rounded bg-primary/10 text-primary">Month</button>
                        <button className="px-2 py-1 rounded bg-muted/50 hover:bg-muted transition-colors">Year</button>
                      </div>
                    </div>
                    <div className="h-32 bg-muted/30 rounded-lg border relative">
                      {/* Mock chart - would be replaced with actual chart component */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full px-4">
                          <div className="relative h-20">
                            <div className="absolute bottom-0 left-0 w-full flex items-end">
                              <div className="w-1/12 h-4 bg-blue-500/30 rounded-sm mx-0.5"></div>
                              <div className="w-1/12 h-6 bg-blue-500/30 rounded-sm mx-0.5"></div>
                              <div className="w-1/12 h-8 bg-blue-500/30 rounded-sm mx-0.5"></div>
                              <div className="w-1/12 h-12 bg-blue-500/30 rounded-sm mx-0.5"></div>
                              <div className="w-1/12 h-10 bg-blue-500/30 rounded-sm mx-0.5"></div>
                              <div className="w-1/12 h-14 bg-blue-500/30 rounded-sm mx-0.5"></div>
                              <div className="w-1/12 h-16 bg-blue-500/30 rounded-sm mx-0.5"></div>
                              <div className="w-1/12 h-12 bg-blue-500/30 rounded-sm mx-0.5"></div>
                              <div className="w-1/12 h-8 bg-blue-500/30 rounded-sm mx-0.5"></div>
                              <div className="w-1/12 h-10 bg-blue-500/30 rounded-sm mx-0.5"></div>
                              <div className="w-1/12 h-12 bg-blue-500/30 rounded-sm mx-0.5"></div>
                              <div className="w-1/12 h-18 bg-primary/50 rounded-sm mx-0.5"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Top Vulnerability Types</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Cross-Site Scripting</span>
                          <span className="font-medium">32%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Command Injection</span>
                          <span className="font-medium">24%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Prototype Pollution</span>
                          <span className="font-medium">18%</span>
                        </div>
                      </div>
                      <Button 
                        className="w-full mt-3 text-xs text-primary hover:underline flex items-center justify-center gap-1"
                        onClick={() => setActiveTab("vulnerabilities")}
                      >
                        View Full Breakdown
                        <ChevronRight className="size-3" />
                      </Button>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Security Score History</h4>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-2xl font-semibold">73</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="text-green-500">+5</span>
                          <span>from last month</span>
                        </div>
                      </div>
                      <div className="h-8 bg-muted/30 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500" style={{ width: '73%' }}></div>
                      </div>
                      <Button 
                        className="w-full mt-3 text-xs text-primary hover:underline flex items-center justify-center gap-1"
                        onClick={() => setActiveTab("dashboard")}
                      >
                        View History
                        <ChevronRight className="size-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Vulnerabilities Tab (Dynamic) */}
          {activeTab === "vulnerabilities" && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <SeverityCard count={criticalCount} severity="critical" />
                <SeverityCard count={highCount} severity="high" />
                <SeverityCard count={mediumCount} severity="medium" />
                <SeverityCard count={lowCount} severity="low" />
              </div>
              
              {findings.length > 0 ? (
              <div className="space-y-4">
                  <h3 className="text-lg font-medium">All Vulnerabilities ({totalVulnerabilities})</h3>
                  {findings.map((f, idx) => (
                <VulnerabilityItem
                      key={idx}
                      severity={f.severity}
                      title={f.description}
                      description={f.suggestedFix || "No specific fix suggested."}
                      file={f.file + (f.line ? `:${f.line}` : "")}
                    />
                  ))}
              </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <CheckCircle2 className="size-8 mx-auto mb-2" />
                  <p>No vulnerabilities found.</p>
              </div>
              )}
            </div>
          )}
          
          {/* Dependencies Tab (Dynamic) */}
          {activeTab === "dependencies" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DependencyCard title="Total Dependencies" count={0} icon={<Package className="size-5" />} />
                <DependencyCard title="Vulnerable" count={dependencyFindings.length} icon={<AlertCircle className="size-5" />} color={dependencyFindings.length > 0 ? "text-red-500" : "text-primary"} />
                <DependencyCard title="Outdated" count={0} icon={<AlertTriangle className="size-5" />} color="text-amber-500" />
              </div>
              
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Vulnerable Dependencies ({dependencyFindings.length})</h3>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    className="text-xs flex items-center gap-1"
                    onClick={() => alert("Exporting report...")} // Placeholder
                  >
                    <Download className="size-3.5" />
                    Export Report
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs flex items-center gap-1"
                    onClick={() => alert("Updating all vulnerable dependencies...")} // Placeholder
                  >
                    <RefreshCw className="size-3.5" />
                    Update All
                  </Button>
                </div>
              </div>
              
              {dependencyFindings.length > 0 ? (
                <div className="overflow-hidden border rounded-lg">
                  <table className="min-w-full divide-y">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Package</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Version</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Vulnerabilities</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-background divide-y">
                        {dependencyFindings.map((f, idx) => (
                          <DependencyRow 
                            key={idx}
                            name={f.packageName || "Unknown"}
                            current={f.packageVersion || "Unknown"}
                            latest={f.suggestedFix?.replace("Update ", "").replace(" or later.", "") || "Unknown"} // Extract latest from suggestedFix
                            vulnCount={1} // Each finding is one vulnerability for a package
                            description={f.description}
                            issues={[{ id: f.cveId || f.osvId || "unknown", title: f.description, severity: f.severity }]} // Pass detailed issue
                          />
                        ))}
                    </tbody>
                  </table>
                  </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Package className="size-8 mx-auto mb-2" />
                  <p>No vulnerable dependencies found.</p>
                </div>
              )}
            </div>
          )}
          
          {/* Code Analysis Tab (Dynamic) */}
          {activeTab === "code" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CodeAnalysisCard title="Files Scanned" count={0} icon={<FileCode className="size-5" />} />
                <CodeAnalysisCard title="Issues Found" count={codeFindings.length} icon={<AlertTriangle className="size-5" />} color={codeFindings.length > 0 ? "text-amber-500" : "text-primary"} />
                <CodeAnalysisCard title="Fixed Issues" count={0} icon={<CheckCircle2 className="size-5" />} color="text-green-500" />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Code Vulnerabilities ({codeFindings.length})</h3>
                {codeFindings.length > 0 ? (
                  <div className="space-y-3">
                    {codeFindings.map((f, idx) => (
                <VulnerabilityItem
                        key={idx}
                        severity={f.severity}
                        title={f.description}
                        description={f.suggestedFix || "No specific fix suggested."}
                        file={f.file + (f.line ? `:${f.line}` : "")}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <FileCode className="size-8 mx-auto mb-2" />
                    <p>No code vulnerabilities found.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VulnerabilityItem({ 
  severity, 
  title, 
  description, 
  file,
}: { 
  severity: Finding["severity"];
  title: string;
  description: string;
  file: string;
}) {
  const severityColors = {
    critical: "bg-red-500",
    high: "bg-orange-500", 
    medium: "bg-yellow-500",
    low: "bg-blue-500",
    info: "bg-gray-500",
  };

  return (
    <div className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className={cn("size-2 rounded-full mt-2 flex-shrink-0", severityColors[severity])} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium">{title}</h4>
            <span className={cn("text-xs px-2 py-0.5 bg-muted rounded-full capitalize", badge(severity))}>
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
  impact,
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

function SecurityCard({ 
  title, 
  value, 
  description, 
  icon,
  color = "text-primary",
}: { 
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="p-5 border rounded-lg bg-card/50 hover:bg-card/80 transition-colors">
      <div className="flex items-start justify-between">
        <div className={cn("p-2 rounded-full bg-muted", color.replace("text-", "bg-") + "/10")}>
          <div className={cn("size-5", color)}>{icon}</div>
        </div>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-semibold">{value}</h3>
        <p className="text-sm text-muted-foreground mt-1">{title}</p>
      </div>
    </div>
  );
}

function SeverityCard({ 
  count, 
  severity,
}: { 
  count: number;
  severity: "critical" | "high" | "medium" | "low" | "info";
}) {
  const severityColors = {
    critical: "text-red-500 bg-red-500/10",
    high: "text-orange-500 bg-orange-500/10", 
    medium: "text-yellow-500 bg-yellow-500/10",
    low: "text-blue-500 bg-blue-500/10",
    info: "text-gray-500 bg-gray-500/10",
  };
  
  const severityIcons = {
    critical: <AlertCircle className="size-5" />,
    high: <AlertTriangle className="size-5" />,
    medium: <AlertTriangle className="size-5" />,
    low: <AlertCircle className="size-5" />,
    info: <AlertCircle className="size-5" />,
  };

  return (
    <div className="p-5 border rounded-lg bg-card/50 hover:bg-card/80 transition-colors">
      <div className="flex items-center justify-between">
        <div className={cn("p-2 rounded-full", severityColors[severity])}>
          <div className={cn("size-5", severityColors[severity].split(" ")[0])}>
            {severityIcons[severity]}
          </div>
        </div>
        <span className="text-xs px-2 py-0.5 bg-muted rounded-full capitalize">
          {severity}
        </span>
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-semibold">{count}</h3>
        <p className="text-sm text-muted-foreground mt-1">Vulnerabilities</p>
      </div>
    </div>
  );
}

function DependencyCard({ 
  title, 
  count, 
  icon,
  color = "text-primary",
}: { 
  title: string;
  count: number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="p-5 border rounded-lg bg-card/50 hover:bg-card/80 transition-colors">
      <div className="flex items-center justify-between">
        <div className={cn("p-2 rounded-full bg-muted", color.replace("text-", "bg-") + "/10")}>
          <div className={cn("size-5", color)}>{icon}</div>
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-semibold">{count}</h3>
        <p className="text-sm text-muted-foreground mt-1">{title}</p>
      </div>
    </div>
  );
}

type VulnerabilityIssue = {
  id: string;
  title: string;
  severity: Finding["severity"];
};

function DependencyRow({ 
  name, 
  current, 
  latest, 
  vulnCount,
  description,
  issues = [],
}: { 
  name: string;
  current: string;
  latest: string;
  vulnCount: number;
  description?: string;
  issues?: VulnerabilityIssue[];
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);
  const [updating, setUpdating] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);

  const handleUpdate = () => {
    setUpdating(true);
    // Simulate update process
    setTimeout(() => {
      setUpdating(false);
      // Show success message
      alert(`${name} updated successfully to ${latest}`);
    }, 1500);
  };

  const severityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 text-red-500 border-red-500/30";
      case "high":
        return "bg-orange-500/10 text-orange-500 border-orange-500/30";
      case "medium":
        return "bg-amber-500/10 text-amber-700 border-amber-500/30";
      case "low":
        return "bg-blue-500/10 text-blue-700 border-blue-500/30";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/30";
    }
  };

  return (
    <>
    <tr className="hover:bg-muted/20">
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center">
          <Package className="size-4 text-primary mr-2" />
            <div>
              <div className="font-medium">{name}</div>
              {description && (
                <div className="text-xs text-muted-foreground mt-0.5 max-w-60 truncate">
                  {description}
                </div>
              )}
            </div>
        </div>
      </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm">{current}</td>
        <td className="px-4 py-3 whitespace-nowrap text-sm">{latest}</td>
      <td className="px-4 py-3 whitespace-nowrap">
        {vulnCount > 0 ? (
            <button
              className="px-2 py-1 text-xs rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
              onClick={() => setExpanded(!expanded)}
            >
              {vulnCount} {vulnCount === 1 ? "vulnerability" : "vulnerabilities"}
            </button>
        ) : (
          <span className="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-500">
            Secure
          </span>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={handleUpdate}
              disabled={updating}
            >
              {updating ? "Updating..." : "Update"}
            </Button>
            <div className="relative">
              <Button
                size="sm"
                variant="ghost"
                className="text-xs px-2"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreHorizontal className="size-4" />
              </Button>
              
              {showMenu && (
                <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-background border z-10">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-muted/50 transition-colors flex items-center gap-2"
                      onClick={() => {
                        setShowDetails(true);
                        setShowMenu(false);
                      }}
                    >
                      <FileCode className="size-4" />
                      View Details
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-muted/50 transition-colors flex items-center gap-2"
                      onClick={() => {
                        alert(`Ignored ${name} vulnerabilities`);
                        setShowMenu(false);
                      }}
                    >
                      <AlertCircle className="size-4" />
                      Ignore Vulnerabilities
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-muted/50 transition-colors flex items-center gap-2"
                      onClick={() => {
                        alert(`Generated report for ${name}`);
                        setShowMenu(false);
                      }}
                    >
                      <Download className="size-4" />
                      Generate Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </td>
      </tr>
      
      {/* Expanded vulnerability details */}
      {expanded && issues.length > 0 && (
        <tr>
          <td colSpan={5} className="bg-muted/30 px-4 py-3">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Vulnerability Details</h4>
              <div className="space-y-2">
                {issues.map((issue) => (
                  <div key={issue.id} className="p-2 border rounded bg-background/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 text-xs rounded border ${severityColor(
                            issue.severity
                          )}`}
                        >
                          {issue.severity.toUpperCase()}
                        </span>
                        <span className="font-medium text-sm">{issue.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{issue.id}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`https://github.com/advisories/${issue.id}`, "_blank")}
                      >
                        View Advisory
        </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
      </td>
    </tr>
      )}
      
      {/* Package details modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-medium flex items-center gap-2">
                <Package className="size-5" />
                {name} Details
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setShowDetails(false)}>
                <X className="size-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Description</h3>
                  <p className="text-sm">{description || "No description available"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">Version Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded">
                      <div className="text-xs text-muted-foreground">Current Version</div>
                      <div className="text-lg font-medium">{current}</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="text-xs text-muted-foreground">Latest Version</div>
                      <div className="text-lg font-medium">{latest}</div>
                    </div>
                  </div>
                </div>
                
                {vulnCount > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Vulnerabilities ({vulnCount})</h3>
                    <div className="space-y-2">
                      {issues.map((issue) => (
                        <div key={issue.id} className="p-3 border rounded">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-1.5 py-0.5 text-xs rounded border ${
                                  severityColor(issue.severity)
                                }`}
                              >
                                {issue.severity.toUpperCase()}
                              </span>
                              <span className="font-medium">{issue.title}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{issue.id}</span>
                          </div>
                          <div className="mt-3 flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                window.open(`https://github.com/advisories/${issue.id}`, "_blank")
                              }
                            >
                              View Advisory
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium mb-1">Update Impact</h3>
                  <div className="p-3 border rounded">
                    <p className="text-sm">
                      Updating from {current} to {latest} will resolve {vulnCount}{" "}
                      {vulnCount === 1 ? "vulnerability" : "vulnerabilities"}.
                      {vulnCount > 0
                        ? " This update is highly recommended."
                        : " No vulnerabilities found in this package."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDetails(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updating}>
                {updating ? "Updating..." : "Update Package"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CodeAnalysisCard({ 
  title, 
  count, 
  icon,
  color = "text-primary",
}: { 
  title: string;
  count: number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="p-5 border rounded-lg bg-card/50 hover:bg-card/80 transition-colors">
      <div className="flex items-center justify-between">
        <div className={cn("p-2 rounded-full bg-muted", color.replace("text-", "bg-") + "/10")}>
          <div className={cn("size-5", color)}>{icon}</div>
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-semibold">{count}</h3>
        <p className="text-sm text-muted-foreground mt-1">{title}</p>
      </div>
    </div>
  );
}
