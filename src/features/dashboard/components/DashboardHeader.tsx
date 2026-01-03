import React from "react";
import { Typography, Button, Space, message } from "antd";
import {
  CustomerServiceOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

interface DashboardHeaderProps {
  onRefresh?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onRefresh,
}) => {
  const headerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  };

  const handleRefresh = () => {
    onRefresh?.();
    message.success("Đã làm mới");
  };

  return (
    <div style={headerStyle}>
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>
          <CustomerServiceOutlined /> Dashboard
        </Typography.Title>
      </div>
      <Space size="middle">
        <Button icon={<ReloadOutlined />} onClick={handleRefresh} type="text" />
      </Space>
    </div>
  );
};
