import apiClient, { type ApiResponse } from "./index";

// Enums
export const DiscountType = {
  PERCENTAGE: "PERCENTAGE",
  FIXED_AMOUNT: "FIXED_AMOUNT",
} as const;

export const PromotionType = {
  AUTO: "auto",
  COUPON: "coupon",
} as const;

export const PromotionStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  EXPIRED: "expired",
} as const;

export const ConditionType = {
  VIEW_VIDEO: "VIEW_VIDEO",
  COMPLETE_SURVEY: "COMPLETE_SURVEY",
  REFERRAL_COUNT: "REFERRAL_COUNT",
  FIRST_PURCHASE: "FIRST_PURCHASE",
  WATCH_AD: "WATCH_AD",
} as const;

export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];
export type PromotionType = (typeof PromotionType)[keyof typeof PromotionType];
export type PromotionStatus =
  (typeof PromotionStatus)[keyof typeof PromotionStatus];
export type ConditionType = (typeof ConditionType)[keyof typeof ConditionType];

// Types
export interface PromotionConditionRequestDTO {
  conditionId?: number;
  conditionType: ConditionType;
  conditionValue?: string;
  isRequired?: boolean;
}

export interface PromotionConditionResponseDTO {
  conditionId: number;
  conditionType: ConditionType;
  conditionValue?: string;
  isRequired: boolean;
}

export interface PromotionRequestDTO {
  discountType: DiscountType;
  promotionType: PromotionType;
  discountValue: number;
  minOrderValue?: number;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  usageLimit?: number;
  priority?: number;
  status: PromotionStatus;
  conditions?: PromotionConditionRequestDTO[];
}

export interface PromotionResponseDTO {
  id: number;
  code: string;
  discountType: DiscountType;
  promotionType: PromotionType;
  discountValue: number;
  minOrderValue?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usageCount: number;
  priority?: number;
  status: PromotionStatus;
  conditions?: PromotionConditionResponseDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface PromotionFilterParams {
  search?: string;
  status?: PromotionStatus;
  type?: PromotionType;
  minDiscount?: number;
  maxDiscount?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export interface PromotionFilterResponseDTO {
  promotions: PromotionResponseDTO[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// API Functions
export const createPromotion = async (
  data: PromotionRequestDTO
): Promise<ApiResponse<PromotionResponseDTO>> => {
  const response = await apiClient.post("/api/promotions", data);
  return response.data;
};

export const getPromotionById = async (
  id: number
): Promise<ApiResponse<PromotionResponseDTO>> => {
  const response = await apiClient.get(`/api/promotions/${id}`);
  return response.data;
};

export const getPromotionConditions = async (
  promotionId: number
): Promise<ApiResponse<PromotionConditionResponseDTO[]>> => {
  const response = await apiClient.get(
    `/api/promotions/${promotionId}/conditions`
  );
  return response.data;
};

export const filterPromotions = async (
  params: PromotionFilterParams
): Promise<ApiResponse<PromotionFilterResponseDTO>> => {
  const response = await apiClient.get("/api/promotions/filter", { params });
  return response.data;
};

export const updatePromotion = async (
  id: number,
  data: Partial<PromotionRequestDTO>
): Promise<ApiResponse<PromotionResponseDTO>> => {
  console.log("Updating promotion with data:", data);
  const response = await apiClient.put(`/api/promotions/${id}`, data);
  console.log("data response", response.data);
  return response.data;
};

export const deletePromotion = async (
  id: number
): Promise<ApiResponse<void>> => {
  const response = await apiClient.delete(`/api/promotions/${id}`);
  console.log("Delete promotion API response:", response.data);
  return response.data;
};
