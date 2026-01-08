import { Layout, Menu, Avatar, Typography } from "antd";
import { useSidebar } from "../app/hooks/useSidebar";

const { Sider } = Layout;
const { Text } = Typography;

interface SidebarProps {
  collapsed?: boolean;
}

const Sidebar = ({ collapsed = false }: SidebarProps) => {
  const { selectedKey, handleMenuClick, getFilteredMenuItems } = useSidebar();

  return (
    <Sider
      collapsed={collapsed}
      width={280}
      collapsedWidth={80}
      className="overflow-hidden"
      style={{
        background: "#fff",
        boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        zIndex: 1000,
      }}
      trigger={null}
    >
      {/* Logo Section */}
      <div
        style={{
          padding: collapsed ? "16px 8px" : "16px 24px",
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          minHeight: "64px",
        }}
      >
        <Avatar size={collapsed ? 32 : 40} src="/src/assets/logo.png">
          B
        </Avatar>
        {!collapsed && (
          <div>
            <Text
              strong
              style={{
                fontSize: "18px",
                color: "#1890ff",
                display: "block",
                lineHeight: 1.2,
              }}
            >
              Busify
            </Text>
            <Text
              type="secondary"
              style={{
                fontSize: "12px",
                lineHeight: 1.2,
              }}
            >
              Admin Dashboard
            </Text>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        onClick={handleMenuClick}
        className="scrollbar-hide"
        style={{
          height: "calc(100vh - 64px)",
          borderRight: 0,
          paddingTop: "8px",
          overflowY: "auto",
        }}
        items={getFilteredMenuItems()}
        theme="light"
      />
    </Sider>
  );
};

export default Sidebar;
