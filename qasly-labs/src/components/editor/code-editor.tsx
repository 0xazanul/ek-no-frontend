"use client";

import { useRef, useState } from "react";
import Editor, { OnChange, OnMount } from "@monaco-editor/react";
import * as React from "react";
import { cn } from "@/lib/utils";

type CodeEditorProps = {
  path?: string;
  value: string;
  language?: string;
  theme: "light" | "dark";
  onChange: (value: string) => void;
  onSave: () => void;
  className?: string;
};

export function CodeEditor({ path, value, language, theme, onChange, onSave, className }: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const monacoRef = useRef<any>(null);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setReady(true);
    const KEY_CODE_S = monaco.KeyCode.KeyS;
    const CMD_OR_CTRL = monaco.KeyMod.CtrlCmd;
    editor.addCommand(CMD_OR_CTRL | KEY_CODE_S, () => onSave());
  };

  const handleChange: OnChange = (v) => {
    onChange(v ?? "");
  };

  return (
    <div className={cn("h-full w-full", className)}>
      <Editor
        path={path}
        value={value}
        language={language}
        theme={theme === "dark" ? "vs-dark" : "vs"}
        onMount={handleMount}
        onChange={handleChange}
        options={{
          fontLigatures: true,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          fontSize: 14,
          minimap: { enabled: false },
          smoothScrolling: true,
          scrollBeyondLastLine: false,
          padding: { top: 12 },
          roundedSelection: false,
          renderLineHighlight: "line",
          cursorSmoothCaretAnimation: "on",
          renderWhitespace: "selection",
          bracketPairColorization: { enabled: true },
          glyphMargin: true,
        }}
      />
    </div>
  );
}


