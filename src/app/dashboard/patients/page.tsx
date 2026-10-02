"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useAuth } from "@/context/AuthContext";
import { patientService } from "@/services/patient.service";
import { doctorService } from "@/services/doctor.service";
import { PatientFormModal } from "@/components/patients/PatientFormModal";
import { PatientDetailModal } from "@/components/patients/PatientDetailModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ApiClientError } from "@/lib/api";
import type { Patient, Doctor, PaginationMeta } from "@/types";

export default function PatientsPage() {
  const { token } = useAuth();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorsMap, setDoctorsMap] = useState<Record<string, Doctor>>({});

  const [pagination, setPagination] = useState<PaginationMeta>({
    totalRecords: 0,
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search & Filters state
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [dateValidationError, setDateValidationError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshIndex, setRefreshIndex] = useState(0);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
  const [selectedPatientForDetail, setSelectedPatientForDetail] = useState<string | null>(null);

  // Delete dialog states
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [, startTransition] = useTransition();

  const hasActiveFilters = Boolean(
    searchQuery || selectedDoctorFilter || conditionFilter || startDateFilter || endDateFilter
  );

  // Load all doctors once for dropdown selections and mapping
  useEffect(() => {
    let isCancelled = false;

    async function loadDoctorList() {
      await Promise.resolve();
      if (isCancelled) return;

      try {
        const result = await doctorService.getDoctors({ limit: 100 }, token);
        if (!isCancelled) {
          setDoctors(result.doctors);
          const map: Record<string, Doctor> = {};
          for (const doc of result.doctors) {
            map[doc.id] = doc;
          }
          setDoctorsMap(map);
        }
      } catch {
        // Fallback silently if doctors fail to load initially
      }
    }

    void loadDoctorList();

    return () => {
      isCancelled = true;
    };
  }, [token]);

  // Date validation
  const handleStartDateChange = (val: string) => {
    setStartDateFilter(val);
    if (val && endDateFilter && val > endDateFilter) {
      setDateValidationError("Start date cannot be after end date.");
    } else {
      setDateValidationError(null);
      setCurrentPage(1);
    }
  };

  const handleEndDateChange = (val: string) => {
    setEndDateFilter(val);
    if (startDateFilter && val && startDateFilter > val) {
      setDateValidationError("Start date cannot be after end date.");
    } else {
      setDateValidationError(null);
      setCurrentPage(1);
    }
  };

  // Fetch patients
  useEffect(() => {
    let isCancelled = false;

    async function fetchPatients() {
      if (dateValidationError) return;

      await Promise.resolve();
      if (isCancelled) return;

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await patientService.getPatients(
          {
            page: currentPage,
            limit: 10,
            search: searchQuery.trim() || undefined,
            doctorId: selectedDoctorFilter.trim() || undefined,
            condition: conditionFilter.trim() || undefined,
            startDate: startDateFilter || undefined,
            endDate: endDateFilter || undefined,
          },
          token
        );
        if (!isCancelled) {
          setPatients(result.patients);
          setPagination(result.pagination);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          if (err instanceof ApiClientError) {
            setErrorMessage(err.message || "Failed to load patients");
          } else if (err instanceof Error) {
            setErrorMessage(err.message);
          } else {
            setErrorMessage("An unexpected error occurred while loading patients");
          }
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchPatients();

    return () => {
      isCancelled = true;
    };
  }, [
    currentPage,
    searchQuery,
    selectedDoctorFilter,
    conditionFilter,
    startDateFilter,
    endDateFilter,
    dateValidationError,
    token,
    refreshIndex,
  ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearchQuery(searchInput);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setSelectedDoctorFilter("");
    setConditionFilter("");
    setStartDateFilter("");
    setEndDateFilter("");
    setDateValidationError(null);
    setCurrentPage(1);
  };

  const handleOpenCreateModal = () => {
    setPatientToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (patient: Patient) => {
    setPatientToEdit(patient);
    setIsFormModalOpen(true);
  };

  const handleFormSuccess = (_patient: Patient, isEdit: boolean) => {
    setSuccessMessage(
      isEdit ? "Patient updated successfully!" : "Patient record created successfully!"
    );
    setTimeout(() => setSuccessMessage(null), 4000);
    setRefreshIndex((prev) => prev + 1);
  };

  const handleOpenDeleteDialog = (patient: Patient) => {
    setPatientToDelete(patient);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!patientToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await patientService.deletePatient(patientToDelete.id, token);
      setPatientToDelete(null);
      setSuccessMessage("Patient record permanently removed.");
      setTimeout(() => setSuccessMessage(null), 4000);
      setRefreshIndex((prev) => prev + 1);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setDeleteError(err.message || "Failed to delete patient record.");
      } else if (err instanceof Error) {
        setDeleteError(err.message);
      } else {
        setDeleteError("An unexpected error occurred during patient deletion.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper to format doctor display
  const getDoctorDisplay = (patient: Patient) => {
    if (patient.doctor) {
      return (
        <div>
          <div className="font-semibold text-white">{patient.doctor.name}</div>
          <div className="text-[11px] text-slate-400">{patient.doctor.specialization}</div>
        </div>
      );
    }
    const doc = doctorsMap[patient.doctorId];
    if (doc) {
      return (
        <div>
          <div className="font-semibold text-white">{doc.name}</div>
          <div className="text-[11px] text-slate-400">{doc.specialization}</div>
        </div>
      );
    }
    return <span className="font-mono text-[11px] text-slate-500">ID: {patient.doctorId}</span>;
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Patients Directory
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Manage patient records, clinical conditions, and attending physician associations
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex cursor-pointer items-center space-x-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-colors hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 self-start sm:self-auto"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div
          role="status"
          className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs sm:text-sm text-emerald-300"
        >
          <div className="flex items-center space-x-2">
            <svg className="h-4 w-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="cursor-pointer text-emerald-400 hover:text-white">
            ×
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm backdrop-blur-sm space-y-3">
        {/* Search Row */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by patient name, condition, phone, email..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
            <svg
              className="absolute left-3.5 top-3 h-4 w-4 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="submit"
              className="cursor-pointer rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
            >
              Search
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="cursor-pointer rounded-xl border border-slate-700/60 px-3 py-2.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </form>

        {/* Secondary Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-800/60">
          {/* Doctor Filter Dropdown */}
          <div>
            <label htmlFor="filter-doctor" className="block text-[11px] font-medium text-slate-400 mb-1">
              Attending Doctor
            </label>
            <select
              id="filter-doctor"
              value={selectedDoctorFilter}
              onChange={(e) => {
                setSelectedDoctorFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="cursor-pointer w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="">All Attending Doctors</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.specialization})
                </option>
              ))}
            </select>
          </div>

          {/* Condition Filter */}
          <div>
            <label htmlFor="filter-condition" className="block text-[11px] font-medium text-slate-400 mb-1">
              Medical Condition
            </label>
            <input
              id="filter-condition"
              type="text"
              value={conditionFilter}
              onChange={(e) => {
                setConditionFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="e.g. Hypertension"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Intake Date After */}
          <div>
            <label htmlFor="filter-start-date" className="block text-[11px] font-medium text-slate-400 mb-1">
              Registered After
            </label>
            <input
              id="filter-start-date"
              type="date"
              value={startDateFilter}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Intake Date Before */}
          <div>
            <label htmlFor="filter-end-date" className="block text-[11px] font-medium text-slate-400 mb-1">
              Registered Before
            </label>
            <input
              id="filter-end-date"
              type="date"
              value={endDateFilter}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Date Validation Alert */}
        {dateValidationError && (
          <div className="flex items-center space-x-1.5 text-xs text-red-400 pt-1">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <span>{dateValidationError}</span>
          </div>
        )}
      </div>

      {/* Main Table / Card Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-500 border-t-transparent" />
            <p className="text-xs">Loading patient records...</p>
          </div>
        ) : errorMessage ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-400 mb-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <p className="text-sm text-red-300 font-medium">{errorMessage}</p>
            <button
              onClick={() => setRefreshIndex((prev) => prev + 1)}
              className="cursor-pointer mt-4 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
            >
              Try Again
            </button>
          </div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-400 mb-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.199l-.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white">No patients found</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
              {hasActiveFilters
                ? "No patient records match the active search or filter criteria. Try clearing filters."
                : "No patient records exist yet. Click below to register the first patient."}
            </p>
            <div className="mt-5">
              {hasActiveFilters ? (
                <button
                  onClick={handleClearFilters}
                  className="cursor-pointer rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-white"
                >
                  Clear All Filters
                </button>
              ) : (
                <button
                  onClick={handleOpenCreateModal}
                  className="cursor-pointer rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500"
                >
                  Register Patient
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">Patient</th>
                    <th scope="col" className="px-6 py-3.5">Condition</th>
                    <th scope="col" className="px-6 py-3.5">Contact</th>
                    <th scope="col" className="px-6 py-3.5">Attending Doctor</th>
                    <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {patients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{patient.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {patient.age} yrs • <span className="capitalize">{patient.gender}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                          {patient.condition}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>{patient.phone}</div>
                        {patient.email ? (
                          <div className="text-[11px] text-slate-400 font-mono">{patient.email}</div>
                        ) : (
                          <div className="text-[11px] text-slate-600 italic">No email</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getDoctorDisplay(patient)}
                      </td>
                      <td className="px-6 py-4 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedPatientForDetail(patient.id)}
                          className="cursor-pointer rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(patient)}
                          className="cursor-pointer rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteDialog(patient)}
                          className="cursor-pointer rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Stack View */}
            <div className="sm:hidden divide-y divide-slate-800/80 p-4 space-y-4">
              {patients.map((patient) => (
                <div key={patient.id} className="pt-4 first:pt-0 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-white text-sm">{patient.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {patient.age} yrs • <span className="capitalize">{patient.gender}</span>
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                      {patient.condition}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1">
                    <div><span className="text-slate-500">Phone:</span> {patient.phone}</div>
                    {patient.email && <div><span className="text-slate-500">Email:</span> {patient.email}</div>}
                    <div><span className="text-slate-500">Attending:</span> {patient.doctor?.name || doctorsMap[patient.doctorId]?.name || "Assigned Doctor"}</div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800/60">
                    <button
                      type="button"
                      onClick={() => setSelectedPatientForDetail(patient.id)}
                      className="cursor-pointer rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(patient)}
                      className="cursor-pointer rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDeleteDialog(patient)}
                      className="cursor-pointer rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-800 px-6 py-4 text-xs text-slate-400 gap-3">
              <div>
                Showing page <span className="font-semibold text-white">{pagination.currentPage}</span> of{" "}
                <span className="font-semibold text-white">{pagination.totalPages}</span> ({pagination.totalRecords} total patients)
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  disabled={!pagination.hasPrevPage}
                  onClick={() =>
                    startTransition(() => {
                      setCurrentPage((prev) => Math.max(1, prev - 1));
                    })
                  }
                  className="cursor-pointer disabled:cursor-not-allowed rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 font-medium text-slate-200 disabled:opacity-40 hover:bg-slate-700 disabled:hover:bg-slate-800 transition-colors"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={!pagination.hasNextPage}
                  onClick={() =>
                    startTransition(() => {
                      setCurrentPage((prev) => prev + 1);
                    })
                  }
                  className="cursor-pointer disabled:cursor-not-allowed rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 font-medium text-slate-200 disabled:opacity-40 hover:bg-slate-700 disabled:hover:bg-slate-800 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create / Edit Patient Modal */}
      <PatientFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        patientToEdit={patientToEdit}
        doctors={doctors}
      />

      {/* Patient Detail Profile Modal */}
      <PatientDetailModal
        isOpen={Boolean(selectedPatientForDetail)}
        onClose={() => setSelectedPatientForDetail(null)}
        patientId={selectedPatientForDetail}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(patientToDelete)}
        title="Delete Patient Record"
        message={
          patientToDelete
            ? `Are you sure you want to permanently delete the patient record for ${patientToDelete.name}? This action cannot be undone.`
            : ""
        }
        confirmText="Confirm Delete"
        isConfirming={isDeleting}
        errorMessage={deleteError}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setPatientToDelete(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
