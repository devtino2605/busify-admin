import React, { useState, useMemo } from "react";
import {
  Space,
  Table,
  Tag,
  Button,
  Input,
  Card,
  Row,
  Col,
  Statistic,
  Breadcrumb,
  Modal,
  message,
  Tooltip,
  Drawer,
  Descriptions,
  Form,
} from "antd";
import type { TableProps } from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EnvironmentOutlined,
  CloseOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import {
  deleteLocation,
  getLocationDropdown,
  approveLocation,
  rejectLocation,
  type LocationDropdownItem,
} from "../../app/api/location";
import LocationModal from "./location-modal.tsx";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Component to update map view when location changes
const MapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();

  React.useEffect(() => {
    map.setView(center, 15);
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map, center]);

  return null;
};

interface DataType extends LocationDropdownItem {
  key: string;
}

const LocationManagement: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  // Drawer states
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<DataType | null>(
    null
  );

  const [refreshKey, setRefreshKey] = useState(0);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [form] = Form.useForm();

  const fetchLocations = async () => {
    const data = await getLocationDropdown();
    return {
      content: data,
      totalElements: data.length,
    };
  };

  const { data: locationData, isLoading } = useQuery({
    queryKey: ["locations", refreshKey],
    queryFn: fetchLocations,
    staleTime: 1000 * 60 * 5,
    retry: 3,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  // Filter and sort data based on search text
  const filteredData = useMemo(() => {
    if (!locationData?.content) return [];

    let data = locationData.content;

    // Filter by search text if provided
    if (searchText) {
      data = data.filter((location) =>
        location.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Sort: PENDING first, then APPROVED, REJECTED, DELETED
    const statusOrder = { PENDING: 0, APPROVED: 1, REJECTED: 2, DELETED: 3 };
    data.sort((a, b) => {
      const orderA = statusOrder[a.status as keyof typeof statusOrder] ?? 4;
      const orderB = statusOrder[b.status as keyof typeof statusOrder] ?? 4;
      return orderA - orderB;
    });

    return data;
  }, [locationData, searchText]);

  // Handler functions
  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleDelete = (record: DataType) => {
    Modal.confirm({
      title: "Are you sure you want to delete this location?",
      content: `This will permanently delete ${record.name} and all associated data.`,
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        if (!record.id) return;
        const result = await deleteLocation(record.id);
        if (result.code === 200) {
          setRefreshKey((prev) => prev + 1);
          message.success(`Location ${record.name} has been deleted`);
        } else {
          message.error(`Failed to delete location ${record.name}`);
        }
      },
    });
  };

  const handleApprove = async (record: DataType) => {
    if (!record.id) return;
    try {
      const result = await approveLocation(record.id);
      if (result.code === 200) {
        setRefreshKey((prev) => prev + 1);
        message.success(`Location ${record.name} has been approved`);
      } else {
        message.error(`Failed to approve location ${record.name}`);
      }
    } catch (error) {
      message.error(`Failed to approve location ${record.name}`);
    }
  };

  const handleReject = async (record: DataType) => {
    if (!record.id) return;
    try {
      const result = await rejectLocation(record.id);
      if (result.code === 200) {
        setRefreshKey((prev) => prev + 1);
        message.success(`Location ${record.name} has been rejected`);
      } else {
        message.error(`Failed to reject location ${record.name}`);
      }
    } catch (error) {
      message.error(`Failed to reject location ${record.name}`);
    }
  };

  // Handler to open drawer with location details
  const handleViewDetails = (record: DataType) => {
    setSelectedLocation(record);
    setDrawerVisible(true);
  };

  // Define columns inside component to access handlers
  const columns: TableProps<DataType>["columns"] = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      sorter: (a, b) => (a.id || 0) - (b.id || 0),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "City",
      dataIndex: "city",
      key: "city",
    },
    {
      title: "Region",
      dataIndex: "region",
      key: "region",
      render: (region: string) => region || "N/A",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "default";
        switch (status) {
          case "APPROVED":
            color = "green";
            break;
          case "PENDING":
            color = "orange";
            break;
          case "REJECTED":
            color = "red";
            break;
          case "DELETED":
            color = "gray";
            break;
        }
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 250,
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          {record.status === "PENDING" && (
            <>
              <Tooltip title="Approve">
                <Button
                  type="text"
                  style={{ color: "#52c41a" }}
                  icon={<EditOutlined />}
                  onClick={() => handleApprove(record)}
                >
                  Approve
                </Button>
              </Tooltip>
              <Tooltip title="Reject">
                <Button
                  type="text"
                  style={{ color: "#ff4d4f" }}
                  icon={<CloseOutlined />}
                  onClick={() => handleReject(record)}
                >
                  Reject
                </Button>
              </Tooltip>
            </>
          )}
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            >
              Delete
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div style={{ padding: "24px" }}>
      <Breadcrumb
        items={[{ title: "Admin" }, { title: "Location Management" }]}
        style={{ marginBottom: "16px" }}
      />

      <Card>
        <Row gutter={16} style={{ marginBottom: "16px" }}>
          <Col span={6}>
            <Statistic
              title="Total Locations"
              value={locationData?.totalElements || 0}
              prefix={<EnvironmentOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Filtered Locations"
              value={filteredData.length}
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: "16px" }}>
          <Col span={8}>
            <Input
              placeholder="Search locations by name..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col span={10}></Col>
          <Col span={6} style={{ textAlign: "right" }}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={isLoading}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                Add Location
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredData.map((item: LocationDropdownItem) => ({
            ...item,
            key: item.id?.toString() || "",
          }))}
          loading={isLoading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredData.length,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} locations`,
            pageSizeOptions: ["10", "20", "50", "100"],
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Location Modal */}
      <LocationModal
        isModalVisible={modalVisible}
        setIsModalVisible={setModalVisible}
        form={form}
        onSuccess={() => setRefreshKey((prev) => prev + 1)}
      />

      {/* Location Details Drawer */}
      <Drawer
        title="Location Details"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={700}
      >
        {selectedLocation && (
          <>
            {/* Map Section */}
            {selectedLocation.latitude && selectedLocation.longitude ? (
              <div style={{ marginBottom: "24px", height: "300px" }}>
                <MapContainer
                  center={[
                    selectedLocation.latitude,
                    selectedLocation.longitude,
                  ]}
                  zoom={15}
                  style={{ height: "100%", width: "100%", borderRadius: "8px" }}
                  scrollWheelZoom={true}
                >
                  <MapUpdater
                    center={[
                      selectedLocation.latitude,
                      selectedLocation.longitude,
                    ]}
                  />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker
                    position={[
                      selectedLocation.latitude,
                      selectedLocation.longitude,
                    ]}
                  >
                    <Popup>
                      <div>
                        <strong>{selectedLocation.name}</strong>
                        {selectedLocation.address && (
                          <div>{selectedLocation.address}</div>
                        )}
                        <div>
                          Lat: {selectedLocation.latitude}, Lng:{" "}
                          {selectedLocation.longitude}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            ) : (
              <div
                style={{
                  marginBottom: "24px",
                  padding: "20px",
                  textAlign: "center",
                  background: "#f5f5f5",
                  borderRadius: "8px",
                }}
              >
                No coordinates available for this location
              </div>
            )}

            {/* Details Section */}
            <Descriptions column={1} bordered>
              <Descriptions.Item label="ID">
                {selectedLocation.id}
              </Descriptions.Item>
              <Descriptions.Item label="Name">
                {selectedLocation.name}
              </Descriptions.Item>
              <Descriptions.Item label="Address">
                {selectedLocation.address}
              </Descriptions.Item>
              <Descriptions.Item label="City">
                {selectedLocation.city}
              </Descriptions.Item>
              <Descriptions.Item label="Region">
                {selectedLocation.region}
              </Descriptions.Item>
              <Descriptions.Item label="Latitude">
                {selectedLocation.latitude || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Longitude">
                {selectedLocation.longitude || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {(() => {
                  let color = "default";
                  switch (selectedLocation.status) {
                    case "APPROVED":
                      color = "green";
                      break;
                    case "PENDING":
                      color = "orange";
                      break;
                    case "REJECTED":
                      color = "red";
                      break;
                    case "DELETED":
                      color = "gray";
                      break;
                  }
                  return <Tag color={color}>{selectedLocation.status}</Tag>;
                })()}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default LocationManagement;
