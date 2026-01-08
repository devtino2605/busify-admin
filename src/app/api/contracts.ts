import apiClient from "./index";
import type { ApiResponse } from "./index";

// Contract status enum
export const ContractStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
} as const;

export type ContractStatus =
  (typeof ContractStatus)[keyof typeof ContractStatus];

// Admin review actions enum
export const ReviewAction = {
  APPROVE: "APPROVE",
  REJECT: "REJECT",
  REQUEST_REVISION: "REQUEST_REVISION",
} as const;

export type ReviewAction = (typeof ReviewAction)[keyof typeof ReviewAction];

// AI Verification status enum
export const VerificationStatus = {
  VERIFIED: "VERIFIED",
  MATCHED: "MATCHED",
  PARTIAL_MATCH: "PARTIAL_MATCH",
  MISMATCHED: "MISMATCHED",
  UNVERIFIABLE: "UNVERIFIABLE",
} as const;

export type VerificationStatus =
  (typeof VerificationStatus)[keyof typeof VerificationStatus];

// AI Extracted Info interface
export interface ExtractedInfo {
  vatCode: string | null;
  companyName: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  representativeName: string | null;
  businessLicenseNumber: string | null;
  businessType: string | null;
  issuedDate: string | null;
  issuedBy: string | null;
  representativeNameFromIdCard?: string | null;
  idCardNumber?: string | null;
  confidenceScore: number;
  warnings: string[];
  rawExtractedText: string;
}

// Comparison Result interface
export interface ComparisonResult {
  fieldName: string;
  displayName: string;
  registeredValue: string | null;
  detectedValue: string | null;
  isMatch: boolean;
  similarityScore: number;
  note: string | null;
}

// AI Verification Response interface
export interface AIVerificationResponse {
  contractId: number;
  verificationStatus: VerificationStatus;
  extractedInfo: ExtractedInfo;
  comparisonResults: ComparisonResult[];
  overallConfidenceScore: number | null;
  matchSummary: string | null;
  warnings: string[];
  verifiedAt: string;
  recommendation: string;
}

// Types based on actual API response
export interface ContractData {
  id: number;
  vatCode: string;
  email: string;
  phone: string;
  address: string;
  startDate: string;
  endDate: string;
  operationArea: string;
  attachmentUrl: string;
  representativeIdCardUrl?: string;
  approvedDate?: string;
  adminNote?: string;
  status: ContractStatus;
  createdDate: string;
  updatedDate: string;
  verificationStatus?: VerificationStatus;
  verificationResult?: AIVerificationResponse;
}

export interface PageableInfo {
  pageNumber: number;
  pageSize: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

export interface ContractListResponse {
  content: ContractData[];
  pageable: PageableInfo;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface ReviewContractRequest {
  action: ReviewAction;
  adminNote?: string;
}

export interface ReviewContractResponse {
  id: number;
  vatCode: string;
  email: string;
  phone: string;
  address: string;
  startDate: string;
  endDate: string;
  operationArea: string;
  attachmentUrl: string;
  approvedDate?: string;
  adminNote?: string;
  status: ContractStatus;
  createdDate: string;
  updatedDate: string;
}

export interface ContractFilterParams {
  page?: number;
  size?: number;
  status?: ContractStatus;
  email?: string;
  operationArea?: string;
}

// Contract API functions
export const contractsApi = {
  // Get all contracts with pagination and filters
  getAllContracts: async (
    params: ContractFilterParams = {}
  ): Promise<ContractListResponse> => {
    const { page = 1, size = 10, status, email, operationArea } = params;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    if (status) {
      searchParams.append("status", status);
    }
    if (email) {
      searchParams.append("email", email);
    }
    if (operationArea) {
      searchParams.append("operationArea", operationArea);
    }

    const response = await apiClient.get<ApiResponse<ContractListResponse>>(
      `/api/contracts/admin/all?${searchParams.toString()}`
    );
    return response.data.result;
  },

  // Admin review contract
  reviewContract: async (
    contractId: number,
    data: ReviewContractRequest
  ): Promise<ApiResponse<ReviewContractResponse>> => {
    const response = await apiClient.post<ApiResponse<ReviewContractResponse>>(
      `/api/contracts/admin/${contractId}/review`,
      data
    );
    return response.data;
  },

  // Get contract by ID (optional for future use)
  getContractById: async (contractId: number): Promise<ContractData> => {
    const response = await apiClient.get<ApiResponse<ContractData>>(
      `/api/contracts/admin/${contractId}`
    );
    return response.data.result;
  },

  // AI Verify contract - Extract info from license image and compare with registered info
  verifyContractWithAI: async (
    contractId: number
  ): Promise<ApiResponse<AIVerificationResponse>> => {
    const response = await apiClient.post<ApiResponse<AIVerificationResponse>>(
      `/api/contracts/admin/${contractId}/verify-with-ai`
    );
    return response.data;
  },
};
