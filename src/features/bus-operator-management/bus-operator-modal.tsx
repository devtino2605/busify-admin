import React from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Row,
  Col,
  Card,
  message,
  Upload,
  type FormInstance,
  Select,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CarOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createBusOperator,
  updateBusOperator,
} from "../../app/api/bus-operator";
import type { UploadChangeParam } from "antd/es/upload";

const { TextArea } = Input;

export interface BusOperatorFormData {
  operatorId?: number;
  operatorName: string;
  email: string;
  hotline: string;
  address: string;
  description?: string;
  licenseFile: string;
  password?: string;
}

interface BusOperatorModalProps {
  isModalVisible: boolean;
  setIsModalVisible: (visible: boolean) => void;
  form: FormInstance;
  onSuccess?: () => void;
}

const BusOperatorModal: React.FC<BusOperatorModalProps> = ({
  isModalVisible,
  setIsModalVisible,
  form,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      console.log("Creating bus operator:", data);
      const response = await createBusOperator(data);
      return response;
    },
    onSuccess: (response) => {
      if (response.code === 200) {
        message.success(response.message || "Tạo nhà xe thành công!");
        queryClient.invalidateQueries({ queryKey: ["busOperators"] });
        if (onSuccess) onSuccess();
        form.resetFields();
        setIsModalVisible(false);
      } else {
        message.error(response.message || "Tạo nhà xe thất bại!");
      }
    },
    onError: (error: Error) => {
      message.error(`Lỗi tạo nhà xe: ${error.message}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData }) => {
      // TODO: Implement update API
      console.log("Updating bus operator:", data);
      const response = await updateBusOperator(id, data);
      return response;
    },
    onSuccess: (response, updateBusOperator) => {
      if (response.code === 200) {
        message.success(response.message || "Cập nhật nhà xe thành công!");
        queryClient.setQueryData(
          ["busOperators", updateBusOperator.id],
          updateBusOperator
        );
        queryClient.invalidateQueries({ queryKey: ["busOperators"] });
        if (onSuccess) onSuccess();
        form.resetFields();
        setIsModalVisible(false);
      } else {
        message.error(response.message || "Cập nhật nhà xe thất bại!");
      }
    },
    onError: (error: Error) => {
      message.error(`Lỗi cập nhật nhà xe: ${error.message}`);
    },
  });

  const normFile = (e: UploadChangeParam) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const handleSubmit = async () => {
    form.validateFields().then((values) => {
      console.log("Form values before submission:", values);
      const formData = new FormData();
      formData.append("name", values.operatorName);
      formData.append("email", values.email);
      formData.append("hotline", values.hotline);
      formData.append("address", values.address);
      formData.append("description", values.description);
      formData.append("status", values.status);
      if (values.password) {
        formData.append("password", values.password);
      }
      const fileObj = values.licenseFile?.[0]?.originFileObj;
      if (fileObj) {
        formData.append("licenseFile", fileObj);
      }

      console.log("Submitting form data:", values.operatorId);

      if (form.getFieldValue("operatorId")) {
        updateMutation.mutate({ id: values.operatorId, data: formData });
      } else {
        createMutation.mutate(formData);
      }
    });
  };

  // Set form values when editing
  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <CarOutlined />
          {form.getFieldValue("operatorId")
            ? "Chỉnh sửa nhà xe"
            : "Thêm nhà xe mới"}
        </div>
      }
      open={isModalVisible}
      onCancel={() => setIsModalVisible(false)}
      width={800}
      footer={[
        <Button key="cancel" onClick={() => setIsModalVisible(false)}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={createMutation.isPending || updateMutation.isPending}
          onClick={handleSubmit}
        >
          {form.getFieldValue("operatorId") ? "Cập nhật" : "Tạo mới"}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" className="mt-4">
        {/* Hidden field for operatorId */}
        <Form.Item name="operatorId" hidden>
          <Input />
        </Form.Item>

        {/* Bus Operator Information */}
        <Card title="Thông tin nhà xe" className="mb-4">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="operatorName"
                label="Tên nhà xe"
                rules={[
                  { required: true, message: "Vui lòng nhập tên nhà xe!" },
                  { min: 2, message: "Tên nhà xe phải có ít nhất 2 ký tự!" },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Nhập tên nhà xe"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email nhà xe"
                rules={[
                  { required: true, message: "Vui lòng nhập email!" },
                  { type: "email", message: "Email không hợp lệ!" },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="Nhập email nhà xe"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Trạng thái"
                rules={[
                  { required: true, message: "Vui lòng chọn trạng thái!" },
                ]}
              >
                <Select placeholder="Chọn trạng thái">
                  <Select.Option value="active">Hoạt động</Select.Option>
                  <Select.Option value="suspended">Tạm ngưng</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="password"
                label="Mật khẩu (Tài khoản chủ)"
                rules={[
                  { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
                ]}
              >
                <Input.Password placeholder="Nhập mật khẩu (để trống nếu không đổi)" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="hotline"
                label="Hotline"
                rules={[
                  { required: true, message: "Vui lòng nhập số hotline!" },
                  {
                    pattern: /^[0-9]{10,11}$/,
                    message: "Số điện thoại phải có 10-11 chữ số!",
                  },
                ]}
              >
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="Nhập số hotline"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="licenseFile"
                label="Đường dẫn giấy phép"
                getValueFromEvent={normFile}
              >
                <Upload
                  beforeUpload={(file) => {
                    const isValid = [
                      "application/pdf",
                      "image/png",
                      "image/jpeg",
                      "image/gif",
                      "image/jpg",
                    ].includes(file.type);
                    if (!isValid) {
                      message.error("Chỉ chấp nhận file PDF hoặc hình ảnh!");
                      return Upload.LIST_IGNORE;
                    }
                    return false;
                  }}
                  multiple={false}
                >
                  <Button icon={<UploadOutlined />}>Click to Upload</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="Địa chỉ nhà xe"
            rules={[{ required: true, message: "Vui lòng nhập địa chỉ!" }]}
          >
            <TextArea rows={2} placeholder="Nhập địa chỉ nhà xe" />
          </Form.Item>
        </Card>
      </Form>
    </Modal>
  );
};

export default BusOperatorModal;
