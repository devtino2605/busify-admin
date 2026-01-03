import type { UserInfo } from "../../features/user-management/user-modal";
import apiClient, { type ApiResponse } from "./index";

export interface UserFilterParams {
  search?: string;
  status?: string;
  roleName?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const getAllUsersManagement = async (params: UserFilterParams = {}) => {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.append("search", params.search);
  if (params.status) searchParams.append("status", params.status);
  if (params.roleName) searchParams.append("roleName", params.roleName);
  if (params.page !== undefined)
    searchParams.append("page", params.page.toString());
  if (params.size !== undefined)
    searchParams.append("size", params.size.toString());
  if (params.sortBy) searchParams.append("sortBy", params.sortBy);
  if (params.sortDirection)
    searchParams.append("sortDirection", params.sortDirection);

  const response = await apiClient.get(
    `api/users/management/filter?${searchParams.toString()}`
  );
  return response.data;
};

export const getUserById = async (id: number) => {
  const response = await apiClient.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (userData: UserInfo) => {
  const response = await apiClient.post("api/users", userData);
  return response.data;
};

export const updateUser = async (id: number, userData: UserInfo) => {
  const response = await apiClient.put(`api/users/${id}`, userData);
  return response.data;
};

export const deleteUserById = async (id: number): Promise<ApiResponse> => {
  const response = await apiClient.delete(`api/users/${id}`);
  return response.data;
};

export const getUserProfile = async () => {
  const response = await apiClient.get("api/users/profile");
  return response.data;
};

export const changeUserPassword = async (
  passwordData: ChangePasswordRequest
) => {
  const response = await apiClient.patch(
    "api/users/change-password",
    passwordData
  );
  return response.data;
};

export const updateUserProfile = async (
  userData: Partial<
    Pick<UserInfo, "fullName" | "email" | "phoneNumber" | "address">
  >
) => {
  const response = await apiClient.patch("api/users/profile", userData);
  return response.data;
};
