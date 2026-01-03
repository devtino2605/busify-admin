import apiClient from ".";

export interface Booking {
  booking_id: number;
  route_name: string;
  departure_time: string;
  arrival_time: string;
  departure_name: string;
  arrival_name: string;
  booking_code: string;
  status: string;
  total_amount: number;
  booking_date: string;
  ticket_count: number;
  payment_method: string;
  selling_method?: "ONLINE" | "OFFLINE";
}

export interface BookingDetail {
  id: number;
  bookingCode: string;
  guestFullName: string;
  guestEmail: string;
  guestPhone: string;
  guestAddress?: string;
  seatNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  tripId: number;
}

export interface BookingResponse {
  code: number;
  message: string;
  result: PaginatedBookingResult;
}

export interface BookingDetailResponse {
  code: number;
  message: string;
  // API returns an array of detailed booking objects
  result: BookingDetailAPI[];
}

// Detailed booking shape returned by GET /api/bookings/{code}
export interface BookingDetailAPI {
  booking_id: number;
  passenger_name: string;
  phone: string;
  email: string;
  address: string;
  guestFullName: string;
  guestEmail: string;
  guestPhone: string;
  guestAddress: string;
  route_start: {
    name: string;
    address: string;
    city: string;
  };
  route_end: {
    name: string;
    address: string;
    city: string;
  };
  operator_name: string;
  departure_time: string;
  arrival_estimate_time: string;
  bus: {
    model: string;
    license_plate: string;
  };
  tickets: {
    seat_number: string;
    ticket_code: string;
  }[];
  status: string;
  payment_info: {
    amount: number;
    method: string;
    timestamp: string;
  };
  selling_method?: "ONLINE" | "OFFLINE";
}

export interface UpdateBookingParams {
  guestAddress?: string;
  guestFullName?: string;
  guestPhone?: string;
  guestEmail?: string;
}

export interface SearchBookingParams {
  bookingCode?: string;
  route?: string;
  status?: string;
  departureDate?: string; // ISO date format YYYY-MM-DD
  arrivalDate?: string; // ISO date format YYYY-MM-DD
  startDate?: string; // ISO date format YYYY-MM-DD
  endDate?: string; // ISO date format YYYY-MM-DD
  sellingMethod?: "ONLINE" | "OFFLINE";
  page?: number;
  size?: number;
}

export interface PaginatedBookingResult {
  result: Booking[];
  totalRecords: number;
  pageNumber: number;
  totalPages: number;
  pageSize: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface SearchBookingResponse {
  code: number;
  message: string;
  result: PaginatedBookingResult;
}

export interface BookingAddRequestDTO {
  tripId: number;
  seatNumber: string; // comma-separated seat numbers
  totalAmount: number;
  guestFullName: string;
  guestPhone: string;
  guestEmail?: string;
  guestAddress?: string;
  promotionId?: number | null;
  discountCode?: string | null;
}

export interface BookingAddResponseDTO {
  bookingId: number;
  bookingCode: string;
  discountCode: string | null;
  seatNumber: string;
  totalAmount: number;
  status: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export const getAllBookings = async (
  page: number = 1,
  size: number = 10
): Promise<BookingResponse> => {
  try {
    const response = await apiClient.get(
      `api/bookings/all?page=${page}&size=${size}`
    );
    return response.data;
  } catch (error) {
    throw new Error("Không thể lấy danh sách đặt vé" + error);
  }
};

export const getBookingByCode = async (
  bookingCode: string
): Promise<BookingDetailResponse> => {
  try {
    const response = await apiClient.get(`api/bookings/${bookingCode}`);
    return response.data;
  } catch (error) {
    throw new Error("Không thể lấy thông tin chi tiết đặt vé" + error);
  }
};

export const updateBooking = async (
  bookingCode: string,
  params: UpdateBookingParams
): Promise<BookingDetailResponse> => {
  try {
    const response = await apiClient.patch(
      `api/bookings/${bookingCode}`,
      params
    );
    return response.data;
  } catch (error) {
    throw new Error("Không thể cập nhật thông tin đặt vé" + error);
  }
};

export const searchBookings = async (
  params: SearchBookingParams = {}
): Promise<SearchBookingResponse> => {
  try {
    const queryParams = new URLSearchParams();

    // Add optional parameters to query string
    if (params.bookingCode)
      queryParams.append("bookingCode", params.bookingCode);
    if (params.route) queryParams.append("route", params.route);
    if (params.status) queryParams.append("status", params.status);
    if (params.departureDate)
      queryParams.append("departureDate", params.departureDate);
    if (params.arrivalDate)
      queryParams.append("arrivalDate", params.arrivalDate);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    if (params.sellingMethod)
      queryParams.append("sellingMethod", params.sellingMethod);

    // Add pagination parameters with defaults
    queryParams.append("page", (params.page || 1).toString());
    queryParams.append("size", (params.size || 10).toString());

    const response = await apiClient.get(
      `api/bookings/search?${queryParams.toString()}`
    );
    return response.data;
  } catch (error) {
    throw new Error("Không thể tìm kiếm đặt vé" + error);
  }
};

// delete booking
export const deleteBooking = async (bookingCode: string): Promise<boolean> => {
  try {
    const response = await apiClient.delete(`/api/bookings/${bookingCode}`);
    return response.status === 200;
  } catch (error) {
    throw new Error("Không thể xóa đặt vé" + error);
  }
};

// manual booking
export const createManualBooking = async (
  bookingData: BookingAddRequestDTO
): Promise<ApiResponse<BookingAddResponseDTO>> => {
  try {
    const response = await apiClient.post(
      `api/bookings/manual-booking`,
      bookingData
    );
    return response.data;
  } catch (error) {
    throw new Error("Không thể tạo đặt vé thủ công" + error);
  }
};

// Get all bookings for statistics (using large page size)
export const getAllBookingsForStats = async (
  params: Omit<SearchBookingParams, "page" | "size"> = {}
): Promise<SearchBookingResponse> => {
  try {
    const queryParams = new URLSearchParams();

    // Add optional parameters to query string (same as search but with large page size)
    if (params.bookingCode)
      queryParams.append("bookingCode", params.bookingCode);
    if (params.route) queryParams.append("route", params.route);
    if (params.status) queryParams.append("status", params.status);
    if (params.departureDate)
      queryParams.append("departureDate", params.departureDate);
    if (params.arrivalDate)
      queryParams.append("arrivalDate", params.arrivalDate);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);

    // Use large page size to get all records for statistics
    queryParams.append("page", "1");
    queryParams.append("size", "10000"); // Large number to get all records

    const response = await apiClient.get(
      `api/bookings/search?${queryParams.toString()}`
    );
    return response.data;
  } catch (error) {
    throw new Error("Không thể lấy dữ liệu thống kê đặt vé" + error);
  }
};
