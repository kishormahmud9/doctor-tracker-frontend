"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { MenuIcon, LogoutIcon } from "./NavIcons";

interface NavbarProps {
  onOpenMobileNav: () => void;
  isMobileNavOpen: boolean;
}

export function Navbar({ onOpenMobileNav, isMobileNavOpen }: NavbarProps) {
  const pathname = usePathname();
  const { admin, logout } = useAuth();

  const getPageTitle = (): { title: string; category: string } => {
    if (pathname === "/dashboard") {
      return { title: "Dashboard Overview", category: "Analytics & Metrics" };
    }
    if (pathname.startsWith("/dashboard/doctors")) {
      return { title: "Doctors Management", category: "Healthcare Providers" };
    }
    if (pathname.startsWith("/dashboard/patients")) {
      return { title: "Patients Management", category: "Patient Records" };
    }
    return { title: "Doctor Tracker", category: "Administration" };
  };

  const { title, category } = getPageTitle();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          aria-expanded={isMobileNavOpen}
          aria-controls="mobile-sidebar-drawer"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:hidden cursor-pointer"
        >
          <MenuIcon className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Page Title & Breadcrumb */}
        <div>
          <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none">
            {title}
          </h1>
          <span className="text-[11px] font-medium text-slate-400 block mt-0.5 leading-none">
            {category}
          </span>
        </div>
      </div>

      {/* Right: Status Pill & Logout Action */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Active Session Indicator */}
        <div className="hidden sm:inline-flex items-center space-x-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active Session</span>
        </div>

        {/* Admin Name & Email */}
        <div className="hidden md:block text-right">
          <span className="block text-xs font-semibold text-slate-200">
            {admin?.name || "Administrator"}
          </span>
          <span className="block text-[11px] text-slate-400 font-mono">
            {admin?.email || "admin@example.com"}
          </span>
        </div>

        {/* Header Quick Logout Button */}
        <button
          onClick={logout}
          type="button"
          className="flex items-center space-x-1.5 rounded-xl border border-slate-700/80 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer"
          title="Sign out of Doctor Tracker"
        >
          <LogoutIcon className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden xs:inline sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}

export default Navbar;
