import apiClient from "./index";

// Interface cho dropdown locations
export interface LocationDropdownItem {
  id: number;
  name: string;
  city: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  region?: LocationRegion;
  status?: LocationStatus;
}

export async function getLocationDropdown(): Promise<LocationDropdownItem[]> {
  try {
    const response = await apiClient.get("api/locations/dropdown");
    console.log("Fetched location dropdown:", response.data);
    return response.data?.result || [];
  } catch (error) {
    console.error("Error fetching location dropdown:", error);
    return [];
  }
}

// Interface cho location data
export interface LocationData {
  id?: number;
  name: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  region: LocationRegion;
  status: LocationStatus;
}

export type LocationRegion = "NORTH" | "SOUTH" | "CENTRAL";
export type LocationStatus = "PENDING" | "APPROVED" | "REJECTED" | "DELETED";

export interface LocationResponse {
  code: number;
  message: string;
  result?: LocationData;
}

export interface LocationFilterParams {
  search?: string;
  status?: LocationStatus;
  region?: LocationRegion;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export interface LocationListResponse {
  code: number;
  message: string;
  result?: {
    content: LocationData[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
}

export async function getLocations(
  params: LocationFilterParams
): Promise<LocationListResponse> {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.append("search", params.search);
  if (params.status) searchParams.append("status", params.status);
  if (params.region) searchParams.append("region", params.region);
  if (params.page !== undefined)
    searchParams.append("page", params.page.toString());
  if (params.size !== undefined)
    searchParams.append("size", params.size.toString());
  if (params.sortBy) searchParams.append("sortBy", params.sortBy);
  if (params.sortDirection)
    searchParams.append("sortDirection", params.sortDirection);

  const response = await apiClient.get(
    `/api/locations?${searchParams.toString()}`
  );
  return response.data;
}

export async function createLocation(
  data: Partial<LocationData>
): Promise<LocationResponse> {
  const response = await apiClient.post("api/locations", data);
  return response.data;
}

export async function updateLocation(
  id: number,
  data: Partial<LocationData>
): Promise<LocationResponse> {
  const response = await apiClient.put(`api/locations/${id}`, data);
  return response.data;
}

export async function approveLocation(id: number): Promise<LocationResponse> {
  const response = await apiClient.put(`api/locations/${id}/approve`);
  return response.data;
}

export async function rejectLocation(id: number): Promise<LocationResponse> {
  const response = await apiClient.put(`api/locations/${id}/reject`);
  return response.data;
}

export async function deleteLocation(id: number): Promise<LocationResponse> {
  const response = await apiClient.delete(`api/locations/${id}`);
  return response.data;
}
