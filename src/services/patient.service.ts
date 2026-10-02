import { apiClient } from "@/lib/api";
import type {
  ApiResponse,
  Patient,
  CreatePatientInput,
  UpdatePatientInput,
  GetPatientsQuery,
  GetPatientsResult,
} from "@/types";

export const patientService = {
  /**
   * Retrieves patients with pagination, search, doctor filter, and condition filter
   */
  async getPatients(
    query?: GetPatientsQuery,
    token?: string | null
  ): Promise<GetPatientsResult> {
    const params: Record<string, string | number | undefined> = {};
    if (query?.page) params.page = query.page;
    if (query?.limit) params.limit = query.limit;
    if (query?.search) params.search = query.search;
    if (query?.doctorId) params.doctorId = query.doctorId;
    if (query?.condition) params.condition = query.condition;
    if (query?.startDate) params.startDate = query.startDate;
    if (query?.endDate) params.endDate = query.endDate;

    const response = await apiClient.get<ApiResponse<GetPatientsResult>>(
      "/patients",
      { params, token }
    );

    if (!response.data) {
      throw new Error(response.message || "Failed to retrieve patients list");
    }

    return response.data;
  },

  /**
   * Retrieves single patient by ID
   */
  async getPatientById(id: string, token?: string | null): Promise<Patient> {
    const response = await apiClient.get<ApiResponse<{ patient: Patient }>>(
      `/patients/${encodeURIComponent(id)}`,
      { token }
    );

    if (!response.data || !response.data.patient) {
      throw new Error(response.message || "Failed to retrieve patient details");
    }

    return response.data.patient;
  },

  /**
   * Creates a new patient record with assigned doctorId
   */
  async createPatient(
    data: CreatePatientInput,
    token?: string | null
  ): Promise<Patient> {
    const response = await apiClient.post<ApiResponse<{ patient: Patient }>>(
      "/patients",
      data,
      { token }
    );

    if (!response.data || !response.data.patient) {
      throw new Error(response.message || "Failed to create patient record");
    }

    return response.data.patient;
  },

  /**
   * Updates an existing patient record by ID
   */
  async updatePatient(
    id: string,
    data: UpdatePatientInput,
    token?: string | null
  ): Promise<Patient> {
    const response = await apiClient.patch<ApiResponse<{ patient: Patient }>>(
      `/patients/${encodeURIComponent(id)}`,
      data,
      { token }
    );

    if (!response.data || !response.data.patient) {
      throw new Error(response.message || "Failed to update patient record");
    }

    return response.data.patient;
  },

  /**
   * Deletes a patient by ID
   */
  async deletePatient(id: string, token?: string | null): Promise<void> {
    await apiClient.delete<ApiResponse>(
      `/patients/${encodeURIComponent(id)}`,
      { token }
    );
  },
};

export default patientService;
