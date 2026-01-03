/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import {
  Modal,
  Descriptions,
  Space,
  Typography,
  Card,
  Button,
  message,
  Rate,
  Form,
} from "antd";
import {
  StarOutlined,
  UserOutlined,
  CalendarOutlined,
  MessageOutlined,
  PrinterOutlined,
  MailOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import MailSenderModal from "../../../components/MailSenderModal";

const { Title, Text, Paragraph } = Typography;

interface Review {
  reviewId: number;
  rating: number;
  customerName: string;
  customerEmail: string;
  comment: string;
  createdAt: string;
}

interface ReviewDetailModalProps {
  review: Review | null;
  visible: boolean;
  onClose: () => void;
}

const ReviewDetailModal: React.FC<ReviewDetailModalProps> = ({
  review,
  visible,
  onClose,
}) => {
  const [mailForm] = Form.useForm();
  const [isMailModalVisible, setIsMailModalVisible] = React.useState(false);

  if (!review) return null;

  const handlePrintInfo = () => {
    message.success("Đang chuẩn bị in thông tin đánh giá...");
  };

  const handleSendEmail = () => {
    mailForm.setFieldsValue({
      toEmail: review.customerEmail,
      userName: review.customerName,
      subject: `Thông tin đánh giá ${review.reviewId} - Busify`,
      caseNumber: review.reviewId.toString(),
      message: "", // Leave empty for agent to edit
    });
    setIsMailModalVisible(true);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "#52c41a";
    if (rating >= 3) return "#faad14";
    return "#ff4d4f";
  };

  const getRatingText = (rating: number) => {
    if (rating === 5) return "Xuất sắc";
    if (rating === 4) return "Tốt";
    if (rating === 3) return "Bình thường";
    if (rating === 2) return "Kém";
    return "Rất kém";
  };

  return (
    <>
      <Modal
        title={
          <Space>
            <StarOutlined />
            <span>Chi tiết đánh giá - #{review.reviewId}</span>
          </Space>
        }
        open={visible}
        onCancel={onClose}
        width={600}
        footer={[
          <Button key="email" icon={<MailOutlined />} onClick={handleSendEmail}>
            Gửi email
          </Button>,
          <Button
            key="print"
            icon={<PrinterOutlined />}
            onClick={handlePrintInfo}
          >
            In thông tin
          </Button>,
          <Button key="close" onClick={onClose}>
            Đóng
          </Button>,
        ]}
      >
        <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {/* Rating Section */}
          <Card
            size="small"
            style={{ marginBottom: "16px", textAlign: "center" }}
          >
            <Space direction="vertical" size="small">
              <Rate disabled defaultValue={review.rating} />
              <Title
                level={4}
                style={{ margin: 0, color: getRatingColor(review.rating) }}
              >
                {review.rating}/5 - {getRatingText(review.rating)}
              </Title>
            </Space>
          </Card>

          {/* Customer Information */}
          <Card
            title="Thông tin khách hàng"
            size="small"
            style={{ marginBottom: "16px" }}
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Tên khách hàng">
                <Space>
                  <UserOutlined />
                  <Text strong>{review.customerName}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày đánh giá">
                <Space>
                  <CalendarOutlined />
                  {dayjs(review.createdAt).format("DD/MM/YYYY HH:mm")}
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Review Content */}
          <Card
            title="Nội dung đánh giá"
            size="small"
            style={{ marginBottom: "16px" }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <MessageOutlined style={{ marginRight: "8px" }} />
                <Text strong>Bình luận:</Text>
              </div>
              <Card style={{ backgroundColor: "#fafafa" }}>
                <Paragraph style={{ margin: 0, fontStyle: "italic" }}>
                  "{review.comment}"
                </Paragraph>
              </Card>
            </Space>
          </Card>

          {/* Additional Info */}
          <Card size="small" style={{ backgroundColor: "#f9f9f9" }}>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              Thông tin đánh giá được thu thập tự động từ hệ thống. Dùng để cải
              thiện chất lượng dịch vụ.
            </Text>
          </Card>
        </div>
      </Modal>

      <MailSenderModal
        isVisible={isMailModalVisible}
        setIsVisible={setIsMailModalVisible}
        form={mailForm}
        defaultRecipient={review.customerName}
        defaultSubject={`Thông tin đánh giá ${review.reviewId} - Busify`}
        defaultUserName={review.customerName}
        caseNumber={review.reviewId.toString()}
        onSuccess={() => {
          message.success("Đã gửi email thành công!");
        }}
      />
    </>
  );
};

export default ReviewDetailModal;
