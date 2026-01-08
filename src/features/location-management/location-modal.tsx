import React from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Row,
  Col,
  message,
  Select,
  type FormInstance,
} from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createLocation,
  updateLocation,
  type LocationRegion,
} from "../../app/api/location";

const { TextArea } = Input;

export interface LocationFormData {
  id?: number;
  name: string;
  address: string;
  city: string;
  region: LocationRegion;
  latitude?: number;
  longitude?: number;
}

interface LocationModalProps {
  isModalVisible: boolean;
  setIsModalVisible: (visible: boolean) => void;
  form: FormInstance;
  onSuccess?: () => void;
}

const LocationModal: React.FC<LocationModalProps> = ({
  isModalVisible,
  setIsModalVisible,
  form,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: LocationFormData) => {
      console.log("Creating location:", data);
      const response = await createLocation(data);
      return response;
    },
    onSuccess: (response) => {
      if (response.code === 200) {
        message.success(response.message || "Tạo địa điểm thành công!");
        queryClient.invalidateQueries({ queryKey: ["locations"] });
        if (onSuccess) onSuccess();
        form.resetFields();
        setIsModalVisible(false);
      } else {
        message.error(response.message || "Tạo địa điểm thất bại!");
      }
    },
    onError: (error: Error) => {
      message.error(`Lỗi tạo địa điểm: ${error.message}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: LocationFormData;
    }) => {
      console.log("Updating location:", data);
      const response = await updateLocation(id, data);
      return response;
    },
    onSuccess: (response) => {
      if (response.code === 200) {
        message.success(response.message || "Cập nhật địa điểm thành công!");
        queryClient.invalidateQueries({ queryKey: ["locations"] });
        if (onSuccess) onSuccess();
        form.resetFields();
        setIsModalVisible(false);
      } else {
        message.error(response.message || "Cập nhật địa điểm thất bại!");
      }
    },
    onError: (error: Error) => {
      message.error(`Lỗi cập nhật địa điểm: ${error.message}`);
    },
  });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const isEdit = !!values.id;

      if (isEdit) {
        updateMutation.mutate({ id: values.id, data: values });
      } else {
        createMutation.mutate(values);
      }
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
  };

  return (
    <Modal
      title={form.getFieldValue("id") ? "Edit Location" : "Add New Location"}
      open={isModalVisible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={createMutation.isPending || updateMutation.isPending}
          onClick={handleSubmit}
        >
          {form.getFieldValue("id") ? "Update" : "Create"}
        </Button>,
      ]}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          region: "NORTH",
        }}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="name"
              label="Location Name"
              rules={[
                { required: true, message: "Please enter location name" },
              ]}
            >
              <Input
                prefix={<EnvironmentOutlined />}
                placeholder="Enter location name"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="address"
              label="Address"
              rules={[{ required: true, message: "Please enter address" }]}
            >
              <TextArea placeholder="Enter full address" rows={3} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="city"
              label="City"
              rules={[{ required: true, message: "Please enter city" }]}
            >
              <Input placeholder="Enter city" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="region"
              label="Region"
              rules={[{ required: true, message: "Please select region" }]}
            >
              <Select placeholder="Select region">
                <Select.Option value="NORTH">North</Select.Option>
                <Select.Option value="SOUTH">South</Select.Option>
                <Select.Option value="CENTRAL">Central</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="latitude" label="Latitude">
              <Input type="number" placeholder="Enter latitude" step="any" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="longitude" label="Longitude">
              <Input type="number" placeholder="Enter longitude" step="any" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default LocationModal;
