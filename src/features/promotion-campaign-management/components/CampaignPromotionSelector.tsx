import React, { useState, useEffect } from "react";
import {
  Card,
  Tabs,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Form,
  Select,
  InputNumber,
  Modal,
  Row,
  Col,
  message,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  GiftOutlined,
  PercentageOutlined,
  DollarOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import {
  DiscountType,
  PromotionType,
  PromotionStatus,
  type PromotionResponseDTO,
  filterPromotions,
} from "../../../app/api/promotion";
import { type CampaignPromotionData } from "../../../app/api/promotion-campaign";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface CampaignPromotionSelectorProps {
  promotions: CampaignPromotionData[];
  onChange: (promotions: CampaignPromotionData[]) => void;
  loading?: boolean;
}

const CampaignPromotionSelector: React.FC<CampaignPromotionSelectorProps> = ({
  promotions,
  onChange,
  loading = false,
}) => {
  const [activeTab, setActiveTab] = useState("new");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPromotion, setEditingPromotion] =
    useState<CampaignPromotionData | null>(null);
  const [form] = Form.useForm();

  // State for existing promotions
  const [existingPromotions, setExistingPromotions] = useState<
    PromotionResponseDTO[]
  >([]);
  const [selectedPromotions, setSelectedPromotions] = useState<number[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // Load existing promotions
  useEffect(() => {
    const loadExistingPromotions = async () => {
      setLoadingExisting(true);
      try {
        const response = await filterPromotions({
          status: PromotionStatus.ACTIVE,
          page: 1,
          size: 100,
        });
        if (response.result) {
          setExistingPromotions(response.result.promotions || []);
        }
      } catch (error) {
        console.error("Failed to load existing promotions:", error);
        message.error("Không thể tải danh sách khuyến mãi");
      } finally {
        setLoadingExisting(false);
      }
    };

    if (activeTab === "existing") {
      loadExistingPromotions();
    }
  }, [activeTab]);

  // Handle add new promotion
  const handleAddNew = () => {
    setEditingPromotion(null);
    form.resetFields();
    form.setFieldsValue({
      discountType: DiscountType.PERCENTAGE,
      promotionType: PromotionType.AUTO,
      status: PromotionStatus.ACTIVE,
    });
    setModalVisible(true);
  };

  // Handle edit promotion
  const handleEdit = (promotion: CampaignPromotionData) => {
    setEditingPromotion(promotion);
    form.setFieldsValue(promotion);
    setModalVisible(true);
  };

  // Handle form submit
  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const promotionData: CampaignPromotionData = {
        ...values,
        tempId: editingPromotion?.tempId || `new-${Date.now()}`,
        isExisting: false,
      };

      if (editingPromotion) {
        // Update existing
        const updatedPromotions = promotions.map((p) =>
          p.tempId === editingPromotion.tempId ? promotionData : p
        );
        onChange(updatedPromotions);
      } else {
        // Add new
        onChange([...promotions, promotionData]);
      }

      setModalVisible(false);
      form.resetFields();
      setEditingPromotion(null);
    } catch (error) {
      console.error("Form validation failed:", error);
    }
  };

  // Handle remove promotion
  const handleRemove = (tempId: string) => {
    const updatedPromotions = promotions.filter((p) => p.tempId !== tempId);
    onChange(updatedPromotions);
  };

  // Handle apply existing promotions
  const handleApplyExisting = () => {
    const selectedPromos = existingPromotions.filter((promo) =>
      selectedPromotions.includes(promo.id)
    );

    const newPromotions: CampaignPromotionData[] = selectedPromos.map(
      (promo) => ({
        tempId: `existing-${promo.id}`,
        promotionId: promo.id,
        code: promo.code,
        isExisting: true,
        discountType: promo.discountType,
        promotionType: promo.promotionType,
        discountValue: promo.discountValue,
        status: promo.status,
        minOrderValue: promo.minOrderValue,
        usageLimit: promo.usageLimit,
      })
    );

    // Merge with existing promotions, avoid duplicates
    const existingIds = promotions
      .filter((p) => p.isExisting)
      .map((p) => p.promotionId);

    const filteredNew = newPromotions.filter(
      (p) => !existingIds.includes(p.promotionId)
    );

    onChange([...promotions, ...filteredNew]);
    setSelectedPromotions([]);
    message.success(`Đã áp dụng ${filteredNew.length} khuyến mãi`);
  };

  // Columns for promotion list
  const promotionColumns: ColumnsType<CampaignPromotionData> = [
    {
      title: "Loại",
      dataIndex: "promotionType",
      key: "promotionType",
      render: (type: PromotionType) => (
        <Tag
          icon={
            type === PromotionType.AUTO ? (
              <GiftOutlined />
            ) : (
              <PercentageOutlined />
            )
          }
          color={type === PromotionType.AUTO ? "blue" : "green"}
        >
          {type === PromotionType.AUTO ? "Tự động" : "Mã giảm giá"}
        </Tag>
      ),
    },
    {
      title: "Giảm giá",
      key: "discount",
      render: (_, record) => (
        <Space>
          <Tag
            icon={
              record.discountType === DiscountType.PERCENTAGE ? (
                <PercentageOutlined />
              ) : (
                <DollarOutlined />
              )
            }
            color={
              record.discountType === DiscountType.PERCENTAGE
                ? "orange"
                : "purple"
            }
          >
            {record.discountValue}
            {record.discountType === DiscountType.PERCENTAGE ? "%" : "đ"}
          </Tag>
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: PromotionStatus) => (
        <Tag
          icon={
            status === PromotionStatus.ACTIVE ? (
              <CheckCircleOutlined />
            ) : (
              <CloseCircleOutlined />
            )
          }
          color={status === PromotionStatus.ACTIVE ? "success" : "error"}
        >
          {status === PromotionStatus.ACTIVE ? "Hoạt động" : "Tạm ngưng"}
        </Tag>
      ),
    },
    {
      title: "Nguồn",
      key: "source",
      render: (_, record) => (
        <Tag color={record.isExisting ? "cyan" : "blue"}>
          {record.isExisting ? "Có sẵn" : "Mới tạo"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Space>
          {!record.isExisting && (
            <Tooltip title="Chỉnh sửa">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
          <Tooltip title="Xóa">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => record.tempId && handleRemove(record.tempId)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Columns for existing promotions
  const existingColumns: ColumnsType<PromotionResponseDTO> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "Mã",
      dataIndex: "code",
      key: "code",
      render: (code: string) => <Text strong>{code}</Text>,
    },
    {
      title: "Loại",
      dataIndex: "promotionType",
      key: "promotionType",
      render: (type: PromotionType) => (
        <Tag
          icon={
            type === PromotionType.AUTO ? (
              <GiftOutlined />
            ) : (
              <PercentageOutlined />
            )
          }
          color={type === PromotionType.AUTO ? "blue" : "green"}
        >
          {type === PromotionType.AUTO ? "Tự động" : "Mã giảm giá"}
        </Tag>
      ),
    },
    {
      title: "Giảm giá",
      key: "discount",
      render: (_, record) => (
        <Space>
          <Tag
            icon={
              record.discountType === DiscountType.PERCENTAGE ? (
                <PercentageOutlined />
              ) : (
                <DollarOutlined />
              )
            }
            color={
              record.discountType === DiscountType.PERCENTAGE
                ? "orange"
                : "purple"
            }
          >
            {record.discountValue}
            {record.discountType === DiscountType.PERCENTAGE ? "%" : "đ"}
          </Tag>
        </Space>
      ),
    },
    {
      title: "Thời gian",
      key: "period",
      render: (_, record) => (
        <div>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.startDate} → {record.endDate}
          </Text>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: PromotionStatus) => (
        <Tag
          icon={
            status === PromotionStatus.ACTIVE ? (
              <CheckCircleOutlined />
            ) : (
              <CloseCircleOutlined />
            )
          }
          color={status === PromotionStatus.ACTIVE ? "success" : "error"}
        >
          {status === PromotionStatus.ACTIVE ? "Hoạt động" : "Tạm ngưng"}
        </Tag>
      ),
    },
  ];

  return (
    <Card title="Quản lý khuyến mãi cho chiến dịch" size="small">
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Tạo mới" key="new">
          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddNew}
            >
              Tạo khuyến mãi mới
            </Button>
          </div>
        </TabPane>

        <TabPane tab="Áp dụng có sẵn" key="existing">
          <div style={{ marginBottom: 16 }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Text type="secondary">
                  Chọn các khuyến mãi có sẵn để áp dụng cho chiến dịch
                </Text>
              </Col>
              <Col>
                <Button
                  type="primary"
                  disabled={selectedPromotions.length === 0}
                  onClick={handleApplyExisting}
                >
                  Áp dụng ({selectedPromotions.length})
                </Button>
              </Col>
            </Row>
          </div>

          <Table
            rowSelection={{
              selectedRowKeys: selectedPromotions,
              onChange: (selectedRowKeys) =>
                setSelectedPromotions(selectedRowKeys as number[]),
            }}
            columns={existingColumns}
            dataSource={existingPromotions}
            rowKey="id"
            loading={loadingExisting}
            size="small"
            pagination={{ pageSize: 10 }}
          />
        </TabPane>
      </Tabs>

      {/* Current promotions list */}
      {(promotions.length > 0 || loading) && (
        <div style={{ marginTop: 16 }}>
          <Title level={5}>
            Khuyến mãi đã chọn ({loading ? "..." : promotions.length})
          </Title>
          <Table
            columns={promotionColumns}
            dataSource={promotions}
            rowKey="tempId"
            size="small"
            pagination={false}
            loading={loading}
          />
        </div>
      )}

      {/* New/Edit Promotion Modal */}
      <Modal
        title={editingPromotion ? "Chỉnh sửa khuyến mãi" : "Tạo khuyến mãi mới"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingPromotion(null);
          form.resetFields();
        }}
        onOk={handleFormSubmit}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="promotionType"
                label="Loại khuyến mãi"
                rules={[
                  { required: true, message: "Vui lòng chọn loại khuyến mãi" },
                ]}
              >
                <Select placeholder="Chọn loại">
                  <Select.Option value={PromotionType.AUTO}>
                    <Space>
                      <GiftOutlined />
                      Tự động áp dụng
                    </Space>
                  </Select.Option>
                  <Select.Option value={PromotionType.COUPON}>
                    <Space>
                      <PercentageOutlined />
                      Mã giảm giá
                    </Space>
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="discountType"
                label="Kiểu giảm giá"
                rules={[
                  { required: true, message: "Vui lòng chọn kiểu giảm giá" },
                ]}
              >
                <Select placeholder="Chọn kiểu">
                  <Select.Option value={DiscountType.PERCENTAGE}>
                    <Space>
                      <PercentageOutlined />
                      Phần trăm (%)
                    </Space>
                  </Select.Option>
                  <Select.Option value={DiscountType.FIXED_AMOUNT}>
                    <Space>
                      <DollarOutlined />
                      Số tiền cố định (đ)
                    </Space>
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="discountValue"
                label="Giá trị giảm"
                dependencies={["discountType"]}
                rules={[
                  { required: true, message: "Vui lòng nhập giá trị giảm" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (value === null || value === undefined) {
                        return Promise.resolve();
                      }
                      const type = getFieldValue("discountType");
                      if (type === DiscountType.PERCENTAGE) {
                        if (value > 0 && value <= 100) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("Phần trăm phải từ 1 đến 100")
                        );
                      }
                      if (type === DiscountType.FIXED_AMOUNT) {
                        if (value > 0) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("Số tiền phải lớn hơn 0")
                        );
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <InputNumber
                  placeholder="Nhập giá trị"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Trạng thái"
                rules={[
                  { required: true, message: "Vui lòng chọn trạng thái" },
                ]}
              >
                <Select placeholder="Chọn trạng thái">
                  <Select.Option value={PromotionStatus.ACTIVE}>
                    <Space>
                      <CheckCircleOutlined />
                      Hoạt động
                    </Space>
                  </Select.Option>
                  <Select.Option value={PromotionStatus.INACTIVE}>
                    <Space>
                      <CloseCircleOutlined />
                      Tạm ngưng
                    </Space>
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="minOrderValue"
                label="Giá trị đơn hàng tối thiểu"
                rules={[
                  {
                    type: "number",
                    min: 0,
                    message: "Giá trị phải lớn hơn hoặc bằng 0",
                  },
                ]}
              >
                <InputNumber
                  placeholder="Không giới hạn"
                  style={{ width: "100%" }}
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="usageLimit"
                label="Giới hạn sử dụng"
                rules={[
                  {
                    type: "number",
                    min: 1,
                    message: "Giới hạn phải lớn hơn 0",
                  },
                ]}
              >
                <InputNumber
                  placeholder="Không giới hạn"
                  style={{ width: "100%" }}
                  min={1}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="priority"
                label="Độ ưu tiên"
                rules={[
                  { type: "number", min: 1, message: "Ưu tiên phải lớn hơn 0" },
                ]}
              >
                <InputNumber
                  placeholder="Mặc định: 1"
                  style={{ width: "100%" }}
                  min={1}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Card>
  );
};

export default CampaignPromotionSelector;
