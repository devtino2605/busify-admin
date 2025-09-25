import React, { useState } from "react";
import {
  Table,
  Tag,
  Space,
  Button,
  Tooltip,
  Typography,
  Progress,
  Badge,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  GiftOutlined,
  PercentageOutlined,
  DollarOutlined,
  CalendarOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  DiscountType,
  PromotionType,
  PromotionStatus,
  type PromotionResponseDTO,
} from "../../../app/api/promotion";
import PromotionConditionsView from "./PromotionConditionsView";

const { Text } = Typography;

interface PromotionTableProps {
  data: PromotionResponseDTO[];
  loading?: boolean;
  onEdit: (promotion: PromotionResponseDTO) => void;
  onDelete: (promotion: PromotionResponseDTO) => void;
  onView: (promotion: PromotionResponseDTO) => void;
  pagination?: {
    current: number;
    total: number;
    pageSize: number;
    onChange: (page: number, pageSize?: number) => void;
  };
}

const PromotionTable: React.FC<PromotionTableProps> = ({
  data,
  loading = false,
  onEdit,
  onDelete,
  onView,
  pagination,
}) => {
  const [conditionsDrawerOpen, setConditionsDrawerOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] =
    useState<PromotionResponseDTO | null>(null);

  const getStatusColor = (status: PromotionStatus) => {
    switch (status) {
      case PromotionStatus.ACTIVE:
        return "success";
      case PromotionStatus.INACTIVE:
        return "default";
      case PromotionStatus.EXPIRED:
        return "error";
      default:
        return "default";
    }
  };

  const getStatusText = (status: PromotionStatus) => {
    switch (status) {
      case PromotionStatus.ACTIVE:
        return "Đang hoạt động";
      case PromotionStatus.INACTIVE:
        return "Tạm ngưng";
      case PromotionStatus.EXPIRED:
        return "Đã hết hạn";
      default:
        return status;
    }
  };

  const getPromotionTypeColor = (type: PromotionType) => {
    switch (type) {
      case PromotionType.AUTO:
        return "blue";
      case PromotionType.COUPON:
        return "green";
      default:
        return "default";
    }
  };

  const getPromotionTypeText = (type: PromotionType) => {
    switch (type) {
      case PromotionType.AUTO:
        return "Tự động";
      case PromotionType.COUPON:
        return "Mã giảm giá";
      default:
        return type;
    }
  };

  const formatDiscountValue = (value: number, type: DiscountType) => {
    if (type === DiscountType.PERCENTAGE) {
      return (
        <Space>
          <PercentageOutlined style={{ color: "#1890ff" }} />
          <Text strong>{value}%</Text>
        </Space>
      );
    } else {
      return (
        <Space>
          <DollarOutlined style={{ color: "#52c41a" }} />
          <Text strong>{value.toLocaleString("vi-VN")} VNĐ</Text>
        </Space>
      );
    }
  };

  const calculateUsagePercentage = (
    usageCount: number,
    usageLimit?: number
  ) => {
    if (!usageLimit) return 0;
    return Math.min((usageCount / usageLimit) * 100, 100);
  };

  const isExpiringSoon = (endDate: string) => {
    return dayjs(endDate).diff(dayjs(), "day") <= 7;
  };

  const columns = [
    {
      title: "Mã giảm giá",
      dataIndex: "code",
      key: "code",
      width: 120,
      render: (code: string) => (
        <Space>
          <GiftOutlined style={{ color: "#722ed1" }} />
          <Text code strong>
            {code}
          </Text>
        </Space>
      ),
    },
    {
      title: "Loại khuyến mãi",
      dataIndex: "promotionType",
      key: "promotionType",
      width: 130,
      render: (type: PromotionType) => (
        <Tag color={getPromotionTypeColor(type)}>
          {getPromotionTypeText(type)}
        </Tag>
      ),
    },
    {
      title: "Giá trị giảm",
      key: "discount",
      width: 150,
      render: (record: PromotionResponseDTO) =>
        formatDiscountValue(record.discountValue, record.discountType),
    },
    {
      title: "Đơn hàng tối thiểu",
      dataIndex: "minOrderValue",
      key: "minOrderValue",
      width: 130,
      render: (value: number) =>
        value ? (
          <Text>{value.toLocaleString("vi-VN")} VNĐ</Text>
        ) : (
          <Text type="secondary">Không giới hạn</Text>
        ),
    },
    {
      title: "Thời gian",
      key: "duration",
      width: 200,
      render: (record: PromotionResponseDTO) => {
        const isExpiring = isExpiringSoon(record.endDate);
        return (
          <Space direction="vertical" size="small">
            <Space size="small">
              <CalendarOutlined />
              <Text style={{ fontSize: "12px" }}>
                {dayjs(record.startDate).format("DD/MM/YYYY")} -{" "}
                {dayjs(record.endDate).format("DD/MM/YYYY")}
              </Text>
            </Space>
            {isExpiring && (
              <Badge
                status="warning"
                text={
                  <Text type="warning" style={{ fontSize: "11px" }}>
                    Sắp hết hạn
                  </Text>
                }
              />
            )}
          </Space>
        );
      },
    },
    {
      title: "Điều kiện",
      key: "conditions",
      width: 120,
      render: (record: PromotionResponseDTO) => {
        const conditions = record.conditions;
        if (!conditions || conditions.length === 0) {
          return <Text type="secondary">Không có</Text>;
        }

        return (
          <Button
            type="text"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => {
              setSelectedPromotion(record);
              setConditionsDrawerOpen(true);
            }}
          >
            {conditions.length} điều kiện
          </Button>
        );
      },
    },
    {
      title: "Số lượng còn lại",
      key: "usage",
      width: 120,
      render: (record: PromotionResponseDTO) => {
        const percentage = calculateUsagePercentage(
          record.usageCount,
          record.usageLimit
        );
        const strokeColor = percentage > 80 ? "#ff4d4f" : "#1890ff";

        return (
          <Space direction="vertical" size="small">
            <Space size="small">
              <Text style={{ fontSize: "12px" }}>
                {record.usageCount}
                {record.usageLimit ? ` ${record.usageLimit}` : ""}
              </Text>
            </Space>
            {record.usageLimit && (
              <Progress
                percent={percentage}
                size="small"
                strokeColor={strokeColor}
                showInfo={false}
              />
            )}
          </Space>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: PromotionStatus) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      fixed: "right" as const,
      render: (record: PromotionResponseDTO) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={
          pagination
            ? {
                current: pagination.current,
                total: pagination.total,
                pageSize: pagination.pageSize,
                onChange: pagination.onChange,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} mã giảm giá`,
                pageSizeOptions: ["10", "20", "50", "100"],
              }
            : false
        }
        scroll={{ x: 1400 }}
        size="small"
        rowClassName={(record) => {
          if (record.status === PromotionStatus.EXPIRED) {
            return "opacity-60";
          }
          if (isExpiringSoon(record.endDate)) {
            return "bg-yellow-50";
          }
          return "";
        }}
      />

      <PromotionConditionsView
        visible={conditionsDrawerOpen}
        onClose={() => {
          setConditionsDrawerOpen(false);
          setSelectedPromotion(null);
        }}
        promotion={selectedPromotion}
      />
    </>
  );
};

export default PromotionTable;
