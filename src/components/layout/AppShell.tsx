"use client";

import React, { useState, ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { MobileNav } from "./MobileNav";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 antialiased">
      {/* Skip to Main Content Link for Keyboard and Screen Reader Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-xl focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white cursor-pointer"
      >
        Skip to main content
      </a>

      {/* Desktop Persistent Sidebar (1024px+) */}
      <Sidebar className="hidden lg:flex w-64 shrink-0 sticky top-0 h-screen" />

      {/* Mobile / Tablet Collapsible Navigation Drawer (< 1024px) */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Navbar
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
          isMobileNavOpen={isMobileNavOpen}
        />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8 outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppShell;
