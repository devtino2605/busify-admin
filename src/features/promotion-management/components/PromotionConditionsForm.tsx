import React from "react";
import {
  Card,
  Form,
  Select,
  Input,
  Switch,
  Button,
  Space,
  Typography,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  MinusCircleOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  ConditionType,
  type PromotionConditionRequestDTO,
} from "../../../app/api/promotion";

const { Text } = Typography;
const { Option } = Select;

interface PromotionConditionsFormProps {
  value?: PromotionConditionRequestDTO[];
  onChange?: (conditions: PromotionConditionRequestDTO[]) => void;
}

const PromotionConditionsForm: React.FC<PromotionConditionsFormProps> = ({
  value = [],
  onChange,
}) => {
  const handleConditionsChange = (
    conditions: PromotionConditionRequestDTO[]
  ) => {
    onChange?.(conditions);
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
        return "Khách hàng phải xem video cụ thể để nhận khuyến mãi";
      case ConditionType.COMPLETE_SURVEY:
        return "Khách hàng phải hoàn thành khảo sát để nhận khuyến mãi";
      case ConditionType.REFERRAL_COUNT:
        return "Khách hàng phải giới thiệu đủ số người để nhận khuyến mãi";
      case ConditionType.FIRST_PURCHASE:
        return "Chỉ dành cho khách hàng mua hàng lần đầu";
      case ConditionType.WATCH_AD:
        return "Khách hàng phải xem quảng cáo để nhận khuyến mãi";
      default:
        return "";
    }
  };

  const getConditionValuePlaceholder = (
    conditionType?: ConditionType
  ): string => {
    switch (conditionType) {
      case ConditionType.VIEW_VIDEO:
        return "Video ID (ví dụ: video_123)";
      case ConditionType.COMPLETE_SURVEY:
        return "Survey ID (ví dụ: survey_456)";
      case ConditionType.REFERRAL_COUNT:
        return "Số lượng (ví dụ: 5)";
      case ConditionType.FIRST_PURCHASE:
        return "Không cần giá trị";
      case ConditionType.WATCH_AD:
        return "Ad ID (tùy chọn, ví dụ: ad_789)";
      default:
        return "Nhập giá trị điều kiện";
    }
  };

  const isConditionValueRequired = (conditionType?: ConditionType): boolean => {
    return conditionType !== ConditionType.FIRST_PURCHASE;
  };

  return (
    <Card
      size="small"
      title={
        <Space>
          <SettingOutlined />
          <Text strong>Điều kiện khuyến mãi</Text>
        </Space>
      }
      extra={
        <Text type="secondary" style={{ fontSize: 12 }}>
          Tùy chọn: Thêm điều kiện để khách hàng có thể sử dụng khuyến mãi
        </Text>
      }
    >
      <Form.List name="conditions" initialValue={value}>
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }, index) => (
              <Card
                key={key}
                size="small"
                style={{ marginBottom: 16, backgroundColor: "#fafafa" }}
                title={`Điều kiện ${index + 1}`}
                extra={
                  <Button
                    type="text"
                    icon={<MinusCircleOutlined />}
                    onClick={() => {
                      remove(name);
                      const newConditions = [...value];
                      newConditions.splice(index, 1);
                      handleConditionsChange(newConditions);
                    }}
                    danger
                    size="small"
                  >
                    Xóa
                  </Button>
                }
              >
                {/* Preserve conditionId for updates (hidden field) */}
                <Form.Item
                  {...restField}
                  name={[name, "conditionId"]}
                  style={{ display: "none" }}
                >
                  <Input />
                </Form.Item>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      {...restField}
                      name={[name, "conditionType"]}
                      label="Loại điều kiện"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng chọn loại điều kiện",
                        },
                      ]}
                    >
                      <Select
                        placeholder="Chọn loại điều kiện"
                        onChange={(conditionType) => {
                          const newConditions = [...value];
                          if (newConditions[index]) {
                            newConditions[index].conditionType = conditionType;
                            // Reset condition value when type changes
                            newConditions[index].conditionValue = undefined;
                          }
                          handleConditionsChange(newConditions);
                        }}
                      >
                        {Object.values(ConditionType).map((type) => (
                          <Option key={type} value={type}>
                            <div>
                              <div>{getConditionLabel(type)}</div>
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                {getConditionDescription(type)}
                              </Text>
                            </div>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col span={10}>
                    <Form.Item
                      {...restField}
                      name={[name, "conditionValue"]}
                      label="Giá trị điều kiện"
                      dependencies={[[name, "conditionType"]]}
                      rules={[
                        ({ getFieldValue }) => ({
                          validator(_, conditionValue) {
                            const conditionType = getFieldValue([
                              "conditions",
                              index,
                              "conditionType",
                            ]);

                            if (
                              isConditionValueRequired(conditionType) &&
                              !conditionValue
                            ) {
                              return Promise.reject(
                                new Error("Vui lòng nhập giá trị điều kiện")
                              );
                            }

                            // Validate specific condition types
                            if (
                              conditionType === ConditionType.REFERRAL_COUNT &&
                              conditionValue
                            ) {
                              const num = Number(conditionValue);
                              if (isNaN(num) || num <= 0) {
                                return Promise.reject(
                                  new Error("Số lượng phải là số dương")
                                );
                              }
                            }

                            // FIRST_PURCHASE không cần validation giá trị vì nó không cần conditionValue

                            return Promise.resolve();
                          },
                        }),
                      ]}
                    >
                      <Input
                        placeholder={getConditionValuePlaceholder(
                          value[index]?.conditionType
                        )}
                        disabled={
                          value[index]?.conditionType ===
                          ConditionType.FIRST_PURCHASE
                        }
                        onChange={(e) => {
                          const newConditions = [...value];
                          if (newConditions[index]) {
                            newConditions[index].conditionValue =
                              e.target.value;
                          }
                          handleConditionsChange(newConditions);
                        }}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={6}>
                    <Form.Item
                      {...restField}
                      name={[name, "isRequired"]}
                      label="Bắt buộc"
                      valuePropName="checked"
                      initialValue={true}
                    >
                      <Switch
                        checkedChildren="Có"
                        unCheckedChildren="Không"
                        onChange={(checked) => {
                          const newConditions = [...value];
                          if (newConditions[index]) {
                            newConditions[index].isRequired = checked;
                          }
                          handleConditionsChange(newConditions);
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            ))}

            <Form.Item>
              <Button
                type="dashed"
                onClick={() => {
                  add({
                    conditionType: ConditionType.VIEW_VIDEO,
                    conditionValue: "",
                    isRequired: true,
                  });
                  const newCondition: PromotionConditionRequestDTO = {
                    conditionType: ConditionType.VIEW_VIDEO,
                    conditionValue: "",
                    isRequired: true,
                  };
                  handleConditionsChange([...value, newCondition]);
                }}
                block
                icon={<PlusOutlined />}
              >
                Thêm điều kiện
              </Button>
            </Form.Item>

            {fields.length === 0 && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <Text type="secondary">
                  Chưa có điều kiện nào. Nhấn "Thêm điều kiện" để thêm điều kiện
                  cho khuyến mãi.
                </Text>
              </div>
            )}
          </>
        )}
      </Form.List>
    </Card>
  );
};

export default PromotionConditionsForm;
