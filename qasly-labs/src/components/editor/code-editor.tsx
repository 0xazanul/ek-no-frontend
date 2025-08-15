"use client";

import { useRef, useState, useImperativeHandle, forwardRef, useEffect } from "react";
import * as React from "react";
import { cn } from "@/lib/utils";
import type { Finding } from "@/types/finding";
import { ChevronDown, ChevronUp, List, FileCode, FunctionSquare } from "lucide-react";

type CodeEditorProps = {
  path?: string;
  value: string;
  language?: string;
  theme: "light" | "dark";
  onChange: (value: string) => void;
  onSave: () => void;
  className?: string;
  findings?: Finding[];
};

export type CodeEditorRef = {
  revealLine: (line: number) => void;
};

type NavigationItem = {
  line: number;
  name: string;
  type: 'function' | 'class' | 'import' | 'comment' | 'variable';
};

export const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(function CodeEditor(
  { path, value, language, theme, onChange, onSave, className, findings },
  ref
) {
  const editorRef = useRef<any>(null);
  const [showNavigation, setShowNavigation] = useState(false);
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [fileStats, setFileStats] = useState<{lines: number, chars: number}>({lines: 0, chars: 0});

  // Handle text area changes for simple editor
  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Update file stats for simple editor
    const lineCount = newValue.split('\n').length;
    const charCount = newValue.length;
    setFileStats({lines: lineCount, chars: charCount});
  };

  // Parse the file for navigation items (functions, classes, etc.)
  const parseNavigationItems = (editor: any, language?: string) => {
    if (!editor) return;
    
    let content = '';
    let lines: string[] = [];
    
    // Handle both Monaco editor and simple editor
    if (editor.getModel) {
    const model = editor.getModel();
    if (!model) return;
      content = model.getValue();
    } else {
      // For simple editor, use the value prop directly
      content = value;
    }
    
    lines = content.split('\n');
    const items: NavigationItem[] = [];
    
    // Simple regex patterns for different languages
    const patterns: Record<string, {[key: string]: RegExp}> = {
      javascript: {
        function: /^\s*(function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(\w+)\s*:\s*(?:async\s*)?\([^)]*\)\s*=>|(?:async\s*)?function\s*\*?\s*(\w+))/,
        class: /^\s*class\s+(\w+)/,
        import: /^\s*import\s+.+\s+from\s+/,
        variable: /^\s*(?:const|let|var)\s+(\w+)\s*=/,
      },
      typescript: {
        function: /^\s*(function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(\w+)\s*:\s*(?:async\s*)?\([^)]*\)\s*=>|(?:async\s*)?function\s*\*?\s*(\w+))/,
        class: /^\s*class\s+(\w+)/,
        interface: /^\s*interface\s+(\w+)/,
        import: /^\s*import\s+.+\s+from\s+/,
        variable: /^\s*(?:const|let|var)\s+(\w+)\s*:/,
      },
      go: {
        function: /^\s*func\s+(\w+)/,
        struct: /^\s*type\s+(\w+)\s+struct/,
        interface: /^\s*type\s+(\w+)\s+interface/,
        import: /^\s*import\s+/,
        variable: /^\s*var\s+(\w+)/,
      },
      python: {
        function: /^\s*def\s+(\w+)/,
        class: /^\s*class\s+(\w+)/,
        import: /^\s*(?:import|from)\s+/,
        variable: /^\s*(\w+)\s*=/,
      },
      solidity: {
        function: /^\s*function\s+(\w+)/,
        contract: /^\s*contract\s+(\w+)/,
        interface: /^\s*interface\s+(\w+)/,
        import: /^\s*import\s+/,
        variable: /^\s*(\w+)\s+\w+\s*;/,
      }
    };
    
    // Default to JavaScript patterns if language not supported
    const langPatterns = patterns[language || ''] || patterns.javascript;
    
    lines.forEach((line: string, index: number) => {
      // Check for comments
      if (line.trim().startsWith('//') || line.trim().startsWith('#') || line.trim().startsWith('/*')) {
        const commentText = line.trim().replace(/^\/\/|^#|^\/\*|\*\/$/g, '').trim();
        if (commentText.length > 3) {  // Only include meaningful comments
          items.push({
            line: index + 1,
            name: commentText.substring(0, 30) + (commentText.length > 30 ? '...' : ''),
            type: 'comment'
          });
        }
        return;
      }
      
      // Check for functions, classes, etc.
      for (const [type, pattern] of Object.entries(langPatterns)) {
        const match = line.match(pattern);
        if (match) {
          // Extract the name from the match groups
          let name = '';
          for (let i = 1; i < match.length; i++) {
            if (match[i]) {
              name = match[i];
              break;
            }
          }
          
          if (name) {
            items.push({
              line: index + 1,
              name: name,
              type: type as any
            });
          }
          break;
        }
      }
    });
    
    setNavigationItems(items);
  };

  // Expose reveal line API
  useImperativeHandle(ref, () => ({
    revealLine: (line: number) => {
      if (!editorRef.current) return;
      editorRef.current.revealLineInCenter(line);
      editorRef.current.setPosition({ lineNumber: line, column: 1 });
      editorRef.current.focus();
    },
  }));

  // Note: Findings display is handled by the issues panel separately

  // Always use simple editor for reliable display
  const [useSimpleEditor] = useState(true);
  const [editorError] = useState<string | null>(null);
  const [highlightedCode, setHighlightedCode] = useState<string>('');
  const [editMode, setEditMode] = useState(true); // Start in edit mode for better UX
  
  // Apply syntax highlighting and update file stats
  useEffect(() => {
    // Initialize file stats
    const lineCount = value.split('\n').length;
    const charCount = value.length;
    setFileStats({lines: lineCount, chars: charCount});
    
    // Advanced syntax highlighting for multiple languages
    const applyHighlighting = (code: string, lang?: string) => {
      if (!code) return '';
      
      // VS Code-inspired color palette
      const colors = theme === 'dark' ? {
        comment: '#6A9955',      // Green for comments
        keyword: '#569CD6',      // Blue for keywords
        string: '#CE9178',       // Salmon for strings
        number: '#B5CEA8',       // Mint green for numbers
        type: '#4EC9B0',         // Teal for types
        function: '#DCDCAA',     // Light yellow for functions
        operator: '#D4D4D4',     // Light gray for operators
        punctuation: '#808080',  // Gray for punctuation
        decorator: '#808080',    // Gray for decorators
        constant: '#9CDCFE',     // Light blue for constants
        preprocessor: '#569CD6'  // Blue for preprocessor directives
      } : {
        comment: '#008000',      // Dark green for comments
        keyword: '#0000FF',      // Blue for keywords
        string: '#A31515',       // Dark red for strings
        number: '#098658',       // Dark green for numbers
        type: '#267F99',         // Teal for types
        function: '#795E26',     // Brown for functions
        operator: '#000000',     // Black for operators
        punctuation: '#808080',  // Gray for punctuation
        decorator: '#808080',    // Gray for decorators
        constant: '#0000FF',     // Blue for constants
        preprocessor: '#0000FF'  // Blue for preprocessor directives
      };
      
      // Escape HTML and apply highlighting
      let highlighted = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      
      // Language-specific highlighting patterns
      const patterns = {
        solidity: {
          keywords: /\b(contract|pragma|solidity|address|uint|int|bool|bytes|mapping|struct|enum|event|modifier|payable|public|private|external|internal|pure|view|memory|storage|calldata|require|assert|emit|constructor)\b/,
          types: /\b(address|uint(8|16|32|64|128|256)?|int(8|16|32|64|128|256)?|bool|bytes(1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25|26|27|28|29|30|31|32)?)\b/,
        },
        javascript: {
          keywords: /\b(function|const|let|var|if|else|return|new|class|import|export|from|for|while|switch|case|break|continue|try|catch|finally|throw|async|await|this|null|undefined|true|false|do|instanceof|typeof)\b/,
          types: /\b(string|number|boolean|object|Array|Date|RegExp|Function|Promise)\b/,
        },
        go: {
          keywords: /\b(package|import|func|var|const|type|struct|interface|if|else|for|range|switch|case|default|return|break|continue|go|defer|chan|select|map|make|len|cap|append|copy|delete|new)\b/,
          types: /\b(string|int(8|16|32|64)?|uint(8|16|32|64)?|byte|rune|float(32|64)|complex(64|128)|bool|error)\b/,
        }
      };
      
      // Apply language-specific highlighting
      const langPatterns = patterns[lang as keyof typeof patterns] || {};
      
      // Keywords
      if (langPatterns.keywords) {
        highlighted = highlighted.replace(langPatterns.keywords, 
          `<span style="color:${colors.keyword}">$&</span>`);
      }
      
      // Types
      if (langPatterns.types) {
        highlighted = highlighted.replace(langPatterns.types, 
          `<span style="color:${colors.type}">$&</span>`);
      }
      
      // Common patterns across languages
      highlighted = highlighted
        // Comments (single line and multi-line)
        .replace(/(\/\/.*$)/gm, `<span style="color:${colors.comment}">$1</span>`)
        .replace(/(\/\*[\s\S]*?\*\/)/g, `<span style="color:${colors.comment}">$1</span>`)
        // Strings (double quotes, single quotes, backticks)
        .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, 
          `<span style="color:${colors.string}">$1</span>`)
        // Numbers
        .replace(/\b(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g, 
          `<span style="color:${colors.number}">$1</span>`)
        // Function names
        .replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, 
          `<span style="color:${colors.function}">$1</span>(`)
        // Operators
        .replace(/([+\-*/%=<>!&|]+)/g, 
          `<span style="color:${colors.operator}">$1</span>`);
      
      return highlighted;
    };
    
    setHighlightedCode(applyHighlighting(value, language));
  }, [value, language, theme]);
  
  // Parse navigation items for simple editor
  useEffect(() => {
    if (useSimpleEditor) {
      parseNavigationItems(null, language);
    }
  }, [useSimpleEditor, value, language]);

  // Copy code to clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(value);
      // Could add a toast notification here
      console.log('Code copied to clipboard');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = value;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      console.log('Code copied to clipboard (fallback)');
    }
  };

  return (
    <div className={cn("h-full w-full relative", className)}>
      {/* File Stats Bar */}
      <div className="absolute bottom-0 right-0 z-10 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-tl border flex items-center gap-3">
        <span>Lines: {fileStats.lines}</span>
        <span>Chars: {fileStats.chars}</span>
        <button 
          onClick={() => setShowNavigation(prev => !prev)}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
          title="Toggle navigation panel (Ctrl+O)"
        >
          <List className="size-3.5" />
          {showNavigation ? 'Hide' : 'Show'} Navigation
        </button>
      </div>
      
      {/* Navigation Panel */}
      {showNavigation && (
        <div className="absolute top-0 right-0 z-10 w-64 h-full bg-background/95 border-l overflow-hidden flex flex-col">
          <div className="p-2 border-b flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-1.5">
              <FileCode className="size-4" />
              File Navigation
            </h3>
            <button 
              onClick={() => setShowNavigation(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              &times;
            </button>
          </div>
          
          <div className="flex-1 overflow-auto p-1">
            {navigationItems.length > 0 ? (
              <div className="space-y-1">
                {navigationItems.map((item, idx) => (
                  <button
                    key={`${item.line}-${idx}`}
                    onClick={() => {
                      if (editorRef.current) {
                        editorRef.current.revealLineInCenter(item.line);
                        editorRef.current.setPosition({ lineNumber: item.line, column: 1 });
                        editorRef.current.focus();
                      }
                    }}
                    className="w-full text-left px-2 py-1 text-xs hover:bg-muted/50 rounded flex items-center gap-2"
                  >
                    {item.type === 'function' && <FunctionSquare className="size-3.5 text-blue-500" />}
                    {item.type === 'class' && <FileCode className="size-3.5 text-purple-500" />}
                    {item.type === 'import' && <ChevronDown className="size-3.5 text-green-500" />}
                    {item.type === 'comment' && <ChevronUp className="size-3.5 text-yellow-500" />}
                    {item.type === 'variable' && <List className="size-3.5 text-orange-500" />}
                    <span className="truncate flex-1">{item.name}</span>
                    <span className="text-muted-foreground">{item.line}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No navigation items found
              </div>
            )}
          </div>
        </div>
      )}
      
      {editorError && (
        <div className="absolute top-2 left-2 right-2 z-10 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded text-sm">
          {editorError}
        </div>
      )}
      
      <div className="h-full w-full flex flex-col">
        {/* Editor Mode Toggle */}
        <div className="flex items-center justify-between p-2 border-b text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditMode(!editMode)}
              className={cn(
                "px-2 py-1 rounded text-xs",
                editMode ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {editMode ? "Edit Mode" : "View Mode"}
            </button>
            <span className="text-muted-foreground">
              {editMode ? "Click to view/copy" : "Click to edit"}
            </span>
          </div>
          <button
            onClick={handleCopyCode}
            className="px-2 py-1 rounded text-xs bg-muted hover:bg-muted/80 transition-colors"
          >
            Copy All
          </button>
        </div>
        
        <div className="flex-1 w-full overflow-auto flex" style={{
          backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
          color: theme === 'dark' ? '#d4d4d4' : '#000000',
        }}>
          {/* Line numbers */}
          <div className="flex-shrink-0 py-4 px-2 text-right font-mono text-sm border-r" style={{
            backgroundColor: theme === 'dark' ? '#252526' : '#f5f5f5',
            color: theme === 'dark' ? '#858585' : '#a0a0a0',
            width: '3rem',
          }}>
            {value.split('\n').map((_, i) => (
              <div key={i} className="leading-6">{i + 1}</div>
            ))}
          </div>
          
          {/* Code area */}
          <div className="flex-1 overflow-auto relative">
            {editMode ? (
              /* Edit Mode - Textarea for editing */
              <textarea
        value={value}
                onChange={handleTextAreaChange}
                className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                style={{
                  lineHeight: 1.5,
                  tabSize: 2,
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: theme === 'dark' ? '#d4d4d4' : '#000000',
                  minHeight: '100%',
                }}
                spellCheck={false}
                placeholder="Enter your code here..."
              />
            ) : (
              /* View Mode - Syntax highlighted code that can be selected/copied */
              <pre 
                className="p-4 font-mono text-sm whitespace-pre select-text cursor-text"
                style={{
                  margin: 0,
                  lineHeight: 1.5,
                  backgroundColor: 'transparent',
                  color: 'inherit',
                  minHeight: '100%',
                  userSelect: 'text',
                  WebkitUserSelect: 'text',
                  MozUserSelect: 'text',
                }}
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
                onDoubleClick={() => setEditMode(true)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});


