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
  UserOutlined,
  SendOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import {
  sendCustomerSupportEmail,
  type CustomerSupportEmailRequestDTO,
} from "../app/api/email";

const { TextArea } = Input;

interface MailSenderModalProps {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  form: FormInstance;
  defaultRecipient?: string;
  defaultSubject?: string;
  defaultUserName?: string;
  caseNumber?: string;
  csRepName?: string;
  onSuccess?: () => void;
}

const MailSenderModal: React.FC<MailSenderModalProps> = ({
  isVisible,
  setIsVisible,
  form,
  defaultRecipient,
  defaultSubject,
  defaultUserName,
  csRepName,
  caseNumber,
  onSuccess,
}) => {
  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: CustomerSupportEmailRequestDTO) => {
      const response = await sendCustomerSupportEmail(emailData);
      return response;
    },
    onSuccess: (response) => {
      if (response.code === 200) {
        message.success("Email đã được gửi thành công!");
        setIsVisible(false);
        form.resetFields();
        if (onSuccess) onSuccess();
      } else {
        message.error(response.message || "Gửi email thất bại!");
      }
    },
    onError: (error: Error) => {
      message.error(`Lỗi gửi email: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        const emailData: CustomerSupportEmailRequestDTO = {
          toEmail: values.toEmail,
          userName: values.userName,
          subject: values.subject,
          message: values.message,
          caseNumber: caseNumber || values.caseNumber,
          csRepName: csRepName || "Admin", // You can make this dynamic based on current user
        };
        sendEmailMutation.mutate(emailData);
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
        toEmail: defaultRecipient || "",
        subject: defaultSubject || "",
        caseNumber: caseNumber || "",
        userName: defaultUserName || "",
      });
    }
  }, [
    isVisible,
    defaultRecipient,
    defaultSubject,
    caseNumber,
    defaultUserName,
    form,
  ]);

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <MailOutlined />
          <span>Gửi Email</span>
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
          {/* To Email Field */}
          <Form.Item
            name="toEmail"
            label="Người nhận"
            rules={[
              { required: true, message: "Vui lòng nhập email người nhận!" },
              { type: "email", message: "Email không hợp lệ!" },
              { max: 100, message: "Email không được vượt quá 100 ký tự!" },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Nhập địa chỉ email người nhận"
              style={{ borderRadius: "6px" }}
            />
          </Form.Item>

          {/* User Name Field */}
          <Form.Item
            name="userName"
            label="Tên người dùng"
            rules={[
              { required: true, message: "Vui lòng nhập tên người dùng!" },
              { max: 100, message: "Tên không được vượt quá 100 ký tự!" },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Nhập tên người dùng"
              style={{ borderRadius: "6px" }}
            />
          </Form.Item>

          {/* Subject Field */}
          <Form.Item
            name="subject"
            label="Tiêu đề"
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

          {/* Case Number Field (Optional) */}
          {!caseNumber && (
            <Form.Item
              name="caseNumber"
              label="Mã số vụ việc (tùy chọn)"
              rules={[
                { max: 50, message: "Mã số không được vượt quá 50 ký tự!" },
              ]}
            >
              <Input
                placeholder="Nhập mã số vụ việc (nếu có)"
                style={{ borderRadius: "6px" }}
              />
            </Form.Item>
          )}

          {/* Message Field */}
          <Form.Item
            name="message"
            label="Nội dung"
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
                loading={sendEmailMutation.isPending}
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

export default MailSenderModal;
