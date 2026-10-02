import { apiClient } from "@/lib/api";
import type {
  ApiResponse,
  DashboardSummary,
  SummaryQuery,
  PatientsPerDoctor,
  DateStatistics,
  DateStatisticsQuery,
} from "@/types";

export const dashboardService = {
  /**
   * Retrieves overall system counts and average patients per doctor.
   * If date range parameters are provided, includes range-specific counts.
   */
  async getSummary(
    query?: SummaryQuery,
    token?: string | null
  ): Promise<DashboardSummary> {
    const params: Record<string, string | undefined> = {};
    if (query?.startDate) params.startDate = query.startDate;
    if (query?.endDate) params.endDate = query.endDate;

    const response = await apiClient.get<ApiResponse<DashboardSummary>>(
      "/dashboard/summary",
      { params, token }
    );

    if (!response.data) {
      throw new Error(response.message || "Failed to retrieve dashboard summary");
    }

    return response.data;
  },

  /**
   * Retrieves patient distribution count assigned to each doctor.
   * Preserves doctors with 0 patients.
   */
  async getPatientsPerDoctor(
    token?: string | null
  ): Promise<PatientsPerDoctor> {
    const response = await apiClient.get<ApiResponse<PatientsPerDoctor>>(
      "/dashboard/patients-per-doctor",
      { token }
    );

    if (!response.data) {
      throw new Error(response.message || "Failed to retrieve patients per doctor metrics");
    }

    return response.data;
  },

  /**
   * Retrieves time-series statistics of doctor and patient registrations
   * grouped by day or month within the specified date range.
   */
  async getDateStatistics(
    query?: DateStatisticsQuery,
    token?: string | null
  ): Promise<DateStatistics> {
    const params: Record<string, string | undefined> = {};
    if (query?.startDate) params.startDate = query.startDate;
    if (query?.endDate) params.endDate = query.endDate;
    if (query?.groupBy) params.groupBy = query.groupBy;
    if (query?.timezone) params.timezone = query.timezone;

    const response = await apiClient.get<ApiResponse<DateStatistics>>(
      "/dashboard/date-statistics",
      { params, token }
    );

    if (!response.data) {
      throw new Error(response.message || "Failed to retrieve date statistics");
    }

    return response.data;
  },
};

export default dashboardService;
