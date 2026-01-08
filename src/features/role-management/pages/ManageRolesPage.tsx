import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Space,
  Typography,
  Row,
  Col,
  Popconfirm,
  Tag,
} from "antd";
import {
  SafetyCertificateOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { Role, CreateRoleRequest } from "../../../types/role";
import {
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
} from "../../../app/api/role";
import "../styles.css";

const { Title, Text } = Typography;
const { TextArea } = Input;

const ManageRolesPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const response = await getAllRoles();
      if (response.code === 200) {
        setRoles((response.result as Role[]) || []);
      }
    } catch (error) {
      message.error("Không thể tải danh sách vai trò");
      console.error("Error loading roles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: CreateRoleRequest) => {
    try {
      setLoading(true);
      let response;

      if (editingRole) {
        response = await updateRole({
          id: editingRole.id,
          ...values,
        });
      } else {
        response = await createRole(values);
      }

      if (response.code === 200) {
        message.success(
          editingRole ? "Cập nhật vai trò thành công" : "Tạo vai trò thành công"
        );
        setModalVisible(false);
        form.resetFields();
        setEditingRole(null);
        loadRoles();
      } else {
        message.error("Có lỗi xảy ra");
      }
    } catch (error) {
      message.error("Có lỗi xảy ra khi lưu vai trò");
      console.error("Error saving role:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await deleteRole(id);
      if (response.code === 200) {
        message.success("Xóa vai trò thành công");
        loadRoles();
      } else {
        message.error("Xóa vai trò thất bại");
      }
    } catch (error) {
      message.error("Có lỗi xảy ra khi xóa vai trò");
      console.error("Error deleting role:", error);
    }
  };

  const openModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      form.setFieldsValue({
        name: role.name,
        description: role.description,
      });
    } else {
      setEditingRole(null);
      form.resetFields();
    }
    setModalVisible(true);
  };

  const getRoleUsageCount = (_roleId: number) => {
    // Giả lập số lượng người dùng đang sử dụng vai trò này
    // Trong thực tế, bạn sẽ cần API để lấy thông tin này
    return Math.floor(Math.random() * 50);
  };

  const columns: ColumnsType<Role> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "Tên vai trò",
      dataIndex: "name",
      key: "name",
      render: (name: string) => (
        <Space>
          <SafetyCertificateOutlined style={{ color: "#1890ff" }} />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      render: (description: string) => (
        <Text type="secondary">{description || "Chưa có mô tả"}</Text>
      ),
    },
    {
      title: "Số người dùng",
      key: "userCount",
      render: (_, record: Role) => (
        <Tag color="blue">{getRoleUsageCount(record.id)} người dùng</Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("vi-VN");
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record: Role) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa vai trò"
            description="Bạn có chắc chắn muốn xóa vai trò này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okType="danger"
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Card>
        <Row gutter={[16, 16]} style={{ marginBottom: "20px" }}>
          <Col span={24}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <Title
                  level={3}
                  style={{
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <SafetyCertificateOutlined />
                  Quản lý vai trò
                </Title>
                <Text type="secondary">
                  Tạo, chỉnh sửa và xóa các vai trò trong hệ thống
                </Text>
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openModal()}
              >
                Thêm vai trò mới
              </Button>
            </div>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={roles}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} vai trò`,
          }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined />
            {editingRole ? "Chỉnh sửa vai trò" : "Thêm vai trò mới"}
          </Space>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingRole(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: "20px" }}
        >
          <Form.Item
            label="Tên vai trò"
            name="name"
            rules={[
              { required: true, message: "Vui lòng nhập tên vai trò" },
              { min: 2, message: "Tên vai trò phải có ít nhất 2 ký tự" },
              { max: 50, message: "Tên vai trò không được quá 50 ký tự" },
            ]}
          >
            <Input placeholder="Nhập tên vai trò (VD: MANAGER, USER, ...)" />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
            rules={[{ max: 255, message: "Mô tả không được quá 255 ký tự" }]}
          >
            <TextArea rows={4} placeholder="Nhập mô tả cho vai trò này..." />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                  setEditingRole(null);
                }}
              >
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingRole ? "Cập nhật" : "Tạo mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageRolesPage;
