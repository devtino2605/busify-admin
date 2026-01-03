import {
  Layout,
  Avatar,
  Dropdown,
  Space,
  Typography,
  Button,
  Row,
  Col,
} from "antd";
import type { MenuProps } from "antd";
import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router";
import { useAuthStore } from "../stores/auth_store";
import { NotificationBell } from "./NotificationBell";

const { Header } = Layout;
const { Text } = Typography;

interface DashboardHeaderProps {
  collapsed?: boolean;
  onCollapse?: () => void;
}

const DashboardHeader = ({ collapsed, onCollapse }: DashboardHeaderProps) => {
  const auth = useAuthStore();
  const navigate = useNavigate();

  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Thông tin cá nhân",
      onClick: () => navigate("/customer-service/profile"),
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Cài đặt tài khoản",
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      onClick: auth.logOut,
      danger: true,
    },
  ];

  return (
    <Header
      style={{
        background: "#fff",
        padding: "0 24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <Row justify="space-between" align="middle" style={{ height: "100%" }}>
        <Col>
          <Space align="center">
            {/* Collapse Button */}
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={onCollapse}
              style={{ fontSize: "16px" }}
            />

            {/* Logo & Title */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Avatar size={32} src="/src/assets/logo.png">
                B
              </Avatar>
              <Text strong style={{ fontSize: "18px", color: "#1890ff" }}>
                Busify Admin
              </Text>
            </div>
          </Space>
        </Col>

        <Col>
          <Space align="center" size="middle">
            {/* Notifications */}
            <NotificationBell />

            {/* User Profile Dropdown */}
            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={["click"]}
              placement="bottomRight"
              arrow
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f5f5f5")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <Avatar
                  size={32}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: "#1890ff" }}
                />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <Text
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      lineHeight: 1.2,
                    }}
                  >
                    {auth.loggedInUser?.email?.split("@")[0] || "Admin"}
                  </Text>
                  <Text
                    type="secondary"
                    style={{ fontSize: "12px", lineHeight: 1.2 }}
                  >
                    {auth.loggedInUser?.role || "Administrator"}
                  </Text>
                </div>
              </div>
            </Dropdown>
          </Space>
        </Col>
      </Row>
    </Header>
  );
};

export default DashboardHeader;
