import React from "react";
import type { RouteObject } from "react-router";
// Blog Management Components
import BlogPostsPage from "../features/blog-management/pages/BlogPostsPage";
import BlogPostForm from "../features/blog-management/pages/BlogPostForm";
import BlogPostPreview from "../features/blog-management/pages/BlogPostPreview";
import DashboardLayout from "../app/layouts/DashboardLayout";
import UserManagement from "../features/user-management/user";
import ProtectedRoute from "../components/ProtectedRoute";
import BusOperatorManagement from "../features/bus-operator-management/bus-operator";
import LocationManagement from "../features/location-management/location";
import ContractManagement from "../features/contract-management/contracts";
import RevenueReports from "../features/revenue-management/revenue-reports";
import RevenueAnalytics from "../features/revenue-management/revenue-analytics";

// Role Management Pages
import RoleManagementDemo from "../features/role-management/RoleManagementDemo";

// Promotion Management
import { PromotionManagement } from "../features/promotion-management";
import PromotionCampaignManagement from "../features/promotion-campaign-management/pages/PromotionCampaignManagement";

// Audit Log Management
import AuditLogManagement from "../features/audit-log/pages/AuditLogManagement";

// Customer Service pages
import TicketWithCustomerServicePage from "../features/ticket-management/pages/TicketWithCustomerServicePage";
import TripWithCustomerServicePage from "../features/trip-management/TripWithCustomerService";
import ComplaintsWithCustomerServicePage from "../features/complaints-management/pages/ComplaintsWithCustomerServicePage";
import ReviewsWithCustomerServicePage from "../features/reviews-management/pages/ReviewsWithCustomerServicePage";
import BookingsWithCustomerService from "../features/bookings-mangement/pages/BookingsWithCustomerService";
import AssignRolesPage from "../features/role-management/pages/AssignRolesPage";
import ManageRolesPage from "../features/role-management/pages/ManageRolesPage";
import PermissionSettingsPage from "../features/role-management/pages/PermissionSettingsPage";
import { DashboardWithCustomerService } from "../features/dashboard/pages/dashboardWithCustomerService";
import Dashboard from "../features/dashboard/pages/dashboard";
import { ChatWithCustomerServicePage } from "../features/chat/chatWithCustomerServicePage";
import ProfilePage from "../features/profile/Profile";

export function withRole(element: React.ReactNode, roles: string[]) {
  return <ProtectedRoute allowedRoles={roles}>{element}</ProtectedRoute>;
}

// Route cho vai trò Customer Service (và Admin có thể access)
export const CustomerServiceRoute: RouteObject = {
  path: "customer-service",
  element: withRole(<DashboardLayout />, ["CUSTOMER_SERVICE", "ADMIN"]),
  children: [
    {
      index: true,

      element: <DashboardWithCustomerService />,
    },
    {
      path: "tickets",
      element: withRole(<TicketWithCustomerServicePage />, [
        "CUSTOMER_SERVICE",
        "ADMIN",
      ]),
    },
    {
      path: "trips",
      element: withRole(<TripWithCustomerServicePage />, ["CUSTOMER_SERVICE"]),
    },
    {
      path: "complaints",
      element: withRole(<ComplaintsWithCustomerServicePage />, [
        "CUSTOMER_SERVICE",
      ]),
    },
    {
      path: "reviews",
      element: withRole(<ReviewsWithCustomerServicePage />, [
        "CUSTOMER_SERVICE",
      ]),
    },
    {
      path: "bookings",
      element: withRole(<BookingsWithCustomerService />, [
        "CUSTOMER_SERVICE",
        "ADMIN",
      ]),
    },

    {
      path: "chat",
      element: <ChatWithCustomerServicePage />,
    },
    {
      path: "profile",
      element: withRole(<ProfilePage />, ["CUSTOMER_SERVICE", "ADMIN"]),
    },
  ],
};

// Route cho vai trò Admin
export const AuthRoute: RouteObject = {
  path: "admin",
  element: withRole(<DashboardLayout />, ["ADMIN"]),
  children: [
    {
      index: true,
      element: <Dashboard />,
    },
    {
      path: "users-management",
      element: <UserManagement />,
    },
    {
      path: "bus-operators-management",
      element: withRole(<BusOperatorManagement />, ["ADMIN"]),
    },
    {
      path: "locations-management",
      element: withRole(<LocationManagement />, ["ADMIN"]),
    },
    {
      path: "contracts",
      element: withRole(<ContractManagement />, ["ADMIN"]),
    },
    {
      path: "revenue-reports",
      element: withRole(<RevenueReports />, ["ADMIN"]),
    },
    {
      path: "revenue-analytics",
      element: withRole(<RevenueAnalytics />, ["ADMIN"]),
    },
    // Promotion Management
    {
      path: "promotion-management",
      element: withRole(<PromotionManagement />, ["ADMIN"]),
    },
    // Promotion Campaign Management
    {
      path: "promotion-campaign-management",
      element: withRole(<PromotionCampaignManagement />, ["ADMIN"]),
    },
    // Role Management Routes
    {
      path: "assign-roles",
      element: withRole(<AssignRolesPage />, ["ADMIN"]),
    },
    {
      path: "manage-roles",
      element: withRole(<ManageRolesPage />, ["ADMIN"]),
    },
    {
      path: "permission-settings",
      element: withRole(<PermissionSettingsPage />, ["ADMIN"]),
    },
    // Demo route for testing
    {
      path: "role-demo",
      element: withRole(<RoleManagementDemo />, ["ADMIN"]),
    },
    // Audit Log Management
    {
      path: "audit-logs",
      element: withRole(<AuditLogManagement />, ["ADMIN"]),
    },
    // Admin có thể access Customer Service functions
    {
      path: "tickets",
      element: withRole(<TicketWithCustomerServicePage />, ["ADMIN"]),
    },
    {
      path: "bookings",
      element: withRole(<BookingsWithCustomerService />, ["ADMIN"]),
    },
    // Blog Management Routes
    {
      path: "blog-posts",
      element: withRole(
        <React.Suspense fallback={<div>Loading...</div>}>
          <BlogPostsPage />
        </React.Suspense>,
        ["ADMIN"]
      ),
    },
    {
      path: "blog-create",
      element: withRole(
        <React.Suspense fallback={<div>Loading...</div>}>
          <BlogPostForm />
        </React.Suspense>,
        ["ADMIN"]
      ),
    },
    {
      path: "blog-edit/:id",
      element: withRole(
        <React.Suspense fallback={<div>Loading...</div>}>
          <BlogPostForm editMode={true} />
        </React.Suspense>,
        ["ADMIN"]
      ),
    },
    {
      path: "blog-preview/:id",
      element: withRole(
        <React.Suspense fallback={<div>Loading...</div>}>
          <BlogPostPreview />
        </React.Suspense>,
        ["ADMIN"]
      ),
    },
  ],
};
