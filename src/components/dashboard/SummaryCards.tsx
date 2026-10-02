"use client";

import React from "react";
import { DoctorsIcon, PatientsIcon } from "@/components/layout/NavIcons";
import type { DashboardSummary } from "@/types";

interface SummaryCardsProps {
  summary: DashboardSummary | null;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
}

export function SummaryCards({
  summary,
  isLoading,
  error,
  onRetry,
}: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 bg-slate-800 rounded-lg" />
              <div className="h-10 w-10 bg-slate-800 rounded-xl" />
            </div>
            <div className="h-8 w-20 bg-slate-800 rounded-lg" />
            <div className="h-3 w-36 bg-slate-800/80 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
        <div className="flex items-center justify-center space-x-2 text-red-400 font-semibold text-sm">
          <svg
            className="h-5 w-5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
          <span>Failed to load summary metrics</span>
        </div>
        <p className="mt-1 text-xs text-red-300">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 rounded-xl bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Retry Summary
          </button>
        )}
      </div>
    );
  }

  if (!summary) return null;

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const hasRange = Boolean(summary.range);

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {/* Total Doctors Card */}
      <div className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-sm transition-all hover:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Doctors
          </span>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600/15 text-blue-400 shadow-inner group-hover:scale-105 transition-transform">
            <DoctorsIcon className="h-6 w-6" aria-hidden="true" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold tracking-tight text-white">
            {formatNumber(summary.totalDoctors)}
          </span>
          <span className="text-xs text-slate-400">practitioners</span>
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          Registered medical professionals in system
        </p>

        {hasRange && summary.range && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">In selected date range:</span>
            <span className="font-semibold text-blue-400">
              +{formatNumber(summary.range.doctorsInRange)} new
            </span>
          </div>
        )}
      </div>

      {/* Total Patients Card */}
      <div className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-sm transition-all hover:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Patients
          </span>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600/15 text-emerald-400 shadow-inner group-hover:scale-105 transition-transform">
            <PatientsIcon className="h-6 w-6" aria-hidden="true" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold tracking-tight text-white">
            {formatNumber(summary.totalPatients)}
          </span>
          <span className="text-xs text-slate-400">records</span>
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          Active patient clinical files and assignments
        </p>

        {hasRange && summary.range && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">In selected date range:</span>
            <span className="font-semibold text-emerald-400">
              +{formatNumber(summary.range.patientsInRange)} new
            </span>
          </div>
        )}
      </div>

      {/* Average Patients per Doctor Card */}
      <div className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-sm transition-all hover:border-slate-700 sm:col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Patients / Doctor Ratio
          </span>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-600/15 text-purple-400 shadow-inner group-hover:scale-105 transition-transform">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
              />
            </svg>
          </div>
        </div>
        <div className="mt-4 flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold tracking-tight text-white">
            {summary.averagePatientsPerDoctor.toFixed(2)}
          </span>
          <span className="text-xs text-slate-400">avg patients</span>
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          Workload balance across active doctors
        </p>

        {hasRange && summary.range && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Range:</span>
            <span className="font-mono text-slate-300">
              {summary.range.startDate || "Start"} → {summary.range.endDate || "Present"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default SummaryCards;
