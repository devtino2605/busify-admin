/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Drawer,
  Descriptions,
  Tag,
  Space,
  Typography,
  Divider,
  Card,
  Button,
  message,
  Rate,
  Badge,
  Row,
  Col,
  Collapse,
  Form,
  Input,
  Spin,
  Alert,
  Dropdown, // Thêm import cho Dropdown
  Menu, // Thêm import cho Menu
} from "antd";
import {
  CarOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  PrinterOutlined,
  MailOutlined,
  WifiOutlined,
  SnippetsOutlined,
  ThunderboltOutlined,
  DesktopOutlined,
  StarOutlined,
  ShoppingCartOutlined,
  PhoneOutlined,
  DownOutlined, // Thêm icon cho dropdown
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { Trip } from "../../../app/api/trip";
import TripSeatSelector from "./TripSeatSelector";
// Import the API functions
import { getTripSeats } from "../../../app/api/tripSeat";
import { getSeatLayout } from "../../../app/api/seatLayout";
import { createManualBooking } from "../../../app/api/booking";
import MailSenderModal from "../../../components/MailSenderModal";
import BulkMailSenderModal from "../../../components/BulkMailSenderModal"; // Add import for BulkMailSenderModal
import { useQuery } from "@tanstack/react-query";

const { Title, Text } = Typography;

// Harmonized palette
const PALETTE = {
  primary: "#1f6feb",
  success: "#27ae60",
  warning: "#f39c12",
  danger: "#e74c3c",
  surface: "#f5f7fb",
  muted: "#6b7280",
  border: "#d9d9d9",
  accent: "#6f42c1",
};

// Mock seat data as fallback

interface TripDetailModalProps {
  trip: Trip | null;
  visible: boolean;
  onClose: () => void;
}

const TripDetailModal: React.FC<TripDetailModalProps> = ({
  trip,
  visible,
  onClose,
}) => {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [bookingForm] = Form.useForm();
  const [bookingLoading, setBookingLoading] = useState(false);

  // Remove manual state management for seat data
  // const [, setSeatLayout] = useState<LayoutData | null>(null);
  // const [seatStatuses, setSeatStatuses] = useState<SeatStatus[]>([]);
  // const [seatLoading, setSeatLoading] = useState(false);

  // Add state for mail modal
  const [isMailModalVisible, setIsMailModalVisible] = useState(false);
  const [mailForm] = Form.useForm();

  // Add state for bulk mail modal
  const [isBulkMailModalVisible, setIsBulkMailModalVisible] = useState(false);
  const [bulkMailForm] = Form.useForm();

  // Thêm state để phân biệt loại email (hành khách hay nhà xe)
  const [isForOperator, setIsForOperator] = useState(false);

  // Use React Query to fetch seat layout
  const { isLoading: seatLayoutLoading, isError: seatLayoutError } = useQuery({
    queryKey: ["seatLayout", trip?.trip_id],
    queryFn: async () => {
      if (!trip?.trip_id) throw new Error("No trip ID");
      const response = await getSeatLayout(trip.trip_id.toString());
      if (response.code === 200) {
        return response.result.layoutData;
      } else {
        throw new Error("Không thể tải thông tin bố trí ghế");
      }
    },
    enabled: !!trip?.trip_id && visible, // Only fetch when we have a trip ID and modal is visible
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  // Use React Query to fetch seat statuses
  const {
    data: seatStatuses = [],
    isLoading: seatStatusLoading,
    isError: seatStatusError,
    refetch: refetchSeatStatuses,
  } = useQuery({
    queryKey: ["tripSeats", trip?.trip_id],
    queryFn: async () => {
      if (!trip?.trip_id) throw new Error("No trip ID");
      const response = await getTripSeats(trip.trip_id);
      if (response.code === 200) {
        return response.result.seatsStatus;
      } else {
        throw new Error("Không thể tải trạng thái ghế");
      }
    },
    enabled: !!trip?.trip_id && visible, // Only fetch when we have a trip ID and modal is visible
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes (seat status changes more frequently)
    refetchInterval: 30 * 1000, // Refetch every 30 seconds when component is active
  });

  // Combined loading state for seat data
  const seatLoading = seatLayoutLoading || seatStatusLoading;

  // Show error messages for seat data fetching
  useEffect(() => {
    if (seatLayoutError) {
      message.error("Không thể tải thông tin bố trí ghế");
    }
    if (seatStatusError) {
      message.error("Không thể tải trạng thái ghế");
    }
  }, [seatLayoutError, seatStatusError]);

  // Remove the fetchSeatData function since we're using React Query
  // const fetchSeatData = useCallback(async () => { ... });

  // Reset state when trip changes or drawer visibility changes
  useEffect(() => {
    // When drawer opens with a trip or trip changes
    if (visible && trip) {
      // Reset selected seats
      setSelectedSeats([]);
      // Reset booking form
      bookingForm.resetFields();
      // Hide booking form
      setBookingModalVisible(false);
      // No need to manually fetch seat data - React Query handles this
    }

    // When drawer closes, clean up state
    if (!visible) {
      // Reset selected seats
      setSelectedSeats([]);
      // Reset booking form visibility
      setBookingModalVisible(false);
      // No need to manually reset seat data - React Query handles caching
    }
  }, [visible, trip, bookingForm]); // Remove fetchSeatData from dependencies

  if (!trip) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return PALETTE.muted; // Gray for scheduled
      case "on_sell":
        return PALETTE.success; // Green for on sale
      case "delayed":
        return PALETTE.warning; // Orange for delayed
      case "departed":
        return "#1890ff"; // Blue for departed
      case "arrived":
        return PALETTE.accent; // Purple for arrived
      case "cancelled":
        return PALETTE.danger; // Red for cancelled
      default:
        return PALETTE.muted;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "scheduled":
        return "Đã lên lịch";
      case "on_sell":
        return "Đã mở bán";
      case "delayed":
        return "Bị hoãn";
      case "departed":
        return "Đã khởi hành";
      case "arrived":
        return "Đã đến nơi";
      case "cancelled":
        return "Bị hủy";
      default:
        return status;
    }
  };

  const handlePrintInfo = () => {
    message.success("Đang chuẩn bị in thông tin chuyến đi...");
  };

  const renderAmenities = () => {
    const amenities = [];
    if (trip.amenities.wifi) {
      amenities.push(
        <Tag key="wifi" color={PALETTE.primary} style={{ margin: "2px" }}>
          <WifiOutlined /> WiFi
        </Tag>
      );
    }
    if (trip.amenities.air_conditioner) {
      amenities.push(
        <Tag key="ac" color={PALETTE.accent} style={{ margin: "2px" }}>
          <SnippetsOutlined /> Điều hòa
        </Tag>
      );
    }
    if (trip.amenities.charging) {
      amenities.push(
        <Tag key="usb" color={PALETTE.warning} style={{ margin: "2px" }}>
          <ThunderboltOutlined /> Sạc USB
        </Tag>
      );
    }
    if (trip.amenities.tv) {
      amenities.push(
        <Tag key="tv" color={PALETTE.muted} style={{ margin: "2px" }}>
          <DesktopOutlined /> TV
        </Tag>
      );
    }

    return amenities.length > 0 ? (
      amenities
    ) : (
      <Text type="secondary">Không có tiện ích đặc biệt</Text>
    );
  };

  // Mock additional details
  const tripDetails = {
    busType: "Giường nằm VIP",
    totalSeats: 40,
    duration: Math.abs(
      dayjs(trip.arrival_time).diff(dayjs(trip.departure_time), "hour")
    ),
    distance: "650 km",
    driverName: "Nguyễn Văn A",
    driverPhone: "0987654321",
    busPlate: "51B-12345",
  };

  const handleSeatSelect = (seatId: string) => {
    setSelectedSeats((prevSeats) => {
      if (prevSeats.includes(seatId)) {
        return prevSeats.filter((id) => id !== seatId);
      } else {
        return [...prevSeats, seatId];
      }
    });
  };

  const handleBookingSubmit = async (values: any) => {
    if (!trip || selectedSeats.length === 0) {
      message.error("Vui lòng chọn ghế trước khi đặt vé");
      return;
    }

    setBookingLoading(true);
    try {
      const totalAmount = selectedSeats.length * trip.price_per_seat;

      const bookingData = {
        tripId: trip.trip_id,
        seatNumber: selectedSeats.join(","),
        totalAmount,
        guestFullName: values.guestFullName,
        guestPhone: values.guestPhone,
        guestEmail: values.guestEmail || undefined,
        guestAddress: values.guestAddress || undefined,
        promotionId: null,
        discountCode: null,
      };

      const response = await createManualBooking(bookingData);
      if (response.code === 200) {
        message.success(
          `Đặt vé thành công! Mã đặt vé: ${response.result.bookingCode}`
        );
        setBookingModalVisible(false);
        setSelectedSeats([]);
        bookingForm.resetFields();

        // Refetch seat statuses after successful booking
        refetchSeatStatuses();
      } else {
        message.error(response.message || "Đặt vé thất bại");
      }
    } catch (error: any) {
      console.error("Booking error:", error);
      message.error(error.message || "Không thể đặt vé. Vui lòng thử lại sau.");
    } finally {
      setBookingLoading(false);
    }
  };

  const renderBookingFormInline = () => (
    <Card title="Thông tin khách hàng" size="small" style={{ marginTop: 16 }}>
      <Form form={bookingForm} layout="vertical" onFinish={handleBookingSubmit}>
        <Form.Item
          name="guestFullName"
          label="Họ và tên"
          rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Nhập họ và tên" />
        </Form.Item>

        <Form.Item
          name="guestPhone"
          label="Số điện thoại"
          rules={[
            { required: true, message: "Vui lòng nhập số điện thoại" },
            {
              pattern: /^[0-9]{10,11}$/,
              message: "Số điện thoại không hợp lệ",
            },
          ]}
        >
          <Input prefix={<PhoneOutlined />} placeholder="Nhập số điện thoại" />
        </Form.Item>

        <Form.Item
          name="guestEmail"
          label="Email"
          rules={[{ type: "email", message: "Email không hợp lệ" }]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="Nhập email (tùy chọn)"
          />
        </Form.Item>

        <Form.Item name="guestAddress" label="Địa chỉ">
          <Input placeholder="Nhập địa chỉ (tùy chọn)" />
        </Form.Item>

        <Form.Item>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={() => setBookingModalVisible(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={bookingLoading}>
              Xác nhận đặt vé
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );

  // Add this function to check if trip is bookable
  const isTripBookable = (status: string): boolean => {
    return status === "on_sell"; // Only on_sell trips are bookable
  };

  // Custom close handler to ensure cleanup
  const handleDrawerClose = () => {
    // Reset all state
    setSelectedSeats([]);
    setBookingModalVisible(false);
    bookingForm.resetFields();
    setIsMailModalVisible(false); // Reset mail modal state
    mailForm.resetFields();
    setIsBulkMailModalVisible(false); // Reset bulk mail modal state
    bulkMailForm.resetFields();
    setIsForOperator(false); // Reset isForOperator

    // Call parent onClose
    onClose();
  };

  // Add handlers for new buttons
  const handleSendToPassenger = () => {
    // Prefill bulk mail form with trip details
    bulkMailForm.setFieldsValue({
      tripId: trip?.trip_id,
      subject: `Thông tin chuyến đi ${trip?.trip_id} - Busify`,
    });
    setIsForOperator(false); // Đặt là false cho hành khách
    setIsBulkMailModalVisible(true);
  };

  const handleSendToOperator = () => {
    // Prefill bulk mail form with trip details và sử dụng sendCustomerSupportEmailToBusOperator
    bulkMailForm.setFieldsValue({
      tripId: trip?.trip_id,
      subject: `Thông tin chuyến đi ${trip?.trip_id} - Busify`,
    });
    setIsForOperator(true); // Đặt là true cho nhà xe
    setIsBulkMailModalVisible(true);
  };

  // Tạo menu cho dropdown
  const emailMenu = (
    <Menu>
      <Menu.Item key="passenger" onClick={handleSendToPassenger}>
        Gửi cho hành khách
      </Menu.Item>
      <Menu.Item key="operator" onClick={handleSendToOperator}>
        Gửi email cho nhà xe
      </Menu.Item>
    </Menu>
  );

  return (
    <Drawer
      title={
        <Space>
          <CarOutlined />
          <span>Chi tiết chuyến đi - #{trip.trip_id}</span>
        </Space>
      }
      open={visible}
      onClose={handleDrawerClose}
      width={900}
      destroyOnHidden={true}
      extra={
        <Space>
          <Dropdown overlay={emailMenu} trigger={["click"]}>
            <Button icon={<MailOutlined />}>
              Gửi email <DownOutlined />
            </Button>
          </Dropdown>
          <Button icon={<PrinterOutlined />} onClick={handlePrintInfo}>
            In thông tin
          </Button>
          <Button onClick={onClose}>Đóng</Button>
        </Space>
      }
    >
      {/* Use key based on trip_id to force full re-render when trip changes */}
      <div
        key={`trip-detail-${trip?.trip_id}`}
        style={{
          maxHeight: "calc(100vh - 108px)",
          overflowY: "auto",
          paddingBottom: "20px",
        }}
      >
        {/* Status and Rating */}
        <Row gutter={16} style={{ marginBottom: "16px" }}>
          <Col span={12}>
            <Card size="small" style={{ textAlign: "center" }}>
              <Title level={4} style={{ margin: 0 }}>
                Trạng thái:{" "}
                <Tag
                  color={getStatusColor(trip.status)}
                  style={{ fontSize: "14px" }}
                >
                  {getStatusText(trip.status)}
                </Tag>
              </Title>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" style={{ textAlign: "center" }}>
              <Space direction="vertical" size="small">
                <Rate disabled defaultValue={trip.average_rating} />
                <Text>
                  <StarOutlined /> {trip.average_rating}/5 điểm
                </Text>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Add alert for non-bookable trips */}
        {!isTripBookable(trip.status) && (
          <Alert
            message="Không thể đặt vé"
            description={`Chuyến đi này đã ${getStatusText(
              trip.status
            ).toLowerCase()}, không thể đặt vé.`}
            type="warning"
            showIcon
            style={{ marginBottom: "16px" }}
          />
        )}

        {/* Trip Seat Section (use items prop to avoid rc-collapse children deprecation) */}
        <Collapse
          defaultActiveKey={["1"]}
          style={{ marginBottom: "16px" }}
          items={[
            {
              key: "1",
              label: "Sơ đồ ghế",
              children: (
                <>
                  {seatLoading ? (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                      <Spin size="large" />
                      <div style={{ marginTop: "10px" }}>
                        Đang tải thông tin ghế...
                      </div>
                    </div>
                  ) : seatLayoutError || seatStatusError ? (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                      <Alert
                        message="Lỗi tải dữ liệu ghế"
                        description="Không thể tải thông tin ghế. Vui lòng thử lại."
                        type="error"
                        showIcon
                        action={
                          <Button
                            size="small"
                            onClick={() => {
                              refetchSeatStatuses();
                            }}
                          >
                            Thử lại
                          </Button>
                        }
                      />
                    </div>
                  ) : (
                    <TripSeatSelector
                      key={`seat-selector-${trip?.trip_id}`}
                      selectedSeats={selectedSeats}
                      onSeatSelect={handleSeatSelect}
                      availableSeats={trip?.available_seats || 0}
                      seatStatuses={seatStatuses}
                      tripStatus={trip.status}
                    />
                  )}

                  {/* Only show booking options for bookable trips */}
                  {selectedSeats.length > 0 && isTripBookable(trip.status) && (
                    <div style={{ marginTop: "12px" }}>
                      <Space direction="vertical" style={{ width: "100%" }}>
                        <div>
                          <Text strong>Ghế đã chọn:</Text>{" "}
                          {selectedSeats.map((seatNumber) => {
                            // Parse seat number to display format (e.g., "A.1.1" -> "A1")
                            const parts = seatNumber.split(".");
                            const displayLabel =
                              parts.length >= 2
                                ? `${parts[0]}${parts[1]}`
                                : seatNumber;
                            return (
                              <Tag
                                color={PALETTE.primary}
                                key={seatNumber}
                                style={{ margin: "2px" }}
                              >
                                {displayLabel}
                              </Tag>
                            );
                          })}
                        </div>
                        <div>
                          <Text strong>Tổng tiền:</Text>{" "}
                          <Text style={{ color: PALETTE.success }}>
                            {(
                              selectedSeats.length * (trip?.price_per_seat || 0)
                            ).toLocaleString("vi-VN")}{" "}
                            VNĐ
                          </Text>
                        </div>
                        <Button
                          type="primary"
                          icon={<ShoppingCartOutlined />}
                          onClick={() => setBookingModalVisible(true)}
                          style={{
                            marginTop: 8,
                            backgroundColor: PALETTE.primary,
                            borderColor: PALETTE.primary,
                          }}
                        >
                          Đặt vé ({selectedSeats.length} ghế)
                        </Button>
                        {/* Inline booking form inside drawer */}
                        {bookingModalVisible && renderBookingFormInline()}
                      </Space>
                    </div>
                  )}
                </>
              ),
            },
          ]}
        />

        {/* Route Information */}
        <Card
          title="Thông tin tuyến đường"
          size="small"
          style={{ marginBottom: "16px" }}
        >
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Điểm khởi hành">
              <Space>
                <EnvironmentOutlined style={{ color: PALETTE.success }} />
                <Text strong>{trip.route.start_location}</Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Điểm đến">
              <Space>
                <EnvironmentOutlined style={{ color: PALETTE.danger }} />
                <Text strong>{trip.route.end_location}</Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Khoảng cách">
              {tripDetails.distance}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian di chuyển">
              {tripDetails.duration} giờ
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Schedule Information */}
        <Card
          title="Thông tin lịch trình"
          size="small"
          style={{ marginBottom: "16px" }}
        >
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Ngày khởi hành">
              <Space>
                <CalendarOutlined />
                {dayjs(trip.departure_time).format("DD/MM/YYYY")}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Giờ khởi hành">
              <Space>
                <ClockCircleOutlined />
                {dayjs(trip.departure_time).format("HH:mm")}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Giờ đến dự kiến">
              <Space>
                <ClockCircleOutlined />
                {dayjs(trip.arrival_time).format("HH:mm")}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày đến">
              <Space>
                <CalendarOutlined />
                {dayjs(trip.arrival_time).format("DD/MM/YYYY")}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Bus and Operator Information */}
        <Card
          title="Thông tin nhà xe & xe khách"
          size="small"
          style={{ marginBottom: "16px" }}
        >
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Nhà xe">
              <Space>
                <CarOutlined />
                <Text strong>{trip.operator_name}</Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Loại xe">
              {tripDetails.busType}
            </Descriptions.Item>
            <Descriptions.Item label="Biển số xe">
              <Text code>{tripDetails.busPlate}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Tên tài xế">
              {tripDetails.driverName}
            </Descriptions.Item>
            <Descriptions.Item label="SĐT tài xế">
              {tripDetails.driverPhone}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Seat and Price Information */}
        <Card
          title="Thông tin ghế & giá vé"
          size="small"
          style={{ marginBottom: "16px" }}
        >
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Tổng số ghế">
              {tripDetails.totalSeats} ghế
            </Descriptions.Item>
            <Descriptions.Item label="Ghế còn trống">
              <Badge
                count={trip.available_seats}
                style={{
                  backgroundColor:
                    trip.available_seats > 20
                      ? PALETTE.success
                      : trip.available_seats > 10
                      ? PALETTE.warning
                      : PALETTE.danger,
                }}
              >
                <UserOutlined style={{ fontSize: 16 }} />
              </Badge>
            </Descriptions.Item>
            <Descriptions.Item label="Giá vé / ghế" span={2}>
              <Space>
                <DollarOutlined />
                <Text
                  strong
                  style={{ color: PALETTE.success, fontSize: "16px" }}
                >
                  {trip.price_per_seat.toLocaleString("vi-VN")} VNĐ
                </Text>
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Amenities */}
        <Card title="Tiện ích" size="small" style={{ marginBottom: "16px" }}>
          <div style={{ padding: "8px 0" }}>{renderAmenities()}</div>
        </Card>

        <Divider />

        {/* Notes */}
        <Card size="small" style={{ backgroundColor: "#f9f9f9" }}>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Thông tin chi tiết chuyến đi được cập nhật tự động từ hệ thống. Mọi
            thay đổi về lịch trình sẽ được thông báo kịp thời đến khách hàng.
          </Text>
        </Card>
      </div>

      {/* Add MailSenderModal at the end */}
      <MailSenderModal
        isVisible={isMailModalVisible}
        setIsVisible={setIsMailModalVisible}
        form={mailForm}
        defaultRecipient={mailForm.getFieldValue("toEmail") || ""}
        defaultSubject={mailForm.getFieldValue("subject") || ""}
        defaultUserName={mailForm.getFieldValue("userName") || ""}
        caseNumber={mailForm.getFieldValue("caseNumber") || ""}
        onSuccess={() => {
          message.success("Đã gửi email thành công!");
          setIsMailModalVisible(false);
          mailForm.resetFields();
        }}
      />

      {/* Add BulkMailSenderModal at the end */}
      <BulkMailSenderModal
        isVisible={isBulkMailModalVisible}
        setIsVisible={setIsBulkMailModalVisible}
        form={bulkMailForm}
        defaultTripId={bulkMailForm.getFieldValue("tripId") || trip?.trip_id}
        defaultSubject={bulkMailForm.getFieldValue("subject") || ""}
        csRepName="Admin" // Or get from current user context
        isForOperator={isForOperator} // Truyền prop để sử dụng sendCustomerSupportEmailToBusOperator khi true
        onSuccess={() => {
          message.success("Đã gửi email thành công!");
          setIsBulkMailModalVisible(false);
          bulkMailForm.resetFields();
          setIsForOperator(false); // Reset sau khi gửi
        }}
      />
    </Drawer>
  );
};

export default TripDetailModal;
