"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings } from "lucide-react";
import { useState } from "react";
import { Mail, Link2, Slack, Trash2, Edit2, Plus, X, Download, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select as AppSelect, SelectTrigger as AppSelectTrigger, SelectValue as AppSelectValue, SelectContent as AppSelectContent, SelectItem as AppSelectItem } from "@/components/ui/select";
import { toast } from "react-hot-toast";

type Props = {
  onSave: (v: { openaiApiKey?: string; model?: string }) => void;
};

const SECTIONS = [
  { key: "general", label: "General" },
  { key: "notifications", label: "Notifications" },
  { key: "billing", label: "Billing & Pricing" },
  { key: "team", label: "Team Members" },
  { key: "audit", label: "Audit Logs" },
];

export function SettingsSheet({ onSave }: Props) {
  const [openaiApiKey, setOpenaiApiKey] = React.useState("");
  const [model, setModel] = React.useState("gpt-4o-mini");
  const [selected, setSelected] = useState("general");
  const [open, setOpen] = useState(false);

  // General settings state
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("en");
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

  // Add Viewer role to roles
  const ROLES = ["Admin", "Member", "Viewer"];

  // Enhanced team members sample data
  const [teamMembers, setTeamMembers] = useState([
    {
      id: 1,
      name: "Alice Johnson",
      email: "alice.johnson@example.com",
      status: "Active",
      lastSeen: "2024-06-10 14:23",
      invited: "2024-05-20",
      role: "Admin",
      inviteMethod: "Email",
    },
    {
      id: 2,
      name: "Bob Smith",
      email: "bob.smith@example.com",
      status: "Pending",
      lastSeen: "-",
      invited: "2024-06-01",
      role: "Member",
      inviteMethod: "Link",
    },
    {
      id: 3,
      name: "Carol Lee",
      email: "carol.lee@example.com",
      status: "Active",
      lastSeen: "2024-06-11 09:10",
      invited: "2024-05-22",
      role: "Member",
      inviteMethod: "Email",
    },
    {
      id: 4,
      name: "David Kim",
      email: "david.kim@company.com",
      status: "Active",
      lastSeen: "2024-06-11 12:45",
      invited: "2024-05-25",
      role: "Member",
      inviteMethod: "Email",
    },
    {
      id: 5,
      name: "Emily Chen",
      email: "emily.chen@company.com",
      status: "Pending",
      lastSeen: "-",
      invited: "2024-06-05",
      role: "Member",
      inviteMethod: "Link",
    },
    {
      id: 6,
      name: "Frank Müller",
      email: "frank.muller@company.de",
      status: "Active",
      lastSeen: "2024-06-11 08:30",
      invited: "2024-05-28",
      role: "Admin",
      inviteMethod: "Email",
    },
    {
      id: 7,
      name: "Grace Park",
      email: "grace.park@company.com",
      status: "Active",
      lastSeen: "2024-06-11 10:15",
      invited: "2024-05-30",
      role: "Member",
      inviteMethod: "Email",
    },
    {
      id: 8,
      name: "Hiro Tanaka",
      email: "hiro.tanaka@company.jp",
      status: "Pending",
      lastSeen: "-",
      invited: "2024-06-07",
      role: "Member",
      inviteMethod: "Link",
    },
  ]);

  // Activity log state
  const [activityLog, setActivityLog] = useState([
    { id: 1, type: "joined", member: "Alice Johnson", date: "2024-05-20 10:00" },
    { id: 2, type: "role_changed", member: "Frank Müller", date: "2024-06-10 09:30", details: "Member → Admin" },
    { id: 3, type: "invited", member: "Emily Chen", date: "2024-06-05 15:12" },
    { id: 4, type: "removed", member: "Bob Smith", date: "2024-06-11 11:00" },
  ]);

  // Invite new member state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Member");
  const [inviteError, setInviteError] = useState("");

  // Member details modal state
  const [detailsMember, setDetailsMember] = useState<null | typeof teamMembers[0]>(null);

  // Remove/role change confirmation state
  const [removeConfirm, setRemoveConfirm] = useState<null | { id: number; name: string }>(null);
  const [roleChangeConfirm, setRoleChangeConfirm] = useState<null | { id: number; name: string; newRole: string }>(null);

  // Helper to get initials for avatar
  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  // Invite new member handler
  const handleInvite = () => {
    setInviteError("");
    if (!inviteEmail.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
      setInviteError("Please enter a valid email address.");
      return;
    }
    if (teamMembers.some((m) => m.email === inviteEmail)) {
      setInviteError("This email is already a team member.");
      return;
    }
    const newMember = {
      id: Math.max(0, ...teamMembers.map((m) => m.id)) + 1,
      name: inviteEmail.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      email: inviteEmail,
      status: "Pending",
      lastSeen: "-",
      invited: new Date().toISOString().slice(0, 10),
      role: inviteRole,
      inviteMethod: "Email",
    };
    setTeamMembers((members) => [...members, newMember]);
    setActivityLog((log) => [
      { id: Math.max(0, ...log.map((l) => l.id)) + 1, type: "invited", member: newMember.name, date: new Date().toISOString().slice(0, 16).replace("T", " ") },
      ...log,
    ]);
    setInviteEmail("");
    setInviteRole("Member");
    setInviteOpen(false);
  };

  // Remove member handler
  const handleRemoveMember = (id: number) => {
    const member = teamMembers.find((m) => m.id === id);
    setTeamMembers((members) => members.filter((m) => m.id !== id));
    setActivityLog((log) => [
      { id: Math.max(0, ...log.map((l) => l.id)) + 1, type: "removed", member: member?.name || "", date: new Date().toISOString().slice(0, 16).replace("T", " ") },
      ...log,
    ]);
    setRemoveConfirm(null);
  };

  // Role change handler
  const handleRoleChange = (id: number, newRole: string) => {
    const member = teamMembers.find((m) => m.id === id);
    setTeamMembers((members) => members.map((m) => m.id === id ? { ...m, role: newRole } : m));
    setActivityLog((log) => [
      { id: Math.max(0, ...log.map((l) => l.id)) + 1, type: "role_changed", member: member?.name || "", date: new Date().toISOString().slice(0, 16).replace("T", " "), details: `${member?.role} → ${newRole}` },
      ...log,
    ]);
    setRoleChangeConfirm(null);
  };

  // Export as CSV
  const handleExportCSV = () => {
    const header = ["Name", "Email", "Role", "Status", "Last Seen", "Date Invited", "Invite Method"];
    const rows = teamMembers.map(m => [m.name, m.email, m.role, m.status, m.lastSeen, m.invited, m.inviteMethod]);
    const csv = [header, ...rows].map(r => r.map(x => `"${x}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "team-members.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export as PDF (simple, using window.print for demo)
  const handleExportPDF = () => {
    window.print();
  };

  const handleSave = () => {
    onSave({ openaiApiKey, model });
  };

  // Billing state
  const [plan, setPlan] = useState({ name: "Pro Plan", price: 49, features: ["Up to 10,000 API calls/month", "Up to 20 team members", "Priority support", "Advanced analytics"], started: "2024-05-01" });
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(plan.name);
  const [subscriptionStatus, setSubscriptionStatus] = useState("Active");
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [usage, setUsage] = useState({ api: 7200, apiLimit: 10000, team: 8, teamLimit: 20, storage: 2.5, storageLimit: 5 });
  const [upgradeFromUsage, setUpgradeFromUsage] = useState(false);

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, brand: "Visa", last4: "4242", exp: "12/26", default: true },
    { id: 2, brand: "Mastercard", last4: "1234", exp: "09/25", default: false },
  ]);
  const [addCardModal, setAddCardModal] = useState(false);
  const [removeCardConfirm, setRemoveCardConfirm] = useState<null | number>(null);
  const [newCard, setNewCard] = useState({ brand: "Visa", number: "", exp: "", cvc: "", name: "" });
  const [cardError, setCardError] = useState("");

  // Invoices state
  const [invoices, setInvoices] = useState([
    { id: 1, date: "2024-06-01", amount: 49, status: "Paid" },
    { id: 2, date: "2024-05-01", amount: 49, status: "Paid" },
    { id: 3, date: "2024-04-01", amount: 49, status: "Pending" },
  ]);

  // Billing contact state
  const [billingContact, setBillingContact] = useState({ name: "Alice Johnson", email: "billing@company.com", company: "Acme Corp", vat: "DE123456789", address: "123 Main St, Berlin, Germany" });
  const [editContact, setEditContact] = useState(false);
  const [contactDraft, setContactDraft] = useState(billingContact);

  // Upgrade/Change Plan Modal
  const availablePlans = [
    { name: "Starter", price: 0, features: ["1,000 API calls/month", "2 team members"] },
    { name: "Pro Plan", price: 49, features: ["10,000 API calls/month", "20 team members", "Priority support", "Advanced analytics"] },
    { name: "Enterprise", price: 199, features: ["100,000 API calls/month", "Unlimited team members", "Dedicated support", "Custom integrations"] },
  ];

  // Add Payment Method handler
  const handleAddCard = () => {
    setCardError("");
    if (!newCard.number.match(/^\d{16}$/)) {
      setCardError("Card number must be 16 digits.");
      return;
    }
    if (!newCard.exp.match(/^(0[1-9]|1[0-2])\/(\d{2})$/)) {
      setCardError("Expiry must be MM/YY.");
      return;
    }
    if (!newCard.cvc.match(/^\d{3}$/)) {
      setCardError("CVC must be 3 digits.");
      return;
    }
    if (!newCard.name) {
      setCardError("Name is required.");
      return;
    }
    const brand = newCard.brand;
    const last4 = newCard.number.slice(-4);
    setPaymentMethods((cards) => [
      ...cards.map((c) => ({ ...c, default: false })),
      { id: Math.max(0, ...cards.map((c) => c.id)) + 1, brand, last4, exp: newCard.exp, default: false },
    ]);
    setAddCardModal(false);
    setNewCard({ brand: "Visa", number: "", exp: "", cvc: "", name: "" });
    toast.success("Card added.");
  };

  // Remove Payment Method handler
  const handleRemoveCard = (id: number) => {
    setPaymentMethods((cards) => cards.filter((c) => c.id !== id));
    setRemoveCardConfirm(null);
    toast.success("Card removed.");
  };

  // Set Default Payment Method handler
  const handleSetDefaultCard = (id: number) => {
    setPaymentMethods((cards) => cards.map((c) => ({ ...c, default: c.id === id })));
    toast.success("Default card updated.");
  };

  // Download Invoice handler
  const handleDownloadInvoice = (id: number) => {
    const invoice = invoices.find((i) => i.id === id);
    if (!invoice) return;
    const csv = `Date,Amount,Status\n${invoice.date},$${invoice.amount.toFixed(2)},${invoice.status}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${invoice.date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Invoice downloaded.");
  };

  // Resend Invoice handler
  const handleResendInvoice = (id: number) => {
    toast.success("Invoice resent to billing contact.");
  };

  // Edit Billing Contact handlers
  const handleSaveContact = () => {
    setBillingContact(contactDraft);
    setEditContact(false);
    toast.success("Billing contact updated.");
  };
  const handleCancelContact = () => {
    setContactDraft(billingContact);
    setEditContact(false);
  };

  // Cancel Subscription handler
  const handleCancelSubscription = () => {
    setSubscriptionStatus("Cancelled");
    setCancelConfirm(false);
    toast.success("Subscription cancelled.");
  };

  // Manage Subscription handler
  const handleManageSubscription = () => {
    setManageModalOpen(true);
  };

  // Upgrade/Change Plan handler
  const handleUpgradePlan = () => {
    const planObj = availablePlans.find((p) => p.name === selectedPlan);
    if (planObj) {
      setPlan({ ...planObj, started: new Date().toISOString().slice(0, 10) });
      setPlanModalOpen(false);
      setUpgradeFromUsage(false);
      toast.success(`Upgraded to ${planObj.name}`);
    }
  };

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, timestamp: "2024-06-12 10:01:23", user: "Alice Johnson", action: "Login", ip: "192.168.1.10", device: "Chrome on Mac", status: "Success", details: "Logged in from Berlin, DE" },
    { id: 2, timestamp: "2024-06-12 10:05:12", user: "Bob Smith", action: "Change Password", ip: "192.168.1.11", device: "Safari on iPhone", status: "Success", details: "Password changed" },
    { id: 3, timestamp: "2024-06-12 10:10:45", user: "Carol Lee", action: "Failed Login", ip: "192.168.1.12", device: "Edge on Windows", status: "Error", details: "Invalid password" },
    { id: 4, timestamp: "2024-06-12 10:15:00", user: "David Kim", action: "Invite Member", ip: "192.168.1.13", device: "Chrome on Mac", status: "Success", details: "Invited emily.chen@company.com" },
    { id: 5, timestamp: "2024-06-12 10:20:30", user: "Emily Chen", action: "Remove Member", ip: "192.168.1.14", device: "Firefox on Linux", status: "Warning", details: "Removed Bob Smith" },
    { id: 6, timestamp: "2024-06-12 10:25:10", user: "Frank Müller", action: "Download Invoice", ip: "192.168.1.15", device: "Chrome on Windows", status: "Success", details: "Downloaded invoice-2024-06-01.csv" },
    { id: 7, timestamp: "2024-06-12 10:30:00", user: "Grace Park", action: "Change Role", ip: "192.168.1.16", device: "Safari on Mac", status: "Success", details: "Changed Carol Lee to Admin" },
    { id: 8, timestamp: "2024-06-12 10:35:00", user: "Hiro Tanaka", action: "Failed Login", ip: "192.168.1.17", device: "Chrome on Android", status: "Error", details: "Invalid password" },
  ]);
  const [auditFilters, setAuditFilters] = useState({ user: "", action: "", status: "", search: "", date: "" });
  const [auditPage, setAuditPage] = useState(1);
  const [auditRowsPerPage] = useState(5);
  const [auditDetail, setAuditDetail] = useState<null | typeof auditLogs[0]>(null);
  const [auditDelete, setAuditDelete] = useState<null | number>(null);

  // Filtered and paginated logs
  const filteredLogs = auditLogs.filter(l =>
    (!auditFilters.user || l.user === auditFilters.user) &&
    (!auditFilters.action || l.action === auditFilters.action) &&
    (!auditFilters.status || l.status === auditFilters.status) &&
    (!auditFilters.date || l.timestamp.startsWith(auditFilters.date)) &&
    (!auditFilters.search ||
      l.user.toLowerCase().includes(auditFilters.search.toLowerCase()) ||
      l.action.toLowerCase().includes(auditFilters.search.toLowerCase()) ||
      l.ip.includes(auditFilters.search))
  );
  const paginatedLogs = filteredLogs.slice((auditPage - 1) * auditRowsPerPage, auditPage * auditRowsPerPage);
  const totalPages = Math.ceil(filteredLogs.length / auditRowsPerPage);

  // Export logs as CSV
  const handleExportAuditCSV = () => {
    const header = ["Timestamp", "User", "Action", "IP", "Device", "Status", "Details"];
    const rows = filteredLogs.map(l => [l.timestamp, l.user, l.action, l.ip, l.device, l.status, l.details]);
    const csv = [header, ...rows].map(r => r.map(x => `"${x}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-logs.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit logs exported.");
  };

  // Refresh logs (mock)
  const handleRefreshAudit = () => {
    toast.success("Audit logs refreshed.");
  };

  // Delete log
  const handleDeleteAudit = (id: number) => {
    setAuditLogs(logs => logs.filter(l => l.id !== id));
    setAuditDelete(null);
    toast.success("Log deleted.");
  };

  // Get unique users/actions/statuses for filters
  const auditUsers = Array.from(new Set(auditLogs.map(l => l.user)));
  const auditActions = Array.from(new Set(auditLogs.map(l => l.action)));
  const auditStatuses = Array.from(new Set(auditLogs.map(l => l.status)));

  // Prevent ESC from closing settings
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Settings" className="h-9 w-9 transition-surgical focus-surgical hover-lift">
          <Settings className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        fullscreen={true}
        className="bg-background/90 backdrop-blur-2xl z-[100] flex flex-row p-0 animate-in fade-in duration-300 overflow-hidden"
      >
        {/* Close Button */}
        <button
          className="absolute top-6 right-8 z-50 text-muted-foreground hover:text-foreground transition-colors text-2xl bg-background/80 rounded-full shadow-lg p-1 border border-muted/30"
          onClick={() => setOpen(false)}
          aria-label="Close settings"
        >
          <X className="size-7" />
        </button>
        {/* Sidebar Navigation */}
        <nav className="w-56 border-r bg-muted/20 h-full flex flex-col py-8 px-2 gap-1 shadow-lg text-[13px]">
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
        <div className="flex-1 px-10 py-10 overflow-y-auto bg-background/80" style={{backdropFilter: 'blur(8px)'}}>
          {selected === "general" && (
            <>
              <SheetHeader>
                <SheetTitle className="text-lg font-semibold tracking-tight">General Settings</SheetTitle>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-7 max-w-lg">
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-[14px] text-muted-foreground">Dark Mode</Label>
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-[14px] text-muted-foreground">Language</Label>
                  <AppSelect value={language} onValueChange={setLanguage}>
                    <AppSelectTrigger className="w-36 h-9 text-[14px]">
                      <AppSelectValue />
                    </AppSelectTrigger>
                    <AppSelectContent>
                      <AppSelectItem value="en">English</AppSelectItem>
                      <AppSelectItem value="es">Spanish</AppSelectItem>
                      <AppSelectItem value="fr">French</AppSelectItem>
                      <AppSelectItem value="de">German</AppSelectItem>
                    </AppSelectContent>
                  </AppSelect>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-[14px] text-muted-foreground">Email Notifications</Label>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
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
          {selected === "billing" && (
            <>
              <SheetHeader>
                <SheetTitle className="text-lg font-semibold tracking-tight">Billing & Pricing</SheetTitle>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-8 max-w-4xl">
                {/* Current Plan Overview */}
                <div className="bg-muted/30 border rounded-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow">
                  <div>
                    <div className="text-lg font-bold mb-1">{plan.name}</div>
                    <div className="text-muted-foreground text-sm mb-2">${plan.price}/month &middot; Billed monthly</div>
                    <ul className="text-xs text-muted-foreground list-disc pl-5 mb-2">
                      {plan.features.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                    <div className="text-xs text-muted-foreground">Started: {plan.started}</div>
                    <div className="text-xs text-muted-foreground">Status: {subscriptionStatus}</div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Button size="sm" variant="default" onClick={() => setPlanModalOpen(true)}>Upgrade</Button>
                    <Button size="sm" variant="outline" onClick={() => setPlanModalOpen(true)}>Change Plan</Button>
                  </div>
                </div>
                {/* Upgrade/Change Plan Modal */}
                {planModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-background border rounded-lg shadow-xl p-8 max-w-md w-full animate-in fade-in duration-200">
                      <div className="font-semibold text-lg mb-2">Select a Plan</div>
                      <div className="flex flex-col gap-4 mb-4">
                        {availablePlans.map((p) => (
                          <div key={p.name} className={`border rounded-lg p-4 flex flex-col gap-1 cursor-pointer ${selectedPlan === p.name ? 'border-primary bg-primary/10' : 'border-muted'}`} onClick={() => setSelectedPlan(p.name)}>
                            <div className="flex items-center justify-between">
                              <div className="font-semibold">{p.name}</div>
                              <div className="text-sm">${p.price}/mo</div>
                            </div>
                            <ul className="text-xs text-muted-foreground list-disc pl-5">
                              {p.features.map((f, i) => <li key={i}>{f}</li>)}
                            </ul>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3 justify-end">
                        <Button onClick={handleUpgradePlan} className="px-5">Confirm</Button>
                        <Button variant="outline" onClick={() => { setPlanModalOpen(false); setUpgradeFromUsage(false); }} className="px-5">Cancel</Button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Usage Summary */}
                <div className="bg-muted/30 border rounded-lg p-6 shadow">
                  <div className="font-semibold mb-4">Usage Summary</div>
                  <div className="flex flex-col gap-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>API Calls</span>
                        <span>{usage.api} / {usage.apiLimit}</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden cursor-pointer" onClick={() => setUpgradeFromUsage(true)}>
                        <div className="h-2 bg-primary rounded-full" style={{ width: `${(usage.api / usage.apiLimit) * 100}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Team Members</span>
                        <span>{usage.team} / {usage.teamLimit}</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden cursor-pointer" onClick={() => setUpgradeFromUsage(true)}>
                        <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${(usage.team / usage.teamLimit) * 100}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Storage</span>
                        <span>{usage.storage} GB / {usage.storageLimit} GB</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden cursor-pointer" onClick={() => setUpgradeFromUsage(true)}>
                        <div className="h-2 bg-emerald-500 rounded-full" style={{ width: `${(usage.storage / usage.storageLimit) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-yellow-700 mt-3 cursor-pointer" onClick={() => setUpgradeFromUsage(true)}>Upgrade for more usage and features!</div>
                </div>
                {/* Usage Upgrade Modal (reuse plan modal) */}
                {upgradeFromUsage && planModalOpen === false && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-background border rounded-lg shadow-xl p-8 max-w-md w-full animate-in fade-in duration-200">
                      <div className="font-semibold text-lg mb-2">Upgrade Plan</div>
                      <div className="mb-4 text-muted-foreground text-sm">Upgrade your plan to increase your usage limits.</div>
                      <Button onClick={() => setPlanModalOpen(true)} className="px-5">Select a Plan</Button>
                      <Button variant="outline" onClick={() => setUpgradeFromUsage(false)} className="px-5 ml-2">Cancel</Button>
                    </div>
                  </div>
                )}
                {/* Payment Methods */}
                <div className="bg-muted/30 border rounded-lg p-6 shadow">
                  <div className="font-semibold mb-4 flex items-center justify-between">
                    <span>Payment Methods</span>
                    <Button size="sm" variant="outline" onClick={() => setAddCardModal(true)}>Add Payment Method</Button>
                  </div>
                  <div className="flex flex-col gap-3">
                    {paymentMethods.map((card) => (
                      <div key={card.id} className="flex items-center gap-4 border-b border-muted/20 pb-2 last:border-b-0 last:pb-0">
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 text-gray-700 font-bold text-xs">{card.brand[0]}</span>
                        <span className="text-sm">{card.brand} ending in {card.last4}</span>
                        <span className="text-xs text-muted-foreground ml-2">Exp {card.exp}</span>
                        {card.default && <span className="ml-auto text-xs text-green-700 font-semibold">Default</span>}
                        {!card.default && <Button size="sm" variant="ghost" onClick={() => handleSetDefaultCard(card.id)}>Set Default</Button>}
                        <Button size="icon" variant="ghost" title="Remove" onClick={() => setRemoveCardConfirm(card.id)}><Trash2 className="size-4 text-destructive" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Add Payment Method Modal */}
                {addCardModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-background border rounded-lg shadow-xl p-8 max-w-sm w-full animate-in fade-in duration-200">
                      <div className="font-semibold text-lg mb-2">Add Payment Method</div>
                      <div className="flex flex-col gap-3 mb-2">
                        <Label>Card Brand</Label>
                        <Select value={newCard.brand} onValueChange={v => setNewCard(c => ({ ...c, brand: v }))}>
                          <SelectTrigger className="h-9 w-40 text-[14px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Visa">Visa</SelectItem>
                            <SelectItem value="Mastercard">Mastercard</SelectItem>
                            <SelectItem value="Amex">Amex</SelectItem>
                          </SelectContent>
                        </Select>
                        <Label>Card Number</Label>
                        <Input value={newCard.number} onChange={e => setNewCard(c => ({ ...c, number: e.target.value.replace(/\D/g, "") }))} maxLength={16} placeholder="1234123412341234" />
                        <Label>Expiry (MM/YY)</Label>
                        <Input value={newCard.exp} onChange={e => setNewCard(c => ({ ...c, exp: e.target.value }))} maxLength={5} placeholder="12/26" />
                        <Label>CVC</Label>
                        <Input value={newCard.cvc} onChange={e => setNewCard(c => ({ ...c, cvc: e.target.value.replace(/\D/g, "") }))} maxLength={3} placeholder="123" />
                        <Label>Name on Card</Label>
                        <Input value={newCard.name} onChange={e => setNewCard(c => ({ ...c, name: e.target.value }))} placeholder="Full Name" />
                        {cardError && <div className="text-destructive text-xs">{cardError}</div>}
                      </div>
                      <div className="flex gap-3 justify-end">
                        <Button onClick={handleAddCard} className="px-5">Add</Button>
                        <Button variant="outline" onClick={() => { setAddCardModal(false); setCardError(""); }} className="px-5">Cancel</Button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Remove Card Confirmation */}
                {removeCardConfirm && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-background border rounded-lg shadow-xl p-8 max-w-sm w-full animate-in fade-in duration-200">
                      <div className="font-semibold text-lg mb-2">Remove Card</div>
                      <div className="text-muted-foreground mb-6">Are you sure you want to remove this card?</div>
                      <div className="flex gap-3 justify-end">
                        <Button variant="destructive" onClick={() => handleRemoveCard(removeCardConfirm)} className="px-5">Remove</Button>
                        <Button variant="outline" onClick={() => setRemoveCardConfirm(null)} className="px-5">Cancel</Button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Invoices & Billing History */}
                <div className="bg-muted/30 border rounded-lg p-6 shadow">
                  <div className="font-semibold mb-4">Invoices & Billing History</div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs text-left">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="px-4 py-2 font-semibold">Date</th>
                          <th className="px-4 py-2 font-semibold">Amount</th>
                          <th className="px-4 py-2 font-semibold">Status</th>
                          <th className="px-4 py-2 font-semibold">Invoice</th>
                          <th className="px-4 py-2 font-semibold">Resend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((inv) => (
                          <tr key={inv.id}>
                            <td className="px-4 py-2">{inv.date}</td>
                            <td className="px-4 py-2">${inv.amount.toFixed(2)}</td>
                            <td className="px-4 py-2"><span className={`inline-block px-2 py-1 rounded ${inv.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{inv.status}</span></td>
                            <td className="px-4 py-2"><Button size="sm" variant="ghost" onClick={() => handleDownloadInvoice(inv.id)}>Download</Button></td>
                            <td className="px-4 py-2"><Button size="sm" variant="outline" onClick={() => handleResendInvoice(inv.id)}>Resend</Button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Billing Contact */}
                <div className="bg-muted/30 border rounded-lg p-6 shadow">
                  <div className="font-semibold mb-4 flex items-center gap-3">
                    <span>Billing Contact</span>
                    {!editContact && <Button size="sm" variant="outline" onClick={() => setEditContact(true)}>Edit</Button>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input className="mt-1" value={editContact ? contactDraft.name : billingContact.name} onChange={e => setContactDraft(d => ({ ...d, name: e.target.value }))} readOnly={!editContact} />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input className="mt-1" value={editContact ? contactDraft.email : billingContact.email} onChange={e => setContactDraft(d => ({ ...d, email: e.target.value }))} readOnly={!editContact} />
                    </div>
                    <div>
                      <Label>Company</Label>
                      <Input className="mt-1" value={editContact ? contactDraft.company : billingContact.company} onChange={e => setContactDraft(d => ({ ...d, company: e.target.value }))} readOnly={!editContact} />
                    </div>
                    <div>
                      <Label>VAT Number</Label>
                      <Input className="mt-1" value={editContact ? contactDraft.vat : billingContact.vat} onChange={e => setContactDraft(d => ({ ...d, vat: e.target.value }))} readOnly={!editContact} />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Address</Label>
                      <Input className="mt-1" value={editContact ? contactDraft.address : billingContact.address} onChange={e => setContactDraft(d => ({ ...d, address: e.target.value }))} readOnly={!editContact} />
                    </div>
                  </div>
                  {editContact && (
                    <div className="flex gap-3 justify-end mt-4">
                      <Button onClick={handleSaveContact} className="px-5">Save</Button>
                      <Button variant="outline" onClick={handleCancelContact} className="px-5">Cancel</Button>
                    </div>
                  )}
                </div>
                {/* Upcoming Charges */}
                <div className="bg-muted/30 border rounded-lg p-6 shadow flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <div className="font-semibold mb-1">Upcoming Charges</div>
                    <div className="text-xs text-muted-foreground">Next renewal: 2024-07-01</div>
                  </div>
                  <div className="text-lg font-bold">${plan.price}.00</div>
                  <div className="text-xs text-muted-foreground">{plan.name} &middot; 1 month</div>
                </div>
                {/* Subscription Management */}
                <div className="flex gap-3">
                  <Button size="sm" variant="destructive" onClick={() => setCancelConfirm(true)} disabled={subscriptionStatus === 'Cancelled'}>Cancel Subscription</Button>
                  <Button size="sm" variant="outline" onClick={handleManageSubscription}>Manage Subscription</Button>
                </div>
                {/* Cancel Subscription Confirmation */}
                {cancelConfirm && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-background border rounded-lg shadow-xl p-8 max-w-sm w-full animate-in fade-in duration-200">
                      <div className="font-semibold text-lg mb-2">Cancel Subscription</div>
                      <div className="text-muted-foreground mb-6">Are you sure you want to cancel your subscription?</div>
                      <div className="flex gap-3 justify-end">
                        <Button variant="destructive" onClick={handleCancelSubscription} className="px-5">Cancel Subscription</Button>
                        <Button variant="outline" onClick={() => setCancelConfirm(false)} className="px-5">Keep</Button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Manage Subscription Modal */}
                {manageModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-background border rounded-lg shadow-xl p-8 max-w-md w-full animate-in fade-in duration-200">
                      <div className="font-semibold text-lg mb-2">Manage Subscription</div>
                      <div className="mb-4 text-muted-foreground text-sm">This would open your billing portal or Stripe customer portal in a real app.</div>
                      <Button onClick={() => setManageModalOpen(false)} className="px-5">Close</Button>
                    </div>
                  </div>
                )}
                {/* Compliance Badges */}
                <div className="flex gap-4 mt-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold">PCI DSS</span>
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded bg-blue-100 text-blue-700 text-xs font-semibold">GDPR</span>
                </div>
              </div>
            </>
          )}
          {selected === "team" && (
            <>
              <SheetHeader>
                <SheetTitle className="text-lg font-semibold tracking-tight">Team Members</SheetTitle>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-6">
                {/* Invite New Member Button */}
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="outline" onClick={() => setInviteOpen(true)}>
                    <Plus className="size-4 mr-1" /> Invite New Member
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleExportCSV} title="Export as CSV">
                    <Download className="size-4 mr-1" /> CSV
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleExportPDF} title="Export as PDF">
                    <Download className="size-4 mr-1" /> PDF
                  </Button>
                </div>
                {/* Invite New Member Modal */}
                {inviteOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-background border rounded-lg shadow-xl p-8 max-w-sm w-full animate-in fade-in duration-200">
                      <div className="font-semibold text-lg mb-2">Invite New Member</div>
                      <div className="flex flex-col gap-4">
                        <Input
                          type="email"
                          placeholder="Email address"
                          value={inviteEmail}
                          onChange={e => setInviteEmail(e.target.value)}
                          className="h-9 text-[14px]"
                        />
                        <div className="flex items-center gap-2">
                          <Label className="text-micro text-muted-foreground w-24">Role</Label>
                          <Select value={inviteRole} onValueChange={setInviteRole}>
                            <SelectTrigger className="h-9 w-40 text-[14px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map(role => (
                                <SelectItem key={role} value={role}>{role}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {inviteError && <div className="text-destructive text-xs">{inviteError}</div>}
                        <div className="flex gap-3 justify-end pt-2">
                          <Button onClick={handleInvite} className="h-9 px-5">Send Invite</Button>
                          <Button variant="outline" onClick={() => setInviteOpen(false)} className="h-9 px-5">Cancel</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Team Members Table */}
                <div className="overflow-x-auto rounded-lg shadow border bg-muted/30">
                  <table className="min-w-full text-sm text-left">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Name</th>
                        <th className="px-6 py-3 font-semibold">Email</th>
                        <th className="px-6 py-3 font-semibold">Role</th>
                        <th className="px-6 py-3 font-semibold">Status</th>
                        <th className="px-6 py-3 font-semibold">Last Seen</th>
                        <th className="px-6 py-3 font-semibold">Date Invited</th>
                        <th className="px-6 py-3 font-semibold">Invite Method</th>
                        <th className="px-6 py-3 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamMembers.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-6 py-4 text-center text-muted-foreground">No team members.</td>
                        </tr>
                      )}
                      {teamMembers.map((member) => (
                        <tr key={member.id} className="border-t border-muted/20 group hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4 font-medium flex items-center gap-3 cursor-pointer" onClick={() => setDetailsMember(member)}>
                            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary/20 text-primary font-bold text-xs">
                              {getInitials(member.name)}
                            </span>
                            {member.name}
                            <Info className="size-4 ml-1 text-muted-foreground opacity-60 group-hover:opacity-100" />
                          </td>
                          <td className="px-6 py-4">{member.email}</td>
                          <td className="px-6 py-4">
                            <Select value={member.role} onValueChange={newRole => setRoleChangeConfirm({ id: member.id, name: member.name, newRole })}>
                              <SelectTrigger className="h-7 w-28 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLES.map(role => (
                                  <SelectItem key={role} value={role}>{role}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${member.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{member.status}</span>
                          </td>
                          <td className="px-6 py-4">{member.lastSeen}</td>
                          <td className="px-6 py-4">{member.invited}</td>
                          <td className="px-6 py-4">{member.inviteMethod}</td>
                          <td className="px-6 py-4 flex gap-1">
                            {member.status === 'Pending' && (
                              <Button size="sm" variant="outline" onClick={() => setActivityLog(log => [{ id: Math.max(0, ...log.map(l => l.id)) + 1, type: 'invited', member: member.name, date: new Date().toISOString().slice(0, 16).replace('T', ' ') }, ...log])} title="Resend Invite">
                                <Mail className="size-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="hover:bg-destructive/10" onClick={() => setRemoveConfirm({ id: member.id, name: member.name })} title="Remove">
                              <Trash2 className="size-4 text-destructive group-hover:scale-110 transition-transform" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Remove confirmation dialog */}
                {removeConfirm && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-background border rounded-lg shadow-xl p-8 max-w-sm w-full animate-in fade-in duration-200">
                      <div className="font-semibold text-lg mb-2">Remove Member</div>
                      <div className="text-muted-foreground mb-6">Are you sure you want to remove <span className="font-bold">{removeConfirm.name}</span> from your team?</div>
                      <div className="flex gap-3 justify-end">
                        <Button variant="destructive" onClick={() => handleRemoveMember(removeConfirm.id)} className="px-5">Remove</Button>
                        <Button variant="outline" onClick={() => setRemoveConfirm(null)} className="px-5">Cancel</Button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Role change confirmation dialog */}
                {roleChangeConfirm && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-background border rounded-lg shadow-xl p-8 max-w-sm w-full animate-in fade-in duration-200">
                      <div className="font-semibold text-lg mb-2">Change Role</div>
                      <div className="text-muted-foreground mb-6">Change role of <span className="font-bold">{roleChangeConfirm.name}</span> to <span className="font-bold">{roleChangeConfirm.newRole}</span>?</div>
                      <div className="flex gap-3 justify-end">
                        <Button onClick={() => handleRoleChange(roleChangeConfirm.id, roleChangeConfirm.newRole)} className="px-5">Change</Button>
                        <Button variant="outline" onClick={() => setRoleChangeConfirm(null)} className="px-5">Cancel</Button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Member details modal */}
                {detailsMember && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-background border rounded-lg shadow-xl p-8 max-w-md w-full animate-in fade-in duration-200">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/20 text-primary font-bold text-xl">
                          {getInitials(detailsMember.name)}
                        </span>
                        <div>
                          <div className="font-semibold text-lg">{detailsMember.name}</div>
                          <div className="text-muted-foreground text-sm">{detailsMember.email}</div>
                          <div className="text-xs mt-1"><span className="font-semibold">Role:</span> {detailsMember.role}</div>
                          <div className="text-xs"><span className="font-semibold">Status:</span> {detailsMember.status}</div>
                        </div>
                      </div>
                      <div className="mb-2 font-semibold">Recent Activity</div>
                      <div className="max-h-40 overflow-y-auto mb-4">
                        {activityLog.filter(a => a.member === detailsMember.name).length === 0 && (
                          <div className="text-muted-foreground text-xs">No recent activity.</div>
                        )}
                        {activityLog.filter(a => a.member === detailsMember.name).map(a => (
                          <div key={a.id} className="text-xs mb-1">
                            <span className="font-semibold">{a.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span> - {a.date} {a.details && (<span className="text-muted-foreground">({a.details})</span>)}
                          </div>
                        ))}
                      </div>
                      <div className="mb-2 font-semibold">Permissions</div>
                      <div className="text-xs mb-4">
                        {detailsMember.role === 'Admin' && 'Full access to all settings and data.'}
                        {detailsMember.role === 'Member' && 'Can view and edit most data, but cannot manage billing or team.'}
                        {detailsMember.role === 'Viewer' && 'Read-only access to data.'}
                      </div>
                      <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setDetailsMember(null)} className="px-5">Close</Button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Activity Log Section */}
                <div className="mt-8">
                  <div className="font-semibold text-base mb-2">Activity Log</div>
                  <div className="bg-muted/30 border rounded-lg p-4 max-h-48 overflow-y-auto text-xs">
                    {activityLog.length === 0 && <div className="text-muted-foreground">No recent activity.</div>}
                    {activityLog.slice(0, 20).map(a => (
                      <div key={a.id} className="mb-1">
                        <span className="font-semibold">{a.member}</span> {a.type.replace('_', ' ')} {a.details ? <span className="text-muted-foreground">({a.details})</span> : ''} <span className="text-muted-foreground">- {a.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
          {selected === "audit" && (
            <>
              <SheetHeader>
                <SheetTitle className="text-lg font-semibold tracking-tight">Audit Logs</SheetTitle>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-6 max-w-5xl">
                {/* Filters/Search/Export/Refresh */}
                <div className="flex flex-wrap gap-3 items-center mb-2">
                  <Input placeholder="Search user, action, IP..." value={auditFilters.search} onChange={e => setAuditFilters(f => ({ ...f, search: e.target.value }))} className="w-48" />
                  <Input type="date" value={auditFilters.date} onChange={e => setAuditFilters(f => ({ ...f, date: e.target.value }))} className="w-36" />
                  <Select value={auditFilters.user} onValueChange={v => setAuditFilters(f => ({ ...f, user: v }))}>
                    <SelectTrigger className="w-36"><SelectValue placeholder="User" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Users</SelectItem>
                      {auditUsers.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={auditFilters.action} onValueChange={v => setAuditFilters(f => ({ ...f, action: v }))}>
                    <SelectTrigger className="w-36"><SelectValue placeholder="Action" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Actions</SelectItem>
                      {auditActions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={auditFilters.status} onValueChange={v => setAuditFilters(f => ({ ...f, status: v }))}>
                    <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      {auditStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" onClick={handleExportAuditCSV}>Export CSV</Button>
                  <Button size="sm" variant="ghost" onClick={handleRefreshAudit}>Refresh</Button>
                </div>
                {/* Audit Logs Table */}
                <div className="overflow-x-auto rounded-lg shadow border bg-muted/30">
                  <table className="min-w-full text-xs text-left">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="px-4 py-2 font-semibold">Timestamp</th>
                        <th className="px-4 py-2 font-semibold">User</th>
                        <th className="px-4 py-2 font-semibold">Action</th>
                        <th className="px-4 py-2 font-semibold">IP</th>
                        <th className="px-4 py-2 font-semibold">Device</th>
                        <th className="px-4 py-2 font-semibold">Status</th>
                        <th className="px-4 py-2 font-semibold">Details</th>
                        <th className="px-4 py-2 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLogs.length === 0 && (
                        <tr><td colSpan={8} className="px-4 py-4 text-center text-muted-foreground">No logs found.</td></tr>
                      )}
                      {paginatedLogs.map(log => (
                        <tr key={log.id} className="border-t border-muted/20 group hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-2">{log.timestamp}</td>
                          <td className="px-4 py-2 flex items-center gap-2">
                            <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-primary/20 text-primary font-bold text-xs">{log.user.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}</span>
                            {log.user}
                          </td>
                          <td className="px-4 py-2">{log.action}</td>
                          <td className="px-4 py-2">{log.ip}</td>
                          <td className="px-4 py-2">{log.device}</td>
                          <td className="px-4 py-2">
                            <span className={`inline-block px-2 py-1 rounded font-semibold ${log.status === 'Success' ? 'bg-green-100 text-green-700' : log.status === 'Warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{log.status}</span>
                          </td>
                          <td className="px-4 py-2 truncate max-w-xs cursor-pointer" title={log.details} onClick={() => setAuditDetail(log)}>{log.details.length > 30 ? log.details.slice(0,30) + '…' : log.details}</td>
                          <td className="px-4 py-2 flex gap-1">
                            <Button size="icon" variant="ghost" title="View Details" onClick={() => setAuditDetail(log)}><Info className="size-4" /></Button>
                            <Button size="icon" variant="ghost" title="Delete" onClick={() => setAuditDelete(log.id)}><Trash2 className="size-4 text-destructive" /></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div className="flex gap-2 items-center justify-end mt-2">
                  <Button size="sm" variant="outline" onClick={() => setAuditPage(p => Math.max(1, p-1))} disabled={auditPage === 1}>Prev</Button>
                  <span className="text-xs">Page {auditPage} of {totalPages || 1}</span>
                  <Button size="sm" variant="outline" onClick={() => setAuditPage(p => Math.min(totalPages, p+1))} disabled={auditPage === totalPages}>Next</Button>
                </div>
                {/* Audit Log Details Modal */}
                {auditDetail && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-background border rounded-lg shadow-xl p-8 max-w-md w-full animate-in fade-in duration-200">
                      <div className="font-semibold text-lg mb-2">Log Details</div>
                      <div className="mb-2 text-xs text-muted-foreground">{auditDetail.timestamp}</div>
                      <div className="mb-2"><span className="font-semibold">User:</span> {auditDetail.user}</div>
                      <div className="mb-2"><span className="font-semibold">Action:</span> {auditDetail.action}</div>
                      <div className="mb-2"><span className="font-semibold">IP:</span> {auditDetail.ip}</div>
                      <div className="mb-2"><span className="font-semibold">Device:</span> {auditDetail.device}</div>
                      <div className="mb-2"><span className="font-semibold">Status:</span> <span className={`inline-block px-2 py-1 rounded font-semibold ${auditDetail.status === 'Success' ? 'bg-green-100 text-green-700' : auditDetail.status === 'Warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{auditDetail.status}</span></div>
                      <div className="mb-2"><span className="font-semibold">Details:</span> {auditDetail.details}</div>
                      <div className="flex gap-3 justify-end mt-4">
                        <Button variant="outline" onClick={() => setAuditDetail(null)} className="px-5">Close</Button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Delete Log Confirmation */}
                {auditDelete && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-background border rounded-lg shadow-xl p-8 max-w-sm w-full animate-in fade-in duration-200">
                      <div className="font-semibold text-lg mb-2">Delete Log</div>
                      <div className="text-muted-foreground mb-6">Are you sure you want to delete this log entry?</div>
                      <div className="flex gap-3 justify-end">
                        <Button variant="destructive" onClick={() => handleDeleteAudit(auditDelete)} className="px-5">Delete</Button>
                        <Button variant="outline" onClick={() => setAuditDelete(null)} className="px-5">Cancel</Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}





