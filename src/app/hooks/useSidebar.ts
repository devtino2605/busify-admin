import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { MenuProps } from "antd";
import { useAuthStore } from "../../stores/auth_store";
import {
  menuItems,
  routeToKeyMap,
  type AppMenuItem,
} from "../../config/menuConfig";

type MenuItem = Required<MenuProps>["items"][number];

export const useSidebar = () => {
  const [selectedKey, setSelectedKey] = useState("dashboard");
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.loggedInUser);

  useEffect(() => {
    const currentPath = location.pathname;
    const currentKey = Object.keys(routeToKeyMap).find(
      (path) => currentPath === path
    );
    if (currentKey) {
      setSelectedKey(routeToKeyMap[currentKey]);
    } else {
      // Fallback for nested routes or routes not in map
      const baseRoute = "/" + currentPath.split("/")[1];
      setSelectedKey(routeToKeyMap[baseRoute] || "dashboard");
    }
  }, [location.pathname]);

  const getFilteredMenuItems = (): MenuItem[] => {
    const filterItems = (items: AppMenuItem[]): MenuItem[] => {
      return items
        .filter(
          (item) => !item.roles || item.roles.includes(user?.role as string)
        )
        .map((item): MenuItem => {
          if (item.type === "divider") {
            return { type: "divider" };
          }
          if (item.children) {
            const filteredChildren = filterItems(item.children);
            if (filteredChildren.length > 0) {
              return {
                key: item.key!,
                icon: item.icon,
                label: item.label,
                children: filteredChildren,
              };
            }
            return null;
          }
          return {
            key: item.key!,
            icon: item.icon,
            label: item.label,
          };
        })
        .filter((item): item is MenuItem => item !== null);
    };
    return filterItems(menuItems);
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    setSelectedKey(key);

    switch (key) {
      case "dashboard":
        navigate(
          user?.role === "CUSTOMER_SERVICE" ? "/customer-service" : "/admin"
        );
        break;
      case "users":
        navigate("/admin/users-management");
        break;
      case "tickets-customer-service":
        navigate("/customer-service/tickets");
        break;
      case "trips-customer-service":
        navigate("/customer-service/trips");
        break;
      case "complaints-customer-service":
        navigate("/customer-service/complaints");
        break;
      case "reviews-customer-service":
        navigate("/customer-service/reviews");
        break;
      case "bookings-customer-service":
        navigate("/customer-service/bookings");
        break;
      case "bus-operators-management":
        navigate("/admin/bus-operators-management");
        break;
      case "list-bus-operator":
        navigate("/admin/contracts");
        break;
      case "revenue-reports":
        navigate("/admin/revenue-reports");
        break;
      case "revenue-analytics":
        navigate("/admin/revenue-analytics");
        break;
      case "chat-customer-service":
        navigate("/customer-service/chat");
        break;
      case "assign-roles":
        navigate("/admin/assign-roles");
        break;
      case "manage-roles":
        navigate("/admin/manage-roles");
        break;
      case "promotion-management":
        navigate("/admin/promotion-management");
        break;
      case "permission-settings":
        navigate("/admin/permission-settings");
        break;
      case "promotion-campaign-management":
        navigate("/admin/promotion-campaign-management");
        break;
      case "log-management":
        navigate("/admin/audit-logs");
        break;
      case "blog-posts":
        navigate("/admin/blog-posts");
        break;
      case "blog-create":
        navigate("/admin/blog-create");
        break;
      case "locations-management":
        navigate("/admin/locations-management");
        break;
      default:
        // Can add navigation for other keys here or use a dynamic approach
        console.log("Navigate to:", key);
        break;
    }
  };

  return {
    selectedKey,
    handleMenuClick,
    getFilteredMenuItems,
  };
};
