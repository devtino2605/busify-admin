/* eslint-disable @typescript-eslint/no-explicit-any */
import apiClient from ".";

export interface Trip {
  trip_id: number;
  operator_name: string;
  operator_avatar?: string;
  route: {
    route_id?: number;
    start_location: string;
    end_location: string;
    default_duration_minutes?: number;
  };
  amenities: {
    wifi?: boolean;
    air_conditioner?: boolean;
    charging?: boolean;
    tv?: boolean;
    toilet?: boolean;
  };
  average_rating: number;
  departure_time: string;
  arrival_time: string;
  status: string;
  price_per_seat: number;
  available_seats: number;
  total_seats?: number;
}

export interface TripResponse {
  code: number;
  message: string;
  result: Trip[];
}

export interface TripSearchParams {
  departureDate?: string;
  untilTime?: string;
  availableSeats?: number;
  startLocation?: number;
  endLocation?: number;
  status?: string;
}

export interface Location {
  locationId: number;
  locationName: string;
}

export interface LocationsResponse {
  code: number;
  message: string;
  result: Location[];
}

export const getAllTrips = async (): Promise<TripResponse> => {
  try {
    const response = await apiClient.get("api/trips");
    return response.data;
  } catch (error: any) {
    console.error("API Error - getAllTrips:", error);
    throw new Error(
      error.response?.data?.message || "Không thể lấy danh sách chuyến đi"
    );
  }
};

export const searchTrips = async (
  params: TripSearchParams
): Promise<TripResponse> => {
  try {
    const response = await apiClient.post("api/trips/search", params);
    return response.data;
  } catch (error: any) {
    console.error("API Error - searchTrips:", error);
    throw new Error(
      error.response?.data?.message || "Không thể tìm kiếm chuyến đi"
    );
  }
};

export const getTripById = async (
  tripId: number
): Promise<{ code: number; message: string; result: Trip }> => {
  try {
    const response = await apiClient.get(`api/trips/${tripId}`);
    return response.data;
  } catch (error: any) {
    console.error("API Error - getTripById:", error);
    throw new Error(
      error.response?.data?.message || "Không thể lấy thông tin chuyến đi"
    );
  }
};

export const getLocations = async (): Promise<LocationsResponse> => {
  try {
    const response = await apiClient.get("api/locations");
    return response.data;
  } catch (error: any) {
    console.error("API Error - getLocations:", error);
    throw new Error("Không thể lấy danh sách địa điểm");
  }
};
