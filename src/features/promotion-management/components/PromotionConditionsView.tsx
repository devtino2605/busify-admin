import React, { useEffect, useState } from "react";
import {
  Drawer,
  Card,
  Space,
  Typography,
  Tag,
  List,
  Spin,
  Empty,
  Alert,
  Descriptions,
  Button,
} from "antd";
import {
  SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import {
  getPromotionConditions,
  ConditionType,
  type PromotionConditionResponseDTO,
  type PromotionResponseDTO,
} from "../../../app/api/promotion";

const { Title, Text } = Typography;

interface PromotionConditionsViewProps {
  visible: boolean;
  onClose: () => void;
  promotion: PromotionResponseDTO | null;
}

const PromotionConditionsView: React.FC<PromotionConditionsViewProps> = ({
  visible,
  onClose,
  promotion,
}) => {
  const [conditions, setConditions] = useState<PromotionConditionResponseDTO[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && promotion) {
      fetchConditions();
    }
  }, [visible, promotion]);

  const fetchConditions = async () => {
    if (!promotion) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getPromotionConditions(promotion.id);
      const conditionsData = "result" in response ? response.result : response;
      setConditions(Array.isArray(conditionsData) ? conditionsData : []);
    } catch (err) {
      console.error("Failed to fetch promotion conditions:", err);
      setError("Không thể tải điều kiện khuyến mãi");
    } finally {
      setLoading(false);
    }
  };

  const getConditionLabel = (conditionType: ConditionType): string => {
    switch (conditionType) {
      case ConditionType.VIEW_VIDEO:
        return "Xem video";
      case ConditionType.COMPLETE_SURVEY:
        return "Hoàn thành khảo sát";
      case ConditionType.REFERRAL_COUNT:
        return "Số lượng giới thiệu";
      case ConditionType.FIRST_PURCHASE:
        return "Mua hàng lần đầu";
      case ConditionType.WATCH_AD:
        return "Xem quảng cáo";
      default:
        return conditionType;
    }
  };

  const getConditionDescription = (conditionType: ConditionType): string => {
    switch (conditionType) {
      case ConditionType.VIEW_VIDEO:
        return "Khách hàng phải xem video cụ thể để được áp dụng khuyến mãi";
      case ConditionType.COMPLETE_SURVEY:
        return "Khách hàng phải hoàn thành khảo sát để được áp dụng khuyến mãi";
      case ConditionType.REFERRAL_COUNT:
        return "Khách hàng phải giới thiệu đủ số lượng người để được áp dụng khuyến mãi";
      case ConditionType.FIRST_PURCHASE:
        return "Chỉ áp dụng cho khách hàng mua hàng lần đầu";
      case ConditionType.WATCH_AD:
        return "Khách hàng phải xem quảng cáo để được áp dụng khuyến mãi";
      default:
        return "";
    }
  };

  const getConditionColor = (conditionType: ConditionType): string => {
    switch (conditionType) {
      case ConditionType.VIEW_VIDEO:
        return "blue";
      case ConditionType.COMPLETE_SURVEY:
        return "green";
      case ConditionType.REFERRAL_COUNT:
        return "orange";
      case ConditionType.FIRST_PURCHASE:
        return "purple";
      case ConditionType.WATCH_AD:
        return "cyan";
      default:
        return "default";
    }
  };

  const formatConditionValue = (
    condition: PromotionConditionResponseDTO
  ): string => {
    if (
      !condition.conditionValue &&
      condition.conditionType !== ConditionType.FIRST_PURCHASE &&
      condition.conditionType !== ConditionType.WATCH_AD
    ) {
      return "Không có giá trị";
    }

    switch (condition.conditionType) {
      case ConditionType.VIEW_VIDEO:
        return `Video ID: ${condition.conditionValue}`;
      case ConditionType.COMPLETE_SURVEY:
        return `Survey ID: ${condition.conditionValue}`;
      case ConditionType.REFERRAL_COUNT:
        return `${condition.conditionValue} người`;
      case ConditionType.FIRST_PURCHASE:
        return "Khách hàng mới";
      case ConditionType.WATCH_AD:
        return condition.conditionValue
          ? `Ad ID: ${condition.conditionValue}`
          : "Xem quảng cáo bất kỳ";
      default:
        return condition.conditionValue || "";
    }
  };

  return (
    <Drawer
      title={
        <Space>
          <SettingOutlined />
          <Title level={4} style={{ margin: 0 }}>
            Điều kiện khuyến mãi
          </Title>
        </Space>
      }
      width={600}
      open={visible}
      onClose={onClose}
      extra={<Button type="text" icon={<CloseOutlined />} onClick={onClose} />}
    >
      {promotion && (
        <Card style={{ marginBottom: 16 }}>
          <Descriptions title="Thông tin khuyến mãi" size="small" column={1}>
            <Descriptions.Item label="Mã khuyến mãi">
              <Text code strong>
                {promotion.code}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Loại">
              <Tag
                color={promotion.promotionType === "auto" ? "blue" : "green"}
              >
                {promotion.promotionType === "auto" ? "Tự động" : "Mã giảm giá"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Giá trị giảm">
              {promotion.discountType === "PERCENTAGE"
                ? `${promotion.discountValue}%`
                : `${promotion.discountValue.toLocaleString("vi-VN")} VNĐ`}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Card
        title={
          <Space>
            <Text strong>Danh sách điều kiện</Text>
            {conditions.length > 0 && (
              <Tag color="blue">{conditions.length} điều kiện</Tag>
            )}
          </Space>
        }
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin size="large" />
          </div>
        ) : error ? (
          <Alert
            message="Lỗi"
            description={error}
            type="error"
            showIcon
            action={
              <Button size="small" danger onClick={fetchConditions}>
                Thử lại
              </Button>
            }
          />
        ) : conditions.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Không có điều kiện nào"
          />
        ) : (
          <List
            dataSource={conditions}
            renderItem={(condition) => (
              <List.Item>
                <Card size="small" style={{ width: "100%" }}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Space>
                      <Tag color={getConditionColor(condition.conditionType)}>
                        {getConditionLabel(condition.conditionType)}
                      </Tag>
                      {condition.isRequired ? (
                        <Tag color="red" icon={<ExclamationCircleOutlined />}>
                          Bắt buộc
                        </Tag>
                      ) : (
                        <Tag color="green" icon={<CheckCircleOutlined />}>
                          Tùy chọn
                        </Tag>
                      )}
                    </Space>

                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {getConditionDescription(condition.conditionType)}
                    </Text>

                    {(condition.conditionValue ||
                      condition.conditionType ===
                        ConditionType.FIRST_PURCHASE ||
                      condition.conditionType === ConditionType.WATCH_AD) && (
                      <div>
                        <Text strong style={{ fontSize: 13 }}>
                          Giá trị: {formatConditionValue(condition)}
                        </Text>
                      </div>
                    )}
                  </Space>
                </Card>
              </List.Item>
            )}
          />
        )}
      </Card>
    </Drawer>
  );
};

export default PromotionConditionsView;
