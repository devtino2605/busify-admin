import apiClient, { type ApiResponse } from "./index";
import { type PromotionRequestDTO } from "./promotion";

// Extended promotion type for campaigns (supports both new and existing)
export interface CampaignPromotionData
  extends Omit<PromotionRequestDTO, "startDate" | "endDate"> {
  tempId?: string;
  isExisting?: boolean; // Whether this is an existing promotion
  promotionId?: number; // ID of existing promotion
}

// Types
export interface PromotionCampaignCreateDTO {
  title: string;
  description?: string;
  banner?: File;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  active?: boolean;
  // promotions cho campaign - có thể là mới hoặc có sẵn
  promotions?: CampaignPromotionData[];
}

export interface PromotionCampaignUpdateDTO {
  title?: string;
  description?: string;
  banner?: File;
  startDate?: string;
  endDate?: string;
  active?: boolean;
  // Update promotions - chỉ support khi có startDate và endDate
  promotions?: CampaignPromotionData[];
}

export interface PromotionCampaignResponseDTO {
  campaignId: number;
  title: string;
  description?: string;
  bannerUrl?: string;
  startDate: string;
  endDate: string;
  active: boolean;
  deleted: boolean; // New field for soft delete status
  promotionCount: number;
  promotions?: Array<{
    id: number;
    code: string;
    discountType: string;
    promotionType: string;
    discountValue: number;
    minOrderValue?: number;
    startDate: string;
    endDate: string;
    usageLimit?: number;
    status: string;
    priority?: number;
    conditions?: Array<{
      conditionId: number;
      conditionType: string;
      conditionValue?: string;
      isRequired: boolean;
    }>;
  }>; // Full promotion objects from backend
  createdAt?: string;
  updatedAt?: string;
}

export interface PromotionCampaignFilterParams {
  search?: string;
  active?: boolean;
  deleted?: boolean; // New field for filtering deleted campaigns
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export interface PromotionCampaignFilterResponseDTO {
  campaigns: PromotionCampaignResponseDTO[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// API Functions
export const createPromotionCampaign = async (
  data: PromotionCampaignCreateDTO
): Promise<ApiResponse<PromotionCampaignResponseDTO>> => {
  const formData = new FormData();

  formData.append("title", data.title);
  if (data.description) {
    formData.append("description", data.description);
  }
  if (data.banner) {
    formData.append("banner", data.banner);
  }
  formData.append("startDate", data.startDate);
  formData.append("endDate", data.endDate);
  formData.append("active", String(data.active ?? true));

  // Add promotions data if any
  if (data.promotions && data.promotions.length > 0) {
    // Separate new promotions and existing promotion IDs
    const newPromotions = data.promotions.filter(
      (p: CampaignPromotionData) => !p.isExisting
    );
    const existingPromotionIds = data.promotions
      .filter((p: CampaignPromotionData) => p.isExisting && p.promotionId)
      .map((p: CampaignPromotionData) => p.promotionId!);

    // Add new promotions
    newPromotions.forEach((promotion, index) => {
      formData.append(
        `promotions[${index}].discountType`,
        promotion.discountType
      );
      formData.append(
        `promotions[${index}].promotionType`,
        promotion.promotionType
      );
      formData.append(
        `promotions[${index}].discountValue`,
        promotion.discountValue.toString()
      );
      formData.append(`promotions[${index}].status`, promotion.status);
      formData.append(`promotions[${index}].startDate`, data.startDate); // Use campaign dates
      formData.append(`promotions[${index}].endDate`, data.endDate); // Use campaign dates

      if (promotion.minOrderValue !== undefined) {
        formData.append(
          `promotions[${index}].minOrderValue`,
          promotion.minOrderValue.toString()
        );
      }
      if (promotion.usageLimit !== undefined) {
        formData.append(
          `promotions[${index}].usageLimit`,
          promotion.usageLimit.toString()
        );
      }
      if (promotion.priority !== undefined) {
        formData.append(
          `promotions[${index}].priority`,
          promotion.priority.toString()
        );
      }

      // Add conditions if provided
      if (promotion.conditions && promotion.conditions.length > 0) {
        promotion.conditions.forEach((condition, conditionIndex) => {
          formData.append(
            `promotions[${index}].conditions[${conditionIndex}].conditionType`,
            condition.conditionType
          );
          if (condition.conditionValue) {
            formData.append(
              `promotions[${index}].conditions[${conditionIndex}].conditionValue`,
              condition.conditionValue
            );
          }
          if (condition.isRequired !== undefined) {
            formData.append(
              `promotions[${index}].conditions[${conditionIndex}].isRequired`,
              condition.isRequired.toString()
            );
          }
        });
      }
    });

    // Add existing promotion IDs
    existingPromotionIds.forEach((promotionId, index) => {
      formData.append(`existingPromotionIds[${index}]`, promotionId.toString());
    });
  }

  console.log("Creating campaign with data:", formData.values());
  const response = await apiClient.post("/api/promotion-campaigns", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const getPromotionCampaignById = async (
  id: number
): Promise<ApiResponse<PromotionCampaignResponseDTO>> => {
  const response = await apiClient.get(`/api/promotion-campaigns/${id}`);
  return response.data;
};

// Get all promotion campaigns (auto-filtered to exclude deleted campaigns)
export const getAllPromotionCampaigns = async (): Promise<
  ApiResponse<PromotionCampaignFilterResponseDTO>
> => {
  const response = await apiClient.get("/api/promotion-campaigns");
  return response.data;
};

// Frontend filtering utility
export const filterCampaignsOnFrontend = (
  campaigns: PromotionCampaignResponseDTO[],
  filters: PromotionCampaignFilterParams
): PromotionCampaignResponseDTO[] => {
  let filtered = [...campaigns];

  // Filter by search (title)
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter((campaign) =>
      campaign.title.toLowerCase().includes(searchLower)
    );
  }

  // Filter by active status
  if (filters.active !== undefined) {
    filtered = filtered.filter(
      (campaign) => campaign.active === filters.active
    );
  }

  // Filter by deleted status (default to showing non-deleted campaigns)
  if (filters.deleted !== undefined) {
    filtered = filtered.filter(
      (campaign) => campaign.deleted === filters.deleted
    );
  } else {
    // If no deleted filter specified, show only non-deleted campaigns by default
    filtered = filtered.filter((campaign) => campaign.deleted === false);
  }

  // Filter by date range
  if (filters.startDate && filters.endDate) {
    filtered = filtered.filter((campaign) => {
      const campaignStart = new Date(campaign.startDate);
      const campaignEnd = new Date(campaign.endDate);
      const filterStart = new Date(filters.startDate!);
      const filterEnd = new Date(filters.endDate!);

      // Check if campaign date range overlaps with filter date range
      return (
        (campaignStart >= filterStart && campaignStart <= filterEnd) ||
        (campaignEnd >= filterStart && campaignEnd <= filterEnd) ||
        (campaignStart <= filterStart && campaignEnd >= filterEnd)
      );
    });
  }

  return filtered;
};

// Frontend pagination utility
export const paginateCampaigns = (
  campaigns: PromotionCampaignResponseDTO[],
  page: number = 1,
  size: number = 20
): PromotionCampaignFilterResponseDTO => {
  const startIndex = (page - 1) * size;
  const endIndex = startIndex + size;
  const paginatedCampaigns = campaigns.slice(startIndex, endIndex);

  const totalElements = campaigns.length;
  const totalPages = Math.ceil(totalElements / size);

  return {
    campaigns: paginatedCampaigns,
    currentPage: page,
    totalPages,
    totalElements,
    pageSize: size,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
};

export const updatePromotionCampaign = async (
  id: number,
  data: PromotionCampaignUpdateDTO
): Promise<ApiResponse<PromotionCampaignResponseDTO>> => {
  const formData = new FormData();

  if (data.title) {
    formData.append("title", data.title);
  }
  if (data.description) {
    formData.append("description", data.description);
  }
  if (data.banner) {
    formData.append("banner", data.banner);
  }
  if (data.startDate) {
    formData.append("startDate", data.startDate);
  }
  if (data.endDate) {
    formData.append("endDate", data.endDate);
  }
  if (data.active !== undefined) {
    formData.append("active", String(data.active));
  }

  // Add promotions data if any (only if both startDate and endDate are provided)
  if (
    data.promotions &&
    data.promotions.length > 0 &&
    data.startDate &&
    data.endDate
  ) {
    // Separate new promotions and existing promotion IDs
    const newPromotions = data.promotions.filter(
      (p: CampaignPromotionData) => !p.isExisting
    );
    const existingPromotionIds = data.promotions
      .filter((p: CampaignPromotionData) => p.isExisting && p.promotionId)
      .map((p: CampaignPromotionData) => p.promotionId!);

    // Add new promotions
    newPromotions.forEach((promotion, index) => {
      formData.append(
        `promotions[${index}].discountType`,
        promotion.discountType
      );
      formData.append(
        `promotions[${index}].promotionType`,
        promotion.promotionType
      );
      formData.append(
        `promotions[${index}].discountValue`,
        promotion.discountValue.toString()
      );
      formData.append(`promotions[${index}].status`, promotion.status);
      formData.append(`promotions[${index}].startDate`, data.startDate!);
      formData.append(`promotions[${index}].endDate`, data.endDate!);

      if (promotion.minOrderValue !== undefined) {
        formData.append(
          `promotions[${index}].minOrderValue`,
          promotion.minOrderValue.toString()
        );
      }
      if (promotion.usageLimit !== undefined) {
        formData.append(
          `promotions[${index}].usageLimit`,
          promotion.usageLimit.toString()
        );
      }
      if (promotion.priority !== undefined) {
        formData.append(
          `promotions[${index}].priority`,
          promotion.priority.toString()
        );
      }

      // Add conditions if provided
      if (promotion.conditions && promotion.conditions.length > 0) {
        promotion.conditions.forEach((condition, conditionIndex) => {
          formData.append(
            `promotions[${index}].conditions[${conditionIndex}].conditionType`,
            condition.conditionType
          );
          if (condition.conditionValue) {
            formData.append(
              `promotions[${index}].conditions[${conditionIndex}].conditionValue`,
              condition.conditionValue
            );
          }
          if (condition.isRequired !== undefined) {
            formData.append(
              `promotions[${index}].conditions[${conditionIndex}].isRequired`,
              condition.isRequired.toString()
            );
          }
        });
      }
    });
    console.log("Existing Promotion IDs:", existingPromotionIds);

    // Add existing promotion IDs
    existingPromotionIds.forEach((promotionId, index) => {
      formData.append(`existingPromotionIds[${index}]`, promotionId.toString());
    });
  }

  const response = await apiClient.put(
    `/api/promotion-campaigns/${id}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  console.log("Update campaign API response:", response.data);
  return response.data;
};

export const deletePromotionCampaign = async (
  id: number
): Promise<ApiResponse<void>> => {
  const response = await apiClient.delete(`/api/promotion-campaigns/${id}`);
  console.log("Delete campaign API response:", response.data);
  return response.data;
};

export const restorePromotionCampaign = async (
  id: number
): Promise<ApiResponse<PromotionCampaignResponseDTO>> => {
  const response = await apiClient.post(
    `/api/promotion-campaigns/${id}/restore`
  );
  console.log("Restore campaign API response:", response.data);
  return response.data;
};
