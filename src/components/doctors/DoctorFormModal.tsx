"use client";

import React, { useState, FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { doctorService } from "@/services/doctor.service";
import { ApiClientError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Doctor, CreateDoctorInput, UpdateDoctorInput } from "@/types";

interface DoctorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (doctor: Doctor, isEdit: boolean) => void;
  doctorToEdit?: Doctor | null;
}

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

interface DoctorFormFieldsProps {
  doctorToEdit?: Doctor | null;
  onClose: () => void;
  onSuccess: (doctor: Doctor, isEdit: boolean) => void;
}

function DoctorFormFields({
  doctorToEdit,
  onClose,
  onSuccess,
}: DoctorFormFieldsProps) {
  const { token } = useAuth();
  const isEdit = Boolean(doctorToEdit);

  const [name, setName] = useState(doctorToEdit?.name || "");
  const [specialization, setSpecialization] = useState(
    doctorToEdit?.specialization || ""
  );
  const [hospital, setHospital] = useState(doctorToEdit?.hospital || "");
  const [phone, setPhone] = useState(doctorToEdit?.phone || "");
  const [email, setEmail] = useState(doctorToEdit?.email || "");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = "Doctor name is required";
    } else if (name.trim().length < 2 || name.trim().length > 120) {
      errors.name = "Name must be between 2 and 120 characters";
    }

    if (!specialization.trim()) {
      errors.specialization = "Specialization is required";
    } else if (specialization.trim().length < 2 || specialization.trim().length > 100) {
      errors.specialization = "Specialization must be between 2 and 100 characters";
    }

    if (!hospital.trim()) {
      errors.hospital = "Hospital name is required";
    } else if (hospital.trim().length < 2 || hospital.trim().length > 150) {
      errors.hospital = "Hospital name must be between 2 and 150 characters";
    }

    if (!phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (phone.trim().length < 7 || phone.trim().length > 25) {
      errors.phone = "Phone number must be between 7 and 25 characters";
    }

    if (!email.trim()) {
      errors.email = "Doctor email is required";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = "Please provide a valid email address";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setGeneralError(null);
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      if (isEdit && doctorToEdit) {
        const updatePayload: UpdateDoctorInput = {
          name: name.trim(),
          specialization: specialization.trim(),
          hospital: hospital.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
        };
        const updatedDoctor = await doctorService.updateDoctor(
          doctorToEdit.id,
          updatePayload,
          token
        );
        onSuccess(updatedDoctor, true);
        onClose();
      } else {
        const createPayload: CreateDoctorInput = {
          name: name.trim(),
          specialization: specialization.trim(),
          hospital: hospital.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
        };
        const newDoctor = await doctorService.createDoctor(createPayload, token);
        onSuccess(newDoctor, false);
        onClose();
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.errors && err.errors.length > 0) {
          const apiErrors: Record<string, string> = {};
          for (const item of err.errors) {
            apiErrors[item.field] = item.message;
          }
          setFieldErrors(apiErrors);
          setGeneralError("Validation failed. Please review the highlighted fields.");
        } else if (err.status === 409) {
          setGeneralError(err.message || "A doctor with this email address already exists.");
        } else {
          setGeneralError(err.message || "Failed to save doctor details.");
        }
      } else if (err instanceof Error) {
        setGeneralError(err.message);
      } else {
        setGeneralError("An unexpected error occurred while saving doctor.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* General Error Banner */}
      {generalError && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300"
        >
          {generalError}
        </div>
      )}

      {/* Doctor Name */}
      <div>
        <label
          htmlFor="doctor-name"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
        >
          Full Name <span className="text-red-400">*</span>
        </label>
        <input
          id="doctor-name"
          type="text"
          required
          disabled={isSubmitting}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Dr. Jane Smith"
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "doctor-name-error" : undefined}
          className={`mt-1.5 w-full rounded-xl border bg-slate-950/70 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-2 disabled:opacity-60 ${
            fieldErrors.name
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
              : "border-slate-800 focus:border-blue-500 focus:ring-blue-500/30"
          }`}
        />
        {fieldErrors.name && (
          <p id="doctor-name-error" className="mt-1 text-xs text-red-400">
            {fieldErrors.name}
          </p>
        )}
      </div>

      {/* Specialization & Hospital Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="doctor-specialization"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            Specialization <span className="text-red-400">*</span>
          </label>
          <input
            id="doctor-specialization"
            type="text"
            required
            disabled={isSubmitting}
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            placeholder="e.g. Cardiology"
            aria-invalid={Boolean(fieldErrors.specialization)}
            aria-describedby={
              fieldErrors.specialization ? "doctor-specialization-error" : undefined
            }
            className={`mt-1.5 w-full rounded-xl border bg-slate-950/70 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-2 disabled:opacity-60 ${
              fieldErrors.specialization
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                : "border-slate-800 focus:border-blue-500 focus:ring-blue-500/30"
            }`}
          />
          {fieldErrors.specialization && (
            <p id="doctor-specialization-error" className="mt-1 text-xs text-red-400">
              {fieldErrors.specialization}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="doctor-hospital"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            Hospital / Clinic <span className="text-red-400">*</span>
          </label>
          <input
            id="doctor-hospital"
            type="text"
            required
            disabled={isSubmitting}
            value={hospital}
            onChange={(e) => setHospital(e.target.value)}
            placeholder="e.g. Metro General Hospital"
            aria-invalid={Boolean(fieldErrors.hospital)}
            aria-describedby={fieldErrors.hospital ? "doctor-hospital-error" : undefined}
            className={`mt-1.5 w-full rounded-xl border bg-slate-950/70 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-2 disabled:opacity-60 ${
              fieldErrors.hospital
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                : "border-slate-800 focus:border-blue-500 focus:ring-blue-500/30"
            }`}
          />
          {fieldErrors.hospital && (
            <p id="doctor-hospital-error" className="mt-1 text-xs text-red-400">
              {fieldErrors.hospital}
            </p>
          )}
        </div>
      </div>

      {/* Phone & Email Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="doctor-phone"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            Phone Number <span className="text-red-400">*</span>
          </label>
          <input
            id="doctor-phone"
            type="tel"
            required
            disabled={isSubmitting}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1-555-0199"
            aria-invalid={Boolean(fieldErrors.phone)}
            aria-describedby={fieldErrors.phone ? "doctor-phone-error" : undefined}
            className={`mt-1.5 w-full rounded-xl border bg-slate-950/70 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-2 disabled:opacity-60 ${
              fieldErrors.phone
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                : "border-slate-800 focus:border-blue-500 focus:ring-blue-500/30"
            }`}
          />
          {fieldErrors.phone && (
            <p id="doctor-phone-error" className="mt-1 text-xs text-red-400">
              {fieldErrors.phone}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="doctor-email"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            Email Address <span className="text-red-400">*</span>
          </label>
          <input
            id="doctor-email"
            type="email"
            required
            disabled={isSubmitting}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="doctor@hospital.com"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "doctor-email-error" : undefined}
            className={`mt-1.5 w-full rounded-xl border bg-slate-950/70 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-2 disabled:opacity-60 ${
              fieldErrors.email
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                : "border-slate-800 focus:border-blue-500 focus:ring-blue-500/30"
            }`}
          />
          {fieldErrors.email && (
            <p id="doctor-email-error" className="mt-1 text-xs text-red-400">
              {fieldErrors.email}
            </p>
          )}
        </div>
      </div>

      {/* Modal Action Buttons */}
      <div className="mt-6 flex justify-end space-x-3 border-t border-slate-800 pt-4">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onClose}
          className="cursor-pointer disabled:cursor-not-allowed rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="cursor-pointer disabled:cursor-not-allowed flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-500 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Saving...</span>
            </div>
          ) : isEdit ? (
            "Update Doctor"
          ) : (
            "Create Doctor"
          )}
        </button>
      </div>
    </form>
  );
}

export function DoctorFormModal({
  isOpen,
  onClose,
  onSuccess,
  doctorToEdit,
}: DoctorFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={doctorToEdit ? "Edit Doctor Profile" : "Register New Doctor"}
    >
      <DoctorFormFields
        key={doctorToEdit ? doctorToEdit.id : "new-doctor"}
        doctorToEdit={doctorToEdit}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </Modal>
  );
}

export default DoctorFormModal;
