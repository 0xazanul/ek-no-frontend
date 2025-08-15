"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/brand";
import { useTheme } from "next-themes";
import { Sun, Moon, ArrowRight, Shield, Eye, Layers, Cpu, Terminal, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Joyride, { CallBackProps, Step } from "react-joyride";
import { useEffect, useState } from "react";

const ONBOARDING_KEY = "qasly_onboarding_complete";

const onboardingSteps: Step[] = [
  {
    target: "body",
    placement: "center",
    title: "Welcome to Qasly Labs!",
    content: "This interactive tour will guide you through the main features.",
    disableBeacon: true,
  },
  {
    target: ".sidebar, aside, nav[role='navigation']",
    title: "Navigation Sidebar",
    content: "Use the sidebar to access the code editor, audit reports, chat, and settings.",
    placement: "right",
  },
  {
    target: ".CodeEditor, .monaco-editor",
    title: "Code Editor",
    content: "Edit and review your code here. Security findings will be highlighted inline.",
    placement: "top",
  },
  {
    target: ".AuditPanel, .audit-panel",
    title: "Audit Panel",
    content: "View AI-generated security audit results and rich visualizations here.",
    placement: "left",
  },
  {
    target: ".SettingsSheet, .settings-sheet",
    title: "Settings",
    content: "Configure integrations, API keys, and preferences in the settings panel.",
    placement: "left",
  },
];

function OnboardingTour() {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(ONBOARDING_KEY)) {
      setRun(true);
    }
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, type } = data;
    if (status === "finished" || status === "skipped") {
      setRun(false);
      localStorage.setItem(ONBOARDING_KEY, "1");
    } else if (typeof index === "number") {
      setStepIndex(index);
    }
  };

  return (
    <Joyride
      steps={onboardingSteps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showSkipButton
      showProgress
      disableScrolling
      styles={{ options: { zIndex: 9999 } }}
      callback={handleJoyrideCallback}
    />
  );
}

type HomepageProps = {
  onEnterEditor: () => void;
};

export function Homepage({ onEnterEditor }: HomepageProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isVisible, setIsVisible] = React.useState(false);
  const [scrollY, setScrollY] = React.useState(0);
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    setIsVisible(true);
    
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <>
      <OnboardingTour />
      <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-background via-background to-muted/10 relative">
      {/* Animated Background */}
      <div 
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.06), transparent 40%)`
        }}
      />
      
      {/* Floating Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute size-2 bg-primary/20 rounded-full animate-pulse"
            style={{
              left: `${20 + i * 15}%`,
              top: `${10 + i * 12}%`,
              animationDelay: `${i * 0.5}s`,
              transform: `translateY(${scrollY * (0.1 + i * 0.05)}px)`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="sticky top-0 z-50 h-12 border-b flex items-center justify-between px-5 bg-background/80 backdrop-blur-xl">
        <Brand className="text-[13.5px] font-semibold tracking-[-0.02em]" />
        <button
          aria-label="Toggle theme"
          className="h-8 w-8 rounded-full border flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
          onClick={() => {
            const next = (resolvedTheme ?? theme) === "dark" ? "light" : "dark";
            setTheme(next);
          }}
        >
          {(resolvedTheme ?? theme) === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
      </div>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-5 relative">
        <div className={cn(
          "max-w-6xl mx-auto text-center space-y-12 transition-all duration-1500",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
        )}>
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border bg-muted/30 backdrop-blur-sm text-sm font-medium hover:bg-muted/50 transition-all duration-500">
              <Sparkles className="size-4 animate-pulse" />
              Next-Generation Security Intelligence
            </div>
            
            <h1 className="text-5xl md:text-8xl font-bold tracking-tighter leading-none">
              Find vulnerabilities
              <br />
              <span className="bg-gradient-to-r from-muted-foreground to-muted-foreground/60 bg-clip-text text-transparent">
                before they find you
              </span>
            </h1>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent blur-3xl" />
              <blockquote className="relative text-2xl md:text-4xl font-light italic leading-relaxed max-w-4xl mx-auto">
                <span className="text-6xl text-muted-foreground/40 absolute -top-4 -left-4">&ldquo;</span>
                There are vulnerabilities in the code that is written and in the code that has not been written.
                <span className="text-6xl text-muted-foreground/40 absolute -bottom-8 -right-4">&rdquo;</span>
              </blockquote>
            </div>
          </div>

          <div className="pt-12 flex justify-center">
            <Button
              size="lg"
              onClick={onEnterEditor}
              className="h-16 px-12 text-lg font-semibold rounded-full shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-110 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 group"
            >
              Launch Security Analysis
              <ArrowRight className="size-6 ml-3 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </section>


      {/* Impact Section */}
      <section className="py-32 px-5 bg-gradient-to-b from-transparent to-muted/20">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-12">Unprecedented Impact</h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <ImpactCard
              number="99.7%"
              label="Vulnerability Detection Rate"
              description="Catches what others miss"
            />
            <ImpactCard
              number="<0.3s"
              label="Analysis Speed"
              description="Real-time security insights"
            />
            <ImpactCard
              number="∞"
              label="Learning Capability"
              description="Continuously evolving intelligence"
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent blur-2xl" />
            <p className="relative text-2xl md:text-3xl font-light max-w-4xl mx-auto leading-relaxed">
              Every line of code tells a story. We help you write a secure ending.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-5 border-t bg-muted/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <Lock className="size-6 text-primary" />
              <div>
                <div className="font-semibold text-lg">Independent Security Research Lab</div>
                <div className="text-sm text-muted-foreground">Advancing the science of secure code</div>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground text-center md:text-right">
              <div>Powered by advanced AI research</div>
              <div className="mt-1">© 2024 Qasly Labs. Securing the future.</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}

function CapabilityItem({ 
  icon, 
  title, 
  description,
  delay = 0
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = React.useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  return (
    <div className={cn(
      "flex gap-6 p-6 rounded-2xl border bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-all duration-700 hover:scale-105 hover:shadow-2xl",
      isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
    )}>
      <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-xl mb-3">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function ImpactCard({ 
  number, 
  label, 
  description 
}: { 
  number: string; 
  label: string; 
  description: string; 
}) {
  return (
    <div className="p-8 rounded-3xl border bg-card/20 backdrop-blur-sm hover:bg-card/40 transition-all duration-500 hover:scale-105 hover:shadow-2xl group">
      <div className="text-4xl md:text-6xl font-black mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent group-hover:from-primary/80 group-hover:to-primary transition-all duration-500">
        {number}
      </div>
      <h3 className="font-bold text-lg mb-2">{label}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function TrustMetric({ 
  number, 
  label, 
  description 
}: { 
  number: string; 
  label: string; 
  description: string; 
}) {
  return (
    <div className="text-center p-6 rounded-2xl border bg-card/10 backdrop-blur-sm hover:bg-card/20 transition-all duration-300 group">
      <div className="text-2xl md:text-3xl font-bold mb-2 text-primary group-hover:scale-110 transition-transform duration-300">
        {number}
      </div>
      <h3 className="font-semibold mb-1">{label}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
