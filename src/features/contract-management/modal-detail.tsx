import { useState, useEffect } from "react";
import {
  Button,
  Descriptions,
  Modal,
  Tag,
  Divider,
  Form,
  Select,
  Space,
  message,
  Alert,
  Card,
  Typography,
  Table,
  Collapse,
  Spin,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  contractsApi,
  ContractStatus,
  ReviewAction,
  VerificationStatus,
  type ContractData,
  type ReviewContractRequest,
  type AIVerificationResponse,
} from "../../app/api/contracts";

const { Text, Paragraph } = Typography;

interface ModalDetailProps {
  isDetailModalVisible: boolean;
  setIsDetailModalVisible: (visible: boolean) => void;
  selectedContract: ContractData | null;
}

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

const ModalDetail = ({
  isDetailModalVisible,
  setIsDetailModalVisible,
  selectedContract,
}: ModalDetailProps) => {
  const [reviewForm] = Form.useForm();
  const queryClient = useQueryClient();
  const [verificationResult, setVerificationResult] =
    useState<AIVerificationResponse | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (isDetailModalVisible && selectedContract?.verificationResult) {
      setVerificationResult(selectedContract.verificationResult);
      setIsPolling(false);
    } else if (isDetailModalVisible && selectedContract) {
      setVerificationResult(null);
      // Start polling for verification result if contract is PENDING or ACCEPTED
      if (
        selectedContract.status === ContractStatus.PENDING ||
        selectedContract.status === ContractStatus.ACCEPTED
      ) {
        setIsPolling(true);
      }
    }
  }, [selectedContract, isDetailModalVisible]);

  // Auto-refresh contract data every 3 seconds when polling
  useEffect(() => {
    if (!isPolling || !selectedContract) return;

    const intervalId = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(intervalId);
  }, [isPolling, selectedContract, queryClient]);

  const reviewMutation = useMutation({
    mutationFn: ({
      contractId,
      data,
    }: {
      contractId: number;
      data: ReviewContractRequest;
    }) => {
      return contractsApi.reviewContract(contractId, data);
    },
    onSuccess: (response, variables) => {
      if (response.code === 200) {
        message.success("Đánh giá hợp đồng thành công");
        queryClient.invalidateQueries({ queryKey: ["contracts"] });
        queryClient.invalidateQueries({
          queryKey: ["contract", variables.contractId],
        });
        setIsDetailModalVisible(false);
        reviewForm.resetFields();
      } else {
        message.error(response.message || "Đánh giá hợp đồng thất bại");
      }
    },
    onError: (error) => {
      console.error("Review contract error:", error);
      message.error("Có lỗi xảy ra khi đánh giá hợp đồng!");
    },
  });

  const handleReviewSubmit = (values: {
    action: ReviewAction;
    adminNote?: string;
  }) => {
    if (!selectedContract) return;

    reviewMutation.mutate({
      contractId: selectedContract.id,
      data: {
        action: values.action,
        adminNote: values.adminNote,
      },
    });
  };

  const handleClose = () => {
    setIsDetailModalVisible(false);
    reviewForm.resetFields();
    setVerificationResult(null);
  };

  // Get verification status display info
  const getVerificationStatusInfo = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.VERIFIED:
      case VerificationStatus.MATCHED:
        return {
          color: "success",
          icon: <CheckCircleOutlined />,
          text: "Khớp hoàn toàn",
          alertType: "success" as const,
        };
      case VerificationStatus.PARTIAL_MATCH:
        return {
          color: "warning",
          icon: <ExclamationCircleOutlined />,
          text: "Khớp một phần",
          alertType: "warning" as const,
        };
      case VerificationStatus.MISMATCHED:
        return {
          color: "error",
          icon: <CloseCircleOutlined />,
          text: "Không khớp",
          alertType: "error" as const,
        };
      case VerificationStatus.UNVERIFIABLE:
        return {
          color: "default",
          icon: <QuestionCircleOutlined />,
          text: "Không thể xác minh",
          alertType: "info" as const,
        };
      default:
        return {
          color: "default",
          icon: <QuestionCircleOutlined />,
          text: status,
          alertType: "info" as const,
        };
    }
  };

  // Comparison results columns for table
  const comparisonColumns = [
    {
      title: "Trường",
      dataIndex: "displayName",
      key: "displayName",
      width: 150,
    },
    {
      title: "Giá trị đăng ký",
      dataIndex: "registeredValue",
      key: "registeredValue",
      render: (value: string | null) =>
        value || <Text type="secondary">N/A</Text>,
    },
    {
      title: "Giá trị trích xuất",
      dataIndex: "detectedValue",
      key: "detectedValue",
      render: (value: string | null) =>
        value || <Text type="secondary">N/A</Text>,
    },
    {
      title: "Kết quả",
      dataIndex: "isMatch",
      key: "isMatch",
      width: 120,
      render: (isMatch: boolean, record: { similarityScore?: number }) =>
        isMatch ? (
          <Tag color="success">
            <CheckOutlined /> Khớp
          </Tag>
        ) : (
          <Tag color="error">
            <CloseOutlined /> Không khớp
            {record.similarityScore !== undefined && (
              <span> ({Math.round(record.similarityScore * 100)}%)</span>
            )}
          </Tag>
        ),
    },
  ];

  return (
    <Modal
      title="Chi tiết Hợp đồng"
      open={isDetailModalVisible}
      onCancel={handleClose}
      footer={null}
      width={900}
    >
      {selectedContract && (
        <>
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="ID" span={2}>
              {selectedContract.id}
            </Descriptions.Item>
            <Descriptions.Item label="Mã số thuế">
              {selectedContract.vatCode}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {selectedContract.email}
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {selectedContract.phone}
            </Descriptions.Item>
            <Descriptions.Item label="Địa chỉ" span={2}>
              {selectedContract.address}
            </Descriptions.Item>
            <Descriptions.Item label="Khu vực hoạt động" span={2}>
              {selectedContract.operationArea}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày bắt đầu">
              {new Date(selectedContract.startDate).toLocaleDateString("vi-VN")}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày kết thúc">
              {new Date(selectedContract.endDate).toLocaleDateString("vi-VN")}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={getStatusTagColor(selectedContract.status)}>
                {getStatusText(selectedContract.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {new Date(selectedContract.createdDate).toLocaleString("vi-VN")}
            </Descriptions.Item>
            {selectedContract.approvedDate && (
              <Descriptions.Item label="Ngày duyệt">
                {new Date(selectedContract.approvedDate).toLocaleString(
                  "vi-VN"
                )}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Ngày cập nhật">
              {new Date(selectedContract.updatedDate).toLocaleString("vi-VN")}
            </Descriptions.Item>
            {selectedContract.adminNote && (
              <Descriptions.Item label="Ghi chú admin" span={2}>
                {selectedContract.adminNote}
              </Descriptions.Item>
            )}
            {selectedContract.attachmentUrl && (
              <Descriptions.Item label="Tài liệu đính kèm" span={2}>
                <a
                  href={selectedContract.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Xem tài liệu
                </a>
              </Descriptions.Item>
            )}
            {selectedContract.representativeIdCardUrl && (
              <Descriptions.Item label="CCCD/CMND" span={2}>
                <a
                  href={selectedContract.representativeIdCardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Xem CCCD/CMND
                </a>
              </Descriptions.Item>
            )}
          </Descriptions>

          {/* AI Verification Section - Show for PENDING and ACCEPTED contracts */}
          {(selectedContract.status === ContractStatus.PENDING ||
            selectedContract.status === ContractStatus.ACCEPTED) && (
            <>
              <Divider orientation="left">
                <RobotOutlined /> Xác minh AI
              </Divider>

              {/* AI Verification Result */}
              {verificationResult ? (
                <Card
                  title={
                    <Space>
                      {
                        getVerificationStatusInfo(
                          verificationResult.verificationStatus
                        ).icon
                      }
                      <span>Kết quả xác minh AI</span>
                      <Tag
                        color={
                          getVerificationStatusInfo(
                            verificationResult.verificationStatus
                          ).color
                        }
                      >
                        {
                          getVerificationStatusInfo(
                            verificationResult.verificationStatus
                          ).text
                        }
                      </Tag>
                    </Space>
                  }
                  size="small"
                  style={{ marginBottom: 16 }}
                >
                  {/* Recommendation Alert */}
                  <Alert
                    type={
                      getVerificationStatusInfo(
                        verificationResult.verificationStatus
                      ).alertType
                    }
                    message="Đề xuất"
                    description={verificationResult.recommendation}
                    showIcon
                    style={{ marginBottom: 16 }}
                  />

                  {/* Warnings */}
                  {verificationResult.warnings &&
                    verificationResult.warnings.length > 0 && (
                      <Alert
                        type="warning"
                        message="Cảnh báo"
                        description={
                          <ul style={{ margin: 0, paddingLeft: 20 }}>
                            {verificationResult.warnings.map((warning, idx) => (
                              <li key={idx}>{warning}</li>
                            ))}
                          </ul>
                        }
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                    )}

                  {/* Confidence Score */}
                  {verificationResult.overallConfidenceScore !== null && (
                    <Paragraph>
                      <Text strong>Điểm tin cậy tổng thể: </Text>
                      <Tag
                        color={
                          verificationResult.overallConfidenceScore >= 0.8
                            ? "success"
                            : verificationResult.overallConfidenceScore >= 0.5
                            ? "warning"
                            : "error"
                        }
                      >
                        {(
                          verificationResult.overallConfidenceScore * 100
                        ).toFixed(1)}
                        %
                      </Tag>
                    </Paragraph>
                  )}

                  {/* Match Summary */}
                  {verificationResult.matchSummary && (
                    <Paragraph>
                      <Text strong>Tóm tắt: </Text>
                      {verificationResult.matchSummary}
                    </Paragraph>
                  )}

                  {/* Comparison Results Table */}
                  {verificationResult.comparisonResults &&
                    verificationResult.comparisonResults.length > 0 && (
                      <Collapse
                        items={[
                          {
                            key: "comparison",
                            label: "Chi tiết so sánh",
                            children: (
                              <Table
                                columns={comparisonColumns}
                                dataSource={verificationResult.comparisonResults.map(
                                  (item, idx) => ({ ...item, key: idx })
                                )}
                                pagination={false}
                                size="small"
                              />
                            ),
                          },
                        ]}
                      />
                    )}

                  {/* Extracted Info Collapse */}
                  {verificationResult.extractedInfo && (
                    <Collapse
                      style={{ marginTop: 8 }}
                      items={[
                        {
                          key: "extracted",
                          label: "Thông tin trích xuất từ AI",
                          children: (
                            <Descriptions bordered column={1} size="small">
                              <Descriptions.Item label="Mã số thuế">
                                {verificationResult.extractedInfo.vatCode ||
                                  "N/A"}
                              </Descriptions.Item>
                              <Descriptions.Item label="Tên công ty">
                                {verificationResult.extractedInfo.companyName ||
                                  "N/A"}
                              </Descriptions.Item>
                              <Descriptions.Item label="Địa chỉ">
                                {verificationResult.extractedInfo.address ||
                                  "N/A"}
                              </Descriptions.Item>
                              <Descriptions.Item label="Điện thoại">
                                {verificationResult.extractedInfo.phone ||
                                  "N/A"}
                              </Descriptions.Item>
                              <Descriptions.Item label="Email">
                                {verificationResult.extractedInfo.email ||
                                  "N/A"}
                              </Descriptions.Item>
                              <Descriptions.Item label="Người đại diện">
                                {verificationResult.extractedInfo
                                  .representativeName || "N/A"}
                              </Descriptions.Item>
                              {verificationResult.extractedInfo
                                .representativeNameFromIdCard && (
                                <Descriptions.Item label="Tên trên CCCD">
                                  {
                                    verificationResult.extractedInfo
                                      .representativeNameFromIdCard
                                  }
                                </Descriptions.Item>
                              )}
                              {verificationResult.extractedInfo
                                .idCardNumber && (
                                <Descriptions.Item label="Số CCCD">
                                  {
                                    verificationResult.extractedInfo
                                      .idCardNumber
                                  }
                                </Descriptions.Item>
                              )}
                              <Descriptions.Item label="Số giấy phép KD">
                                {verificationResult.extractedInfo
                                  .businessLicenseNumber || "N/A"}
                              </Descriptions.Item>
                              <Descriptions.Item label="Loại hình KD">
                                {verificationResult.extractedInfo
                                  .businessType || "N/A"}
                              </Descriptions.Item>
                              <Descriptions.Item label="Ngày cấp">
                                {verificationResult.extractedInfo.issuedDate ||
                                  "N/A"}
                              </Descriptions.Item>
                              <Descriptions.Item label="Nơi cấp">
                                {verificationResult.extractedInfo.issuedBy ||
                                  "N/A"}
                              </Descriptions.Item>
                              <Descriptions.Item label="Độ tin cậy">
                                <Tag
                                  color={
                                    verificationResult.extractedInfo
                                      .confidenceScore >= 0.8
                                      ? "success"
                                      : verificationResult.extractedInfo
                                          .confidenceScore >= 0.5
                                      ? "warning"
                                      : "error"
                                  }
                                >
                                  {(
                                    verificationResult.extractedInfo
                                      .confidenceScore * 100
                                  ).toFixed(1)}
                                  %
                                </Tag>
                              </Descriptions.Item>
                            </Descriptions>
                          ),
                        },
                      ]}
                    />
                  )}

                  {/* Verified Time */}
                  <Paragraph style={{ marginTop: 12, textAlign: "right" }}>
                    <Text type="secondary">
                      Xác minh lúc:{" "}
                      {new Date(verificationResult.verifiedAt).toLocaleString(
                        "vi-VN"
                      )}
                    </Text>
                  </Paragraph>
                </Card>
              ) : (
                <Card>
                  <div style={{ textAlign: "center", padding: 20 }}>
                    <Spin size="large" />
                    <Paragraph style={{ marginTop: 16 }}>
                      Đang phân tích giấy phép kinh doanh bằng AI...
                    </Paragraph>
                  </div>
                </Card>
              )}

              <Divider orientation="left">Đánh giá hợp đồng</Divider>

              {selectedContract.status === ContractStatus.ACCEPTED && (
                <Alert
                  message="Cảnh báo: Hợp đồng này đã được duyệt"
                  description="Nếu bạn từ chối hoặc yêu cầu chỉnh sửa, tài khoản Bus Operator và User liên quan sẽ bị khóa (suspended) ngay lập tức."
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              <Form
                form={reviewForm}
                layout="vertical"
                onFinish={handleReviewSubmit}
                initialValues={{
                  action:
                    selectedContract.status === ContractStatus.ACCEPTED
                      ? ReviewAction.REJECT
                      : ReviewAction.APPROVE,
                }}
              >
                <Form.Item
                  name="action"
                  label="Hành động"
                  rules={[
                    { required: true, message: "Vui lòng chọn hành động!" },
                  ]}
                >
                  <Select placeholder="Chọn hành động">
                    {selectedContract.status !== ContractStatus.ACCEPTED && (
                      <Select.Option value={ReviewAction.APPROVE}>
                        <CheckOutlined
                          style={{ color: "green", marginRight: 8 }}
                        />
                        Phê duyệt
                      </Select.Option>
                    )}
                    <Select.Option value={ReviewAction.REJECT}>
                      <CloseOutlined style={{ color: "red", marginRight: 8 }} />
                      Từ chối{" "}
                      {selectedContract.status === ContractStatus.ACCEPTED
                        ? "(Thu hồi)"
                        : ""}
                    </Select.Option>
                    <Select.Option value={ReviewAction.REQUEST_REVISION}>
                      <EditOutlined
                        style={{ color: "orange", marginRight: 8 }}
                      />
                      Yêu cầu chỉnh sửa
                    </Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="adminNote"
                  label="Ghi chú admin"
                  rules={[
                    {
                      validator: (_, value) => {
                        const action = reviewForm.getFieldValue("action");
                        if (
                          (action === ReviewAction.REJECT ||
                            action === ReviewAction.REQUEST_REVISION) &&
                          !value
                        ) {
                          return Promise.reject(
                            new Error(
                              "Vui lòng nhập ghi chú khi từ chối hoặc yêu cầu chỉnh sửa!"
                            )
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <TextArea
                    rows={3}
                    placeholder="Nhập ghi chú admin (bắt buộc khi từ chối hoặc yêu cầu chỉnh sửa)"
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                  <Space>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={reviewMutation.isPending}
                    >
                      Xác nhận đánh giá
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </>
          )}
        </>
      )}
    </Modal>
  );
};

export default ModalDetail;
