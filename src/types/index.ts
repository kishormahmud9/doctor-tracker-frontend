/**
 * Common API Response Types
 * Aligned with Doctor Tracker Express backend contract:
 * { status: "success" | "fail" | "error", message?: string, data?: T, errors?: [...] }
 */
export type ApiStatus = "success" | "fail" | "error";

export interface ApiValidationError {
  field: string;
  message: string;
}

export interface ApiResponse<T = unknown> {
  status: ApiStatus;
  message?: string;
  data?: T;
  errors?: ApiValidationError[];
  stack?: string;
}

export interface ApiSuccessResponse<T> {
  status: "success";
  message?: string;
  data: T;
}

export interface ApiFailResponse {
  status: "fail";
  message: string;
  errors?: ApiValidationError[];
}

export interface ApiErrorResponse {
  status: "error";
  message: string;
  stack?: string;
}

export interface PaginationMeta {
  totalRecords: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Authentication Types
 * Based on Admin model and /api/auth endpoints
 */
export interface Admin {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  admin: Admin;
}

/**
 * Dashboard Analytics Types
 * Based on GET /api/dashboard/summary, GET /api/dashboard/patients-per-doctor,
 * and GET /api/dashboard/date-statistics
 */
export interface DashboardSummaryRange {
  startDate?: string;
  endDate?: string;
  doctorsInRange: number;
  patientsInRange: number;
}

export interface DashboardSummary {
  totalDoctors: number;
  totalPatients: number;
  averagePatientsPerDoctor: number;
  range?: DashboardSummaryRange;
}

export interface DoctorPatientCountItem {
  doctorId: string;
  doctorName: string;
  specialization: string;
  hospital: string;
  patientCount: number;
}

export interface PatientsPerDoctor {
  doctors: DoctorPatientCountItem[];
  totalDoctors: number;
}

export interface DateStatisticsPoint {
  date: string;
  doctorsCreated: number;
  patientsCreated: number;
}

export interface DateStatisticsSummary {
  groupBy: "day" | "month";
  timezone: string;
  startDate?: string;
  endDate?: string;
  totalDoctorsInRange: number;
  totalPatientsInRange: number;
}

export interface DateStatistics {
  timeline: DateStatisticsPoint[];
  summary: DateStatisticsSummary;
}

export interface DateStatisticsQuery {
  startDate?: string;
  endDate?: string;
  groupBy?: "day" | "month";
  timezone?: string;
}

export interface SummaryQuery {
  startDate?: string;
  endDate?: string;
}

/**
 * Doctor Types
 */
export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDoctorInput {
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
}

export interface UpdateDoctorInput {
  name?: string;
  specialization?: string;
  hospital?: string;
  phone?: string;
  email?: string;
}

export interface GetDoctorsQuery {
  page?: number;
  limit?: number;
  search?: string;
  specialization?: string;
  hospital?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetDoctorsResult {
  doctors: Doctor[];
  pagination: PaginationMeta;
}

/**
 * Patient Types
 */
export type PatientGender = "male" | "female" | "other";

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: PatientGender;
  phone: string;
  condition: string;
  email?: string;
  doctorId: string;
  doctor?: Doctor;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePatientInput {
  name: string;
  age: number;
  gender: PatientGender;
  phone: string;
  condition: string;
  doctorId: string;
  email?: string;
}

export interface UpdatePatientInput {
  name?: string;
  age?: number;
  gender?: PatientGender;
  phone?: string;
  condition?: string;
  doctorId?: string;
  email?: string;
}

export interface GetPatientsQuery {
  page?: number;
  limit?: number;
  search?: string;
  doctorId?: string;
  condition?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetPatientsResult {
  patients: Patient[];
  pagination: PaginationMeta;
}
