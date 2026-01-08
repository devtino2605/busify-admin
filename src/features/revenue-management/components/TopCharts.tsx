import React, { useEffect, useState } from "react";
import { Card, Row, Col } from "antd";
import { Bar, Column } from "@ant-design/charts";

interface TopRouteData {
  totalRevenue: number;
  totalTrips: number;
  routeName: string;
  totalBookings: number;
}

interface TopTripData {
  totalRevenue: number;
  routeName: string;
  totalBookings: number;
  busOperatorName: string;
  departureTime: string;
}

interface TopChartsProps {
  topRoutesData: TopRouteData[] | undefined;
  topTripsData: TopTripData[] | undefined;
  formatCurrency: (amount: number) => string;
}

const TopCharts: React.FC<TopChartsProps> = ({
  topRoutesData,
  topTripsData,
  formatCurrency,
}) => {
  const [key, setKey] = useState(0); // State để buộc tái render

  // Khi tab thay đổi, cập nhật key để tái render
  useEffect(() => {
    setKey((prev) => prev + 1);
  }, [topRoutesData, topTripsData]); // Tùy chỉnh dependency theo dữ liệu

  // Function để validate và format revenue
  const safeFormatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return "0 ₫";
    }
    return formatCurrency(value);
  };

  // Function để validate number
  const safeNumber = (value: number | null | undefined): number => {
    if (value === null || value === undefined || isNaN(value)) {
      return 0;
    }
    return value;
  };

  // Cấu hình Top Routes Bar Chart
  const topRoutesConfig = {
    data:
      topRoutesData
        ?.filter((route) => route && safeNumber(route.totalRevenue) > 0)
        .slice(0, 5)
        .map((route, index) => ({
          route: `Tuyến ${index + 1}`,
          fullName: route.routeName || `Tuyến ${index + 1}`,
          revenue: safeNumber(route.totalRevenue),
          trips: safeNumber(route.totalTrips),
          bookings: safeNumber(route.totalBookings),
        })) || [],
    xField: "revenue",
    yField: "route",
    seriesField: "route",
    legend: false,
    meta: {
      revenue: {
        alias: "Doanh thu",
        formatter: (v: number) => safeFormatCurrency(v),
      },
    },
    color: "#52c41a",
    barStyle: {
      radius: [0, 4, 4, 0],
    },
    tooltip: {
      fields: ["fullName", "revenue", "trips", "bookings"],
      formatter: (datum: any) => {
        return {
          name: datum.fullName || "Tuyến",
          value: `${safeFormatCurrency(datum.revenue || 0)} - ${
            datum.trips || 0
          } chuyến - ${datum.bookings || 0} booking`,
        };
      },
    },
    label: {
      position: "right" as const,
      offset: 4,
      formatter: (v: { revenue: number }) => {
        const value = safeNumber(v.revenue);
        if (value === 0) return "";
        return safeFormatCurrency(value);
      },
    },
    xAxis: {
      label: {
        formatter: (v: number) => safeFormatCurrency(v),
      },
    },
  };

  // Cấu hình Top Trips Column Chart
  const topTripsConfig = {
    data:
      topTripsData
        ?.filter((trip) => trip && safeNumber(trip.totalRevenue) > 0)
        .slice(0, 5)
        .map((trip, index) => ({
          trip: `Chuyến ${index + 1}`,
          fullRoute: trip.routeName || `Chuyến ${index + 1}`,
          revenue: safeNumber(trip.totalRevenue),
          bookings: safeNumber(trip.totalBookings),
          operator: trip.busOperatorName || "N/A",
          departureTime: trip.departureTime || "N/A",
        })) || [],
    xField: "trip",
    yField: "revenue",
    columnStyle: {
      fill: "#722ed1",
      radius: [4, 4, 0, 0],
    },
    meta: {
      revenue: {
        alias: "Doanh thu",
        formatter: (v: number) => safeFormatCurrency(v),
      },
    },
    label: {
      visible: true,
      position: "top" as const,
      formatter: (data: { bookings: number }) => {
        const bookings = safeNumber(data.bookings);
        return bookings > 0 ? `${bookings} booking` : "";
      },
    },
    tooltip: {
      fields: ["fullRoute", "revenue", "bookings", "operator", "departureTime"],
      formatter: (datum: any) => {
        return {
          name: datum.fullRoute || "Chuyến",
          value: `${safeFormatCurrency(datum.revenue || 0)} • ${safeNumber(
            datum.bookings
          )} booking • ${datum.operator || "N/A"}`,
        };
      },
    },
    xAxis: {
      label: {
        autoRotate: false,
      },
    },
    yAxis: {
      label: {
        formatter: (v: number) => safeFormatCurrency(v),
      },
    },
  };

  // Handle case when no data available
  const hasRoutesData = topRoutesData && topRoutesData.length > 0;
  const hasTripsData = topTripsData && topTripsData.length > 0;

  return (
    <Row gutter={[16, 16]} style={{ marginTop: "24px" }}>
      <Col xs={24} lg={12}>
        <Card
          title="🏆 Top 5 Tuyến đường Doanh thu cao nhất"
          size="small"
          bodyStyle={{ padding: "16px 8px", height: "340px" }}
        >
          <div style={{ width: "100%", height: "300px", overflow: "hidden" }}>
            {hasRoutesData ? (
              <Bar {...topRoutesConfig} height={300} autoFit key={key} />
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  color: "#999",
                }}
              >
                <p>📊 Chưa có dữ liệu tuyến đường</p>
              </div>
            )}
          </div>
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card
          title="🚌 Top 5 Chuyến đi Doanh thu cao nhất"
          size="small"
          bodyStyle={{ padding: "16px 8px", height: "340px" }}
        >
          <div style={{ width: "100%", height: "300px", overflow: "hidden" }}>
            {hasTripsData ? (
              <Column {...topTripsConfig} height={300} autoFit key={key} />
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  color: "#999",
                }}
              >
                <p>🚌 Chưa có dữ liệu chuyến đi</p>
              </div>
            )}
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default TopCharts;
