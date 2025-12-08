
import { QuarterPackageResponse, RecordApprovalResponse, Quarter } from "@/types/api";
import { apiClient, ApiError } from "@/lib/api-client";

export interface QuarterPackageService {
  getAllQuarterPackages(): Promise<QuarterPackageResponse[]>;
  getQuarterPackage(sectionId: string, quarter: Quarter): Promise<QuarterPackageResponse | null>;
  createQuarterPackage(sectionId: string, quarter: Quarter): Promise<QuarterPackageResponse>;
  submitQuarterPackage(packageId: string, teacherId: string): Promise<QuarterPackageResponse>;
  getApprovalHistory(packageId: string): Promise<RecordApprovalResponse[]>;
}

class QuarterPackagesServiceImpl implements QuarterPackageService {
  async getAllQuarterPackages(): Promise<QuarterPackageResponse[]> {
    try {
      const response = await apiClient.get<QuarterPackageResponse[]>("/api/quarter-packages");
      return response.data;
    } catch (error) {
      console.error("Error fetching all quarter packages:", error);
      throw error;
    }
  }

  async getAdviserQuarterPackages(adviserId: string): Promise<QuarterPackageResponse[]> {
    try {
      const response = await apiClient.get<QuarterPackageResponse[]>(`/api/quarter-packages/adviser/${adviserId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching adviser quarter packages:", error);
      throw error;
    }
  }

  async getQuarterPackage(sectionId: string, quarter: Quarter): Promise<QuarterPackageResponse | null> {
    try {
      const response = await apiClient.get<QuarterPackageResponse[]>(`/api/quarter-packages/section/${sectionId}`);
      const packages = response.data;
      // Find the package for the specific quarter
      const quarterPackage = packages.find(pkg => pkg.quarter === quarter);
      return quarterPackage || null;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null; // No packages found for section
      }
      console.error("Error fetching quarter package:", error);
      throw error;
    }
  }

  async createQuarterPackage(sectionId: string, quarter: Quarter): Promise<QuarterPackageResponse> {
    try {
      const response = await apiClient.post<QuarterPackageResponse>(`/api/quarter-packages?sectionId=${sectionId}&quarter=${quarter}`);
      return response.data;
    } catch (error) {
      console.error("Error creating quarter package:", error);
      throw error;
    }
  }

  async submitQuarterPackage(packageId: string, teacherId: string): Promise<QuarterPackageResponse> {
    try {
      const response = await apiClient.post<QuarterPackageResponse>(`/api/quarter-packages/${packageId}/submit`, undefined, {
        headers: {
          "X-Teacher-Id": teacherId,
        },
      } as any);
      return response.data;
    } catch (error) {
      console.error("Error submitting quarter package:", error);
      throw error;
    }
  }

  async getApprovalHistory(packageId: string): Promise<RecordApprovalResponse[]> {
    try {
      const response = await apiClient.get<RecordApprovalResponse[]>(`/api/quarter-packages/${packageId}/approvals`);
      return response.data;
    } catch (error) {
      console.error("Error fetching approval history:", error);
      throw error;
    }
  }

  async forwardQuarterPackageToAdmin(packageId: string): Promise<QuarterPackageResponse> {
    try {
      const response = await apiClient.post<QuarterPackageResponse>(`/api/quarter-packages/${packageId}/forward-to-admin`);
      return response.data;
    } catch (error) {
      console.error("Error forwarding quarter package to admin:", error);
      throw error;
    }
  }

  async returnQuarterPackage(packageId: string, remarks: string): Promise<QuarterPackageResponse> {
    try {
      const response = await apiClient.post<QuarterPackageResponse>(`/api/quarter-packages/${packageId}/return`, remarks);
      return response.data;
    } catch (error) {
      console.error("Error returning quarter package:", error);
      throw error;
    }
  }
}

export const quarterPackagesService = new QuarterPackagesServiceImpl();

