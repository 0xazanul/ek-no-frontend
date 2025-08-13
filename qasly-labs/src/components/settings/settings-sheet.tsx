"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings } from "lucide-react";

type Props = {
  onSave: (v: { openaiApiKey?: string; model?: string }) => void;
};

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


