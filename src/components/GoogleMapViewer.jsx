import React, { useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

// Google Maps Container Style
const containerStyle = {
  width: "100%",
  height: "100%",
};

// Default Center (Atlanta, GA) - Used if no properties
const defaultCenter = {
  lat: 33.7490,
  lng: -84.3880,
};

// Custom Blue Marker Icon (Matches EstateA Brand)
const markerIcon = (isActive) => ({
  path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
  fillColor: isActive ? "#007983" : "#007983",
  fillOpacity: 1,
  strokeWeight: 1,
  strokeColor: "#ffffff",
  scale: 2,
  anchor: { x: 12, y: 22 }, // Anchor at the bottom tip
});

const GoogleMapViewer = ({ properties }) => {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [map, setMap] = useState(null);
  const [selectedProp, setSelectedProp] = useState(null);

  const onLoad = useCallback((map) => {
    // Optional: Fit bounds to show all markers
    if (properties.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      let hasValidCoords = false;
      properties.forEach((prop) => {
        if (prop.latitude && prop.longitude) {
          bounds.extend({ lat: prop.latitude, lng: prop.longitude });
          hasValidCoords = true;
        }
      });
      if (hasValidCoords) map.fitBounds(bounds);
    }
    setMap(map);
  }, [properties]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (!isLoaded) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-teal-700" /></div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={defaultCenter}
      zoom={12}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        styles: [ // Optional: Clean map style to make pins pop
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      }}
    >
      {properties.map((prop) => {
        // Skip if invalid coords
        if (!prop.latitude || !prop.longitude) return null;

        return (
          <Marker
            key={prop.product_id}
            position={{ lat: prop.latitude, lng: prop.longitude }}
            icon={markerIcon(selectedProp?.product_id === prop.product_id)}
            onClick={() => setSelectedProp(prop)}
          />
        );
      })}

      {/* Info Window (Popup) */}
      {selectedProp && (
        <InfoWindow
          position={{ lat: selectedProp.latitude, lng: selectedProp.longitude }}
          onCloseClick={() => setSelectedProp(null)}
          options={{ pixelOffset: new window.google.maps.Size(0, -30) }}
        >
          <div style={{ width: "220px", padding: "0" }}>
            <img 
              src={selectedProp.photos?.[0]?.url || "/placeholder.png"} 
              alt="Home" 
              style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "6px 6px 0 0" }}
            />
            <div style={{ padding: "8px" }}>
              <div style={{ fontSize: "16px", fontWeight: "bold", color: "#111" }}>
                {selectedProp.price_currency} {Number(selectedProp.price).toLocaleString()}
              </div>
              <div style={{ fontSize: "12px", color: "#555", margin: "4px 0" }}>
                {selectedProp.bedrooms} bds | {selectedProp.bathrooms} ba | {selectedProp.square_footage} sqft
              </div>
              <div style={{ fontSize: "11px", color: "#777", marginBottom: "8px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {selectedProp.address}, {selectedProp.city}
              </div>
              <Link 
                to={`/listing/${selectedProp.product_id}`} 
                style={{ 
                  display: "block", 
                  textAlign: "center", 
                  backgroundColor: "#007983", 
                  color: "white", 
                  padding: "6px", 
                  borderRadius: "4px", 
                  textDecoration: "none",
                  fontSize: "12px",
                  fontWeight: "600"
                }}
              >
                View Details
              </Link>
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default GoogleMapViewer;