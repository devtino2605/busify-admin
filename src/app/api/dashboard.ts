import { getAllUsersManagement, type UserFilterParams } from "./user";
import {
  getAllBusOperatorsManagement,
  type BusOperatorFilterParams,
} from "./bus-operator";
import { getAllTrips, type Trip } from "./trip";
import { getAllBookingsForStats, searchBookings } from "./booking";
import { getAuditLogs } from "./audit-log";
import { getYearlyRevenue } from "./revenue";

// Dashboard statistics types
export interface DashboardStats {
  totalUsers: number;
  totalVehicles: number;
  totalRoutes: number;
  monthlyRevenue: number;
  activeRoutes: number; // Now represents weekly bookings
  pendingUsers: number;
  todayBookings: number;
  pendingComplaints: number;
  completedTrips: number;
  cancelledTrips: number;
}

// Recent activity types (mapped from Audit Log)
export interface RecentActivity {
  id: string;
  action: string;
  user: string;
  time: string;
  type: "user" | "vehicle" | "route" | "booking" | "complaint";
  description?: string;
}

// Revenue data for charts
export interface RevenueData {
  date: string;
  amount: number;
}

// User growth data
export interface UserGrowthData {
  month: string;
  users: number;
  busOperators: number;
}

// Dashboard API functions using existing endpoints
export const dashboardApi = {
  // Get dashboard statistics by combining multiple API calls
  getStats: async (): Promise<{ result: DashboardStats }> => {
    try {
      console.log("🔄 Starting dashboard stats fetch...");

      // Parallel API calls to get all required data
      const [usersRes, operatorsRes, tripsRes, bookingsRes] = await Promise.all(
        [
          getAllUsersManagement({ page: 1, size: 1 } as UserFilterParams),
          getAllBusOperatorsManagement({
            page: 1,
            size: 1,
          } as BusOperatorFilterParams),
          getAllTrips(),
          getAllBookingsForStats(),
        ]
      );

      console.log("📊 API Results:", {
        usersRes,
        operatorsRes,
        tripsRes,
        bookingsRes,
      });

      // Debug each API response structure
      console.log("👥 Users structure:", {
        full: usersRes,
        result: usersRes?.result,
        totalRecords: usersRes?.result?.totalRecords || usersRes?.totalRecords,
      });

      console.log("🚌 Operators structure:", {
        full: operatorsRes,
        result: operatorsRes?.result,
        totalRecords:
          operatorsRes?.result?.totalRecords || operatorsRes?.totalRecords,
      });

      console.log("🛣️ Trips structure:", {
        full: tripsRes,
        result: tripsRes?.result,
        length: tripsRes?.result?.length,
      });

      // Calculate current month revenue
      const currentDate = new Date();
      const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const endOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );

      const monthlyBookings = await searchBookings({
        startDate: startOfMonth.toISOString().split("T")[0],
        endDate: endOfMonth.toISOString().split("T")[0],
        status: "CONFIRMED",
        size: 10000,
      });

      const monthlyRevenue = monthlyBookings.result.result.reduce(
        (sum, booking) => sum + booking.total_amount,
        0
      );

      // Today's bookings
      const today = new Date().toISOString().split("T")[0];
      console.log("📅 Today's date:", today);
      const todayBookings = await searchBookings({
        startDate: today,
        endDate: today,
        size: 10000,
      });

      // Weekly bookings (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weeklyBookings = await searchBookings({
        startDate: weekAgo.toISOString().split("T")[0],
        endDate: today,
        size: 10000,
      });

      const allTrips = tripsRes?.result || [];

      const completedTrips = Array.isArray(allTrips)
        ? allTrips.filter(
            (t: Trip) =>
              t.status?.toUpperCase() === "ARRIVED" ||
              t.status?.toUpperCase() === "COMPLETED"
          ).length
        : 0;
      const cancelledTrips = Array.isArray(allTrips)
        ? allTrips.filter(
            (t: Trip) =>
              t.status?.toUpperCase() === "CANCELLED" ||
              t.status?.toUpperCase() === "CANCELED"
          ).length
        : 0;

      console.log("📈 Trip counts:", { completedTrips, cancelledTrips });

      const stats: DashboardStats = {
        // Extract total counts - try all possible structures
        totalUsers:
          usersRes?.result?.totalRecords ||
          usersRes?.result?.totalElements ||
          usersRes?.totalRecords ||
          usersRes?.totalElements ||
          usersRes?.pageInfo?.totalElements ||
          usersRes?.content?.length ||
          (Array.isArray(usersRes?.result?.content)
            ? usersRes.result.content.length
            : 0) ||
          (Array.isArray(usersRes?.content) ? usersRes.content.length : 0) ||
          (Array.isArray(usersRes?.result) ? usersRes.result.length : 0) ||
          (Array.isArray(usersRes) ? usersRes.length : 0) ||
          0,

        totalVehicles:
          operatorsRes?.result?.totalRecords ||
          operatorsRes?.result?.totalElements ||
          operatorsRes?.totalRecords ||
          operatorsRes?.totalElements ||
          operatorsRes?.pageInfo?.totalElements ||
          operatorsRes?.content?.length ||
          (Array.isArray(operatorsRes?.result?.content)
            ? operatorsRes.result.content.length
            : 0) ||
          (Array.isArray(operatorsRes?.content)
            ? operatorsRes.content.length
            : 0) ||
          (Array.isArray(operatorsRes?.result)
            ? operatorsRes.result.length
            : 0) ||
          (Array.isArray(operatorsRes) ? operatorsRes.length : 0) ||
          0,

        totalRoutes:
          tripsRes?.result?.length ||
          (Array.isArray(tripsRes?.result) ? tripsRes.result.length : 0) ||
          0,

        monthlyRevenue,

        activeRoutes: weeklyBookings?.result?.result?.length || 0,

        pendingUsers: 0,
        todayBookings: todayBookings?.result?.result?.length || 0,
        pendingComplaints: 0,
        completedTrips,
        cancelledTrips,
      };

      console.log("✅ Final dashboard stats:", stats);
      return { result: stats };
    } catch (error) {
      console.error("❌ Error fetching dashboard stats:", error);
      throw error;
    }
  },

  // Get recent activities from audit logs
  getRecentActivities: async (
    limit: number = 10
  ): Promise<{ result: RecentActivity[] }> => {
    try {
      const auditRes = await getAuditLogs({
        page: 1,
        size: limit,
      });

      const activities: RecentActivity[] = auditRes.result.auditLogs.map(
        (log) => {
          const activityType = getActivityType(log.targetEntity);
          const actionText = formatAction(log.action, log.targetEntity);

          return {
            id: log.id.toString(),
            action: actionText,
            user: log.userEmail || log.userName || "Hệ thống",
            time: formatTimeAgo(log.timestamp),
            type: activityType,
            description: log.details,
          };
        }
      );

      return { result: activities };
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      throw error;
    }
  },

  // Get revenue data for chart (using existing yearly revenue API)
  getRevenueData: async (): Promise<{ result: RevenueData[] }> => {
    try {
      const currentYear = new Date().getFullYear();
      const yearlyRes = await getYearlyRevenue(currentYear);

      const revenueData: RevenueData[] = yearlyRes.result.map((monthData) => ({
        date: `${monthData.year}-${monthData.month
          .toString()
          .padStart(2, "0")}`,
        amount: monthData.totalRevenue,
      }));

      return { result: revenueData };
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      throw error;
    }
  },
};

// Helper functions
function getActivityType(
  targetEntity: string
): "user" | "vehicle" | "route" | "booking" | "complaint" {
  switch (targetEntity) {
    case "USER":
    case "USER_PROFILE":
    case "EMPLOYEE":
      return "user";
    case "BUS":
      return "vehicle";
    case "TRIP":
      return "route";
    case "BOOKING":
    case "TICKET":
    case "PAYMENT":
      return "booking";
    default:
      return "user";
  }
}

function formatAction(action: string, targetEntity: string): string {
  const actionMap: Record<string, string> = {
    CREATE: "Tạo mới",
    UPDATE: "Cập nhật",
    DELETE: "Xóa",
    USE: "Sử dụng",
  };

  const entityMap: Record<string, string> = {
    USER: "người dùng",
    USER_PROFILE: "hồ sơ người dùng",
    BOOKING: "đặt vé",
    PAYMENT: "thanh toán",
    PROMOTION: "khuyến mãi",
    BUS: "xe buýt",
    TICKET: "vé",
    EMPLOYEE: "nhân viên",
  };

  const actionText = actionMap[action] || action;
  const entityText = entityMap[targetEntity] || targetEntity;

  return `${actionText} ${entityText}`;
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = now.getTime() - time.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  return `${days} ngày trước`;
}

export default dashboardApi;
