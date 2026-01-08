import React, { useEffect } from "react";
import { Modal } from "antd";
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

  useEffect(() => {
    map.setView(center, 15);
    // Fix map size display issues
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map, center]);

  return null;
};

interface MapModalProps {
  isVisible: boolean;
  onClose: () => void;
  location: {
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  } | null;
}

const MapModal: React.FC<MapModalProps> = ({
  isVisible,
  onClose,
  location,
}) => {
  if (!location || !location.latitude || !location.longitude) {
    return (
      <Modal
        title="Location Map"
        open={isVisible}
        onCancel={onClose}
        footer={null}
        width={800}
      >
        <div style={{ textAlign: "center", padding: "20px" }}>
          No coordinates available for this location.
        </div>
      </Modal>
    );
  }

  const position: [number, number] = [location.latitude, location.longitude];

  return (
    <Modal
      title={`Location: ${location.name}`}
      open={isVisible}
      onCancel={onClose}
      footer={null}
      width={800}
      bodyStyle={{ height: "500px", padding: 0 }}
    >
      <MapContainer
        center={position}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <MapUpdater center={position} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            <div>
              <strong>{location.name}</strong>
              {location.address && <div>{location.address}</div>}
              <div>
                Lat: {location.latitude}, Lng: {location.longitude}
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </Modal>
  );
};

export default MapModal;
