"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Package, Shield, AlertCircle,
  Users, History, Settings, MessageSquare, Code, Home
} from "lucide-react";
import { Brand } from "@/components/brand";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { NotificationProvider, useNotification } from "@/components/ui/notification";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { addNotification } = useNotification();

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: Home,
    },
    {
      name: "Code Editor",
      href: "/editor",
      icon: Code,
    },
    {
      name: "AI Chat",
      href: "/chat",
      icon: MessageSquare,
    },
    {
      name: "Audit Reports",
      href: "/audit",
      icon: Shield,
    },
    {
      name: "Dependencies",
      href: "/dependencies",
      icon: Package,
    },
    {
      name: "Collaboration",
      href: "/collaboration",
      icon: Users,
    },
    {
      name: "File History",
      href: "/history",
      icon: History,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col">
        <div className="h-12 border-b flex items-center px-4">
          <Brand />
          <span className="ml-2 text-micro text-muted-foreground">Labs</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="size-4" />
                <span>{item.name}</span>
              </a>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <Separator className="mb-4" />
          <Button
            variant="ghost"
            className="w-full justify-start"
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
            {(resolvedTheme ?? theme) === "dark" ? <Sun className="size-4 mr-2" /> : <Moon className="size-4 mr-2" />}
            Toggle Theme
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header for Main Content */}
        <header className="h-12 border-b flex items-center justify-between px-5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-2">
            {/* Breadcrumbs or active section title */}
            <h1 className="text-lg font-semibold capitalize">{pathname.substring(1) || "Home"}</h1>
          </div>
          {/* Other global actions can go here */}
        </header>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function RootWrapper({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </NotificationProvider>
  );
}
