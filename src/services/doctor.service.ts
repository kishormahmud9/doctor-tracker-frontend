import { apiClient } from "@/lib/api";
import type {
  ApiResponse,
  Doctor,
  CreateDoctorInput,
  UpdateDoctorInput,
  GetDoctorsQuery,
  GetDoctorsResult,
} from "@/types";

export const doctorService = {
  /**
   * Retrieves doctors with pagination, search, and filtering
   */
  async getDoctors(
    query?: GetDoctorsQuery,
    token?: string | null
  ): Promise<GetDoctorsResult> {
    const params: Record<string, string | number | undefined> = {};
    if (query?.page) params.page = query.page;
    if (query?.limit) params.limit = query.limit;
    if (query?.search) params.search = query.search;
    if (query?.specialization) params.specialization = query.specialization;
    if (query?.hospital) params.hospital = query.hospital;
    if (query?.startDate) params.startDate = query.startDate;
    if (query?.endDate) params.endDate = query.endDate;

    const response = await apiClient.get<ApiResponse<GetDoctorsResult>>(
      "/doctors",
      { params, token }
    );

    if (!response.data) {
      throw new Error(response.message || "Failed to retrieve doctors list");
    }

    return response.data;
  },

  /**
   * Retrieves single doctor by ID
   */
  async getDoctorById(id: string, token?: string | null): Promise<Doctor> {
    const response = await apiClient.get<ApiResponse<{ doctor: Doctor }>>(
      `/doctors/${encodeURIComponent(id)}`,
      { token }
    );

    if (!response.data || !response.data.doctor) {
      throw new Error(response.message || "Failed to retrieve doctor details");
    }

    return response.data.doctor;
  },

  /**
   * Creates a new doctor record
   */
  async createDoctor(
    data: CreateDoctorInput,
    token?: string | null
  ): Promise<Doctor> {
    const response = await apiClient.post<ApiResponse<{ doctor: Doctor }>>(
      "/doctors",
      data,
      { token }
    );

    if (!response.data || !response.data.doctor) {
      throw new Error(response.message || "Failed to create doctor record");
    }

    return response.data.doctor;
  },

  /**
   * Updates an existing doctor by ID
   */
  async updateDoctor(
    id: string,
    data: UpdateDoctorInput,
    token?: string | null
  ): Promise<Doctor> {
    const response = await apiClient.patch<ApiResponse<{ doctor: Doctor }>>(
      `/doctors/${encodeURIComponent(id)}`,
      data,
      { token }
    );

    if (!response.data || !response.data.doctor) {
      throw new Error(response.message || "Failed to update doctor record");
    }

    return response.data.doctor;
  },

  /**
   * Deletes a doctor by ID (enforcing foreign-key constraints)
   */
  async deleteDoctor(id: string, token?: string | null): Promise<void> {
    await apiClient.delete<ApiResponse>(
      `/doctors/${encodeURIComponent(id)}`,
      { token }
    );
  },

  /**
   * Retrieves patients associated with a specific doctor (supports pagination)
   */
  async getDoctorPatients(
    doctorId: string,
    query?: { page?: number; limit?: number; search?: string; condition?: string; startDate?: string; endDate?: string },
    token?: string | null
  ): Promise<{ patients: import("@/types").Patient[]; pagination: import("@/types").PaginationMeta }> {
    const params: Record<string, string | number | undefined> = {};
    if (query?.page) params.page = query.page;
    if (query?.limit) params.limit = query.limit;
    if (query?.search) params.search = query.search;
    if (query?.condition) params.condition = query.condition;
    if (query?.startDate) params.startDate = query.startDate;
    if (query?.endDate) params.endDate = query.endDate;

    const response = await apiClient.get<
      import("@/types").ApiResponse<{
        patients: import("@/types").Patient[];
        pagination: import("@/types").PaginationMeta;
      }>
    >(`/doctors/${encodeURIComponent(doctorId)}/patients`, { params, token });

    if (!response.data) {
      throw new Error(response.message || "Failed to retrieve doctor patients");
    }

    return response.data;
  },

  /**
   * Creates a patient directly associated with a specific doctor
   */
  async createDoctorPatient(
    doctorId: string,
    data: Omit<import("@/types").CreatePatientInput, "doctorId">,
    token?: string | null
  ): Promise<import("@/types").Patient> {
    const response = await apiClient.post<
      import("@/types").ApiResponse<{ patient: import("@/types").Patient }>
    >(`/doctors/${encodeURIComponent(doctorId)}/patients`, data, { token });

    if (!response.data || !response.data.patient) {
      throw new Error(response.message || "Failed to create patient under doctor");
    }

    return response.data.patient;
  },

  /**
   * Deletes a patient specifically associated with a doctor
   */
  async deleteDoctorPatient(
    doctorId: string,
    patientId: string,
    token?: string | null
  ): Promise<void> {
    await apiClient.delete<import("@/types").ApiResponse>(
      `/doctors/${encodeURIComponent(doctorId)}/patients/${encodeURIComponent(patientId)}`,
      { token }
    );
  },
};

export default doctorService;
