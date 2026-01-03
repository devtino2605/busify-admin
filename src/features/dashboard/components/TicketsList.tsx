import React from "react";
import {
  Card,
  Typography,
  Avatar,
  Tag,
  Button,
  Space,
  Dropdown,
  Pagination,
} from "antd";
import {
  PhoneOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  MailOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { getStatusColor, getStatusText } from "../utils/ticketUtils"; // Giữ lại các hàm tiện ích cho status
import type { ComplaintDetail } from "../../../app/api/complaint";

interface TicketsListProps {
  tickets: ComplaintDetail[];
  currentPage: number;
  totalElements: number;
  pageSize: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onTicketAction: (action: string, ticketId: number, extra?: any) => void; // Mở rộng để hỗ trợ extra (ví dụ: trạng thái mới)
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const TicketsList: React.FC<TicketsListProps> = ({
  tickets,
  currentPage,
  totalElements,
  pageSize,
  onTicketAction,
  onPageChange,
  onPageSizeChange,
}) => {
  const ticketCardStyle: React.CSSProperties = {
    borderRadius: 10,
    boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
    overflow: "hidden",
    background: "#fff",
  };

  // Menu cho dropdown trạng thái
  const statusMenu = (ticketId: number) => ({
    items: [
      { key: "New", label: "Mới" },
      { key: "pending", label: "Chờ xử lý" },
      { key: "in_progress", label: "Đang xử lý" },
      { key: "resolved", label: "Đã giải quyết" },
      { key: "rejected", label: "Từ chối" },
    ],
    onClick: ({ key }: { key: string }) => {
      onTicketAction("ChangeStatus", ticketId, key); // Gọi với trạng thái mới
    },
  });

  return (
    <Card
      style={{
        ...ticketCardStyle,
        background: "#fafafa",
      }}
      styles={{ body: { padding: 0 } }}
    >
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #f0f0f0",
          background: "#fff",
        }}
      >
        <Typography.Title level={5} style={{ margin: 0 }}>
          Danh sách Khiếu nại ({tickets.length})
        </Typography.Title>
      </div>
      <div style={{ padding: "8px 0" }}>
        {tickets.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "#999",
            }}
          >
            <SearchOutlined style={{ fontSize: 24, marginBottom: 8 }} />
            <div>Không có yêu cầu phù hợp</div>
          </div>
        ) : (
          <div
            style={{
              maxHeight: "500px",
              overflowY: "auto",
            }}
          >
            {tickets.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #f5f5f5",
                  background: "#fff",
                  margin: "0 8px 8px",
                  borderRadius: 8,
                  border: "2px solid #E0E0E0",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(0, 128, 255, 0.06)"; // xanh mờ
                  e.currentTarget.style.borderColor = "rgba(0, 128, 255, 0.4)"; // xanh nhạt mờ
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "#f0f0f0";
                }}
              >
                {/* Header Row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 6,
                      }}
                    >
                      <Typography.Text
                        strong
                        style={{
                          fontSize: 15,
                          color: "#262626",
                        }}
                      >
                        {item.title}{" "}
                        {/* Thay thế: item.subject -> item.title */}
                      </Typography.Text>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <Tag
                        color={getStatusColor(item.status)}
                        style={{
                          margin: 0,
                          fontSize: 11,
                          borderRadius: 4,
                          fontWeight: 500,
                        }}
                      >
                        {getStatusText(item.status)}
                      </Tag>

                      <div
                        style={{
                          height: 12,
                          width: 1,
                          backgroundColor: "#f0f0f0",
                        }}
                      />

                      <Typography.Text
                        style={{
                          fontSize: 12,
                          color: "#8c8c8c",
                        }}
                      >
                        #{item.id}
                      </Typography.Text>
                    </div>
                  </div>

                  <div
                    style={{
                      textAlign: "right",
                      minWidth: 80,
                    }}
                  >
                    <Typography.Text
                      style={{
                        fontSize: 11,
                        color: "#999",
                        display: "block",
                      }}
                    >
                      Tạo lúc
                    </Typography.Text>
                    <Typography.Text
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#595959",
                      }}
                    >
                      {dayjs(item.createdAt).format("DD/MM HH:mm")}
                    </Typography.Text>
                  </div>
                </div>

                {/* Customer Info Row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 12,
                    padding: "8px 12px",
                    backgroundColor: "#fafafa",
                    borderRadius: 6,
                  }}
                >
                  <Avatar
                    size={32}
                    style={{
                      backgroundColor: "#f0f2f5",
                      color: "#595959",
                      fontWeight: 600,
                    }}
                  >
                    {/* Thay thế: Truy cập tên khách hàng qua object customer */}
                    {item.customer.customerName
                      .split(" ")
                      .slice(-1)[0]
                      .charAt(0)}
                  </Avatar>

                  <div style={{ flex: 1 }}>
                    <Typography.Text
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#262626",
                        display: "block",
                      }}
                    >
                      {item.customer.customerName}
                    </Typography.Text>
                    <Typography.Text
                      style={{
                        fontSize: 12,
                        color: "#8c8c8c",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <PhoneOutlined style={{ fontSize: 11 }} />
                      {/* Thay thế: Truy cập sđt qua object customer */}
                      {item.customer.customerPhone}
                    </Typography.Text>
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: 12 }}>
                  <Typography.Text
                    style={{
                      fontSize: 13,
                      color: "#595959",
                      lineHeight: 1.4,
                      display: "block",
                    }}
                  >
                    {item.description.length > 100
                      ? `${item.description.substring(0, 100)}...`
                      : item.description}
                  </Typography.Text>
                </div>

                {/* Action Row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: 8,
                    borderTop: "1px solid #f5f5f5",
                  }}
                >
                  {/* Thay thế: Hiển thị booking code thay cho priority */}
                  <Typography.Text style={{ fontSize: 12, color: "#8c8c8c" }}>
                    Mã đặt chỗ: <strong>{item.booking.bookingCode}</strong>
                  </Typography.Text>

                  <Space size="small">
                    <Button
                      type="text"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTicketAction("View", item.id);
                      }}
                      style={{
                        color: "#595959",
                        fontSize: 12,
                        height: 28,
                        padding: "0 8px",
                      }}
                    >
                      Xem
                    </Button>
                    {/* Nút mới: Gửi Email */}
                    <Button
                      type="text"
                      size="small"
                      icon={<MailOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTicketAction("SendEmail", item.id);
                      }}
                      style={{
                        color: "#52c41a", // Màu xanh lá cho email
                        fontSize: 12,
                        height: 28,
                        padding: "0 8px",
                      }}
                    >
                      Gửi Email
                    </Button>
                    {/* Thay đổi nút "Xử lý" thành dropdown để chuyển trạng thái */}
                    <Dropdown menu={statusMenu(item.id)} trigger={["click"]}>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          color: "#1890ff",
                          fontSize: 12,
                          height: 28,
                          padding: "0 8px",
                          fontWeight: 500,
                        }}
                      >
                        Chuyển Trạng Thái
                      </Button>
                    </Dropdown>
                  </Space>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalElements > 0 && (
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid #f0f0f0",
            background: "#fafafa",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography.Text style={{ fontSize: 13, color: "#8c8c8c" }}>
            Hiển thị {currentPage * pageSize + 1} -{" "}
            {Math.min((currentPage + 1) * pageSize, totalElements)} của{" "}
            {totalElements} mục
          </Typography.Text>

          <Pagination
            current={currentPage + 1} // Ant Design sử dụng 1-based indexing
            pageSize={pageSize}
            total={totalElements}
            showSizeChanger
            showQuickJumper
            pageSizeOptions={["10", "20", "50", "100"]}
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} của ${total} mục`
            }
            onChange={(page, size) => {
              onPageChange(page - 1); // Chuyển về 0-based indexing
              if (size !== pageSize) {
                onPageSizeChange(size);
              }
            }}
            onShowSizeChange={(_, size) => {
              onPageSizeChange(size);
            }}
            style={{ marginLeft: 16 }}
          />
        </div>
      )}
    </Card>
  );
};
