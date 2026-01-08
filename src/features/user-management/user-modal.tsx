import {
  Checkbox,
  Col,
  Form,
  Input,
  message,
  Modal,
  Row,
  Select,
  type FormInstance,
} from "antd";
import { getAllRoles } from "../../app/api/role";
import type { Role } from "../../types/role";
import { createUser, updateUser } from "../../app/api/user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface UserModalProps {
  isModalVisible: boolean;
  setIsModalVisible: (visible: boolean) => void;
  form: FormInstance;
  onSuccess?: () => void;
}

export interface UserInfo {
  fullName: string;
  email: string;
  phoneNumber: string;
  roleId: string;
  address: string;
  emailVerified: boolean;
  password?: string;
}

const UserModal = ({
  isModalVisible,
  setIsModalVisible,
  form,
  onSuccess,
}: UserModalProps) => {
  const queryClient = useQueryClient();

  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const response = await getAllRoles();
      return response.result as Role[];
    },
    staleTime: 1000 * 60 * 10,
  });

  const createUserMutation = useMutation({
    mutationFn: async (userInfo: UserInfo) => {
      const response = await createUser(userInfo);
      return response;
    },
    onSuccess: (response) => {
      if (response.code === 200) {
        message.success(response.message || "Tạo người dùng thành công");
        queryClient.invalidateQueries({ queryKey: ["users"] });
        setIsModalVisible(false);
        if (onSuccess) onSuccess();
      } else {
        message.error(response.message || "Tạo người dùng thất bại");
      }
    },

    onError: (error) => {
      message.error(error.message || "Tạo người dùng thất bại");
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({
      id,
      userInfo,
    }: {
      id: number;
      userInfo: UserInfo;
    }) => {
      const response = await updateUser(id, userInfo);
      return response;
    },
    onSuccess: (response, updateUser) => {
      if (response.code === 200) {
        message.success(response.message || "Cập nhật người dùng thành công");
        queryClient.setQueryData(["users", updateUser.id], updateUser);
        queryClient.invalidateQueries({ queryKey: ["users"] });

        setIsModalVisible(false);
        if (onSuccess) onSuccess();
      } else {
        message.error(response.message || "Cập nhật người dùng thất bại");
      }
    },
    onError: (error) => {
      message.error(error.message || "Cập nhật người dùng thất bại");
    },
  });

  const handleOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        const userUpdate: UserInfo = {
          fullName: values.fullName,
          email: values.email,
          phoneNumber: values.phoneNumber,
          roleId: values.roleId,
          address: values.address,
          emailVerified: values.emailVerified,
          password: values.password,
        };
        if (values.id) {
          updateUserMutation.mutate({ id: values.id, userInfo: userUpdate });
        } else {
          createUserMutation.mutate(userUpdate);
        }
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  return (
    <Modal
      title={
        form.getFieldValue("id")
          ? "Chỉnh sửa người dùng"
          : "Thêm người dùng mới"
      }
      open={isModalVisible}
      onCancel={() => setIsModalVisible(false)}
      onOk={() => handleOk()}
      confirmLoading={
        createUserMutation.isPending || updateUserMutation.isPending
      }
      width={700}
    >
      <Form form={form} layout="vertical" name="userForm">
        <Form.Item name="id" hidden>
          <Input />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="fullName"
              label="Họ và tên"
              rules={[
                { required: true, message: "Vui lòng nhập họ tên!" },
                { min: 2, message: "Họ và tên phải có ít nhất 2 ký tự!" },
                {
                  max: 100,
                  message: "Họ và tên không được vượt quá 100 ký tự!",
                },
              ]}
            >
              <Input placeholder="Nhập họ và tên" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Vui lòng nhập email!" },
                { type: "email", message: "Vui lòng nhập email hợp lệ!" },
              ]}
            >
              <Input placeholder="Nhập địa chỉ email" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="phoneNumber"
              label="Số điện thoại"
              rules={[
                { required: true, message: "Vui lòng nhập số điện thoại!" },
                {
                  pattern: /^(0|\\+84)[0-9]{9}$/,
                  message: "Số điện thoại phải có 10 hoặc 11 chữ số!",
                },
              ]}
            >
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="roleId"
              label="Vai trò"
              rules={[{ required: true, message: "Vui lòng chọn vai trò!" }]}
            >
              <Select placeholder="Chọn vai trò">
                {rolesData?.map((role) => (
                  <Select.Option key={role.id} value={role.id}>
                    {role.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="emailVerified"
              label="Email đã xác thực"
              valuePropName="checked"
            >
              <Checkbox>Email đã được xác thực</Checkbox>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[{ min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" }]}
            >
              <Input.Password placeholder="Nhập mật khẩu (để trống nếu không đổi)" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="address"
          label="Địa chỉ"
          rules={[
            { required: true, message: "Vui lòng nhập địa chỉ!" },
            {
              max: 255,
              message: "Địa chỉ không được vượt quá 255 ký tự!",
            },
          ]}
        >
          <Input.TextArea rows={3} placeholder="Nhập địa chỉ đầy đủ" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UserModal;
