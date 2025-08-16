"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings } from "lucide-react";
import { useState } from "react";
import { Mail, Link2, Slack, Trash2, Edit2, Plus, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select as AppSelect, SelectTrigger as AppSelectTrigger, SelectValue as AppSelectValue, SelectContent as AppSelectContent, SelectItem as AppSelectItem } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

type Props = {
  onSave: (v: { openaiApiKey?: string; model?: string }) => void;
};

const SECTIONS = [
  { key: "general", label: "General" },
  { key: "notifications", label: "Notifications" },
  { key: "billing", label: "Billing & Pricing" },
  { key: "team", label: "Team Members" },
];

// Add SVG background for the modal
const SettingsBackground = () => (
  <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" style={{ opacity: 0.13 }}>
    <defs>
      <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
        <circle cx="1.5" cy="1.5" r="1.5" fill="#222" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#dots)" />
  </svg>
);

export function SettingsSheet({ onSave }: Props) {
  const [openaiApiKey, setOpenaiApiKey] = React.useState("");
  const [model, setModel] = React.useState("gpt-4o-mini");
  const [selected, setSelected] = useState("general");
  const [open, setOpen] = useState(false);

  // General settings state
  const [landingPage, setLandingPage] = useState("dashboard");
  const [autoSave, setAutoSave] = useState(30);
  const [betaFeatures, setBetaFeatures] = useState(false);
  const [codeFont, setCodeFont] = useState("monospace");
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Notification channels state
  const [channels, setChannels] = useState([
    { id: 1, type: "webhook", name: "Prod Webhook", value: "https://hooks.example.com/abc", enabled: true },
    { id: 2, type: "email", name: "Security Email", value: "alerts@example.com", enabled: true },
    { id: 3, type: "slack", name: "Slack #alerts", value: "#alerts", enabled: false },
  ]);
  const [editing, setEditing] = useState<null | { id?: number; type: string; name: string; value: string; enabled: boolean }>(null);

  // Add or update channel
  const handleSaveChannel = () => {
    if (!editing) return;
    if (editing.id) {
      setChannels((chs) => chs.map((c) => (c.id === editing.id ? { ...editing, id: editing.id } : c)));
    } else {
      setChannels((chs) => [
        ...chs,
        { ...editing, id: Math.max(0, ...chs.map((c) => c.id)) + 1 },
      ]);
    }
    setEditing(null);
  };
  // Remove channel
  const handleRemoveChannel = (id: number) => {
    setChannels((chs) => chs.filter((c) => c.id !== id));
  };
  // Toggle enabled
  const handleToggleEnabled = (id: number) => {
    setChannels((chs) => chs.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)));
  };

  // Team members sample data
  const [members, setMembers] = useState([
    { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "Owner" },
    { id: 2, name: "Bob Smith", email: "bob@example.com", role: "Admin" },
    { id: 3, name: "Charlie Lee", email: "charlie@example.com", role: "Member" },
  ]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Member");

  // Billing sample data
  const plan = { name: "Pro", price: "$29/mo", usage: 62, limit: 100 };
  const invoices = [
    { id: "INV-001", date: "2024-05-01", amount: "$29.00", status: "Paid" },
    { id: "INV-002", date: "2024-04-01", amount: "$29.00", status: "Paid" },
    { id: "INV-003", date: "2024-03-01", amount: "$29.00", status: "Paid" },
  ];
  const usageData = [
    { name: "Jan", usage: 20 },
    { name: "Feb", usage: 35 },
    { name: "Mar", usage: 50 },
    { name: "Apr", usage: 62 },
    { name: "May", usage: 62 },
  ];

  // Team member actions
  const handleRemoveMember = (id: number) => setMembers(members.filter(m => m.id !== id));
  const handleChangeRole = (id: number, role: string) => setMembers(members.map(m => m.id === id ? { ...m, role } : m));
  const handleInvite = () => {
    if (inviteEmail.trim()) {
      setMembers([...members, { id: Date.now(), name: inviteEmail.split('@')[0], email: inviteEmail, role: inviteRole }]);
      setInviteEmail("");
      setInviteRole("Member");
    }
  };

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
      <SheetContent
        fullscreen={true}
        className="bg-background/90 backdrop-blur-2xl flex flex-row p-0 animate-in fade-in duration-300 overflow-hidden relative border-4 border-red-500"
      >
        <SettingsBackground />
        {/* Close Button */}
        <button
          className="absolute top-6 right-8 z-50 text-muted-foreground hover:text-foreground transition-colors text-2xl bg-background/80 rounded-full shadow-lg p-1 border border-muted/30"
          onClick={() => setOpen(false)}
          aria-label="Close settings"
        >
          <X className="size-7" />
        </button>
        {/* Sidebar Navigation */}
        <nav className="w-56 border-r bg-muted/20 h-full flex flex-col py-8 px-2 gap-1 shadow-lg text-[13px] z-10">
          {SECTIONS.map((section) => (
            <button
              key={section.key}
              className={`text-left px-4 py-2 rounded transition-colors font-medium ${selected === section.key ? "bg-primary/10 text-primary shadow" : "hover:bg-muted/40 text-muted-foreground"}`}
              onClick={() => setSelected(section.key)}
            >
              {section.label}
            </button>
          ))}
        </nav>
        {/* Main Content */}
        <div className="flex-1 px-0 py-0 flex flex-col items-center justify-center overflow-y-auto bg-background/80 z-10" style={{backdropFilter: 'blur(8px)'}}>
          <div className="w-full max-w-2xl mx-auto px-12 py-12">
            {selected === "general" && (
              <>
        <SheetHeader>
                  <SheetTitle className="text-lg font-semibold tracking-tight mb-6">General Settings</SheetTitle>
        </SheetHeader>
                <div className="flex flex-col gap-7">
                  <div className="flex items-center justify-between gap-4">
                    <Label className="text-[14px] text-muted-foreground">Default Landing Page</Label>
                    <AppSelect value={landingPage} onValueChange={setLandingPage}>
                      <AppSelectTrigger className="w-44 h-9 text-[14px]">
                        <AppSelectValue />
                      </AppSelectTrigger>
                      <AppSelectContent>
                        <AppSelectItem value="dashboard">Dashboard</AppSelectItem>
                        <AppSelectItem value="editor">Editor</AppSelectItem>
                        <AppSelectItem value="audit">Audit</AppSelectItem>
                        <AppSelectItem value="settings">Settings</AppSelectItem>
                      </AppSelectContent>
                    </AppSelect>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <Label className="text-[14px] text-muted-foreground">Auto-save Interval (seconds)</Label>
            <Input 
                      type="number"
                      min={5}
                      max={300}
                      value={autoSave}
                      onChange={e => setAutoSave(Number(e.target.value))}
                      className="w-24 h-9 text-[14px]"
            />
          </div>
                  <div className="flex items-center justify-between gap-4">
                    <Label className="text-[14px] text-muted-foreground">Enable Beta Features</Label>
                    <Switch checked={betaFeatures} onCheckedChange={setBetaFeatures} />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <Label className="text-[14px] text-muted-foreground">Preferred Code Font</Label>
                    <AppSelect value={codeFont} onValueChange={setCodeFont}>
                      <AppSelectTrigger className="w-44 h-9 text-[14px]">
                        <AppSelectValue />
                      </AppSelectTrigger>
                      <AppSelectContent>
                        <AppSelectItem value="monospace">Monospace</AppSelectItem>
                        <AppSelectItem value="fira">Fira Code</AppSelectItem>
                        <AppSelectItem value="jetbrains">JetBrains Mono</AppSelectItem>
                        <AppSelectItem value="source">Source Code Pro</AppSelectItem>
                      </AppSelectContent>
                    </AppSelect>
                  </div>
                </div>
              </>
            )}
          {selected === "notifications" && (
            <>
              <SheetHeader>
                <SheetTitle className="text-lg font-semibold tracking-tight">Notifications</SheetTitle>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-8">
                {/* List of channels */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-base font-semibold">Notification Channels</div>
                    <Button size="sm" variant="outline" onClick={() => setEditing({ type: "webhook", name: "", value: "", enabled: true })}>
                      <Plus className="size-4 mr-1" /> Add Channel
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {channels.length === 0 && (
                      <div className="text-muted-foreground text-sm">No channels configured.</div>
                    )}
                    {channels.map((c) => (
                      <div key={c.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-3">
                        <div className="flex items-center gap-3">
                          {c.type === "webhook" && <Link2 className="size-4 text-blue-500" />}
                          {c.type === "email" && <Mail className="size-4 text-emerald-500" />}
                          {c.type === "slack" && <Slack className="size-4 text-indigo-500" />}
                          <div>
                            <div className="font-medium text-[14px]">{c.name}</div>
                            <div className="text-xs text-muted-foreground">{c.value}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="icon" variant={c.enabled ? "default" : "outline"} onClick={() => handleToggleEnabled(c.id)} title={c.enabled ? "Disable" : "Enable"}>
                            {c.enabled ? <span className="text-green-600">●</span> : <span className="text-gray-400">●</span>}
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditing({ ...c })} title="Edit">
                            <Edit2 className="size-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleRemoveChannel(c.id)} title="Delete">
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Add/Edit Channel Form */}
                {editing && (
                  <div className="bg-card/90 border rounded-lg p-5 max-w-md mx-auto shadow-xl animate-in fade-in duration-200 flex flex-col gap-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-base">{editing.id ? "Edit Channel" : "Add Channel"}</div>
                      <Button size="icon" variant="ghost" onClick={() => setEditing(null)}>
                        ×
                      </Button>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <Label className="text-micro text-muted-foreground w-24">Type</Label>
                        <Select value={editing.type} onValueChange={(v) => setEditing((e) => e && { ...e, type: v })}>
                          <SelectTrigger className="h-9 w-40 text-[14px]">
                            <SelectValue />
              </SelectTrigger>
              <SelectContent>
                            <SelectItem value="webhook">Webhook</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="slack">Slack</SelectItem>
              </SelectContent>
            </Select>
          </div>
                      <div className="flex items-center gap-3">
                        <Label className="text-micro text-muted-foreground w-24">Name</Label>
                        <Input
                          className="h-9 w-64 text-[14px]"
                          value={editing.name}
                          onChange={(e) => setEditing((ed) => ed && { ...ed, name: e.target.value })}
                          placeholder="Channel name"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Label className="text-micro text-muted-foreground w-24">{editing.type === "email" ? "Email Address" : editing.type === "slack" ? "Slack Channel" : "Webhook URL"}</Label>
                        <Input
                          className="h-9 w-64 text-[14px]"
                          value={editing.value}
                          onChange={(e) => setEditing((ed) => ed && { ...ed, value: e.target.value })}
                          placeholder={editing.type === "email" ? "alerts@example.com" : editing.type === "slack" ? "#alerts" : "https://hooks.example.com/abc"}
                        />
                      </div>
                      <div className="flex items-center gap-3 pt-2 justify-end">
                        <Button onClick={handleSaveChannel} className="h-9 px-5 text-[14px]">{editing.id ? "Save Changes" : "Add Channel"}</Button>
                        <Button variant="outline" onClick={() => setEditing(null)} className="h-9 px-5 text-[14px]">Cancel</Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          {selected === "team" && (
            <>
              <SheetHeader>
                <SheetTitle className="text-lg font-semibold tracking-tight mb-6">Team Members</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-8 max-w-2xl mx-auto">
                <div className="flex flex-col gap-2">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-3 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center font-bold text-[15px] text-primary uppercase">
                          {m.name[0]}
                        </div>
                        <div>
                          <div className="font-medium text-[15px]">{m.name}</div>
                          <div className="text-xs text-muted-foreground">{m.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <AppSelect value={m.role} onValueChange={role => handleChangeRole(m.id, role)}>
                          <AppSelectTrigger className="w-28 h-8 text-[13px]">
                            <AppSelectValue />
                          </AppSelectTrigger>
                          <AppSelectContent>
                            <AppSelectItem value="Owner">Owner</AppSelectItem>
                            <AppSelectItem value="Admin">Admin</AppSelectItem>
                            <AppSelectItem value="Member">Member</AppSelectItem>
                          </AppSelectContent>
                        </AppSelect>
                        <Button size="icon" variant="ghost" onClick={() => handleRemoveMember(m.id)} title="Remove">
                          <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <Input
                    className="h-9 w-64 text-[14px]"
                    placeholder="Invite by email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                  />
                  <AppSelect value={inviteRole} onValueChange={setInviteRole}>
                    <AppSelectTrigger className="w-28 h-8 text-[13px]">
                      <AppSelectValue />
                    </AppSelectTrigger>
                    <AppSelectContent>
                      <AppSelectItem value="Owner">Owner</AppSelectItem>
                      <AppSelectItem value="Admin">Admin</AppSelectItem>
                      <AppSelectItem value="Member">Member</AppSelectItem>
                    </AppSelectContent>
                  </AppSelect>
                  <Button className="h-9 px-5 text-[14px]" onClick={handleInvite}>Invite</Button>
                </div>
              </div>
            </>
          )}
          {selected === "billing" && (
            <>
              <SheetHeader>
                <SheetTitle className="text-lg font-semibold tracking-tight mb-6">Billing & Pricing</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-8 max-w-2xl mx-auto">
                <div className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-4 mb-2">
                  <div>
                    <div className="font-semibold text-[16px]">Current Plan: <span className="text-primary">{plan.name}</span></div>
                    <div className="text-xs text-muted-foreground">{plan.price} &middot; {plan.usage} of {plan.limit} units used</div>
                  </div>
                  <Button size="sm" variant="outline">Upgrade</Button>
                </div>
                <div className="bg-card/80 border rounded-lg p-6 shadow flex flex-col gap-4">
                  <div className="font-semibold mb-2">Usage This Year</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={usageData}>
                      <XAxis dataKey="name" stroke="#888" fontSize={13} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888" fontSize={13} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="usage" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-card/80 border rounded-lg p-6 shadow flex flex-col gap-4">
                  <div className="font-semibold mb-2">Invoices</div>
                  <div className="divide-y">
                    {invoices.map(inv => (
                      <div key={inv.id} className="flex items-center justify-between py-2 text-[15px]">
                        <div>
                          <div className="font-medium">{inv.id}</div>
                          <div className="text-xs text-muted-foreground">{inv.date}</div>
                        </div>
                        <div className="font-semibold">{inv.amount}</div>
                        <div className={`text-xs font-medium ${inv.status === "Paid" ? "text-green-600" : "text-yellow-600"}`}>{inv.status}</div>
                        <Button size="sm" variant="outline">Download</Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div> {/* closes .w-full.max-w-2xl.mx-auto... */}
      </div> {/* closes .flex-1... main content div */}
      </SheetContent>
    </Sheet>
  );
}

export default SettingsSheet;
