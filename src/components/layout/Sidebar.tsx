"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  DashboardIcon,
  DoctorsIcon,
  PatientsIcon,
  LogoutIcon,
  UserIcon,
} from "./NavIcons";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  exact?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: DashboardIcon,
    exact: true,
  },
  {
    name: "Doctors",
    href: "/dashboard/doctors",
    icon: DoctorsIcon,
  },
  {
    name: "Patients",
    href: "/dashboard/patients",
    icon: PatientsIcon,
  },
];

interface SidebarProps {
  onNavigate?: () => void;
  className?: string;
}

export function Sidebar({ onNavigate, className = "" }: SidebarProps) {
  const pathname = usePathname();
  const { admin, logout } = useAuth();

  const isItemActive = (item: NavItem): boolean => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <aside
      className={`flex flex-col justify-between border-r border-slate-800 bg-slate-900/95 text-slate-100 ${className}`}
      aria-label="Main Application Sidebar"
    >
      {/* Top Header & Branding */}
      <div>
        <div className="flex h-16 items-center border-b border-slate-800/80 px-6">
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="flex items-center space-x-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-md shadow-blue-600/30 text-base">
              DT
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white block leading-tight">
                Doctor Tracker
              </span>
              <span className="text-[11px] font-medium text-slate-400 block leading-none">
                Admin Management
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav
          className="mt-6 space-y-1.5 px-4"
          aria-label="Sidebar Navigation"
        >
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`group flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer ${
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 font-semibold"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                }`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 transition-colors ${
                    active ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                  }`}
                  aria-hidden="true"
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Identity & Logout at Bottom */}
      <div className="border-t border-slate-800/80 p-4">
        <div className="flex items-center justify-between rounded-xl bg-slate-950/60 p-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-300">
              <UserIcon className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-200">
                {admin?.name || "System Admin"}
              </p>
              <p className="truncate text-[11px] text-slate-400 font-mono">
                {admin?.email || "admin@example.com"}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            type="button"
            title="Log Out"
            aria-label="Log Out of Admin Portal"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-700/60 text-slate-400 transition-colors hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer"
          >
            <LogoutIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
