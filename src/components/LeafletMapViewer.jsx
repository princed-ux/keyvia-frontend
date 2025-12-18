import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getCurrencySymbol, formatPrice } from "../utils/format";

// --- Custom Icon Generator ---
const createCustomIcon = (isHovered, price, currency) => {
  // Zillow-style: Price Pill or Dot
  // For simplicity and performance, we use a clean dot that expands on hover
  const color = isHovered ? "#d97706" : "#007983"; // Amber-600 vs Teal
  const size = isHovered ? 24 : 14; 
  const border = isHovered ? "3px solid white" : "2px solid white";
  const zIndex = isHovered ? 1000 : 1;

  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: ${border};
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -10],
  });
};

const LeafletMapViewer = ({ properties, hoveredId, onMarkerClick }) => {
  const defaultCenter = [33.7490, -84.3880]; // Atlanta

  return (
    <MapContainer
      center={defaultCenter}
      zoom={12}
      scrollWheelZoom={true}
      style={{ width: "100%", height: "100%", background: "#e5e7eb" }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />

      {properties.map((prop) => {
        if (!prop.latitude || !prop.longitude) return null;
        const isHovered = hoveredId === prop.product_id;

        return (
          <Marker
            key={prop.product_id}
            position={[prop.latitude, prop.longitude]}
            icon={createCustomIcon(isHovered, prop.price, prop.price_currency)}
            zIndexOffset={isHovered ? 9999 : 10}
            eventHandlers={{
              click: () => onMarkerClick(prop.product_id),
            }}
          >
            {/* Optional: Remove popup if you want instant click-to-modal behavior */}
            <Popup closeButton={false} className="custom-popup">
              <div 
                style={{ cursor: "pointer" }}
                onClick={() => onMarkerClick(prop.product_id)}
              >
                <strong>{getCurrencySymbol(prop.price_currency)}{formatPrice(prop.price)}</strong><br/>
                {prop.bedrooms} bds | {prop.bathrooms} ba
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default LeafletMapViewer;