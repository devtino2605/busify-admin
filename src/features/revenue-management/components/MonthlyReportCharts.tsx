import React from "react";
import { Card, Row, Col, Statistic, Space } from "antd";
import {
  DollarCircleOutlined,
  UserOutlined,
  CarOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

interface MonthlyReportData {
  year: number;
  month: number;
  operatorName: string;
  operatorEmail: string;
  totalPassengers: number;
  totalTrips: number;
  totalRevenue: number;
  sentToAdmin: number;
  totalBuses: number;
  reportGeneratedDate: string;
}

interface MonthlyReportChartsProps {
  monthlyData: MonthlyReportData | undefined;
  formatCurrency: (amount: number) => string;
}

const MonthlyReportCharts: React.FC<MonthlyReportChartsProps> = ({
  monthlyData,
  formatCurrency,
}) => {
  if (!monthlyData) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p>Vui lòng chọn nhà xe để xem báo cáo tháng</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="Doanh thu tháng"
              value={monthlyData.totalRevenue}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<DollarCircleOutlined />}
              valueStyle={{ color: "#3f8600", fontSize: "20px" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="Hành khách"
              value={monthlyData.totalPassengers}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#1890ff", fontSize: "20px" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="Chuyến đi"
              value={monthlyData.totalTrips}
              prefix={<CarOutlined />}
              valueStyle={{ color: "#722ed1", fontSize: "20px" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="Số xe"
              value={monthlyData.totalBuses}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: "#fa8c16", fontSize: "20px" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Report Details */}
      <Card title="📋 Chi tiết báo cáo tháng" size="small">
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <strong>🏢 Nhà xe:</strong> {monthlyData.operatorName}
              </div>
              <div>
                <strong>📧 Email:</strong> {monthlyData.operatorEmail}
              </div>
              <div>
                <strong>📅 Tháng/Năm:</strong> {monthlyData.month}/
                {monthlyData.year}
              </div>
              <div>
                <strong>📝 Ngày tạo báo cáo:</strong>{" "}
                {monthlyData.reportGeneratedDate}
              </div>
            </Space>
          </Col>
          <Col xs={24} lg={12}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <strong>📤 Đã gửi admin:</strong>{" "}
                {monthlyData.sentToAdmin ? "Có" : "Chưa"}
              </div>
              <div>
                <strong>💰 Tổng doanh thu:</strong>{" "}
                {formatCurrency(monthlyData.totalRevenue)}
              </div>
              <div>
                <strong>🚌 Tổng chuyến đi:</strong> {monthlyData.totalTrips}
              </div>
              <div>
                <strong>👥 Tổng hành khách:</strong>{" "}
                {monthlyData.totalPassengers}
              </div>
            </Space>
          </Col>
        </Row>
      </Card>
    </>
  );
};

export default MonthlyReportCharts;
