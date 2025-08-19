"use client";

import * as React from "react";
import { RepoNode } from "@/components/editor/file-explorer";
import { FileExplorer } from "@/components/editor/file-explorer";
import { CodeEditor, CodeEditorRef } from "@/components/editor/code-editor";
import { IssuesPanel } from "@/components/editor/issues-panel";
import type { Finding } from "@/types/finding";
// Removed resizable split; using fixed sidebar layout
import { Brand } from "@/components/brand";
import { ChatPanel } from "@/components/chat/chat-panel";
import { Homepage } from "@/components/homepage";
import { SecurityPanel } from "@/components/premium-features";
import { FileHistory } from "@/components/editor/file-history";
// Keyboard shortcuts removed as requested
import { NotificationProvider, useNotification } from "@/components/ui/notification";
import { useTheme } from "next-themes";
import { generateId, cn } from "@/lib/utils";
import { 
  Sun, Moon, ChevronRight, Package, Shield, AlertCircle, 
  Users, Share2, History, Search, Download, ChevronLeft, Settings
} from "lucide-react";
import { AuditPanel } from "@/components/audit/audit-panel";
import { SettingsSheet } from "@/components/settings/settings-sheet";
import { MarkdownRenderer } from "@/components/chat/markdown-renderer";
import { SingleChat } from "@/components/chat/chat-tabs";

type Message = { id: string; role: "user" | "assistant"; content: string };

function HomeContent() {
  const [tree, setTree] = React.useState<RepoNode[]>([]);
  const [activePath, setActivePath] = React.useState<string | undefined>(undefined);
  const [code, setCode] = React.useState<string>("// Connect a repo to begin\n");
  const [language, setLanguage] = React.useState<string | undefined>("typescript");
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [mode, setMode] = React.useState<"code" | "chat" | "security">("code");
  const [showSecurityPanel, setShowSecurityPanel] = React.useState(false);
  const [showFileHistory, setShowFileHistory] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [connectionError, setConnectionError] = React.useState<string | undefined>();
  const [isLoadingFile, setIsLoadingFile] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [showEditor, setShowEditor] = React.useState(false);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [showingHome, setShowingHome] = React.useState(false);
  const [globalError, setGlobalError] = React.useState<string | undefined>();
  const [isOnline, setIsOnline] = React.useState(true);
  const [findings, setFindings] = React.useState<Finding[]>([]);
  const [aiReasoning, setAiReasoning] = React.useState<string>("");
  const [aiReasoningLoading, setAiReasoningLoading] = React.useState(false);
  const [aiReasoningError, setAiReasoningError] = React.useState<string | null>(null);
  const editorRef = React.useRef<CodeEditorRef>(null);
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { addNotification } = useNotification();
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = React.useState(false);
  
  // Keyboard shortcuts removed as requested

  const handleConnect = async (url: string) => {
    setIsConnecting(true);
    setConnectionError(undefined);
    setGlobalError(undefined);
    
    try {
      // If connecting to the sample repo (empty URL), try a direct approach first
      if (!url.trim()) {
        try {
          // Create a sample repo structure manually with diverse files
          const sampleTree: RepoNode[] = [
            {
              name: "contracts",
              path: "contracts",
              type: "folder",
              children: [
                { name: "AccessControl.sol", path: "contracts/AccessControl.sol", type: "file" },
                { name: "LoopGasBomb.sol", path: "contracts/LoopGasBomb.sol", type: "file" },
                { name: "OverflowToken.sol", path: "contracts/OverflowToken.sol", type: "file" },
                { name: "Ownable.sol", path: "contracts/Ownable.sol", type: "file" },
                { name: "PriceOracle.sol", path: "contracts/PriceOracle.sol", type: "file" },
                { name: "RandomLottery.sol", path: "contracts/RandomLottery.sol", type: "file" },
                { name: "ReentrancyVault.sol", path: "contracts/ReentrancyVault.sol", type: "file" },
                { name: "UncheckedTransfer.sol", path: "contracts/UncheckedTransfer.sol", type: "file" },
                { name: "UnsafeDelegate.sol", path: "contracts/UnsafeDelegate.sol", type: "file" },
                { name: "UnsafeInitializer.sol", path: "contracts/UnsafeInitializer.sol", type: "file" },
                { name: "UnsafeDelegate.js", path: "contracts/UnsafeDelegate.js", type: "file" }, // JS version
              ]
            },
            {
              name: "web",
              path: "web",
              type: "folder",
              children: [
                { name: "index.html", path: "web/index.html", type: "file" },
                { name: "style.css", path: "web/style.css", type: "file" },
                { name: "app.js", path: "web/app.js", type: "file" },
              ]
            },
            {
              name: "backend",
              path: "backend",
              type: "folder",
              children: [
                { name: "main.go", path: "backend/main.go", type: "file" },
                { name: "server.py", path: "backend/server.py", type: "file" },
                { name: "Dockerfile", path: "backend/Dockerfile", type: "file" },
              ]
            },
            {
              name: ".github",
              path: ".github",
              type: "folder",
              children: [
                {
                  name: "workflows",
                  path: ".github/workflows",
                  type: "folder",
                  children: [
                    { name: "ci.yml", path: ".github/workflows/ci.yml", type: "file" },
                  ]
                }
              ]
            },
            { name: "package.json", path: "package.json", type: "file" },
            { name: "requirements.txt", path: "requirements.txt", type: "file" },
            { name: "go.mod", path: "go.mod", type: "file" },
            { name: "README.md", path: "README.md", type: "file" },
          ];
          
          setTree(sampleTree);
          
          // Show success notification
          addNotification({
            type: "success",
            title: "Sample repository loaded",
            message: "Connected to local sample repository",
            duration: 3000
          });
          
          // Select a preferred file by default
          const pick = findFirstFilePath(sampleTree);
          console.log('First file found:', pick);
          if (pick) handleSelect(pick);
          setIsConnecting(false);
          return;
        } catch (e) {
          console.warn("Failed to load local sample repo directly, falling back to API:", e);
        }
      }
      
      const res = await fetch("/api/repo/connect", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ url: url.trim() }) 
      });
      
      if (!res.ok) {
        let errorData;
        try {
          const text = await res.text();
          // Try to parse as JSON, if it fails, use the text as error message
          try {
            errorData = JSON.parse(text);
          } catch {
            // If JSON parsing fails, the response might be HTML or plain text
            throw new Error(`Server error: ${text.substring(0, 100)}...`);
          }
        } catch (fetchError) {
          throw new Error('Network error: Unable to connect to server');
        }
        
        throw new Error(errorData.error || `Server error (${res.status})`);
      }
      
      const data = await res.json();
      console.log('Repository data received:', data);
      
      if (!data.tree || data.tree.length === 0) {
        throw new Error('Repository appears to be empty or inaccessible');
      }
      
      setTree(data.tree);
      setGlobalError(undefined); // Clear any previous errors
      
      // Show success message if we have stats
      if (data.stats) {
        console.log(`Repository loaded: ${data.stats.totalFiles} files, ${data.stats.totalFolders} folders`);
      }
      
      // Show success notification
      addNotification({
        type: "success",
        title: "Repository connected",
        message: url ? `Connected to ${url}` : "Connected to sample repository",
        duration: 5000
      });
      
      // auto-select a file for demo if present
      const pick = findFirstFilePath(data.tree);
      console.log('First file found:', pick);
      if (pick) handleSelect(pick);
      
    } catch (error: any) {
      console.error('Connection error:', error);
      const errorMessage = error.message || 'Connection failed';
      setConnectionError(errorMessage);
      setGlobalError(`Failed to connect: ${errorMessage}`);
      
      // Show error notification
      addNotification({
        type: "error",
        title: "Connection failed",
        message: errorMessage,
        duration: 5000
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Don't auto-connect to sample repo
  React.useEffect(() => {
    if (showEditor) {
      console.log('Editor shown, no auto-connect');
      // Auto-connect disabled as requested
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEditor]);

  const handleSelect = async (path: string) => {
    setActivePath(path);
    setIsLoadingFile(true);
    
    // Show notification
    addNotification({
      type: "info",
      title: "Loading file",
      message: `Loading ${path}...`,
      duration: 2000
    });
    
    // Set loading indicator immediately
    setCode("// Loading file content...");
    
    // Try to load from cache first for instant display
    try {
      const cachedContent = localStorage.getItem(`file_cache_${path}`);
      if (cachedContent) {
        setCode(cachedContent);
        setLanguage(inferLanguageFromPath(path));
        console.log("Loaded from cache:", path);
      }
    } catch (e) {
      console.warn("Could not access cache:", e);
    }
    
    try {
      // Add a small delay to ensure UI updates before fetch
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Handle sample repo files with content from specific paths
      if (path.startsWith('contracts/') || path.startsWith('web/') || path.startsWith('backend/') || path.startsWith('.github/') || path === 'package.json' || path === 'requirements.txt' || path === 'go.mod' || path === 'README.md') {
        let content = '';
        switch (path) {
          case 'contracts/UnsafeDelegate.js':
            content = `// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

contract UnsafeDelegate {
    address public target;

    function setTarget(address t) external {
        target = t; // VULN: no validation
    }

    function execute(bytes memory data) external payable {
        (bool ok, ) = target.delegatecall(data); // VULN: arbitrary delegatecall
        require(ok, "fail");
    }
}`; 
            setLanguage('javascript');
            break;
          case 'contracts/AccessControl.sol':
            content = `// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

contract AccessControl {
    address public owner;
    mapping(address => bool) public admins;

    constructor() {
        owner = msg.sender;
        admins[msg.sender] = true;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAdmin() {
        require(admins[msg.sender], "Not admin");
        _;
    }

    function addAdmin(address _admin) public onlyOwner {
        admins[_admin] = true;
    }

    function removeAdmin(address _admin) public onlyOwner {
        admins[_admin] = false;
    }
}
`;
            setLanguage('solidity');
            break;
          case 'contracts/LoopGasBomb.sol':
            content = `// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

contract LoopGasBomb {
    uint public totalGas;

    function loop(uint n) public {
        for (uint i = 0; i < n; i++) {
            // This loop consumes gas based on input 'n'
            // Can lead to OOG if 'n' is too large
            totalGas += 1; // dummy operation to consume gas
        }
    }
}
`;
            setLanguage('solidity');
            break;
          case 'contracts/OverflowToken.sol':
            content = `// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract OverflowToken is ERC20 {
    constructor() ERC20("OverflowToken", "OFL") {
        _mint(msg.sender, 1000 * 10 ** decimals());
    }

    // VULN: Potential integer overflow on addition before Solidity 0.8.0
    // SafeMath or Solidity 0.8.0+ are needed to prevent this.
    function transferTokens(address to, uint256 amount1, uint256 amount2) public returns (bool) {
        uint256 totalAmount = amount1 + amount2; // If amount1 + amount2 > type(uint256).max, this overflows
        _transfer(msg.sender, to, totalAmount);
        return true;
    }
}
`;
            setLanguage('solidity');
            break;
          case 'contracts/Ownable.sol':
            content = `// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

contract Ownable {
    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: caller is not the owner");
        _;
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
`;
            setLanguage('solidity');
            break;
          case 'contracts/PriceOracle.sol':
            content = `// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

contract PriceOracle {
    uint public price;
    address public owner;

    constructor() {
        owner = msg.sender;
        price = 100; // default price
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // VULN: Price can be manipulated by owner without external validation
    function setPrice(uint _newPrice) public onlyOwner {
        price = _newPrice;
    }

    function getPrice() public view returns (uint) {
        return price;
    }
}
`;
            setLanguage('solidity');
            break;
          case 'contracts/RandomLottery.sol':
            content = `// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

contract RandomLottery {
    uint public winnerNumber;
    address[] public players;

    function enter() public payable {
        players.push(msg.sender);
    }

    // VULN: Uses block.timestamp and block.difficulty for randomness
    // These can be manipulated by miners.
    function drawWinner() public returns (uint) {
        require(players.length > 0, "No players");
        winnerNumber = uint(keccak256(abi.encodePacked(block.timestamp, block.difficulty, players.length))) % players.length;
        return winnerNumber;
    }
}
`;
            setLanguage('solidity');
            break;
          case 'contracts/ReentrancyVault.sol':
            content = `// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

contract ReentrancyVault {
    mapping(address => uint) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    // VULN: Reentrancy vulnerability - state updated after external call
    function withdraw() public {
        uint amount = balances[msg.sender];
        require(amount > 0, "Nothing to withdraw");

        (bool success, ) = msg.sender.call{value: amount}(""); // External call
        require(success, "Transfer failed");

        balances[msg.sender] = 0; // State update after external call
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}
`;
            setLanguage('solidity');
            break;
          case 'contracts/UncheckedTransfer.sol':
            content = `// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

interface IERC20 {
    function transfer(address to, uint amount) external returns (bool);
}

contract UncheckedTransfer {
    IERC20 public token;

    constructor(IERC20 _token) {
        token = _token;
    }

    // VULN: No check for return value of token.transfer()
    // Malicious token contracts can return false on failure
    function sendTokens(address to, uint amount) public {
        token.transfer(to, amount); // Return value is not checked
    }
}
`;
            setLanguage('solidity');
            break;
          case 'contracts/UnsafeDelegate.sol':
            content = `// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

contract UnsafeDelegate {
    address public target;

    function setTarget(address t) external {
        target = t; // VULN: no validation
    }

    function execute(bytes memory data) external payable {
        (bool ok, ) = target.delegatecall(data); // VULN: arbitrary delegatecall
        require(ok, "fail");
    }
}
`;
            setLanguage('solidity');
            break;
          case 'contracts/UnsafeInitializer.sol':
            content = `// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

contract UnsafeInitializer {
    uint public value;
    bool public initialized;

    // VULN: Missing initializer guard
    // Allows re-initialization if not deployed via upgradeable proxy pattern
    function initialize(uint _value) public {
        value = _value;
        initialized = true;
    }

    function updateValue(uint _newValue) public {
        require(initialized, "Not initialized");
        value = _newValue;
    }
}
`;
            setLanguage('solidity');
            break;
          case 'web/index.html':
            content = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sample Web Page</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Welcome!</h1>
    <p>This is a sample HTML page.</p>
    <button id="myButton">Click Me</button>
    <script src="app.js"></script>
</body>
</html>
`;
            setLanguage('html');
            break;
          case 'web/style.css':
            content = `body {
    font-family: Arial, sans-serif;
    background-color: #f0f0f0;
    color: #333;
    margin: 20px;
}
h1 {
    color: #0056b3;
}
.button {
    padding: 10px 15px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}
`;
            setLanguage('css');
            break;
          case 'web/app.js':
            content = `document.getElementById('myButton').addEventListener('click', () => {\n    alert('Button clicked!');\n});\n\n// VULN: Example of an insecure direct object reference (IDOR) if not properly handled server-side\nasync function fetchUserData(userId) {\n    // In a real application, this would fetch from an API\n    // If server-side doesn\'t validate userId against authenticated user, it\'s an IDOR\n    const response = await fetch(\`\/api\/users\/\${userId}\`);\n    const data = await response.json();\n    console.log('User data:', data);\n}\n\nfetchUserData(123); // Example usage\n`;
            setLanguage('javascript');
            break;
          case 'backend/main.go':
            content = `package main

import (
	"fmt"
	"net/http"
	"os"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Hello, %s!\n", r.URL.Path[1:])
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Server listening on port %s\n", port)
	// VULN: Using a hardcoded port and not handling errors from ListenAndServe
	// In production, configure robust error handling and dynamic port allocation.
	// Also, consider using HTTPS.
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		fmt.Printf("Server failed: %v\n", err)
	}
}
`;
            setLanguage('go');
            break;
          case 'backend/server.py':
            content = `from flask import Flask, request, jsonify
import os

app = Flask(__name__)

@app.route('/command', methods=['GET'])
def execute_command():
    command = request.args.get('cmd')
    if command:
        # VULN: Command Injection - directly executing user input
        # In a real app, use a whitelist of allowed commands or restrict input.
        result = os.popen(command).read()
        return jsonify({'output': result})
    return jsonify({'error': 'No command provided'}), 400

@app.route('/')
def hello():
    return "Hello from Flask!"

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
`;
            setLanguage('python');
            break;
          case 'backend/Dockerfile':
            content = `FROM python:3.9-slim-buster
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8080
CMD ["python", "server.py"]
`;
            setLanguage('dockerfile'); // Assuming 'dockerfile' language support
            break;
          case 'package.json':
            content = `{ 
  "name": "sample-app",
  "version": "1.0.0",
  "description": "A sample Node.js application",
  "main": "index.js",
  "dependencies": {
    "express": "4.17.1",
    "lodash": "4.17.15",
    "axios": "0.21.1" 
  },
  "devDependencies": {
    "nodemon": "2.0.7"
  }
}
`;
            setLanguage('json');
            break;
          case 'requirements.txt':
            content = `flask==2.0.1
requests>=2.25.1
django==3.2.5
`;
            setLanguage('plaintext'); // or specific python requirements language
            break;
          case 'go.mod':
            content = `module example.com/mymodule

go 1.18

require (
	github.com/gorilla/mux v1.8.0
	github.com/spf13/cobra v1.2.1
)
`;
            setLanguage('go.mod'); // Custom language for go.mod
            break;
          case 'README.md':
            content = `# Sample Repository

This is a sample repository to demonstrate security scanning capabilities.

## Files Included:
- **Smart Contracts (Solidity):** Examples of common vulnerabilities like reentrancy, access control, integer overflows.
- **Web Files (HTML, CSS, JS):** Basic web application with a simulated IDOR vulnerability.
- **Backend Services (Go, Python):** Examples of command injection and hardcoded credentials.
- **Dependency Files:** \`package.json\`, \`requirements.txt\`, \`go.mod\` for SCA scanning.

Feel free to explore the files and run security analyses.
`;
            setLanguage('markdown');
            break;
          case '.github/workflows/ci.yml':
            content = `name: CI/CD Pipeline

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Go
        uses: actions/setup-go@v3
        with:
          go-version: 1.18
      - name: Build
        run: go build ./...
      - name: Run tests
        run: go test ./...

  security_scan:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v3
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          publishToken: \$\$\{ secrets.SEMGREP_APP_TOKEN \}\}
          publishUrl: https://semgrep.dev

      - name: Run Trivy vulnerability scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          ignore-unfixed: true
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results to GitHub Security tab
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

`;
            setLanguage('yaml');
            break;
          default:
            content = `// Content for ${path}

// This is a placeholder for file content.
// In a real application, content would be loaded dynamically.
`;
            setLanguage(inferLanguageFromPath(path));
            break;
        }

        if (content) {
          setCode(content);
          
          // Show success notification
          addNotification({
            type: "success",
            title: "File loaded",
            message: `${path} loaded successfully`,
            duration: 3000
          });
          setIsLoadingFile(false);
          return;
        }
      }
      
      const res = await fetch(`/api/repo/file?path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error('Failed to load file');
      
      const data = await res.json();
      
      if (!data.content && path.endsWith('.go')) {
        // Fallback content for Go files if API returns empty
        setCode(`// ${path}\n// Go source file\n\npackage main\n\nimport (\n\t"fmt"\n)\n\nfunc main() {\n\t// Your code here\n\tfmt.Println("Hello, world!")\n}`);
        setLanguage("go");
      } else if (!data.content && path.endsWith('.sol')) {
        // Fallback content for Solidity files
        setCode(`// SPDX-License-Identifier: MIT\npragma solidity ^0.7.6;\n\ncontract ${path.split('/').pop()?.replace('.sol', '') || 'Contract'} {\n    // Contract code here\n}`);
        setLanguage("solidity");
      } else if (!data.content && path.endsWith('.js')) {
        // Fallback content for JavaScript files
        setCode(`// ${path}\n\n// JavaScript file content\nfunction main() {\n  console.log("Hello world");\n}\n\nmain();`);
        setLanguage("javascript");
      } else {
        setCode(data.content || `// ${path}\n// File loaded successfully`);
        setLanguage(data.language ?? inferLanguageFromPath(path));
      }
      
      // Cache the file content in localStorage for faster loading next time
      try {
        localStorage.setItem(`file_cache_${path}`, data.content || "");
        // Also store metadata about the file
        localStorage.setItem(`file_meta_${path}`, JSON.stringify({
          language: data.language ?? inferLanguageFromPath(path),
          lastAccessed: new Date().toISOString(),
          size: data.content?.length || 0
        }));
      } catch (e) {
        console.warn("Could not cache file:", e);
      }
      
      // Analyze on load (best-effort)
      if (data.content) {
        setFindings([]); // Clear previous findings
        setAiReasoning("");
        setAiReasoningError(null);
        setAiReasoningLoading(false);
      } else {
        setFindings([]);
        setAiReasoning("");
        setAiReasoningLoading(false);
        setAiReasoningError(null);
      }
      
      // Show success notification
      addNotification({
        type: "success",
        title: "File loaded",
        message: `${path} loaded successfully`,
        duration: 3000
      });
    } catch (error) {
      console.error('File load error:', error);
      setCode(`// Error loading file: ${path}\n// ${error instanceof Error ? error.message : 'Unknown error'}\n\n// Try selecting the file again or check your connection`);
      setFindings([]);
      
      // Show error notification
      addNotification({
        type: "error",
        title: "Error loading file",
        message: `Failed to load ${path}. ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: 5000
      });
    } finally {
      setIsLoadingFile(false);
    }
  };
  
  // Helper function to infer language from file path
  const inferLanguageFromPath = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'go': 'go',
      'sol': 'solidity',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'rs': 'rust',
      'swift': 'swift',
      'md': 'markdown',
      'json': 'json',
      'html': 'html',
      'css': 'css',
      'yml': 'yaml',
      'yaml': 'yaml',
      'sh': 'shell',
      'bash': 'shell',
    };
    return langMap[ext || ''] || 'plaintext';
  };

  const handleSave = async () => {
    if (!activePath) return;
    
    try {
      setIsSaving(true);
      addNotification({
        type: "info",
        title: "Saving file...",
        message: `Saving changes to ${activePath}`,
        duration: 2000
      });
      
      await fetch("/api/repo/file", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ path: activePath, content: code }) 
      });
      
      // Cache the updated content
      try {
        localStorage.setItem(`file_cache_${activePath}`, code);
      } catch (e) {
        console.warn("Could not update cache:", e);
      }
      
      addNotification({
        type: "success",
        title: "File saved",
        message: `${activePath} saved successfully`,
        duration: 3000
      });
    } catch (error) {
      console.error("Error saving file:", error);
      addNotification({
        type: "error",
        title: "Save failed",
        message: `Could not save ${activePath}. Please try again.`,
        duration: 5000
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = async (content: string) => {
    if (!isOnline) {
      setGlobalError('No internet connection. Cannot send message.');
      return;
    }
    const userMsg: Message = { id: generateId(), role: "user", content };
    const pendingId = generateId();
    // Add thinking delay for deep research commands
    const isDeepCommand = content.includes('/deep-research') || content.includes('/audit-all');
    const thinkingDelay = isDeepCommand ? 3000 : 1500;
    setMessages((m) => [...m, userMsg, { id: pendingId, role: "assistant", content: "" }]);
    setGlobalError(undefined);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      // Always include code if a file is selected
      const body: any = {
        messages: [...messages, userMsg],
        currentFile: activePath,
        isDeepAnalysis: isDeepCommand,
      };
      if (activePath && code) {
        body.code = code;
      }
      const res = await fetch("/api/chat", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `Server error (${res.status})`);
      }
      const data = await res.json();
      if (!data.reply) {
        throw new Error('Empty response from AI');
      }
      // Simulate thinking time for better UX
      setTimeout(() => {
        setMessages((m) => m.map((msg) => (msg.id === pendingId ? { ...msg, content: data.reply } : msg)));
      }, thinkingDelay);
    } catch (error: any) {
      console.error('Chat error:', error);
      let errorMessage = "Sorry, I encountered an error processing your request.";
      if (error.name === 'AbortError') {
        errorMessage = "Request timed out. Please try again with a shorter message.";
        setGlobalError('AI response timed out');
      } else if (error.message.includes('400')) {
        errorMessage = "Invalid request. Please check your message and try again.";
      } else if (error.message.includes('429')) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
        setGlobalError('Rate limit exceeded');
      } else if (error.message.includes('500')) {
        errorMessage = "Server error. Our team has been notified.";
        setGlobalError('Server error occurred');
      }
      setTimeout(() => {
        setMessages((m) => m.map((msg) => (msg.id === pendingId ? { ...msg, content: errorMessage } : msg)));
      }, 1000);
    }
  };

  const handleSettingsSave = async (v: { openaiApiKey?: string; model?: string }) => {
    await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
  };

  const handleEnterEditor = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowEditor(true);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }, 300);
  };

  const handleBackToHome = () => {
    setShowingHome(true);
    setIsTransitioning(true);
    setTimeout(() => {
      setShowEditor(false);
      setTimeout(() => {
        setShowingHome(false);
        setIsTransitioning(false);
      }, 100);
    }, 300);
  };

  if (!showEditor && !isTransitioning && !showingHome) {
    return (
      <div className="overflow-y-auto h-screen">
        <Homepage onEnterEditor={handleEnterEditor} />
      </div>
    );
  }

  return (
    <div className={cn(
      "h-dvh flex flex-col overflow-hidden transition-all duration-500",
      isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
    )}>
      {/* Global Error Toast */}
      {(globalError || !isOnline) && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className="bg-destructive/90 text-destructive-foreground px-4 py-3 rounded-lg shadow-lg border backdrop-blur-sm animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-2">
              <div className="size-4 rounded-full bg-destructive-foreground/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs">!</span>
              </div>
              <div className="text-sm">
                {!isOnline ? 'You are offline. Some features may not work.' : globalError}
              </div>
              <button 
                onClick={() => setGlobalError(undefined)}
                className="ml-auto text-destructive-foreground/70 hover:text-destructive-foreground transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="h-12 border-b flex items-center justify-between px-5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-5">
          <button 
            onClick={handleBackToHome}
            className="text-[13.5px] font-semibold tracking-[-0.02em] hover:text-primary transition-colors cursor-pointer"
          >
            <Brand />
          </button>
          <div className="text-micro text-muted-foreground">Vulnerability analysis</div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Keyboard shortcuts button removed as requested */}
          <button
            aria-label="File history"
            className="h-8 w-8 rounded-md border flex items-center justify-center transition-surgical focus-surgical"
            onClick={() => setShowFileHistory(prev => !prev)}
            title="File History"
          >
            <History className="size-4" />
          </button>
          <button
            aria-label="Toggle theme"
            className="h-8 w-8 rounded-md border flex items-center justify-center transition-surgical focus-surgical"
            onClick={() => {
              const next = (resolvedTheme ?? theme) === "dark" ? "light" : "dark";
              setTheme(next);
              
              addNotification({
                type: "info",
                title: `${next === "dark" ? "Dark" : "Light"} theme activated`,
                message: `Switched to ${next} mode`,
                duration: 2000
              });
            }}
          >
            {(resolvedTheme ?? theme) === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <SettingsSheet onSave={handleSettingsSave} />
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="h-full w-full flex overflow-hidden">
          <div className={cn(
            "border-r bg-gradient-to-b from-card/60 to-card/30 overflow-hidden min-h-0 backdrop-blur-sm transition-all duration-300 ease-in-out",
            isLeftPanelCollapsed ? "w-10 min-w-[40px] max-w-[40px]" : "w-80 min-w-[280px] max-w-[320px]"
          )}>
            <FileExplorer
              tree={tree}
              onSelect={handleSelect}
              onConnect={handleConnect}
              activePath={activePath}
              isConnecting={isConnecting}
              connectionError={connectionError}
              isCollapsed={isLeftPanelCollapsed} // Pass collapsed state to FileExplorer
            />
            <button
              onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 bg-muted/50 hover:bg-muted border rounded-full p-1 shadow-md z-10 transition-all duration-300 ease-in-out",
                isLeftPanelCollapsed ? "left-[30px]" : "left-[310px]"
              )}
              title={isLeftPanelCollapsed ? "Expand Panel" : "Collapse Panel"}
            >
              {isLeftPanelCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            </button>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="h-10 border-b bg-gradient-to-r from-muted/40 to-muted/20 px-4 flex items-center justify-between backdrop-blur-sm">
              <div className="text-micro text-muted-foreground flex items-center gap-2 min-w-0">
                {isLoadingFile && <div className="size-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />}
                {activePath ? (
                  <div className="flex items-center gap-1 min-w-0">
                    {activePath.split('/').map((segment, index, array) => (
                      <React.Fragment key={index}>
                        {index > 0 && <ChevronRight className="size-3 opacity-60" />}
                        <span className={cn(
                          "transition-colors",
                          index === array.length - 1 ? "font-medium text-foreground" : "truncate hover:text-foreground/80 cursor-pointer"
                        )}>
                          {segment}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <span className="opacity-60">No file selected</span>
                )}
                
                {/* Scan Dependencies Button */}
                {(activePath?.endsWith('package.json') || activePath?.endsWith('requirements.txt') || activePath?.endsWith('go.mod') || activePath?.endsWith('pom.xml') || activePath?.endsWith('build.gradle')) && (
                  <button
                    className="ml-4 px-2 py-0.5 text-[11px] bg-blue-500/15 text-blue-600 border border-blue-500/30 rounded flex items-center gap-1 hover:bg-blue-500/20 transition-colors"
                    onClick={async () => {
                      try {
                        addNotification({
                          type: "info",
                          title: "Scanning dependencies",
                          message: "Checking for vulnerabilities...",
                          duration: 2000
                        });
                        
                        const res = await fetch('/api/analyze/dependencies', { // Call the new dependency API
                          method: 'POST', 
                          headers: { 'Content-Type': 'application/json' }, 
                          body: JSON.stringify({ files: [{ path: activePath, content: code }] }) 
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setFindings(data.findings || []);
                          
                          if (data.findings?.length === 0) {
                            addNotification({
                              type: "success",
                              title: "Scan complete",
                              message: "No vulnerabilities found in dependencies",
                              duration: 3000
                            });
                          } else {
                            addNotification({
                              type: "warning",
                              title: "Vulnerabilities found",
                              message: `Found ${data.findings.length} security issues in dependencies`,
                              duration: 5000
                            });
                          }
                        } else {
                          const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
                          throw new Error(errorData.error || `Failed to fetch findings (${res.status})`);
                        }
                      } catch (error) {
                        console.error('Error scanning dependencies:', error);
                        addNotification({
                          type: "error",
                          title: "Scan failed",
                          message: `Failed to scan dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`,
                          duration: 4000
                        });
                      }
                    }}
                  >
                    <Package className="size-3" />
                    Scan Dependencies
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className={cn(
                    "h-7 px-3 text-[12.5px] rounded-full border transition-all",
                    mode === "code" 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "bg-background/80 hover:bg-accent/50 backdrop-blur-sm"
                  )}
                  onClick={() => setMode("code")}
                >
                  Code
                </button>
                <button
                  className={cn(
                    "h-7 px-3 text-[12.5px] rounded-full border transition-all",
                    mode === "chat" 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "bg-background/80 hover:bg-accent/50 backdrop-blur-sm"
                  )}
                  onClick={() => {
                    setMode("chat");
                    // Auto-focus chat input when switching to chat mode
                    setTimeout(() => {
                      const chatInput = document.querySelector('textarea[placeholder*="audit options"]') as HTMLTextAreaElement;
                      chatInput?.focus();
                    }, 100);
                  }}
                >
                  AI
                </button>
                {/* Security button moved to a floating action button */}
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              {mode === "code" ? (
                <div className="relative h-full flex">
                  <div className="flex-1 flex flex-col">
                    {findings.length > 0 && (
                      <div className="mb-4">
                        <AuditPanel findings={findings} />
                      </div>
                    )}
                    {/* AI Reasoning Panel */}
                    <div className="mb-4">
                      <div className="rounded border bg-background/80 p-4 shadow-sm">
                        <div className="font-semibold mb-2 flex items-center gap-2">
                          <span>AI Reasoning & Bug Report</span>
                          {aiReasoningLoading && <span className="text-xs text-muted-foreground animate-pulse">Loading...</span>}
                          {aiReasoningError && <span className="text-xs text-red-500">{aiReasoningError}</span>}
                        </div>
                        {aiReasoningLoading ? (
                          <div className="text-muted-foreground text-sm">The AI is analyzing this file for bugs and vulnerabilities...</div>
                        ) : aiReasoning ? (
                          <div className="prose max-w-none">
                            <MarkdownRenderer content={aiReasoning} />
                          </div>
                        ) : (
                          <div className="text-muted-foreground text-sm">No AI reasoning available for this file yet.</div>
                        )}
                      </div>
                    </div>
                    <CodeEditor
                      ref={editorRef}
                      path={activePath}
                      value={code}
                      onChange={setCode}
                      onSave={handleSave}
                      language={language}
                      theme={((resolvedTheme ?? theme) as "light" | "dark") ?? "light"}
                      findings={findings}
                    />
                    {activePath && (
                      <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded border flex items-center gap-2">
                        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+S</kbd>
                        to save
                      </div>
                    )}
                    {/* Floating Security Button */}
                    <div className="absolute bottom-6 right-6 z-10">
                      <button 
                        className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
                        title="Security Analysis"
                        onClick={() => setMode("security")}
                      >
                        <Shield className="size-5" />
                      </button>
                    </div>
                  </div>
                  {/* Issues Panel */}
                  {findings.length > 0 && (
                    <div className="w-80 border-l">
                      <IssuesPanel 
                        findings={findings} 
                        onJump={(line) => editorRef.current?.revealLine(line)} 
                      />
                    </div>
                  )}
                  {/* File History Panel */}
                  {showFileHistory && (
                    <FileHistory 
                      onClose={() => setShowFileHistory(false)}
                      path={activePath}
                    />
                  )}
                </div>
              ) : mode === "security" ? (
                <SecurityPanel />
              ) : (
                <SingleChat activePath={activePath} code={code} />
              )}
              
              {/* Keyboard Shortcuts Dialog removed as requested */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function findFirstFilePath(nodes: RepoNode[]): string | undefined {
  // Prioritize specific files for better demo experience
  const preferredFiles = [
    "contracts/UnsafeDelegate.js",
    "contracts/UnsafeDelegate.sol",
    "package.json",
    "README.md",
    "go.mod",
  ];

  for (const preferredPath of preferredFiles) {
    for (const n of nodes) {
      const foundPath = findPathInTree(n, preferredPath);
      if (foundPath) return foundPath;
    }
  }

  // Fallback to the first file found if none of the preferred files exist
  for (const n of nodes) {
    if (n.type === "file") return n.path;
    if (n.children) {
      const r = findFirstFilePath(n.children);
      if (r) return r;
    }
  }
  return undefined;
}

// Helper function to recursively find a specific path in the tree
function findPathInTree(node: RepoNode, targetPath: string): string | undefined {
  if (node.path === targetPath) {
    return node.path;
  }
  if (node.type === "folder" && node.children) {
    for (const child of node.children) {
      const found = findPathInTree(child, targetPath);
      if (found) return found;
    }
  }
  return undefined;
}

// Wrap with NotificationProvider
export default function Home() {
  return (
    <NotificationProvider>
      <HomeContent />
    </NotificationProvider>
  );
}