/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Table,
  Space,
  Typography,
  Tag,
  Row,
  Col,
  Statistic,
  Alert,
  Breadcrumb,
  Empty,
  Tooltip,
  message,
  Select,
  DatePicker,
  Tabs,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  ClearOutlined,
  MessageOutlined,
  FilterOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { TableProps } from "antd";
import dayjs from "dayjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ComplaintDetailModal from "../components/ComplaintDetailModal";
import {
  getAllComplaints,
  updateComplaintStatus,
  type ComplaintDetail,
} from "../../../app/api/complaint";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const ComplaintsWithCustomerServicePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedComplaint, setSelectedComplaint] =
    useState<ComplaintDetail | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("search");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Truy vấn để tải tất cả các khiếu nại với phân trang
  const {
    data: complaintsPageData,
    isLoading: isLoadingComplaints,
    isError: isErrorComplaints,
    error: errorComplaints,
  } = useQuery({
    queryKey: ["complaints", currentPage, pageSize],
    queryFn: async () => {
      const response = await getAllComplaints({
        page: currentPage,
        size: pageSize,
      });
      if (response.code === 200) {
        setTotalElements(response.result.totalElements);
        setTotalPages(response.result.totalPages);
        return response.result;
      }
      return {
        complaints: [],
        currentPage: 0,
        totalPages: 0,
        totalElements: 0,
        hasNext: false,
        hasPrevious: false,
      };
    },
    staleTime: 5 * 60 * 1000, // Cache 5 phút
  });

  // Mutation cho chức năng cập nhật trạng thái khiếu nại
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateComplaintStatus(id, status),
    onSuccess: (_response, variables) => {
      message.success(
        `Đã cập nhật trạng thái khiếu nại #${variables.id} thành công`
      );

      // Cập nhật cache với khiếu nại đã cập nhật
      queryClient.invalidateQueries({ queryKey: ["complaints"] });

      // Đóng modal nếu đang mở
      if (selectedComplaint?.id === variables.id) {
        setIsModalVisible(false);
        setSelectedComplaint(null);
      }
    },
    onError: (error: Error) => {
      message.error(`Lỗi khi cập nhật trạng thái khiếu nại: ${error.message}`);
    },
  });

  // Mutation cho chức năng tìm kiếm khiếu nại
  const searchMutation = useMutation({
    mutationFn: async (values: any) => {
      const { customerName, title, description } = values;

      if (!customerName && !title && !description) {
        throw new Error("Vui lòng nhập ít nhất một từ khóa để tìm kiếm");
      }

      // For now, filter only current page data.
      // In a real scenario, you'd want to send search params to the API
      const currentComplaints = complaintsPageData?.complaints || [];
      let results = currentComplaints;

      if (customerName) {
        results = results.filter((complaint) =>
          complaint.customer?.customerName
            ?.toLowerCase()
            .includes(customerName.toLowerCase())
        );
      }
      if (title) {
        results = results.filter((complaint) =>
          complaint.title.toLowerCase().includes(title.toLowerCase())
        );
      }
      if (description) {
        results = results.filter((complaint) =>
          complaint.description
            .toLowerCase()
            .includes(description.toLowerCase())
        );
      }

      return results;
    },
    onSuccess: (data) => {
      // Cập nhật cache với kết quả tìm kiếm
      queryClient.setQueryData(["complaints", "filtered"], data);

      if (data.length === 0) {
        message.info("Không tìm thấy khiếu nại phù hợp với từ khóa tìm kiếm");
      } else {
        message.success(`Tìm thấy ${data.length} khiếu nại phù hợp`);
      }

      setHasSearched(true);
    },
    onError: (error: Error) => {
      if (error.message.includes("Vui lòng nhập")) {
        message.warning(error.message);
      } else {
        message.error(`Lỗi khi tìm kiếm khiếu nại: ${error.message}`);
      }
      queryClient.setQueryData(["complaints", "filtered"], []);
    },
  });

  // Mutation cho chức năng lọc khiếu nại
  const filterMutation = useMutation({
    mutationFn: async (values: any) => {
      const { status, dateRange, customerName } = values;

      // For now, filter only current page data.
      // In a real scenario, you'd want to send filter params to the API
      const currentComplaints = complaintsPageData?.complaints || [];
      let results = currentComplaints;

      if (status) {
        results = results.filter((complaint) => complaint.status === status);
      }

      if (dateRange && dateRange.length === 2) {
        const [startDate, endDate] = dateRange;
        results = results.filter((complaint) => {
          const complaintDate = dayjs(complaint.createdAt);
          return (
            complaintDate.isAfter(startDate) && complaintDate.isBefore(endDate)
          );
        });
      }

      if (customerName) {
        results = results.filter((complaint) =>
          complaint.customer?.customerName
            ?.toLowerCase()
            .includes(customerName.toLowerCase())
        );
      }

      return results;
    },
    onSuccess: (data) => {
      // Cập nhật cache với kết quả lọc
      queryClient.setQueryData(["complaints", "filtered"], data);

      if (data.length === 0) {
        message.info("Không tìm thấy khiếu nại phù hợp");
      } else {
        message.success(`Tìm thấy ${data.length} khiếu nại`);
      }

      setHasSearched(true);
    },
    onError: (error: Error) => {
      message.error(`Lỗi khi lọc khiếu nại: ${error.message}`);
      queryClient.setQueryData(["complaints", "filtered"], []);
    },
  });

  const handleSearch = (values: any) => {
    searchMutation.mutate(values);
  };

  const handleFilter = (values: any) => {
    filterMutation.mutate(values);
  };

  const handleReset = () => {
    form.resetFields();
    searchForm.resetFields();
    setHasSearched(false);
    queryClient.removeQueries({ queryKey: ["complaints", "filtered"] });
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: ["complaints", currentPage, pageSize],
    });
    if (hasSearched) {
      // Reset search state and go back to paginated view
      setHasSearched(false);
      queryClient.removeQueries({ queryKey: ["complaints", "filtered"] });
    }
    message.success("Đang làm mới dữ liệu...");
  };

  const handleViewDetail = (complaint: ComplaintDetail) => {
    setSelectedComplaint(complaint);
    setIsModalVisible(true);
  };

  // Pagination handlers
  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page - 1); // Ant Design uses 1-based indexing, backend uses 0-based
    if (size && size !== pageSize) {
      setPageSize(size);
    }
    // Reset search/filter when changing pages
    if (hasSearched) {
      setHasSearched(false);
      queryClient.removeQueries({ queryKey: ["complaints", "filtered"] });
    }
  };

  const handlePageSizeChange = (_current: number, size: number) => {
    setPageSize(size);
    setCurrentPage(0); // Reset to first page when changing page size
    if (hasSearched) {
      setHasSearched(false);
      queryClient.removeQueries({ queryKey: ["complaints", "filtered"] });
    }
  };

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

  const columns: TableProps<ComplaintDetail>["columns"] = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      render: (id) => (
        <Text strong style={{ color: "#1890ff" }}>
          #{id}
        </Text>
      ),
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      render: (title) => (
        <Text strong style={{ color: "#262626" }}>
          <ExclamationCircleOutlined
            style={{ marginRight: "8px", color: "#faad14" }}
          />
          {title}
        </Text>
      ),
    },
    {
      title: "Nội dung",
      dataIndex: "description",
      key: "description",
      render: (description) => (
        <div style={{ maxWidth: "300px" }}>
          <Text ellipsis={{ tooltip: description }}>
            <MessageOutlined style={{ marginRight: "8px" }} />
            {description}
          </Text>
        </div>
      ),
    },
    {
      title: "Khách hàng",
      key: "customerName",
      render: (record: ComplaintDetail) => (
        <Space>
          <UserOutlined />
          {record.customer?.customerName || "N/A"}
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => (
        <Space direction="vertical" size="small">
          <div>
            <CalendarOutlined /> {dayjs(date).format("DD/MM/YYYY")}
          </div>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {dayjs(date).format("HH:mm")}
          </Text>
        </Space>
      ),
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Tooltip title="Xem chi tiết">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          />
        </Tooltip>
      ),
    },
  ];

  // Quyết định dữ liệu nào hiển thị dựa trên trạng thái tìm kiếm
  const displayComplaints = hasSearched
    ? queryClient.getQueryData<ComplaintDetail[]>(["complaints", "filtered"]) ||
      []
    : complaintsPageData?.complaints || [];

  // Tính toán thống kê dựa trên dữ liệu hiển thị hiện tại
  const stats = {
    total: hasSearched ? displayComplaints.length : totalElements,
    new: displayComplaints.filter((c: any) => c.status === "New").length,
    pending: displayComplaints.filter((c: any) => c.status === "pending")
      .length,
    inProgress: displayComplaints.filter((c: any) => c.status === "in_progress")
      .length,
    resolved: displayComplaints.filter((c: any) => c.status === "resolved")
      .length,
    rejected: displayComplaints.filter((c: any) => c.status === "rejected")
      .length,
  };

  // Trạng thái loading tổng hợp
  const isLoading =
    isLoadingComplaints ||
    searchMutation.isPending ||
    filterMutation.isPending ||
    updateStatusMutation.isPending;

  return (
    <div style={{ padding: "24px" }}>
      <Breadcrumb
        style={{ marginBottom: "16px" }}
        items={[
          {
            title: "Chăm sóc khách hàng",
          },
          {
            title: "Quản lý khiếu nại",
          },
        ]}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          <ExclamationCircleOutlined /> Quản lý khiếu nại khách hàng
        </Title>
        <Button
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          loading={isLoading}
        >
          Làm mới
        </Button>
      </div>

      {/* Hiển thị lỗi nếu có */}
      {isErrorComplaints && (
        <Alert
          message="Lỗi tải dữ liệu"
          description={
            errorComplaints?.message || "Không thể tải danh sách khiếu nại"
          }
          type="error"
          showIcon
          style={{ marginBottom: "16px" }}
        />
      )}

      {/* Search and Filter Tabs */}
      <Card style={{ marginBottom: "24px" }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <span>
                <SearchOutlined />
                Tìm kiếm
              </span>
            }
            key="search"
          >
            <Form
              form={searchForm}
              layout="vertical"
              onFinish={handleSearch}
              autoComplete="off"
            >
              <Row gutter={16}>
                <Col xs={24} sm={8} lg={8}>
                  <Form.Item name="customerName" label="Tên khách hàng">
                    <Input
                      placeholder="Nhập tên khách hàng"
                      prefix={<UserOutlined />}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8} lg={8}>
                  <Form.Item name="title" label="Tiêu đề khiếu nại">
                    <Input
                      placeholder="Nhập tiêu đề khiếu nại"
                      prefix={<ExclamationCircleOutlined />}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8} lg={8}>
                  <Form.Item name="description" label="Nội dung khiếu nại">
                    <Input
                      placeholder="Nhập từ khóa trong nội dung"
                      prefix={<MessageOutlined />}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row>
                <Col span={24}>
                  <Space>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<SearchOutlined />}
                      loading={searchMutation.isPending}
                    >
                      Tìm kiếm
                    </Button>
                    <Button icon={<ClearOutlined />} onClick={handleReset}>
                      Xóa bộ lọc
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Form>
          </TabPane>
          <TabPane
            tab={
              <span>
                <FilterOutlined />
                Lọc nâng cao
              </span>
            }
            key="filter"
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleFilter}
              autoComplete="off"
            >
              <Row gutter={16}>
                <Col xs={24} sm={8} lg={8}>
                  <Form.Item name="status" label="Trạng thái">
                    <Select placeholder="Chọn trạng thái" allowClear>
                      <Option value="New">Mới</Option>
                      <Option value="pending">Chờ xử lý</Option>
                      <Option value="in_progress">Đang xử lý</Option>
                      <Option value="resolved">Đã giải quyết</Option>
                      <Option value="rejected">Từ chối</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8} lg={8}>
                  <Form.Item name="dateRange" label="Khoảng thời gian">
                    <RangePicker
                      style={{ width: "100%" }}
                      placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
                      format="DD/MM/YYYY"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8} lg={8}>
                  <Form.Item name="customerName" label="Tên khách hàng">
                    <Input
                      placeholder="Nhập tên khách hàng"
                      prefix={<UserOutlined />}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row>
                <Col span={24}>
                  <Space>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<FilterOutlined />}
                      loading={filterMutation.isPending}
                    >
                      Lọc khiếu nại
                    </Button>
                    <Button icon={<ClearOutlined />} onClick={handleReset}>
                      Xóa bộ lọc
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Form>
          </TabPane>
        </Tabs>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={8} lg={4}>
          <Card>
            <Statistic
              title="Tổng khiếu nại"
              value={stats.total}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} lg={4}>
          <Card>
            <Statistic
              title="Mới"
              value={stats.new}
              valueStyle={{ color: "#f5222d" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} lg={4}>
          <Card>
            <Statistic
              title="Chờ xử lý"
              value={stats.pending}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} lg={4}>
          <Card>
            <Statistic
              title="Đang xử lý"
              value={stats.inProgress}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} lg={4}>
          <Card>
            <Statistic
              title="Đã giải quyết"
              value={stats.resolved}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} lg={4}>
          <Card>
            <Statistic
              title="Từ chối"
              value={stats.rejected}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Results Table */}
      <Card>
        {displayComplaints.length === 0 && !isLoading ? (
          <Empty description="Không có khiếu nại nào" />
        ) : (
          <>
            {hasSearched && (
              <Alert
                message={`Tìm thấy ${
                  displayComplaints.length
                } khiếu nại phù hợp${
                  activeTab === "search"
                    ? " với từ khóa tìm kiếm"
                    : " với bộ lọc"
                }`}
                type="success"
                showIcon
                style={{ marginBottom: "16px" }}
              />
            )}
            {!hasSearched && (
              <Alert
                message={`Hiển thị trang ${
                  currentPage + 1
                }/${totalPages} (${totalElements} khiếu nại trong hệ thống)`}
                type="info"
                showIcon
                style={{ marginBottom: "16px" }}
              />
            )}
            <Table
              columns={columns}
              dataSource={displayComplaints}
              rowKey="id"
              loading={isLoading}
              scroll={{ x: 1000 }}
              pagination={
                hasSearched
                  ? {
                      pageSize: displayComplaints.length,
                      hideOnSinglePage: true,
                      showTotal: (total, range) =>
                        `${range[0]}-${range[1]} của ${total} kết quả tìm kiếm`,
                    }
                  : {
                      current: currentPage + 1, // Ant Design uses 1-based indexing
                      pageSize: pageSize,
                      total: totalElements,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      pageSizeOptions: ["10", "20", "50", "100"],
                      onChange: handlePageChange,
                      onShowSizeChange: handlePageSizeChange,
                      showTotal: (total, range) =>
                        `${range[0]}-${range[1]} của ${total} khiếu nại`,
                    }
              }
            />
          </>
        )}
      </Card>

      {/* Complaint Detail Modal */}
      <ComplaintDetailModal
        complaint={selectedComplaint}
        visible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setSelectedComplaint(null);
        }}
        onUpdate={(updatedComplaint) => {
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ["complaints"] });
          message.success("Đã cập nhật khiếu nại thành công");
        }}
      />
    </div>
  );
};

export default ComplaintsWithCustomerServicePage;
