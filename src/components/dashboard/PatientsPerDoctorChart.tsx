"use client";

import React, { useState } from "react";
import type { PatientsPerDoctor } from "@/types";

interface PatientsPerDoctorChartProps {
  data: PatientsPerDoctor | null;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
}

export function PatientsPerDoctorChart({
  data,
  isLoading,
  error,
  onRetry,
}: PatientsPerDoctorChartProps) {
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="h-5 w-48 bg-slate-800 rounded animate-pulse" />
          <div className="h-8 w-24 bg-slate-800 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-4 py-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2 animate-pulse">
              <div className="flex justify-between">
                <div className="h-3 w-32 bg-slate-800 rounded" />
                <div className="h-3 w-16 bg-slate-800 rounded" />
              </div>
              <div className="h-4 w-full bg-slate-800 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
        <div className="flex items-center justify-center space-x-2 text-red-400 font-semibold text-sm">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <span>Failed to load patients per doctor analytics</span>
        </div>
        <p className="mt-1 text-xs text-red-300">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 rounded-xl bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Retry Chart
          </button>
        )}
      </div>
    );
  }

  if (!data || !data.doctors) return null;

  const { doctors, totalDoctors } = data;
  const maxPatients = Math.max(...doctors.map((d) => d.patientCount), 1);

  return (
    <section
      aria-labelledby="patients-per-doctor-heading"
      className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-sm"
    >
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4 gap-3">
        <div>
          <h3
            id="patients-per-doctor-heading"
            className="text-base font-bold text-white tracking-tight sm:text-lg"
          >
            Patients Distribution Per Doctor
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Workload distribution across {totalDoctors} registered doctors (includes zero-patient doctors)
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-1.5 rounded-xl border border-slate-800 bg-slate-950 p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("chart")}
            aria-pressed={viewMode === "chart"}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
              viewMode === "chart"
                ? "bg-blue-600 text-white font-semibold shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Chart View
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            aria-pressed={viewMode === "table"}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
              viewMode === "table"
                ? "bg-blue-600 text-white font-semibold shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Data Table
          </button>
        </div>
      </div>

      {/* Body Content */}
      {doctors.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          No doctor workload records available. Register doctors and assign patients to view distribution.
        </div>
      ) : viewMode === "chart" ? (
        /* Accessible Responsive Bar Chart */
        <div
          role="img"
          aria-label="Bar chart showing patient counts per doctor"
          className="mt-6 space-y-4 max-h-[460px] overflow-y-auto pr-1"
        >
          {doctors.map((doc) => {
            const percentage = Math.round((doc.patientCount / maxPatients) * 100);
            return (
              <div key={doc.doctorId} className="group rounded-xl p-2.5 transition-colors hover:bg-slate-800/40">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs gap-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {doc.doctorName}
                    </span>
                    <span className="inline-flex rounded-md bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 border border-slate-700">
                      {doc.specialization}
                    </span>
                    <span className="hidden md:inline text-[11px] text-slate-500">
                      • {doc.hospital}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 font-mono text-xs">
                    <span className="font-bold text-white">
                      {doc.patientCount}{" "}
                      <span className="text-[11px] font-normal text-slate-400">
                        {doc.patientCount === 1 ? "patient" : "patients"}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Progress Fill Bar */}
                <div className="mt-2 h-3 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800/80">
                  <div
                    style={{ width: `${Math.max(percentage, doc.patientCount > 0 ? 3 : 0)}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      doc.patientCount === 0
                        ? "bg-slate-800"
                        : percentage > 75
                        ? "bg-gradient-to-r from-blue-600 to-indigo-500"
                        : "bg-gradient-to-r from-blue-600 to-cyan-500"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Accessible Data Table Alternative */
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th scope="col" className="px-4 py-3">Doctor Name</th>
                <th scope="col" className="px-4 py-3">Specialization</th>
                <th scope="col" className="px-4 py-3">Hospital</th>
                <th scope="col" className="px-4 py-3 text-right">Patients Assigned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {doctors.map((doc) => (
                <tr key={doc.doctorId} className="hover:bg-slate-800/30">
                  <td className="px-4 py-2.5 font-sans font-medium text-white">{doc.doctorName}</td>
                  <td className="px-4 py-2.5 font-sans">{doc.specialization}</td>
                  <td className="px-4 py-2.5 font-sans text-slate-400">{doc.hospital}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-white">
                    {doc.patientCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default PatientsPerDoctorChart;
