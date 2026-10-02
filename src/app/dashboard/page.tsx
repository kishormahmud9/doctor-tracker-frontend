"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { dashboardService } from "@/services/dashboard.service";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { PatientsPerDoctorChart } from "@/components/dashboard/PatientsPerDoctorChart";
import { DateStatisticsChart } from "@/components/dashboard/DateStatisticsChart";
import { DateRangeFilter, type DateRange } from "@/components/dashboard/DateRangeFilter";
import { ApiClientError } from "@/lib/api";
import type {
  DashboardSummary,
  PatientsPerDoctor,
  DateStatistics,
} from "@/types";

export default function DashboardPage() {
  const { admin, token } = useAuth();

  // Filter states
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: "",
    endDate: "",
  });
  const [groupBy, setGroupBy] = useState<"day" | "month">("day");

  // Summary State
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Patients Per Doctor State
  const [patientsPerDoctor, setPatientsPerDoctor] = useState<PatientsPerDoctor | null>(null);
  const [ppdLoading, setPpdLoading] = useState(true);
  const [ppdError, setPpdError] = useState<string | null>(null);

  // Date Statistics State
  const [dateStatistics, setDateStatistics] = useState<DateStatistics | null>(null);
  const [dateStatsLoading, setDateStatsLoading] = useState(true);
  const [dateStatsError, setDateStatsError] = useState<string | null>(null);

  // Stale request tracking
  const fetchSummaryIdRef = useRef(0);
  const fetchDateStatsIdRef = useRef(0);
  const fetchPpdIdRef = useRef(0);

  /**
   * Fetch Summary metrics with current date filter
   */
  const fetchSummary = useCallback(
    async (rangeToUse = dateRange) => {
      const fetchId = ++fetchSummaryIdRef.current;
      setSummaryLoading(true);
      setSummaryError(null);

      try {
        const query = {
          startDate: rangeToUse.startDate.trim() || undefined,
          endDate: rangeToUse.endDate.trim() || undefined,
        };
        const data = await dashboardService.getSummary(query, token);
        if (fetchId === fetchSummaryIdRef.current) {
          setSummary(data);
        }
      } catch (err: unknown) {
        if (fetchId === fetchSummaryIdRef.current) {
          const msg =
            err instanceof ApiClientError
              ? err.message
              : err instanceof Error
              ? err.message
              : "Failed to retrieve summary metrics";
          setSummaryError(msg);
        }
      } finally {
        if (fetchId === fetchSummaryIdRef.current) {
          setSummaryLoading(false);
        }
      }
    },
    [dateRange, token]
  );

  /**
   * Fetch Patients per Doctor distribution metrics
   */
  const fetchPatientsPerDoctor = useCallback(async () => {
    const fetchId = ++fetchPpdIdRef.current;
    setPpdLoading(true);
    setPpdError(null);

    try {
      const data = await dashboardService.getPatientsPerDoctor(token);
      if (fetchId === fetchPpdIdRef.current) {
        setPatientsPerDoctor(data);
      }
    } catch (err: unknown) {
      if (fetchId === fetchPpdIdRef.current) {
        const msg =
          err instanceof ApiClientError
            ? err.message
            : err instanceof Error
            ? err.message
            : "Failed to retrieve doctor workload distribution";
        setPpdError(msg);
      }
    } finally {
      if (fetchId === fetchPpdIdRef.current) {
        setPpdLoading(false);
      }
    }
  }, [token]);

  /**
   * Fetch Date Statistics time-series
   */
  const fetchDateStatistics = useCallback(
    async (rangeToUse = dateRange, groupToUse = groupBy) => {
      const fetchId = ++fetchDateStatsIdRef.current;
      setDateStatsLoading(true);
      setDateStatsError(null);

      try {
        const query = {
          startDate: rangeToUse.startDate.trim() || undefined,
          endDate: rangeToUse.endDate.trim() || undefined,
          groupBy: groupToUse,
        };
        const data = await dashboardService.getDateStatistics(query, token);
        if (fetchId === fetchDateStatsIdRef.current) {
          setDateStatistics(data);
        }
      } catch (err: unknown) {
        if (fetchId === fetchDateStatsIdRef.current) {
          const msg =
            err instanceof ApiClientError
              ? err.message
              : err instanceof Error
              ? err.message
              : "Failed to retrieve registration timeline statistics";
          setDateStatsError(msg);
        }
      } finally {
        if (fetchId === fetchDateStatsIdRef.current) {
          setDateStatsLoading(false);
        }
      }
    },
    [dateRange, groupBy, token]
  );

  /**
   * Master refetch all endpoints concurrently using Promise.allSettled
   */
  const refreshAll = useCallback(() => {
    void Promise.allSettled([
      fetchSummary(),
      fetchPatientsPerDoctor(),
      fetchDateStatistics(),
    ]);
  }, [fetchSummary, fetchPatientsPerDoctor, fetchDateStatistics]);

  /**
   * Initial load and reactive trigger on dateRange or groupBy changes
   */
  useEffect(() => {
    let isCancelled = false;

    const runLoad = async () => {
      await Promise.resolve();
      if (isCancelled) return;
      void Promise.allSettled([
        fetchSummary(dateRange),
        fetchDateStatistics(dateRange, groupBy),
      ]);
    };

    void runLoad();

    return () => {
      isCancelled = true;
    };
  }, [dateRange, groupBy, fetchSummary, fetchDateStatistics]);

  /**
   * Fetch patients-per-doctor on mount and when token updates
   */
  useEffect(() => {
    let isCancelled = false;

    const runLoadPpd = async () => {
      await Promise.resolve();
      if (isCancelled) return;
      void fetchPatientsPerDoctor();
    };

    void runLoadPpd();

    return () => {
      isCancelled = true;
    };
  }, [token, fetchPatientsPerDoctor]);

  // Handle Date Filter Apply
  const handleApplyRange = (range: DateRange) => {
    setDateRange(range);
  };

  // Handle Date Filter Reset
  const handleResetRange = () => {
    setDateRange({ startDate: "", endDate: "" });
  };

  // Handle GroupBy toggle
  const handleGroupByChange = (newGroupBy: "day" | "month") => {
    setGroupBy(newGroupBy);
  };

  // Partial failure detection
  const errorCount = [summaryError, ppdError, dateStatsError].filter(Boolean).length;
  const isAnyLoading = summaryLoading || ppdLoading || dateStatsLoading;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header / Welcome Banner */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              <span>Real-time Analytics Dashboard</span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Welcome, {admin?.name || "Administrator"}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Monitor key healthcare metrics, doctor workloads, and patient registration trends across the system.
            </p>
          </div>

          <div className="flex items-center space-x-3 self-start md:self-auto">
            <button
              type="button"
              onClick={refreshAll}
              disabled={isAnyLoading}
              className="inline-flex items-center space-x-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-700 hover:border-slate-600 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <svg
                className={`h-4 w-4 ${isAnyLoading ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
              <span>{isAnyLoading ? "Refreshing..." : "Refresh Data"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Partial Failure Notice (if one or more calls fail while others succeed) */}
      {errorCount > 0 && (
        <aside
          aria-label="Analytics sync notice"
          className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-2">
              <svg
                className="h-5 w-5 shrink-0 text-amber-400 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
              <div>
                <p className="font-semibold text-amber-200">
                  Partial Data Sync Notice ({errorCount} {errorCount === 1 ? "section" : "sections"} failed)
                </p>
                <p className="mt-0.5 text-amber-300/90">
                  Some analytics components could not be updated. Other sections are displaying verified live data.
                  Use the individual retry buttons or the button below to re-attempt loading.
                </p>
              </div>
            </div>
            <button
              onClick={refreshAll}
              className="shrink-0 rounded-lg bg-amber-600 px-3 py-1 font-semibold text-white hover:bg-amber-500 transition-colors cursor-pointer"
            >
              Retry Failed
            </button>
          </div>
        </aside>
      )}

      {/* Date Range Filter */}
      <DateRangeFilter
        initialRange={dateRange}
        onApply={handleApplyRange}
        onReset={handleResetRange}
        isLoading={summaryLoading || dateStatsLoading}
      />

      {/* Summary KPI Cards */}
      <SummaryCards
        summary={summary}
        isLoading={summaryLoading}
        error={summaryError}
        onRetry={() => fetchSummary()}
      />

      {/* Analytics Visualizations Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Patients Per Doctor Distribution */}
        <PatientsPerDoctorChart
          data={patientsPerDoctor}
          isLoading={ppdLoading}
          error={ppdError}
          onRetry={fetchPatientsPerDoctor}
        />

        {/* Date Statistics Timeline */}
        <DateStatisticsChart
          data={dateStatistics}
          isLoading={dateStatsLoading}
          error={dateStatsError}
          groupBy={groupBy}
          onGroupByChange={handleGroupByChange}
          onRetry={() => fetchDateStatistics()}
        />
      </div>

      {/* Navigation Quick Links */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
        <Link
          href="/dashboard/doctors"
          className="group flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition-all hover:border-slate-700 hover:bg-slate-900/90 cursor-pointer"
        >
          <div className="flex items-center space-x-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 group-hover:scale-105 transition-transform">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                Manage Doctors Directory
              </h4>
              <p className="text-xs text-slate-400">
                Register new doctors, update profiles, and manage specializations
              </p>
            </div>
          </div>
          <span className="text-slate-500 group-hover:text-white transition-colors">→</span>
        </Link>

        <Link
          href="/dashboard/patients"
          className="group flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition-all hover:border-slate-700 hover:bg-slate-900/90 cursor-pointer"
        >
          <div className="flex items-center space-x-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400 group-hover:scale-105 transition-transform">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.199l-.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                Manage Patient Records
              </h4>
              <p className="text-xs text-slate-400">
                Register patients, assign attending physicians, and view clinical history
              </p>
            </div>
          </div>
          <span className="text-slate-500 group-hover:text-white transition-colors">→</span>
        </Link>
      </section>
    </div>
  );
}
