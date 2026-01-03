import React from "react";
import { Result, Button, Typography, Space, Card, theme } from "antd";
import { LockOutlined, LoginOutlined, MailOutlined } from "@ant-design/icons";

/**
 * AccessDenied – Khối UI đẹp gọn cho trạng thái 403 (không có quyền)
 *
 * Props gợi ý:
 * - title: Tiêu đề lớn (mặc định "403")
 * - message: Mô tả ngắn (mặc định tiếng Việt)
 * - onRetry: Handler khi bấm "Thử lại"
 * - onLogin: Handler điều hướng đăng nhập
 * - onRequestAccess: Handler gửi yêu cầu cấp quyền
 * - homeHref: Link về trang chủ (nếu cần)
 */
export type AccessDeniedProps = {
  title?: React.ReactNode;
  message?: React.ReactNode;
  onRetry?: () => void;
  onLogin?: () => void;
  onRequestAccess?: () => void;
  homeHref?: string;
};

const AccessDenied: React.FC<AccessDeniedProps> = ({
  title = "403",
  message = "Bạn không có quyền truy cập vào nội dung này.",
  onLogin,
  onRequestAccess,
}) => {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: `linear-gradient(135deg, ${token.colorBgLayout} 0%, ${token.colorFillSecondary} 100%)`,
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 680,
          borderRadius: 16,
          boxShadow: token.boxShadowSecondary,
        }}
        styles={{ body: { padding: 0 } }}
      >
        <div
          style={{
            padding: 24,
            background: token.colorBgContainer,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        >
          <Result
            icon={<LockOutlined style={{ fontSize: 64 }} />}
            status={"403"}
            title={
              <Typography.Title level={2} style={{ margin: 0 }}>
                {title}
              </Typography.Title>
            }
            subTitle={
              <Typography.Text type="secondary">{message}</Typography.Text>
            }
            extra={
              <Space wrap size={[12, 12]}>
                {onLogin && (
                  <Button
                    type="primary"
                    icon={<LoginOutlined />}
                    onClick={onLogin}
                  >
                    Đăng nhập
                  </Button>
                )}
              </Space>
            }
          />
        </div>

        <div
          style={{
            borderTop: `1px dashed ${token.colorSplit}`,
            padding: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
          }}
        >
          <Typography.Text type="secondary">
            Nếu bạn nghĩ đây là nhầm lẫn, hãy liên hệ quản trị viên hoặc nhóm
            phụ trách.
          </Typography.Text>
          {onRequestAccess && (
            <Button
              size="small"
              onClick={onRequestAccess}
              icon={<MailOutlined />}
            >
              Liên hệ ngay
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AccessDenied;
