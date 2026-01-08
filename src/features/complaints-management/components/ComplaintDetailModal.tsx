import React, { useState, useEffect } from "react";
import {
  Modal,
  Descriptions,
  Typography,
  Tag,
  Space,
  Button,
  Card,
  Row,
  Col,
  Avatar,
  message,
  Form,
  Select,
  Input,
  Divider,
} from "antd";
import {
  UserOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  BookOutlined,
  CarOutlined,
  CloseOutlined,
  CheckOutlined,
  EditOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getComplaintById,
  updateComplaintStatus,
  type ComplaintDetail,
} from "../../../app/api/complaint";

const { Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface ComplaintDetailModalProps {
  complaint: ComplaintDetail | null;
  visible: boolean;
  onClose: () => void;
  onUpdate?: (complaint: ComplaintDetail) => void;
}

const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaint,
  visible,
  onClose,
  onUpdate,
}) => {
  const [form] = Form.useForm();
  const [detailLoading, setDetailLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [complaintDetail, setComplaintDetail] =
    useState<ComplaintDetail | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchComplaintDetail = async () => {
      if (complaint && visible) {
        // If we already have the full details, use them directly
        if (complaint.customer && complaint.booking) {
          setComplaintDetail(complaint);
          return;
        }

        // Otherwise, fetch the full details
        setDetailLoading(true);
        try {
          const response = await getComplaintById(complaint.id);
          setComplaintDetail(response.result);
        } catch (error) {
          message.error("Không thể tải thông tin chi tiết khiếu nại: " + error);
        } finally {
          setDetailLoading(false);
        }
      }
    };

    fetchComplaintDetail();
  }, [complaint, visible]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New":
        return "red";
      case "pending":
        return "orange";
      case "in_progress":
        return "blue";
      case "resolved":
        return "green";
      case "rejected":
        return "volcano";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "New":
        return "Mới";
      case "pending":
        return "Chờ xử lý";
      case "in_progress":
        return "Đang xử lý";
      case "resolved":
        return "Đã giải quyết";
      case "rejected":
        return "Từ chối";
      default:
        return status;
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "green";
      case "pending":
        return "orange";
      case "cancelled":
        return "red";
      default:
        return "default";
    }
  };

  const getBookingStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Đã xác nhận";
      case "pending":
        return "Chờ xử lý";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const handleUpdateStatus = async (values: any) => {
    if (!complaintDetail) return;

    setUpdateLoading(true);
    try {
      const response = await updateComplaintStatus(
        complaintDetail.id,
        values.status
      );

      if (response.code === 200) {
        message.success("Cập nhật trạng thái khiếu nại thành công");
        setComplaintDetail(response.result);
        setIsProcessing(false);
        form.resetFields();

        if (onUpdate) {
          onUpdate(response.result);
        }
      } else {
        message.error(response.message || "Cập nhật thất bại");
      }
    } catch (error) {
      message.error("Không thể cập nhật trạng thái khiếu nại");
      console.error(error);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleStartProcessing = () => {
    setIsProcessing(true);
    form.setFieldsValue({
      status: complaintDetail?.status || "in_progress",
    });
  };

  const handleCancelProcessing = () => {
    setIsProcessing(false);
    form.resetFields();
  };

  if (!complaint) {
    return null;
  }

  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: "#faad14" }} />
          <span>Chi tiết khiếu nại #{complaint.id}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      footer={
        isProcessing ? (
          <Space>
            <Button onClick={handleCancelProcessing}>Hủy</Button>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              loading={updateLoading}
              onClick={() => form.submit()}
            >
              Lưu thay đổi
            </Button>
          </Space>
        ) : (
          <Space>
            <Button icon={<CloseOutlined />} onClick={onClose}>
              Đóng
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={handleStartProcessing}
              disabled={complaintDetail?.status === "resolved"}
            >
              Xử lý khiếu nại
            </Button>
          </Space>
        )
      }
    >
      <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
        {detailLoading ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <Space direction="vertical">
              <span>Đang tải thông tin chi tiết...</span>
            </Space>
          </div>
        ) : !complaintDetail ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <Text type="secondary">
              Không thể tải thông tin chi tiết khiếu nại
            </Text>
          </div>
        ) : (
          <>
            {/* Complaint Information */}
            <Card title="Thông tin khiếu nại" style={{ marginBottom: "16px" }}>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="ID khiếu nại" span={1}>
                  <Text strong>#{complaintDetail.id}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái" span={1}>
                  <Tag color={getStatusColor(complaintDetail.status)}>
                    {getStatusText(complaintDetail.status)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Tiêu đề" span={2}>
                  <Text strong>{complaintDetail.title}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Nội dung khiếu nại" span={2}>
                  <Paragraph>{complaintDetail.description}</Paragraph>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo" span={1}>
                  <Space>
                    <CalendarOutlined />
                    {dayjs(complaintDetail.createdAt).format(
                      "DD/MM/YYYY HH:mm"
                    )}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Cập nhật lần cuối" span={1}>
                  <Space>
                    <CalendarOutlined />
                    {dayjs(complaintDetail.updatedAt).format(
                      "DD/MM/YYYY HH:mm"
                    )}
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Customer Information */}
            <Card title="Thông tin khách hàng" style={{ marginBottom: "16px" }}>
              <Row gutter={16}>
                <Col span={4}>
                  <Avatar size={64} icon={<UserOutlined />} />
                </Col>
                <Col span={20}>
                  <Descriptions column={2} bordered size="small">
                    <Descriptions.Item label="Tên khách hàng" span={1}>
                      <Text strong>
                        {complaintDetail.customer.customerName}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Mã khách hàng" span={1}>
                      #{complaintDetail.customer.customerId}
                    </Descriptions.Item>
                    <Descriptions.Item label="Email" span={1}>
                      <Space>
                        <MailOutlined />
                        {complaintDetail.customer.customerEmail}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại" span={1}>
                      <Space>
                        <PhoneOutlined />
                        {complaintDetail.customer.customerPhone}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Địa chỉ" span={2}>
                      <Space>
                        <EnvironmentOutlined />
                        {complaintDetail.customer.customerAddress}
                      </Space>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            {/* Processing Form */}
            {isProcessing && (
              <>
                <Divider>Xử lý khiếu nại</Divider>
                <Card
                  title="Cập nhật trạng thái"
                  style={{ marginBottom: "16px" }}
                >
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdateStatus}
                    initialValues={{
                      status: complaintDetail.status,
                    }}
                  >
                    <Form.Item
                      name="status"
                      label="Trạng thái mới"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng chọn trạng thái",
                        },
                      ]}
                    >
                      <Select placeholder="Chọn trạng thái">
                        <Option value="pending">Chờ xử lý</Option>
                        <Option value="in_progress">Đang xử lý</Option>
                        <Option value="resolved">Đã giải quyết</Option>
                        <Option value="rejected">Từ chối</Option>
                      </Select>
                    </Form.Item>
                  </Form>
                </Card>
              </>
            )}

            {/* Booking Information */}
            <Card title="Thông tin đặt vé liên quan">
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Mã đặt vé" span={1}>
                  <Space>
                    <BookOutlined />
                    <Text strong style={{ color: "#1890ff" }}>
                      {complaintDetail.booking.bookingCode}
                    </Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái đặt vé" span={1}>
                  <Tag
                    color={getBookingStatusColor(
                      complaintDetail.booking.bookingStatus
                    )}
                  >
                    {getBookingStatusText(
                      complaintDetail.booking.bookingStatus
                    )}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Tuyến đường" span={2}>
                  <Text strong>{complaintDetail.booking.routeName}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Điểm khởi hành" span={1}>
                  <Space>
                    <EnvironmentOutlined style={{ color: "#52c41a" }} />
                    {complaintDetail.booking.startLocation}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Điểm đến" span={1}>
                  <Space>
                    <EnvironmentOutlined style={{ color: "#f5222d" }} />
                    {complaintDetail.booking.endLocation}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian khởi hành" span={1}>
                  {dayjs(complaintDetail.booking.departureTime).format(
                    "DD/MM/YYYY HH:mm"
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian đến" span={1}>
                  {dayjs(complaintDetail.booking.arrivalTime).format(
                    "DD/MM/YYYY HH:mm"
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Nhà xe" span={1}>
                  <Space>
                    <CarOutlined />
                    {complaintDetail.booking.operatorName}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Biển số xe" span={1}>
                  <Text code>{complaintDetail.booking.busLicensePlate}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Số ghế" span={1}>
                  <Tag color="blue">{complaintDetail.booking.seatNumber}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Tổng tiền" span={1}>
                  <Text strong style={{ color: "#52c41a" }}>
                    {complaintDetail.booking.totalAmount.toLocaleString(
                      "vi-VN"
                    )}{" "}
                    VNĐ
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày đặt vé" span={2}>
                  {dayjs(complaintDetail.booking.bookingDate).format(
                    "DD/MM/YYYY HH:mm"
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ComplaintDetailModal;
