import React from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  message,
  type FormInstance,
} from "antd";
import {
  MailOutlined,
  SendOutlined,
  CloseOutlined,
  NumberOutlined,
} from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import {
  sendBulkCustomerSupportEmailForTrip,
  sendCustomerSupportEmailToBusOperator,
  type BulkCustomerSupportEmailRequestDTO,
} from "../app/api/email";

const { TextArea } = Input;

interface BulkMailSenderModalProps {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  form: FormInstance;
  defaultTripId?: number;
  defaultSubject?: string;
  csRepName?: string;
  isForOperator?: boolean; // Thêm prop để phân biệt loại email
  onSuccess?: () => void;
}

const BulkMailSenderModal: React.FC<BulkMailSenderModalProps> = ({
  isVisible,
  setIsVisible,
  form,
  defaultTripId,
  defaultSubject,
  csRepName,
  isForOperator = false, // Mặc định là false (gửi cho hành khách)
  onSuccess,
}) => {
  const sendBulkEmailMutation = useMutation({
    mutationFn: async (emailData: BulkCustomerSupportEmailRequestDTO) => {
      // Chọn API dựa trên isForOperator
      const apiFunction = isForOperator
        ? sendCustomerSupportEmailToBusOperator
        : sendBulkCustomerSupportEmailForTrip;
      const response = await apiFunction(emailData);
      return response;
    },
    onSuccess: (response) => {
      if (response.code === 200) {
        const successMessage = isForOperator
          ? "Email đến nhà xe đã được gửi thành công!"
          : "Email hàng loạt đã được gửi thành công!";
        message.success(successMessage);
        setIsVisible(false);
        form.resetFields();
        if (onSuccess) onSuccess();
      } else {
        const errorMessage = isForOperator
          ? "Gửi email đến nhà xe thất bại!"
          : "Gửi email hàng loạt thất bại!";
        message.error(response.message || errorMessage);
      }
    },
    onError: (error: Error) => {
      const errorMessage = isForOperator
        ? `Lỗi gửi email đến nhà xe: ${error.message}`
        : `Lỗi gửi email hàng loạt: ${error.message}`;
      message.error(errorMessage);
    },
  });

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        const emailData: BulkCustomerSupportEmailRequestDTO = {
          tripId: values.tripId,
          subject: values.subject,
          message: values.message,
          csRepName: csRepName || "Admin", // You can make this dynamic based on current user
        };
        sendBulkEmailMutation.mutate(emailData);
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  const handleCancel = () => {
    setIsVisible(false);
    form.resetFields();
  };

  // Set default values when modal opens
  React.useEffect(() => {
    if (isVisible) {
      form.setFieldsValue({
        tripId: defaultTripId || "",
        subject: defaultSubject || "",
      });
    }
  }, [isVisible, defaultTripId, defaultSubject, form]);

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <MailOutlined />
          <span>
            {isForOperator ? "Gửi Email Cho Nhà Xe" : "Gửi Email Hàng Loạt"}
          </span>
        </div>
      }
      open={isVisible}
      onCancel={handleCancel}
      width={600}
      footer={null}
      destroyOnHidden
    >
      <div
        style={{
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          padding: "24px",
          margin: "16px 0",
        }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Trip ID Field */}
          <Form.Item
            name="tripId"
            label="ID Chuyến Đi"
            rules={[
              { required: true, message: "Vui lòng nhập ID chuyến đi!" },
              {
                type: "number",
                message: "ID phải là số!",
                transform: (value) => Number(value),
              },
            ]}
          >
            <Input
              type="number"
              prefix={<NumberOutlined />}
              placeholder="Nhập ID chuyến đi"
              style={{ borderRadius: "6px" }}
              disabled={true} // Disable editing of tripId
            />
          </Form.Item>

          {/* Subject Field */}
          <Form.Item
            name="subject"
            label="Tiêu Đề"
            rules={[
              { required: true, message: "Vui lòng nhập tiêu đề email!" },
              { max: 200, message: "Tiêu đề không được vượt quá 200 ký tự!" },
            ]}
          >
            <Input
              placeholder="Nhập tiêu đề email"
              style={{
                borderRadius: "6px",
                border: "2px solid #e9ecef",
                padding: "8px 12px",
              }}
            />
          </Form.Item>

          {/* Message Field */}
          <Form.Item
            name="message"
            label="Nội Dung"
            rules={[
              { required: true, message: "Vui lòng nhập nội dung email!" },
              {
                max: 1000,
                message: "Nội dung không được vượt quá 1000 ký tự!",
              },
            ]}
          >
            <TextArea
              rows={6}
              placeholder="Nhập nội dung email..."
              style={{
                borderRadius: "8px",
                border: "2px solid #e9ecef",
                resize: "none",
              }}
              maxLength={1000}
              showCount
            />
          </Form.Item>

          {/* Action Buttons */}
          <Form.Item style={{ marginBottom: 0, marginTop: "24px" }}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button
                onClick={handleCancel}
                style={{
                  borderRadius: "6px",
                  padding: "6px 20px",
                  height: "auto",
                }}
              >
                <CloseOutlined />
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={sendBulkEmailMutation.isPending}
                style={{
                  borderRadius: "6px",
                  padding: "6px 20px",
                  height: "auto",
                  backgroundColor: "#007bff",
                  borderColor: "#007bff",
                }}
              >
                <SendOutlined />
                Gửi
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default BulkMailSenderModal;
