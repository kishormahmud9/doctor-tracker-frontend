"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useAuth } from "@/context/AuthContext";
import { doctorService } from "@/services/doctor.service";
import { DoctorFormModal } from "@/components/doctors/DoctorFormModal";
import { DoctorPatientsModal } from "@/components/doctors/DoctorPatientsModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ApiClientError } from "@/lib/api";
import type { Doctor, PaginationMeta } from "@/types";

export default function DoctorsPage() {
  const { token } = useAuth();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
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

  // Search & Filter state
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("");
  const [hospitalFilter, setHospitalFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshIndex, setRefreshIndex] = useState(0);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [doctorToEdit, setDoctorToEdit] = useState<Doctor | null>(null);
  const [doctorForPatients, setDoctorForPatients] = useState<Doctor | null>(null);

  // Delete dialog states
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [, startTransition] = useTransition();

  const hasActiveFilters = Boolean(
    searchQuery || specializationFilter || hospitalFilter || startDateFilter || endDateFilter
  );

  useEffect(() => {
    let isCancelled = false;

    async function fetchDoctors() {
      await Promise.resolve();
      if (isCancelled) return;

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await doctorService.getDoctors(
          {
            page: currentPage,
            limit: 10,
            search: searchQuery.trim() || undefined,
            specialization: specializationFilter.trim() || undefined,
            hospital: hospitalFilter.trim() || undefined,
            startDate: startDateFilter || undefined,
            endDate: endDateFilter || undefined,
          },
          token
        );
        if (!isCancelled) {
          setDoctors(result.doctors);
          setPagination(result.pagination);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          if (err instanceof ApiClientError) {
            setErrorMessage(err.message || "Failed to load doctors");
          } else if (err instanceof Error) {
            setErrorMessage(err.message);
          } else {
            setErrorMessage("An unexpected error occurred while loading doctors");
          }
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchDoctors();

    return () => {
      isCancelled = true;
    };
  }, [
    currentPage,
    searchQuery,
    specializationFilter,
    hospitalFilter,
    startDateFilter,
    endDateFilter,
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
    setSpecializationFilter("");
    setHospitalFilter("");
    setStartDateFilter("");
    setEndDateFilter("");
    setCurrentPage(1);
  };

  const handleOpenCreateModal = () => {
    setDoctorToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (doctor: Doctor) => {
    setDoctorToEdit(doctor);
    setIsFormModalOpen(true);
  };

  const handleFormSuccess = (_doctor: Doctor, isEdit: boolean) => {
    setSuccessMessage(
      isEdit ? "Doctor updated successfully!" : "Doctor created successfully!"
    );
    setTimeout(() => setSuccessMessage(null), 4000);
    setRefreshIndex((prev) => prev + 1);
  };

  const handleOpenDeleteDialog = (doctor: Doctor) => {
    setDoctorToDelete(doctor);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!doctorToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await doctorService.deleteDoctor(doctorToDelete.id, token);
      setDoctorToDelete(null);
      setSuccessMessage("Doctor deleted successfully!");
      setTimeout(() => setSuccessMessage(null), 4000);
      setRefreshIndex((prev) => prev + 1);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setDeleteError(err.message || "Failed to delete doctor.");
      } else if (err instanceof Error) {
        setDeleteError(err.message);
      } else {
        setDeleteError("An unexpected error occurred during deletion.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Doctors Directory
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Manage healthcare practitioners, specializations, hospitals, and assigned patient lists
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center space-x-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 self-start sm:self-auto cursor-pointer"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Add New Doctor</span>
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
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-white cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm backdrop-blur-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, specialization, hospital, email..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
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
              className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700 hover:text-white cursor-pointer"
            >
              Search
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="rounded-xl border border-slate-700/60 px-3 py-2.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        </form>

        {/* Secondary Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-800/60">
          {/* Specialization Filter */}
          <div>
            <label htmlFor="filter-spec" className="block text-[11px] font-medium text-slate-400 mb-1">
              Specialization
            </label>
            <input
              id="filter-spec"
              type="text"
              value={specializationFilter}
              onChange={(e) => {
                setSpecializationFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="e.g. Cardiology"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Hospital Filter */}
          <div>
            <label htmlFor="filter-hosp" className="block text-[11px] font-medium text-slate-400 mb-1">
              Hospital
            </label>
            <input
              id="filter-hosp"
              type="text"
              value={hospitalFilter}
              onChange={(e) => {
                setHospitalFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="e.g. General Hospital"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Start Date Filter */}
          <div>
            <label htmlFor="filter-start" className="block text-[11px] font-medium text-slate-400 mb-1">
              Created After
            </label>
            <input
              id="filter-start"
              type="date"
              value={startDateFilter}
              onChange={(e) => {
                setStartDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* End Date Filter */}
          <div>
            <label htmlFor="filter-end" className="block text-[11px] font-medium text-slate-400 mb-1">
              Created Before
            </label>
            <input
              id="filter-end"
              type="date"
              value={endDateFilter}
              onChange={(e) => {
                setEndDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Table / Content Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-500 border-t-transparent" />
            <p className="text-xs">Loading doctors directory...</p>
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
              className="mt-4 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : doctors.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-400 mb-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white">No doctors found</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
              {hasActiveFilters
                ? "No doctors match the active search or filter criteria. Try clearing filters."
                : "No doctors have been registered yet. Click below to add the first doctor."}
            </p>
            <div className="mt-5">
              {hasActiveFilters ? (
                <button
                  onClick={handleClearFilters}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                >
                  Clear All Filters
                </button>
              ) : (
                <button
                  onClick={handleOpenCreateModal}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 cursor-pointer"
                >
                  Add Doctor
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
                    <th scope="col" className="px-6 py-3.5">Doctor</th>
                    <th scope="col" className="px-6 py-3.5">Specialization</th>
                    <th scope="col" className="px-6 py-3.5">Hospital</th>
                    <th scope="col" className="px-6 py-3.5">Contact</th>
                    <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {doctors.map((doctor) => (
                    <tr
                      key={doctor.id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{doctor.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          ID: {doctor.id.slice(-6)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400 border border-blue-500/20">
                          {doctor.specialization}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {doctor.hospital}
                      </td>
                      <td className="px-6 py-4">
                        <div>{doctor.phone}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{doctor.email}</div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {/* View Patients Associated with Doctor */}
                        <button
                          type="button"
                          onClick={() => setDoctorForPatients(doctor)}
                          className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-xs font-semibold text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer"
                        >
                          Patients
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(doctor)}
                          className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteDialog(doctor)}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-colors cursor-pointer"
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
              {doctors.map((doctor) => (
                <div key={doctor.id} className="pt-4 first:pt-0 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-white text-sm">{doctor.name}</div>
                      <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-400 border border-blue-500/20 mt-1">
                        {doctor.specialization}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      #{doctor.id.slice(-6)}
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1">
                    <div><span className="text-slate-500">Hospital:</span> {doctor.hospital}</div>
                    <div><span className="text-slate-500">Phone:</span> {doctor.phone}</div>
                    <div><span className="text-slate-500">Email:</span> {doctor.email}</div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800/60">
                    <button
                      type="button"
                      onClick={() => setDoctorForPatients(doctor)}
                      className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400 cursor-pointer"
                    >
                      Patients
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(doctor)}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDeleteDialog(doctor)}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 cursor-pointer"
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
                <span className="font-semibold text-white">{pagination.totalPages}</span> ({pagination.totalRecords} total doctors)
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
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 font-medium text-slate-200 disabled:opacity-40 hover:bg-slate-700 disabled:hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
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
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 font-medium text-slate-200 disabled:opacity-40 hover:bg-slate-700 disabled:hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create / Edit Modal Dialog */}
      <DoctorFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        doctorToEdit={doctorToEdit}
      />

      {/* Doctor-Scoped Patients Modal */}
      <DoctorPatientsModal
        isOpen={Boolean(doctorForPatients)}
        onClose={() => setDoctorForPatients(null)}
        doctor={doctorForPatients}
        onPatientCountChange={() => setRefreshIndex((p) => p + 1)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(doctorToDelete)}
        title="Delete Doctor Profile"
        message={
          doctorToDelete
            ? `Are you sure you want to delete ${doctorToDelete.name}? Note: If this doctor has assigned patients, the backend policy prevents deletion until all patients are reassigned or removed.`
            : ""
        }
        confirmText="Confirm Delete"
        isConfirming={isDeleting}
        errorMessage={deleteError}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setDoctorToDelete(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
