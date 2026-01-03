import React from "react";
import { Card, Row, Col, Statistic, Space, Input, Segmented } from "antd";
import {
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";

// Cập nhật interface StatsData để loại bỏ pending
interface StatsData {
  new: number;
  pending: number; // Thêm lại pending
  inProgress: number;
  resolved: number;
  rejected: number;
  resolvedToday: number;
  avgResponseTime: string;
  customerSatisfaction: number;
}

interface MetricsCardProps {
  stats: StatsData;
  searchText: string;
  selectedStatus: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (status: string) => void;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  stats,
  searchText,
  selectedStatus,
  onSearchChange,
  onStatusChange,
}) => {
  const metricCardStyle: React.CSSProperties = {
    borderRadius: 12,
    boxShadow: "0 6px 18px rgba(20,20,30,0.04)",
    background: "#fff",
    padding: 14,
  };

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col xs={24}>
        <Card style={{ ...metricCardStyle }}>
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <Space size="large" wrap>
              <Statistic
                title="Mới"
                value={stats.new}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: "#f5222d" }}
              />
              {/* <Statistic
                title="Chờ xử lý"
                value={stats.pending}
                valueStyle={{ color: "#faad14" }}
              /> */}
              <Statistic
                title="Đang xử lý"
                value={stats.inProgress}
                valueStyle={{ color: "#1890ff" }}
              />
              <Statistic
                title="Đã giải quyết"
                value={stats.resolved}
                valueStyle={{ color: "#52c41a" }}
              />
              <Statistic
                title="Từ chối"
                value={stats.rejected}
                valueStyle={{ color: "#722ed1" }}
              />
              <Statistic
                title="Giải quyết hôm nay"
                value={stats.resolvedToday}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Space>

            <div
              style={{
                minWidth: 280,
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <Input
                placeholder="Tìm ticket, khách hàng..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => onSearchChange(e.target.value)}
                allowClear
              />
              <Segmented
                options={[
                  { label: "Tất cả", value: "all" },
                  { label: "Mới", value: "New" },
                  // { label: "Chờ xử lý", value: "pending" },
                  { label: "Đang xử lý", value: "in_progress" },
                  { label: "Đã giải quyết", value: "resolved" },
                  { label: "Từ chối", value: "rejected" },
                ]}
                value={selectedStatus}
                onChange={(v) => onStatusChange(String(v))}
              />
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  );
};
