import React, { useState } from "react";
import {
  Button,
  Card,
  Col,
  Row,
  Table,
  Tag,
  Typography,
  Space,
  Form,
  Input,
  Select,
  Tooltip,
} from "antd";
import { useQuery } from "@tanstack/react-query";
import {
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  QuestionCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  contractsApi,
  ContractStatus,
  VerificationStatus,
  type ContractData,
  type ContractFilterParams,
} from "../../app/api/contracts";
import ModalDetail from "./modal-detail";

const { Title } = Typography;

const ContractManagement: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<
    Omit<ContractFilterParams, "page" | "size">
  >({});
  const [selectedContract, setSelectedContract] = useState<ContractData | null>(
    null
  );
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [filterForm] = Form.useForm();

  // Query for contracts list
  const {
    data: contractsData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["contracts", currentPage, pageSize, filters],
    queryFn: () =>
      contractsApi.getAllContracts({
        page: currentPage,
        size: pageSize,
        ...filters,
      }),
  });

  // Status tag color mapping
  const getStatusTagColor = (status: ContractStatus): string => {
    switch (status) {
      case ContractStatus.PENDING:
        return "warning";
      case ContractStatus.ACCEPTED:
        return "success";
      case ContractStatus.REJECTED:
        return "error";
      default:
        return "default";
    }
  };

  // Status text mapping
  const getStatusText = (status: ContractStatus): string => {
    switch (status) {
      case ContractStatus.PENDING:
        return "Chờ duyệt";
      case ContractStatus.ACCEPTED:
        return "Đã duyệt";
      case ContractStatus.REJECTED:
        return "Từ chối";
      default:
        return status;
    }
  };

  // Handle view contract details
  const handleViewDetails = (contract: ContractData) => {
    setSelectedContract(contract);
    setIsDetailModalVisible(true);
  };

  // Handle filter changes
  const handleFilterChange = (values: {
    status?: ContractStatus;
    email?: string;
    operationArea?: string;
  }) => {
    const newFilters: Omit<ContractFilterParams, "page" | "size"> = {};

    if (values.status) {
      newFilters.status = values.status;
    }
    if (values.email && values.email.trim()) {
      newFilters.email = values.email.trim();
    }
    if (values.operationArea && values.operationArea.trim()) {
      newFilters.operationArea = values.operationArea.trim();
    }

    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Handle filter reset
  const handleFilterReset = () => {
    filterForm.resetFields();
    setFilters({});
    setCurrentPage(1);
  };

  // Table columns
  const columns: ColumnsType<ContractData> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Mã số thuế",
      dataIndex: "vatCode",
      key: "vatCode",
      width: 120,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 180,
      ellipsis: {
        showTitle: false,
      },
      render: (email) => (
        <Tooltip placement="topLeft" title={email}>
          {email}
        </Tooltip>
      ),
    },
    {
      title: "Khu vực hoạt động",
      dataIndex: "operationArea",
      key: "operationArea",
      width: 150,
      ellipsis: {
        showTitle: false,
      },
      render: (operationArea) => (
        <Tooltip placement="topLeft" title={operationArea}>
          {operationArea}
        </Tooltip>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: ContractStatus) => (
        <Tag color={getStatusTagColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdDate",
      key: "createdDate",
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
      sorter: (a, b) =>
        new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime(),
    },
    {
      title: "AI Check",
      dataIndex: "verificationStatus",
      key: "verificationStatus",
      width: 100,
      align: "center",
      render: (status: VerificationStatus, record: ContractData) => {
        if (!status) {
          // Nếu hợp đồng đã duyệt/từ chối mà không có kết quả AI -> Dữ liệu cũ
          if (record.status !== ContractStatus.PENDING) {
            return (
              <Tooltip title="Chưa xác minh (Dữ liệu cũ)">
                <QuestionCircleOutlined
                  style={{ color: "#d9d9d9", fontSize: "18px" }}
                />
              </Tooltip>
            );
          }
          // Nếu đang chờ duyệt mà chưa có kết quả -> Đang xử lý
          return (
            <Tooltip title="Đang xử lý">
              <LoadingOutlined style={{ color: "#1890ff", fontSize: "18px" }} />
            </Tooltip>
          );
        }

        switch (status) {
          case VerificationStatus.VERIFIED:
          case VerificationStatus.MATCHED:
            return (
              <Tooltip title="Khớp hoàn toàn">
                <CheckCircleOutlined
                  style={{ color: "#52c41a", fontSize: "18px" }}
                />
              </Tooltip>
            );
          case VerificationStatus.PARTIAL_MATCH:
            return (
              <Tooltip title="Khớp một phần">
                <ExclamationCircleOutlined
                  style={{ color: "#faad14", fontSize: "18px" }}
                />
              </Tooltip>
            );
          case VerificationStatus.MISMATCHED:
            return (
              <Tooltip title="Không khớp">
                <CloseCircleOutlined
                  style={{ color: "#ff4d4f", fontSize: "18px" }}
                />
              </Tooltip>
            );
          default:
            return (
              <Tooltip title="Không thể xác minh">
                <QuestionCircleOutlined
                  style={{ color: "#d9d9d9", fontSize: "18px" }}
                />
              </Tooltip>
            );
        }
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="primary"
              ghost
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (isError) {
    return (
      <Card>
        <div style={{ textAlign: "center", color: "red" }}>
          Lỗi khi tải danh sách hợp đồng: {error?.message}
        </div>
      </Card>
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Title level={3} style={{ margin: 0 }}>
                Quản lý Hợp đồng
              </Title>
            </div>

            {/* Filter Section */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <Form
                form={filterForm}
                layout="inline"
                onFinish={handleFilterChange}
                style={{ gap: 16 }}
              >
                <Form.Item name="status" label="Trạng thái">
                  <Select
                    placeholder="Chọn trạng thái"
                    style={{ width: 150 }}
                    allowClear
                  >
                    <Select.Option value={ContractStatus.PENDING}>
                      Chờ duyệt
                    </Select.Option>
                    <Select.Option value={ContractStatus.ACCEPTED}>
                      Đã duyệt
                    </Select.Option>
                    <Select.Option value={ContractStatus.REJECTED}>
                      Từ chối
                    </Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item name="email" label="Email">
                  <Input placeholder="Tìm theo email" style={{ width: 200 }} />
                </Form.Item>

                <Form.Item name="operationArea" label="Khu vực hoạt động">
                  <Input
                    placeholder="Tìm theo khu vực"
                    style={{ width: 200 }}
                  />
                </Form.Item>

                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit">
                      Tìm kiếm
                    </Button>
                    <Button onClick={handleFilterReset}>Xóa bộ lọc</Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>

            <Table
              columns={columns}
              dataSource={contractsData?.content}
              rowKey="id"
              loading={isLoading}
              scroll={{ x: 1200 }}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: contractsData?.totalElements,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} hợp đồng`,
                onChange: (page, size) => {
                  setCurrentPage(page);
                  setPageSize(size || 10);
                },
                onShowSizeChange: (_, size) => {
                  setPageSize(size);
                  setCurrentPage(1); // Reset về page đầu
                },
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Contract Details Modal with Review */}
      <ModalDetail
        isDetailModalVisible={isDetailModalVisible}
        setIsDetailModalVisible={setIsDetailModalVisible}
        selectedContract={selectedContract}
      />
    </div>
  );
};

export default ContractManagement;
