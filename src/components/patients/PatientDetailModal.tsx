"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { patientService } from "@/services/patient.service";
import { ApiClientError } from "@/lib/api";
import type { Patient } from "@/types";

interface PatientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string | null;
}

export function PatientDetailModal({
  isOpen,
  onClose,
  patientId,
}: PatientDetailModalProps) {
  const { token } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadDetails() {
      if (!patientId) return;
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const data = await patientService.getPatientById(patientId, token);
        if (!isCancelled) {
          setPatient(data);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          if (err instanceof ApiClientError) {
            setErrorMessage(err.message || "Failed to load patient details.");
          } else if (err instanceof Error) {
            setErrorMessage(err.message);
          } else {
            setErrorMessage("An unexpected error occurred while loading patient details.");
          }
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    if (isOpen && patientId) {
      void (async () => {
        await Promise.resolve();
        loadDetails();
      })();
    }

    return () => {
      isCancelled = true;
    };
  }, [isOpen, patientId, token]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-6 bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.199l-.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                />
              </svg>
            </div>
            <div>
              <h3 id="patient-detail-title" className="text-lg font-bold text-white tracking-tight">
                Patient Clinical Profile
              </h3>
              <p className="text-xs text-slate-400">Complete record and attending physician information</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close details dialog"
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {isLoading ? (
            <div className="space-y-4 py-8 animate-pulse">
              <div className="h-6 w-48 bg-slate-800 rounded" />
              <div className="h-4 w-full bg-slate-800/60 rounded" />
              <div className="h-4 w-3/4 bg-slate-800/60 rounded" />
              <div className="h-16 w-full bg-slate-800/40 rounded-xl" />
            </div>
          ) : errorMessage ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 text-red-400 mb-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-red-300">{errorMessage}</p>
            </div>
          ) : patient ? (
            <div className="space-y-5">
              {/* Identity Banner */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <h4 className="text-xl font-bold text-white">{patient.name}</h4>
                  <div className="flex items-center space-x-2 mt-1 text-xs text-slate-400">
                    <span>{patient.age} years old</span>
                    <span>•</span>
                    <span className="capitalize">{patient.gender}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-500">ID: {patient.id}</span>
                  </div>
                </div>
                <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                  {patient.condition}
                </span>
              </div>

              {/* Contact Information Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-slate-400 block font-medium">Telephone</span>
                  <span className="text-white font-mono mt-0.5 block">{patient.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Email</span>
                  <span className="text-white font-mono mt-0.5 block">{patient.email || "Not provided"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Intake Date</span>
                  <span className="text-slate-300 font-mono mt-0.5 block">
                    {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Last Updated</span>
                  <span className="text-slate-300 font-mono mt-0.5 block">
                    {patient.updatedAt ? new Date(patient.updatedAt).toLocaleDateString() : "—"}
                  </span>
                </div>
              </div>

              {/* Assigned Attending Physician */}
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 space-y-2">
                <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block">
                  Attending Physician
                </span>
                {patient.doctor ? (
                  <div>
                    <h5 className="text-sm font-bold text-white">{patient.doctor.name}</h5>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-blue-300">
                      <span>{patient.doctor.specialization}</span>
                      <span>•</span>
                      <span>{patient.doctor.hospital}</span>
                      {patient.doctor.email && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-slate-400">{patient.doctor.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">
                    <span>Doctor ID: </span>
                    <span className="font-mono text-slate-300">{patient.doctorId}</span>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 p-4 bg-slate-950/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}

export default PatientDetailModal;
