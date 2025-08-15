"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings } from "lucide-react";
import { useState } from "react";

type Props = {
  onSave: (v: { openaiApiKey?: string; model?: string }) => void;
};

function GithubIntegrationSettings() {
  const [token, setToken] = useState<string>(() => typeof window !== 'undefined' ? localStorage.getItem('github_token') || '' : '');
  const [repo, setRepo] = useState<string>(() => typeof window !== 'undefined' ? localStorage.getItem('github_repo') || '' : '');
  const [status, setStatus] = useState<string>("");

  const handleSave = () => {
    localStorage.setItem('github_token', token);
    localStorage.setItem('github_repo', repo);
    setStatus("Saved!");
  };

  const handleTest = async () => {
    setStatus("Testing...");
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github+json',
        }
      });
      if (res.status === 200) {
        setStatus("Connection successful!");
      } else {
        setStatus("Failed: " + res.status);
      }
    } catch (e) {
      setStatus("Error: " + (e as any).message);
    }
  };

  return (
    <div className="mb-6 p-4 border rounded bg-muted/10">
      <div className="font-semibold mb-2">GitHub Issues Integration</div>
      <div className="mb-2 text-xs text-muted-foreground">Enter a GitHub personal access token (with repo scope) and the repository (owner/repo) to enable issue creation from findings.</div>
      <input
        className="w-full mb-2 p-2 border rounded"
        placeholder="GitHub Personal Access Token"
        value={token}
        onChange={e => setToken(e.target.value)}
        type="password"
      />
      <input
        className="w-full mb-2 p-2 border rounded"
        placeholder="Repository (owner/repo)"
        value={repo}
        onChange={e => setRepo(e.target.value)}
      />
      <div className="flex gap-2">
        <button className="px-3 py-1 rounded bg-primary text-primary-foreground" onClick={handleSave}>Save</button>
        <button className="px-3 py-1 rounded bg-muted border" onClick={handleTest}>Test Connection</button>
        <span className="text-xs ml-2">{status}</span>
      </div>
    </div>
  );
}

export function SettingsSheet({ onSave }: Props) {
  const [openaiApiKey, setOpenaiApiKey] = React.useState("");
  const [model, setModel] = React.useState("gpt-4o-mini");

  const handleSave = () => {
    onSave({ openaiApiKey, model });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Settings" className="h-9 w-9 transition-surgical focus-surgical hover-lift">
          <Settings className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-96">
        <SheetHeader>
          <SheetTitle className="text-lg font-semibold tracking-tight">Configuration</SheetTitle>
        </SheetHeader>
        <div className="mt-8 space-y-6">
          <div className="space-y-3">
            <Label htmlFor="openai" className="text-micro text-muted-foreground">
              OpenAI API Key
            </Label>
            <Input 
              id="openai" 
              placeholder="sk-..." 
              value={openaiApiKey} 
              onChange={(e) => setOpenaiApiKey(e.target.value)}
              className="h-10 focus-surgical transition-surgical text-surgical"
            />
          </div>
          <div className="space-y-3">
            <Label className="text-micro text-muted-foreground">Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="h-10 focus-surgical transition-surgical">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                <SelectItem value="o3-mini">o3-mini</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <GithubIntegrationSettings />
          <div className="pt-6">
            <Button 
              onClick={handleSave}
              className="w-full h-10 transition-surgical focus-surgical"
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}


