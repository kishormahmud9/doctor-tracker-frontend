"use client";

import React, { useState } from "react";
import type { DateStatistics, DateStatisticsPoint } from "@/types";

interface DateStatisticsChartProps {
  data: DateStatistics | null;
  isLoading: boolean;
  error: string | null;
  groupBy: "day" | "month";
  onGroupByChange: (groupBy: "day" | "month") => void;
  onRetry?: () => void;
}

export function DateStatisticsChart({
  data,
  isLoading,
  error,
  groupBy,
  onGroupByChange,
  onRetry,
}: DateStatisticsChartProps) {
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [hoveredPoint, setHoveredPoint] = useState<DateStatisticsPoint | null>(null);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4 gap-3 animate-pulse">
          <div className="h-5 w-52 bg-slate-800 rounded" />
          <div className="flex space-x-2">
            <div className="h-8 w-24 bg-slate-800 rounded-lg" />
            <div className="h-8 w-24 bg-slate-800 rounded-lg" />
          </div>
        </div>
        <div className="h-64 w-full bg-slate-800/40 rounded-xl animate-pulse flex items-center justify-center">
          <span className="text-xs text-slate-500 font-mono">Loading timeline data...</span>
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
          <span>Failed to load registration date statistics</span>
        </div>
        <p className="mt-1 text-xs text-red-300">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 rounded-xl bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Retry Timeline
          </button>
        )}
      </div>
    );
  }

  if (!data) return null;

  const { timeline, summary } = data;
  const maxVal = Math.max(
    ...timeline.map((p) => Math.max(p.doctorsCreated, p.patientsCreated)),
    5
  );

  // SVG dimensions
  const svgWidth = 720;
  const svgHeight = 260;
  const paddingX = 45;
  const paddingY = 30;
  const graphWidth = svgWidth - paddingX * 2;
  const graphHeight = svgHeight - paddingY * 2;

  // Coordinate computation helpers
  const getX = (index: number): number => {
    if (timeline.length <= 1) return paddingX + graphWidth / 2;
    return paddingX + (index / (timeline.length - 1)) * graphWidth;
  };

  const getY = (val: number): number => {
    return paddingY + graphHeight - (val / maxVal) * graphHeight;
  };

  // Build SVG path strings
  const doctorsPoints = timeline.map((p, i) => `${getX(i)},${getY(p.doctorsCreated)}`).join(" ");
  const patientsPoints = timeline.map((p, i) => `${getX(i)},${getY(p.patientsCreated)}`).join(" ");

  const doctorsArea =
    timeline.length > 0
      ? `M ${getX(0)},${paddingY + graphHeight} ` +
        timeline.map((p, i) => `L ${getX(i)},${getY(p.doctorsCreated)}`).join(" ") +
        ` L ${getX(timeline.length - 1)},${paddingY + graphHeight} Z`
      : "";

  const patientsArea =
    timeline.length > 0
      ? `M ${getX(0)},${paddingY + graphHeight} ` +
        timeline.map((p, i) => `L ${getX(i)},${getY(p.patientsCreated)}`).join(" ") +
        ` L ${getX(timeline.length - 1)},${paddingY + graphHeight} Z`
      : "";

  return (
    <section
      aria-labelledby="date-statistics-heading"
      className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-sm"
    >
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3
              id="date-statistics-heading"
              className="text-base font-bold text-white tracking-tight sm:text-lg"
            >
              Registration Trends Over Time
            </h3>
            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-400">
              {summary.timezone}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Comparative analysis of Doctor registrations vs. Patient intakes
          </p>
        </div>

        {/* Controls: GroupBy & ViewMode */}
        <div className="flex flex-wrap items-center gap-2">
          {/* GroupBy Pill */}
          <div className="flex items-center space-x-1 rounded-xl border border-slate-800 bg-slate-950 p-1">
            <button
              type="button"
              onClick={() => onGroupByChange("day")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                groupBy === "day"
                  ? "bg-slate-800 text-white font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Daily
            </button>
            <button
              type="button"
              onClick={() => onGroupByChange("month")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                groupBy === "month"
                  ? "bg-slate-800 text-white font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-1 rounded-xl border border-slate-800 bg-slate-950 p-1">
            <button
              type="button"
              onClick={() => setViewMode("chart")}
              aria-pressed={viewMode === "chart"}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                viewMode === "chart"
                  ? "bg-blue-600 text-white font-semibold shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Chart
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              aria-pressed={viewMode === "table"}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-blue-600 text-white font-semibold shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Range Metadata Summary Badges */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center space-x-2 rounded-xl bg-blue-500/10 px-3 py-1.5 border border-blue-500/20 text-xs">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span className="text-slate-400">Doctors In Range:</span>
          <span className="font-bold text-blue-400">+{summary.totalDoctorsInRange}</span>
        </div>
        <div className="flex items-center space-x-2 rounded-xl bg-emerald-500/10 px-3 py-1.5 border border-emerald-500/20 text-xs">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-slate-400">Patients In Range:</span>
          <span className="font-bold text-emerald-400">+{summary.totalPatientsInRange}</span>
        </div>
        {hoveredPoint && (
          <div className="ml-auto text-xs font-mono text-slate-300 bg-slate-950 border border-slate-800 px-3 py-1 rounded-lg">
            <span className="text-slate-500">{hoveredPoint.date}:</span>{" "}
            <span className="text-blue-400 font-semibold">{hoveredPoint.doctorsCreated} doctors</span>,{" "}
            <span className="text-emerald-400 font-semibold">{hoveredPoint.patientsCreated} patients</span>
          </div>
        )}
      </div>

      {/* Main Visual or Table Area */}
      {timeline.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-400 mb-3">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.253M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-slate-300">No registration activity found</p>
          <p className="mt-1 text-xs text-slate-500">
            No doctors or patients were registered within the selected time window. Try adjusting the date range.
          </p>
        </div>
      ) : viewMode === "chart" ? (
        <div
          role="img"
          aria-label="Interactive timeline chart plotting doctors and patients registration numbers over time"
          className="mt-6 w-full overflow-x-auto"
        >
          <div className="min-w-[620px]">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = paddingY + graphHeight * (1 - pct);
                const labelVal = Math.round(maxVal * pct);
                return (
                  <g key={i}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={paddingX + graphWidth}
                      y2={y}
                      stroke="#334155"
                      strokeDasharray="4 4"
                      strokeWidth={1}
                      strokeOpacity={0.6}
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 4}
                      fill="#64748b"
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {labelVal}
                    </text>
                  </g>
                );
              })}

              {/* Area Fills */}
              <path d={patientsArea} fill="url(#emeraldGradient)" />
              <path d={doctorsArea} fill="url(#blueGradient)" />

              {/* Line Paths */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={patientsPoints}
              />
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={doctorsPoints}
              />

              {/* Data Interactive Nodes and X-axis Labels */}
              {timeline.map((point, index) => {
                const x = getX(index);
                const yDoc = getY(point.doctorsCreated);
                const yPat = getY(point.patientsCreated);
                const isHovered = hoveredPoint?.date === point.date;

                // Format X-axis label depending on number of points
                const showLabel =
                  timeline.length <= 12 ||
                  index === 0 ||
                  index === timeline.length - 1 ||
                  index % Math.ceil(timeline.length / 8) === 0;

                return (
                  <g
                    key={point.date}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(point)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {/* Hover Column guide */}
                    {isHovered && (
                      <line
                        x1={x}
                        y1={paddingY}
                        x2={x}
                        y2={paddingY + graphHeight}
                        stroke="#60a5fa"
                        strokeWidth={1}
                        strokeDasharray="2 2"
                      />
                    )}

                    {/* Doctors Node */}
                    <circle
                      cx={x}
                      cy={yDoc}
                      r={isHovered ? 6 : 4}
                      fill="#1e293b"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      className="transition-all duration-150"
                    />

                    {/* Patients Node */}
                    <circle
                      cx={x}
                      cy={yPat}
                      r={isHovered ? 6 : 4}
                      fill="#1e293b"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      className="transition-all duration-150"
                    />

                    {/* X-axis Label */}
                    {showLabel && (
                      <text
                        x={x}
                        y={paddingY + graphHeight + 18}
                        fill="#94a3b8"
                        fontSize="10"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {groupBy === "day" && point.date.length >= 10
                          ? point.date.slice(5) // MM-DD
                          : point.date}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Interactive Legend */}
          <div className="mt-4 flex items-center justify-center space-x-6 text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="h-3 w-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
              <span className="font-medium text-slate-300">Doctors Registered</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
              <span className="font-medium text-slate-300">Patients Registered</span>
            </div>
          </div>
        </div>
      ) : (
        /* Accessible Data Table Alternative */
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th scope="col" className="px-4 py-3">Date / Period</th>
                <th scope="col" className="px-4 py-3 text-right">Doctors Registered</th>
                <th scope="col" className="px-4 py-3 text-right">Patients Registered</th>
                <th scope="col" className="px-4 py-3 text-right">Total Intake</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {timeline.map((point) => (
                <tr key={point.date} className="hover:bg-slate-800/30">
                  <td className="px-4 py-2.5 font-sans font-medium text-white">{point.date}</td>
                  <td className="px-4 py-2.5 text-right text-blue-400 font-bold">
                    {point.doctorsCreated}
                  </td>
                  <td className="px-4 py-2.5 text-right text-emerald-400 font-bold">
                    {point.patientsCreated}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-300">
                    {point.doctorsCreated + point.patientsCreated}
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

export default DateStatisticsChart;
