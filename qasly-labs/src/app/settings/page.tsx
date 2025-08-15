"use client";

import { SettingsSheet } from "@/components/settings/settings-sheet";

export default function SettingsPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <h1 className="text-2xl font-bold">Settings Page</h1>
      <SettingsSheet />
    </div>
  );
}
