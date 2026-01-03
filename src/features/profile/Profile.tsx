import React, { useState } from "react";
import {
  Card,
  Typography,
  Button,
  Modal,
  Form,
  Input,
  Row,
  Col,
  message,
  Spin,
} from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  getUserProfile,
  changeUserPassword,
  updateUserProfile,
} from "../../app/api/user";
import { useAuthStore } from "../../stores/auth_store";

const { Title, Text } = Typography;

const ProfilePage: React.FC = () => {
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [passwordForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const { logOut } = useAuthStore();
  const queryClient = useQueryClient();

  // Fetch user profile
  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["userProfile"],
    queryFn: getUserProfile,
  });

  // Mutation change password
  const changePasswordMutation = useMutation({
    mutationFn: changeUserPassword,
    onSuccess: () => {
      message.success("Đổi mật khẩu thành công, vui lòng đăng nhập lại.");
      setIsPasswordModalVisible(false);
      passwordForm.resetFields();
      logOut();
    },
    onError: (error: AxiosError) => {
      const errorMessage = (error.response?.data as { message?: string })
        ?.message;
      message.error(errorMessage || "Đổi mật khẩu thất bại!");
    },
  });

  // Mutation update profile
  const updateProfileMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      message.success("Cập nhật thông tin người dùng thành công");
      setIsEditModalVisible(false);
      editForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
    onError: (error: AxiosError) => {
      const errorMessage = (error.response?.data as { message?: string })
        ?.message;
      message.error(
        errorMessage || "Cập nhật thông tin người dùng không thành công"
      );
    },
  });

  const handlePasswordSubmit = async () => {
    try {
      const values = await passwordForm.validateFields();
      changePasswordMutation.mutate(values);
    } catch {
      message.error("Vui lòng kiểm tra lại thông tin nhập vào!");
    }
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      updateProfileMutation.mutate(values);
    } catch {
      message.error("Vui lòng kiểm tra lại thông tin nhập vào!");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !profile?.result) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <p>Không thể tải dữ liệu người dùng!</p>
      </div>
    );
  }

  const user = profile.result;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        Hồ sơ người dùng
      </Title>
      <Card>
        {/* Info */}
        <Row gutter={16} align="middle" style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>ID:</Text> {user.id}
              </Col>
              <Col span={12}>
                <Text strong>Họ tên:</Text> {user.fullName}
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={12}>
                <Text strong>Email:</Text> {user.email}
              </Col>
              <Col span={12}>
                <Text strong>Số điện thoại:</Text> {user.phoneNumber}
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={24}>
                <Text strong>Địa chỉ:</Text> {user.address}
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={12}>
                <Text strong>Trạng thái:</Text>{" "}
                <span
                  style={{
                    color: user.status === "active" ? "#52c41a" : "#ff4d4f",
                  }}
                >
                  {user.status === "active" ? "Hoạt động" : "Không hoạt động"}
                </span>
              </Col>
              <Col span={12}>
                <Text strong>Vai trò:</Text> {user.roleName}
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={12}>
                <Text strong>Email xác thực:</Text>{" "}
                {user.emailVerified ? "Đã xác thực" : "Chưa xác thực"}
              </Col>
              <Col span={12}>
                <Text strong>Nhà cung cấp:</Text> {user.authProvider}
              </Col>
            </Row>
          </Col>
        </Row>

        {/* Actions */}
        <Row gutter={16} style={{ marginTop: 24, marginBottom: 16 }}>
          <Col>
            <Button
              onClick={() => {
                setIsEditModalVisible(true);
                editForm.setFieldsValue(user);
              }}
            >
              Chỉnh sửa hồ sơ
            </Button>
          </Col>
          <Col>
            <Button onClick={() => setIsPasswordModalVisible(true)}>
              Đổi mật khẩu
            </Button>
          </Col>
        </Row>
        <Row>
          <p className="text-slate-400">
            Any information you provide will be kept confidential. Any changes
            made will be reflected in your account. And any customer can see
            your public information.
          </p>
        </Row>
      </Card>

      {/* Modal Đổi mật khẩu */}
      <Modal
        title="Đổi mật khẩu"
        open={isPasswordModalVisible}
        onCancel={() => setIsPasswordModalVisible(false)}
        onOk={handlePasswordSubmit}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={changePasswordMutation.isPending}
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            name="oldPassword"
            label="Mật khẩu cũ"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu cũ" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu mới" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            dependencies={["newPassword"]}
            rules={[{ required: true, message: "Vui lòng nhập lại mật khẩu" }]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Chỉnh sửa hồ sơ */}
      <Modal
        title="Chỉnh sửa hồ sơ"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        onOk={handleEditSubmit}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={updateProfileMutation.isPending}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="fullName" label="Họ tên">
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: "email", message: "Email không hợp lệ" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="phoneNumber" label="Số điện thoại">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProfilePage;
