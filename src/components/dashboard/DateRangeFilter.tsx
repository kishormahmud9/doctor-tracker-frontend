"use client";

import React, { useState } from "react";

export interface DateRange {
  startDate: string;
  endDate: string;
}

interface DateRangeFilterProps {
  initialRange?: DateRange;
  onApply: (range: DateRange) => void;
  onReset: () => void;
  isLoading?: boolean;
}

// Utility to format Date to YYYY-MM-DD
function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DateRangeFilter({
  initialRange,
  onApply,
  onReset,
  isLoading = false,
}: DateRangeFilterProps) {
  const [startDate, setStartDate] = useState(initialRange?.startDate || "");
  const [endDate, setEndDate] = useState(initialRange?.endDate || "");
  const [validationError, setValidationError] = useState<string | null>(null);

  const isApplied = Boolean(startDate || endDate);

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (val && endDate && val > endDate) {
      setValidationError("Start date cannot be after end date.");
    } else {
      setValidationError(null);
    }
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    if (startDate && val && startDate > val) {
      setValidationError("Start date cannot be after end date.");
    } else {
      setValidationError(null);
    }
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (startDate && endDate && startDate > endDate) {
      setValidationError("Start date cannot be after end date.");
      return;
    }
    setValidationError(null);
    onApply({ startDate, endDate });
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setValidationError(null);
    onReset();
  };

  const applyPreset = (days: number | "year") => {
    const end = new Date();
    let start: Date;

    if (days === "year") {
      start = new Date(end.getFullYear(), 0, 1);
    } else {
      start = new Date();
      start.setDate(end.getDate() - days);
    }

    const startStr = formatDate(start);
    const endStr = formatDate(end);

    setStartDate(startStr);
    setEndDate(endStr);
    setValidationError(null);
    onApply({ startDate: startStr, endDate: endStr });
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Title and Active Status */}
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Date Range Filter
            </h3>
            {isApplied && (
              <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mr-1.5 animate-pulse" />
                Active Filter
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Filter summary metrics and registration timelines across doctors and patients
          </p>
        </div>

        {/* Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-400 mr-1">Presets:</span>
          <button
            type="button"
            onClick={() => applyPreset(7)}
            disabled={isLoading}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            7 Days
          </button>
          <button
            type="button"
            onClick={() => applyPreset(30)}
            disabled={isLoading}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            30 Days
          </button>
          <button
            type="button"
            onClick={() => applyPreset(90)}
            disabled={isLoading}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            90 Days
          </button>
          <button
            type="button"
            onClick={() => applyPreset("year")}
            disabled={isLoading}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            This Year
          </button>
        </div>
      </div>

      {/* Date Input Form */}
      <form onSubmit={handleApply} className="mt-4 pt-4 border-t border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label
              htmlFor="dashboard-start-date"
              className="block text-xs font-medium text-slate-400 mb-1"
            >
              Start Date
            </label>
            <input
              id="dashboard-start-date"
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              disabled={isLoading}
              max={endDate || undefined}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex-1">
            <label
              htmlFor="dashboard-end-date"
              className="block text-xs font-medium text-slate-400 mb-1"
            >
              End Date
            </label>
            <input
              id="dashboard-end-date"
              type="date"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              disabled={isLoading}
              min={startDate || undefined}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex items-center space-x-2 pt-1 sm:pt-0">
            <button
              type="submit"
              disabled={isLoading || Boolean(validationError)}
              className="flex-1 sm:flex-none rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-500 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? "Loading..." : "Apply Range"}
            </button>

            {isApplied && (
              <button
                type="button"
                onClick={handleReset}
                disabled={isLoading}
                className="flex-1 sm:flex-none rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Validation Error Message */}
        {validationError && (
          <div className="mt-2.5 flex items-center space-x-1.5 text-xs text-red-400">
            <svg
              className="h-4 w-4 shrink-0"
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
            <span>{validationError}</span>
          </div>
        )}
      </form>
    </div>
  );
}

export default DateRangeFilter;
