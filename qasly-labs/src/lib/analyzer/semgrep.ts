import { Finding, Severity } from "@/types/finding";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execPromise = promisify(exec);

// Function to map Semgrep severity to our internal Severity type
function mapSemgrepSeverity(semgrepSeverity: string): Severity {
  switch (semgrepSeverity.toLowerCase()) {
    case "error":
    case "critical":
    case "alert":
      return "critical";
    case "warning":
    case "high":
      return "high";
    case "info":
    case "medium":
      return "medium";
    case "note":
    case "low":
      return "low";
    default:
      return "info";
  }
}

export async function runSemgrepAnalysis(
  filePath: string,
  fileContent: string,
  language: string
): Promise<Finding[]> {
  try {
    // Semgrep requires files to be on disk for analysis.
    // We'll create a temporary directory and file for Semgrep to scan.
    // In a real production environment, you'd manage temporary files more robustly
    // and consider security implications (e.g., proper isolation, cleanup).
    const tempDir = `/tmp/semgrep-scan-${Date.now()}`;
    const tempFilePath = `${tempDir}/${filePath.split('/').pop()}`; // Just the filename

    // Ensure language is supported by Semgrep and infer correct --lang parameter
    let semgrepLang = "";
    switch(language) {
      case "javascript":
      case "typescript":
        semgrepLang = "javascript"; // Semgrep uses 'javascript' for both
        break;
      case "python":
        semgrepLang = "python";
        break;
      case "go":
        semgrepLang = "go";
        break;
      case "solidity":
        semgrepLang = "solidity";
        break;
      case "java":
        semgrepLang = "java";
        break;
      case "c":
      case "cpp":
        semgrepLang = "c"; // Semgrep uses 'c' for C/C++
        break;
      case "php":
        semgrepLang = "php";
        break;
      case "ruby":
        semgrepLang = "ruby";
        break;
      case "csharp":
        semgrepLang = "csharp";
        break;
      default:
        console.warn(`Semgrep does not officially support language: ${language}. Trying anyway...`);
        semgrepLang = language;
    }


    // Create temp directory and write content
    await execPromise(`mkdir -p ${tempDir}`);
    await execPromise(`echo ${JSON.stringify(fileContent)} > ${tempFilePath}`); // Be careful with escaping!

    // Run Semgrep as a Docker command
    // Using a very basic rule for demonstration; in a real app, you'd pull custom rules
    // or use a pre-built ruleset.
    // Ensure the Docker image 'returntocorp/semgrep' is available.
    const command = `docker run --rm -v ${tempDir}:${tempDir} returntocorp/semgrep:latest \
      --lang ${semgrepLang} \
      --json \
      --metrics=off \
      --timeout=10 \
      --config "r/javascript.react.security.audit.react-sinks" \
      --config "r/python.flask.security.audit.sql-injection" \
      --config "r/go.lang.security.audit.insecure-tls-version" \
      --config "r/solidity.audit" \
      --config "r/java.lang.security.audit.hardcoded-passwords" \
      --config "r/c.lang.security.audit.strcpy" \
      --config "r/php.lang.security.audit.command-injection" \
      --config "r/ruby.lang.security.audit.shell-escape" \
      --config "r/csharp.lang.security.audit.insecure-deserialization" \
      ${tempFilePath}`;

    console.log("Running Semgrep command:", command);
    const { stdout, stderr } = await execPromise(command);

    // Clean up temporary files
    await execPromise(`rm -rf ${tempDir}`);

    if (stderr) {
      console.warn("Semgrep stderr:", stderr);
    }

    const sarifOutput = JSON.parse(stdout);

    if (!sarifOutput.results || sarifOutput.results.length === 0) {
      return []; // No findings
    }

    const findings: Finding[] = sarifOutput.results.map((result: any) => ({
      file: filePath, // Original file path
      line: result.start.line,
      endLine: result.end.line,
      severity: mapSemgrepSeverity(result.severity),
      description: result.extra.message,
      ruleId: result.check_id,
      suggestedFix: result.extra.fix ? result.extra.fix.message : undefined,
      // Semgrep doesn't directly provide CWE or OSV IDs in simple JSON output
      // You'd need to map these from the rule ID or a separate database.
    }));

    return findings;
  } catch (error: any) {
    console.error("Error running Semgrep analysis:", error.message);
    // Attempt to clean up temp files even if analysis failed
    const tempDirMatch = error.message.match(/\/tmp\/semgrep-scan-(\d+)/);
    if (tempDirMatch && tempDirMatch[0]) {
      await execPromise(`rm -rf ${tempDirMatch[0]}`).catch(err => console.error("Failed to clean up temp dir:", err));
    }
    return []; // Return empty findings on error
  }
}
