"use client";

import React, { useState, FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { patientService } from "@/services/patient.service";
import { ApiClientError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type {
  Patient,
  Doctor,
  CreatePatientInput,
  UpdatePatientInput,
  PatientGender,
} from "@/types";

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (patient: Patient, isEdit: boolean) => void;
  patientToEdit?: Patient | null;
  doctors: Doctor[];
}

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

interface PatientFormFieldsProps {
  patientToEdit?: Patient | null;
  doctors: Doctor[];
  onClose: () => void;
  onSuccess: (patient: Patient, isEdit: boolean) => void;
}

function PatientFormFields({
  patientToEdit,
  doctors,
  onClose,
  onSuccess,
}: PatientFormFieldsProps) {
  const { token } = useAuth();
  const isEdit = Boolean(patientToEdit);

  const [name, setName] = useState(patientToEdit?.name || "");
  const [age, setAge] = useState<number | "">(
    patientToEdit ? patientToEdit.age : ""
  );
  const [gender, setGender] = useState<PatientGender>(
    patientToEdit ? patientToEdit.gender : "male"
  );
  const [phone, setPhone] = useState(patientToEdit?.phone || "");
  const [condition, setCondition] = useState(patientToEdit?.condition || "");
  const [doctorId, setDoctorId] = useState(
    patientToEdit
      ? patientToEdit.doctorId
      : doctors.length > 0
      ? doctors[0].id
      : ""
  );
  const [email, setEmail] = useState(patientToEdit?.email || "");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = "Patient name is required";
    } else if (name.trim().length < 2 || name.trim().length > 120) {
      errors.name = "Name must be between 2 and 120 characters";
    }

    if (age === "" || isNaN(Number(age))) {
      errors.age = "Patient age is required";
    } else if (Number(age) < 0 || Number(age) > 130) {
      errors.age = "Age must be between 0 and 130";
    }

    if (!phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (phone.trim().length < 7 || phone.trim().length > 25) {
      errors.phone = "Phone number must be between 7 and 25 characters";
    }

    if (!condition.trim()) {
      errors.condition = "Medical condition is required";
    } else if (condition.trim().length < 2 || condition.trim().length > 100) {
      errors.condition = "Condition must be between 2 and 100 characters";
    }

    if (!doctorId.trim()) {
      errors.doctorId = "Assigned doctor is required";
    }

    if (email.trim() && !EMAIL_REGEX.test(email.trim())) {
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
      if (isEdit && patientToEdit) {
        const updatePayload: UpdatePatientInput = {
          name: name.trim(),
          age: Number(age),
          gender,
          phone: phone.trim(),
          condition: condition.trim(),
          doctorId: doctorId.trim(),
          email: email.trim() ? email.trim().toLowerCase() : undefined,
        };
        const updatedPatient = await patientService.updatePatient(
          patientToEdit.id,
          updatePayload,
          token
        );
        onSuccess(updatedPatient, true);
        onClose();
      } else {
        const createPayload: CreatePatientInput = {
          name: name.trim(),
          age: Number(age),
          gender,
          phone: phone.trim(),
          condition: condition.trim(),
          doctorId: doctorId.trim(),
          email: email.trim() ? email.trim().toLowerCase() : undefined,
        };
        const newPatient = await patientService.createPatient(createPayload, token);
        onSuccess(newPatient, false);
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
        } else if (err.status === 404) {
          setGeneralError(err.message || "Assigned doctor could not be found.");
        } else {
          setGeneralError(err.message || "Failed to save patient record.");
        }
      } else if (err instanceof Error) {
        setGeneralError(err.message);
      } else {
        setGeneralError("An unexpected error occurred while saving patient.");
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

      {/* Patient Name */}
      <div>
        <label
          htmlFor="patient-name"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
        >
          Full Name <span className="text-red-400">*</span>
        </label>
        <input
          id="patient-name"
          type="text"
          required
          disabled={isSubmitting}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. John Doe"
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "patient-name-error" : undefined}
          className={`mt-1.5 w-full rounded-xl border bg-slate-950/70 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-2 disabled:opacity-60 ${
            fieldErrors.name
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
              : "border-slate-800 focus:border-blue-500 focus:ring-blue-500/30"
          }`}
        />
        {fieldErrors.name && (
          <p id="patient-name-error" className="mt-1 text-xs text-red-400">
            {fieldErrors.name}
          </p>
        )}
      </div>

      {/* Age & Gender Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="patient-age"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            Age (Years) <span className="text-red-400">*</span>
          </label>
          <input
            id="patient-age"
            type="number"
            min={0}
            max={130}
            required
            disabled={isSubmitting}
            value={age}
            onChange={(e) =>
              setAge(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder="e.g. 35"
            aria-invalid={Boolean(fieldErrors.age)}
            aria-describedby={fieldErrors.age ? "patient-age-error" : undefined}
            className={`mt-1.5 w-full rounded-xl border bg-slate-950/70 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-2 disabled:opacity-60 ${
              fieldErrors.age
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                : "border-slate-800 focus:border-blue-500 focus:ring-blue-500/30"
            }`}
          />
          {fieldErrors.age && (
            <p id="patient-age-error" className="mt-1 text-xs text-red-400">
              {fieldErrors.age}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="patient-gender"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            Gender <span className="text-red-400">*</span>
          </label>
          <select
            id="patient-gender"
            required
            disabled={isSubmitting}
            value={gender}
            onChange={(e) => setGender(e.target.value as PatientGender)}
            className="cursor-pointer mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Assigned Doctor Dropdown */}
      <div>
        <label
          htmlFor="patient-doctor"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
        >
          Assigned Doctor <span className="text-red-400">*</span>
        </label>
        <select
          id="patient-doctor"
          required
          disabled={isSubmitting || doctors.length === 0}
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
          aria-invalid={Boolean(fieldErrors.doctorId)}
          aria-describedby={
            fieldErrors.doctorId ? "patient-doctor-error" : undefined
          }
          className={`cursor-pointer disabled:cursor-not-allowed mt-1.5 w-full rounded-xl border bg-slate-950/70 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 disabled:opacity-60 ${
            fieldErrors.doctorId
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
              : "border-slate-800 focus:border-blue-500 focus:ring-blue-500/30"
          }`}
        >
          {doctors.length === 0 ? (
            <option value="">No doctors available (Register a doctor first)</option>
          ) : (
            doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name} — {doc.specialization} ({doc.hospital})
              </option>
            ))
          )}
        </select>
        {fieldErrors.doctorId && (
          <p id="patient-doctor-error" className="mt-1 text-xs text-red-400">
            {fieldErrors.doctorId}
          </p>
        )}
      </div>

      {/* Condition & Phone Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="patient-condition"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            Medical Condition <span className="text-red-400">*</span>
          </label>
          <input
            id="patient-condition"
            type="text"
            required
            disabled={isSubmitting}
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            placeholder="e.g. Hypertension, Diabetes"
            aria-invalid={Boolean(fieldErrors.condition)}
            aria-describedby={
              fieldErrors.condition ? "patient-condition-error" : undefined
            }
            className={`mt-1.5 w-full rounded-xl border bg-slate-950/70 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-2 disabled:opacity-60 ${
              fieldErrors.condition
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                : "border-slate-800 focus:border-blue-500 focus:ring-blue-500/30"
            }`}
          />
          {fieldErrors.condition && (
            <p id="patient-condition-error" className="mt-1 text-xs text-red-400">
              {fieldErrors.condition}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="patient-phone"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            Phone Number <span className="text-red-400">*</span>
          </label>
          <input
            id="patient-phone"
            type="tel"
            required
            disabled={isSubmitting}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1-555-0144"
            aria-invalid={Boolean(fieldErrors.phone)}
            aria-describedby={
              fieldErrors.phone ? "patient-phone-error" : undefined
            }
            className={`mt-1.5 w-full rounded-xl border bg-slate-950/70 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-2 disabled:opacity-60 ${
              fieldErrors.phone
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                : "border-slate-800 focus:border-blue-500 focus:ring-blue-500/30"
            }`}
          />
          {fieldErrors.phone && (
            <p id="patient-phone-error" className="mt-1 text-xs text-red-400">
              {fieldErrors.phone}
            </p>
          )}
        </div>
      </div>

      {/* Email Field (Optional) */}
      <div>
        <label
          htmlFor="patient-email"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
        >
          Email Address <span className="text-slate-500 text-[11px] normal-case">(Optional)</span>
        </label>
        <input
          id="patient-email"
          type="email"
          disabled={isSubmitting}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="patient@example.com"
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "patient-email-error" : undefined}
          className={`mt-1.5 w-full rounded-xl border bg-slate-950/70 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-2 disabled:opacity-60 ${
            fieldErrors.email
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
              : "border-slate-800 focus:border-blue-500 focus:ring-blue-500/30"
          }`}
        />
        {fieldErrors.email && (
          <p id="patient-email-error" className="mt-1 text-xs text-red-400">
            {fieldErrors.email}
          </p>
        )}
      </div>

      {/* Action Buttons */}
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
          disabled={isSubmitting || doctors.length === 0}
          className="cursor-pointer disabled:cursor-not-allowed flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/25 transition-colors hover:bg-emerald-500 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Saving...</span>
            </div>
          ) : isEdit ? (
            "Update Patient"
          ) : (
            "Create Patient"
          )}
        </button>
      </div>
    </form>
  );
}

export function PatientFormModal({
  isOpen,
  onClose,
  onSuccess,
  patientToEdit,
  doctors,
}: PatientFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={patientToEdit ? "Edit Patient Record" : "Register New Patient"}
    >
      <PatientFormFields
        key={patientToEdit ? patientToEdit.id : "new-patient"}
        patientToEdit={patientToEdit}
        doctors={doctors}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </Modal>
  );
}

export default PatientFormModal;
