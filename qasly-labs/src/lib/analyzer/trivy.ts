import { Finding, Severity } from "@/types/finding";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const execPromise = promisify(exec);

// Function to map Trivy severity to our internal Severity type
function mapTrivySeverity(trivySeverity: string): Severity {
  switch (trivySeverity.toLowerCase()) {
    case "critical":
      return "critical";
    case "high":
      return "high";
    case "medium":
      return "medium";
    case "low":
      return "low";
    case "unknown":
    default:
      return "info";
  }
}

// Function to parse Trivy JSON output and convert to Finding objects
function parseTrivyOutput(filePath: string, output: any): Finding[] {
  const findings: Finding[] = [];

  if (!output.Results) {
    return findings;
  }

  for (const result of output.Results) {
    if (!result.Vulnerabilities) continue;

    for (const vuln of result.Vulnerabilities) {
      const severity = mapTrivySeverity(vuln.Severity);
      const description = vuln.Description || vuln.Title || `Vulnerability in ${vuln.PkgName}`;
      const cwe = vuln.CweIDs && vuln.CweIDs.length > 0 ? vuln.CweIDs[0] : undefined;
      const cveId = vuln.VulnerabilityID; // Trivy provides CVE/GHSA IDs here

      let suggestedFix = `Update ${vuln.PkgName} to a non-vulnerable version.`;
      if (vuln.FixedVersion) {
        suggestedFix = `Update ${vuln.PkgName} to version ${vuln.FixedVersion} or later.`;
      }

      const references = vuln.References?.map((ref: string) => ({ url: ref, type: "UNKNOWN" })) || [];

      findings.push({
        file: filePath, // The dependency file itself
        line: 1, // Trivy doesn't provide line numbers for package vulnerabilities
        severity,
        cwe,
        description,
        suggestedFix,
        ruleId: `trivy-${vuln.VulnerabilityID}`,
        osvId: cveId.startsWith("GHSA") ? cveId : undefined, // Assuming GHSA is used as OSV ID
        packageName: vuln.PkgName,
        packageVersion: vuln.InstalledVersion,
        packageEcosystem: result.Type, // e.g., "npm", "pip", "gomod"
        cveId: cveId.startsWith("CVE") ? cveId : undefined,
        references,
      });
    }
  }
  return findings;
}

export async function scanDependencies(filePath: string, fileContent: string): Promise<Finding[]> {
  const tempDir = `/tmp/trivy-scan-${Date.now()}`;
  const tempFilePath = path.join(tempDir, path.basename(filePath));

  try {
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(tempFilePath, fileContent, "utf8");

    // Detect package manager based on file name for Trivy's --scanners option
    let scanner = "fs"; // Default to filesystem scan
    if (filePath.endsWith("package.json")) {
      scanner = "vuln,secret"; // npm
    } else if (filePath.endsWith("requirements.txt")) {
      scanner = "vuln,secret"; // pip
    } else if (filePath.endsWith("go.mod")) {
      scanner = "vuln,secret"; // go.mod
    } else if (filePath.endsWith("pom.xml") || filePath.endsWith("build.gradle")) {
      scanner = "vuln,secret"; // Maven/Gradle
    }

    // Run Trivy as a Docker command
    const command = `docker run --rm -v ${tempDir}:${tempDir} aquasec/trivy:latest \
      fs \
      --format json \
      --scanners ${scanner} \
      --timeout 5m \
      ${tempFilePath}`;

    console.log("Running Trivy command:", command);
    const { stdout, stderr } = await execPromise(command);

    if (stderr) {
      console.warn("Trivy stderr:", stderr);
    }

    const trivyOutput = JSON.parse(stdout);
    const findings = parseTrivyOutput(filePath, trivyOutput);
    return findings;
  } catch (error: any) {
    console.error("Error running Trivy analysis:", error.message);
    const tempDirMatch = error.message.match(/\/tmp\/trivy-scan-(\d+)/);
    if (tempDirMatch && tempDirMatch[0]) {
      await execPromise(`rm -rf ${tempDirMatch[0]}`).catch(err => console.error("Failed to clean up temp dir:", err));
    }
    return [];
  } finally {
    // Ensure cleanup even if errors occur before catch
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (err) {
      console.error("Failed to clean up temp directory:", err);
    }
  }
}
