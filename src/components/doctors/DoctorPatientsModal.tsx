"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { doctorService } from "@/services/doctor.service";
import { ApiClientError } from "@/lib/api";
import type { Doctor, Patient, PaginationMeta, PatientGender } from "@/types";

interface DoctorPatientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: Doctor | null;
  onPatientCountChange?: () => void;
}

export function DoctorPatientsModal({
  isOpen,
  onClose,
  doctor,
  onPatientCountChange,
}: DoctorPatientsModalProps) {
  const { token } = useAuth();

  const [activeTab, setActiveTab] = useState<"list" | "add">("list");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    totalRecords: 0,
    currentPage: 1,
    pageSize: 5,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Deletion state
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Add Patient Form State
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<PatientGender>("male");
  const [phone, setPhone] = useState("");
  const [condition, setCondition] = useState("");
  const [email, setEmail] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Doctor's Patients
  const fetchPatients = useCallback(async () => {
    if (!doctor) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await doctorService.getDoctorPatients(
        doctor.id,
        { page: currentPage, limit: 5 },
        token
      );
      setPatients(result.patients);
      setPagination(result.pagination);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message || "Failed to load doctor's patients");
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred loading patients");
      }
    } finally {
      setIsLoading(false);
    }
  }, [doctor, currentPage, token]);

  useEffect(() => {
    let isCancelled = false;
    if (isOpen && doctor) {
      void (async () => {
        await Promise.resolve();
        if (!isCancelled) {
          fetchPatients();
        }
      })();
    }
    return () => {
      isCancelled = true;
    };
  }, [isOpen, doctor, fetchPatients]);

  if (!isOpen || !doctor) return null;

  // Handle Create Patient Form Submission
  const handleAddPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setFormErrors({});
    const errors: Record<string, string> = {};

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      errors.name = "Full name must be at least 2 characters.";
    }

    const numAge = Number(age);
    if (!age || isNaN(numAge) || numAge < 0 || numAge > 130) {
      errors.age = "Please enter a valid age between 0 and 130.";
    }

    const trimmedPhone = phone.trim();
    if (!trimmedPhone || trimmedPhone.length < 7) {
      errors.phone = "Phone number must be at least 7 characters.";
    }

    const trimmedCondition = condition.trim();
    if (!trimmedCondition || trimmedCondition.length < 2) {
      errors.condition = "Medical condition is required.";
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = "Please enter a valid email address.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await doctorService.createDoctorPatient(
        doctor.id,
        {
          name: trimmedName,
          age: numAge,
          gender,
          phone: trimmedPhone,
          condition: trimmedCondition,
          email: trimmedEmail || undefined,
        },
        token
      );

      // Reset form
      setName("");
      setAge("");
      setGender("male");
      setPhone("");
      setCondition("");
      setEmail("");
      setSuccessMessage("Patient successfully registered under this doctor!");
      setTimeout(() => setSuccessMessage(null), 4000);

      // Switch to list view & refresh
      setActiveTab("list");
      setCurrentPage(1);
      fetchPatients();
      onPatientCountChange?.();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.errors && err.errors.length > 0) {
          const apiErrors: Record<string, string> = {};
          err.errors.forEach((e) => {
            apiErrors[e.field] = e.message;
          });
          setFormErrors(apiErrors);
        } else {
          setErrorMessage(err.message || "Failed to create patient under doctor.");
        }
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred while creating patient.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Remove Patient from Doctor
  const handleConfirmDelete = async () => {
    if (!patientToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await doctorService.deleteDoctorPatient(doctor.id, patientToDelete.id, token);
      setPatientToDelete(null);
      setSuccessMessage("Patient removed successfully!");
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchPatients();
      onPatientCountChange?.();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setDeleteError(err.message || "Failed to remove patient.");
      } else if (err instanceof Error) {
        setDeleteError(err.message);
      } else {
        setDeleteError("An unexpected error occurred during removal.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="doctor-patients-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 p-6 bg-slate-950/40">
          <div>
            <div className="flex items-center space-x-2">
              <h3 id="doctor-patients-title" className="text-lg font-bold text-white tracking-tight">
                Patients Assigned to {doctor.name}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-400">
              <span className="rounded-md bg-blue-500/10 px-2 py-0.5 font-medium text-blue-400 border border-blue-500/20">
                {doctor.specialization}
              </span>
              <span>•</span>
              <span>{doctor.hospital}</span>
              <span>•</span>
              <span className="font-mono text-slate-500">{doctor.email}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("list")}
            className={`cursor-pointer border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === "list"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Associated Patients ({pagination.totalRecords})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("add")}
            className={`cursor-pointer border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === "add"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            + Add New Patient
          </button>
        </div>

        {/* Alerts / Feedback */}
        {successMessage && (
          <div className="mx-6 mt-4 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="cursor-pointer text-emerald-400 hover:text-white">
              ×
            </button>
          </div>
        )}
        {errorMessage && (
          <div className="mx-6 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {errorMessage}
          </div>
        )}

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === "list" ? (
            isLoading ? (
              <div className="space-y-3 py-6 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 w-full bg-slate-800/60 rounded-xl" />
                ))}
              </div>
            ) : patients.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-400 mb-2">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-white">No patients assigned</h4>
                <p className="mt-1 text-xs text-slate-400">
                  Dr. {doctor.name} currently has no active patient assignments.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("add")}
                  className="cursor-pointer mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
                >
                  Add First Patient
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
                  {patients.map((pat) => (
                    <div
                      key={pat.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-slate-900/50 transition-colors"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-white text-xs sm:text-sm">{pat.name}</span>
                          <span className="text-[11px] text-slate-400">
                            ({pat.age} yrs • {pat.gender})
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                            {pat.condition}
                          </span>
                          <span>Phone: {pat.phone}</span>
                          {pat.email && <span className="font-mono text-[11px]">Email: {pat.email}</span>}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPatientToDelete(pat)}
                        className="cursor-pointer self-end sm:self-auto rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                    <span>
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <div className="flex space-x-1.5">
                      <button
                        type="button"
                        disabled={!pagination.hasPrevPage}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="cursor-pointer disabled:cursor-not-allowed rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors"
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        disabled={!pagination.hasNextPage}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="cursor-pointer disabled:cursor-not-allowed rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            /* Add Patient Form */
            <form onSubmit={handleAddPatientSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label htmlFor="pat-name" className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    id="pat-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Patient full name"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {formErrors.name && <p className="mt-1 text-xs text-red-400">{formErrors.name}</p>}
                </div>

                {/* Age */}
                <div>
                  <label htmlFor="pat-age" className="block text-xs font-semibold text-slate-300 mb-1">
                    Age *
                  </label>
                  <input
                    id="pat-age"
                    type="number"
                    min={0}
                    max={130}
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 35"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {formErrors.age && <p className="mt-1 text-xs text-red-400">{formErrors.age}</p>}
                </div>

                {/* Gender */}
                <div>
                  <label htmlFor="pat-gender" className="block text-xs font-semibold text-slate-300 mb-1">
                    Gender *
                  </label>
                  <select
                    id="pat-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as PatientGender)}
                    className="cursor-pointer w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="pat-phone" className="block text-xs font-semibold text-slate-300 mb-1">
                    Phone *
                  </label>
                  <input
                    id="pat-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {formErrors.phone && <p className="mt-1 text-xs text-red-400">{formErrors.phone}</p>}
                </div>

                {/* Medical Condition */}
                <div>
                  <label htmlFor="pat-cond" className="block text-xs font-semibold text-slate-300 mb-1">
                    Medical Condition *
                  </label>
                  <input
                    id="pat-cond"
                    type="text"
                    required
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    placeholder="e.g. Hypertension"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {formErrors.condition && <p className="mt-1 text-xs text-red-400">{formErrors.condition}</p>}
                </div>

                {/* Email (Optional) */}
                <div className="sm:col-span-2">
                  <label htmlFor="pat-email" className="block text-xs font-semibold text-slate-300 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    id="pat-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {formErrors.email && <p className="mt-1 text-xs text-red-400">{formErrors.email}</p>}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab("list")}
                  className="cursor-pointer rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer disabled:cursor-not-allowed rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-500 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Registering..." : "Assign Patient to Doctor"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Delete Confirmation Modal Overlay */}
        {patientToDelete && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-sm rounded-xl border border-red-500/30 bg-slate-900 p-5 shadow-2xl text-center space-y-3">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15 text-red-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-white">Remove Patient Assignment?</h4>
              <p className="text-xs text-slate-400">
                Are you sure you want to remove <strong className="text-white">{patientToDelete.name}</strong> from{" "}
                {doctor.name}? This action cannot be undone.
              </p>
              {deleteError && <p className="text-xs text-red-400">{deleteError}</p>}
              <div className="flex justify-center space-x-2 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setPatientToDelete(null)}
                  className="cursor-pointer disabled:cursor-not-allowed rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="cursor-pointer disabled:cursor-not-allowed rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500"
                >
                  {isDeleting ? "Removing..." : "Confirm Removal"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DoctorPatientsModal;
