import React, { useEffect, useRef, useState, useMemo } from "react";
import Map, {
  Marker,
  NavigationControl,
  GeolocateControl,
  FullscreenControl,
  ScaleControl,
} from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import useSupercluster from "use-supercluster";
import { getCurrencySymbol, formatPrice } from "../utils/format";
import {
  Bed,
  Bath,
  Square,
  Layers,
  Map as MapIcon,
  RotateCcw,
  MapPin,
} from "lucide-react";

// Brand Color Constant
const BRAND_COLOR = "#09707D";

const MapLibreMapViewer = ({
  properties,
  hoveredId,
  onMarkerClick,
  onSearchArea,
  flyToCoords,
}) => {
  const mapRef = useRef(null);

  const [viewState, setViewState] = useState({
    latitude: 0,
    longitude: 0,
    zoom: 1,
    pitch: 45,
    bearing: 0,
  });

  const [showSearchBtn, setShowSearchBtn] = useState(false);
  const [mapStyle, setMapStyle] = useState("streets");
  const [popupInfo, setPopupInfo] = useState(null);

  // State for the Location Pin visibility
  const [showLocationPin, setShowLocationPin] = useState(false);

  // --- 1. DATA PREP ---
  const points = useMemo(() => {
    return properties
      .map((p) => {
        const lat = parseFloat(p.latitude);
        const lng = parseFloat(p.longitude);
        if (isNaN(lat) || isNaN(lng)) return null;
        return {
          type: "Feature",
          properties: {
            cluster: false,
            productId: p.product_id,
            price: p.price,
            currency: p.price_currency,
            ...p,
          },
          geometry: { type: "Point", coordinates: [lng, lat] },
        };
      })
      .filter(Boolean);
  }, [properties]);

  const bounds = mapRef.current
    ? mapRef.current.getMap().getBounds().toArray().flat()
    : null;
  const clusterOptions = useMemo(() => ({ radius: 60, maxZoom: 16 }), []);

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: viewState.zoom,
    options: clusterOptions,
  });

  // --- 2. AUTO-FIT (On Load) ---
  useEffect(() => {
    if (mapRef.current && points.length > 0 && !flyToCoords) {
      const b = new maplibregl.LngLatBounds();
      let valid = false;
      points.forEach((p) => {
        b.extend(p.geometry.coordinates);
        valid = true;
      });

      if (valid && !b.isEmpty()) {
        mapRef.current.fitBounds(b, {
          padding: 100,
          maxZoom: 14,
          duration: 2000,
          pitch: 45,
        });
      }
    }
  }, [points]);

  // --- 3. SEARCH FLY-TO & SHOW PIN ---
  useEffect(() => {
    if (flyToCoords && mapRef.current) {
      setShowLocationPin(true); // ✅ Keep pin visible
      mapRef.current.flyTo({
        center: [flyToCoords.lng, flyToCoords.lat],
        zoom: 13,
        pitch: 45,
        duration: 2500,
        essential: true,
      });
    }
  }, [flyToCoords]);

  // --- 4. HOVER POPUP ---
  useEffect(() => {
    if (hoveredId && mapRef.current) {
      const target = points.find((p) => p.properties.productId === hoveredId);
      if (target) setPopupInfo(target.properties);
    } else {
      setPopupInfo(null);
    }
  }, [hoveredId, points]);

  const styles = {
    streets: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
    satelliteSource: {
      version: 8,
      sources: {
        raster: {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
        },
      },
      layers: [{ id: "raster", type: "raster", source: "raster" }],
    },
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "#e5e7eb",
      }}
    >
      {/* --- FLOATING SEARCH BUTTON --- */}
      {showSearchBtn && (
        <button
          onClick={() => {
            if (!mapRef.current) return;
            const b = mapRef.current.getMap().getBounds();
            onSearchArea({
              north: b.getNorth(),
              south: b.getSouth(),
              east: b.getEast(),
              west: b.getWest(),
            });
            setShowSearchBtn(false);
          }}
          style={{
            position: "absolute",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(8px)",
            color: BRAND_COLOR,
            padding: "10px 24px",
            borderRadius: 50,
            border: "1px solid rgba(255,255,255,0.3)",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            display: "flex",
            gap: 8,
            alignItems: "center",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = "translateX(-50%) scale(1.05)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.transform = "translateX(-50%) scale(1)")
          }
        >
          <RotateCcw size={16} /> Search this area
        </button>
      )}

      {/* --- STYLE TOGGLE --- */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 10,
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: 12,
          backdropFilter: "blur(4px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.5)",
        }}
      >
        <button
          onClick={() => setMapStyle("streets")}
          style={{
            padding: "10px",
            background: mapStyle === "streets" ? "#f3f4f6" : "transparent",
            border: "none",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          title="Street View"
        >
          <MapIcon
            size={20}
            color={mapStyle === "streets" ? BRAND_COLOR : "#666"}
          />
        </button>
        <div style={{ height: 1, background: "#eee" }} />
        <button
          onClick={() => setMapStyle("satellite")}
          style={{
            padding: "10px",
            background: mapStyle === "satellite" ? "#f3f4f6" : "transparent",
            border: "none",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          title="Satellite View"
        >
          <Layers
            size={20}
            color={mapStyle === "satellite" ? BRAND_COLOR : "#666"}
          />
        </button>
      </div>

      <Map
        {...viewState}
        ref={mapRef}
        onMove={(evt) => {
          setViewState(evt.viewState);
          if (!showSearchBtn) setShowSearchBtn(true);
        }}
        // ❌ REMOVED: onMoveStart logic so pin stays persistent
        mapStyle={
          mapStyle === "streets" ? styles.streets : styles.satelliteSource
        }
        style={{ width: "100%", height: "100%" }}
        maxPitch={60}
      >
        <NavigationControl
          position="bottom-right"
          visualizePitch={true}
          showCompass={true}
        />
        <GeolocateControl position="top-right" />
        <FullscreenControl position="top-left" />
        <ScaleControl />

        {/* ✅ SEARCH LOCATION PIN (Pulse Effect) */}
        {showLocationPin && flyToCoords && (
          <Marker
            longitude={flyToCoords.lng}
            latitude={flyToCoords.lat}
            anchor="bottom"
          >
            <div className="location-pin-container">
              <MapPin
                size={42}
                fill={BRAND_COLOR} // 🟢 Updated Color
                color="#ffffff"
                strokeWidth={1.5}
                style={{
                  filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))",
                  transform: "translateY(-5px)",
                }}
              />
              <div className="pulse-ring" />
            </div>
          </Marker>
        )}

        {/* --- CLUSTERS & MARKERS --- */}
        {clusters.map((cluster) => {
          const [lng, lat] = cluster.geometry.coordinates;
          const { cluster: isCluster, point_count } = cluster.properties;

          if (isCluster) {
            return (
              <Marker key={cluster.id} longitude={lng} latitude={lat}>
                <div
                  onClick={() => {
                    const expansionZoom = Math.min(
                      supercluster.getClusterExpansionZoom(cluster.id),
                      20
                    );
                    mapRef.current.flyTo({
                      center: [lng, lat],
                      zoom: expansionZoom,
                      pitch: 45,
                      duration: 500,
                    });
                  }}
                  style={{
                    width: `${32 + (point_count / points.length) * 20}px`,
                    height: `${32 + (point_count / points.length) * 20}px`,
                    background: BRAND_COLOR,
                    color: "#fff",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "700",
                    cursor: "pointer",
                    border: "3px solid rgba(255,255,255,0.9)",
                    boxShadow: "0 6px 12px rgba(0,0,0,0.25)",
                    fontSize: "14px",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "scale(1.1)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                >
                  {point_count}
                </div>
              </Marker>
            );
          }

          const isHovered = hoveredId === cluster.properties.productId;
          return (
            <Marker
              key={cluster.properties.productId}
              longitude={lng}
              latitude={lat}
              anchor="bottom"
            >
              <div
                onClick={() => onMarkerClick(cluster.properties.productId)}
                onMouseEnter={() =>
                  setPopupInfo({
                    ...cluster.properties,
                    longitude: lng,
                    latitude: lat,
                  })
                }
                onMouseLeave={() => setPopupInfo(null)}
                style={{
                  zIndex: isHovered ? 100 : 1,
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              >
                {viewState.zoom < 11 ? (
                  // Small Dot for wide view
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      backgroundColor: BRAND_COLOR,
                      borderRadius: "50%",
                      border: "3px solid white",
                      boxShadow: "0 3px 8px rgba(0,0,0,0.3)",
                      transform: isHovered ? "scale(1.8)" : "scale(1)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                ) : (
                  // Price Tag for close view
                  <div
                    style={{
                      transform: isHovered
                        ? "scale(1.15) translateY(-4px)"
                        : "scale(1)",
                      position: "relative",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: isHovered ? "#111827" : BRAND_COLOR,
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "13px",
                        fontWeight: "700",
                        border: "2px solid white",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {getCurrencySymbol(cluster.properties.price_currency)}
                      {formatPrice(cluster.properties.price)}
                    </div>
                    <div
                      style={{
                        width: 0,
                        height: 0,
                        borderLeft: "6px solid transparent",
                        borderRight: "6px solid transparent",
                        borderTop: `8px solid ${
                          isHovered ? "#111827" : BRAND_COLOR
                        }`,
                        margin: "-2px auto 0 auto",
                      }}
                    />
                  </div>
                )}
              </div>
            </Marker>
          );
        })}

        {/* --- POPUP --- */}
        {popupInfo && (
          <Marker
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            anchor="bottom"
            offset={[0, -55]}
          >
            <div
              style={{
                width: 250,
                background: "#fff",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
                zIndex: 200,
                animation: "fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <div style={{ position: "relative", height: 150 }}>
                <img
                  src={popupInfo.photos?.[0]?.url || "/placeholder.png"}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  alt=""
                />

                {/* ✅ UPDATED BADGE: Shows "FOR SALE" instead of just "sale" */}
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    background: "rgba(0,0,0,0.75)",
                    backdropFilter: "blur(4px)",
                    color: "#fff",
                    padding: "4px 8px",
                    borderRadius: 6,
                    fontSize: "10px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {popupInfo.listing_type === "rent" ? "For Rent" : "For Sale"}
                </div>
              </div>
              <div style={{ padding: "14px 16px" }}>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "800",
                    color: "#111",
                    lineHeight: 1.2,
                  }}
                >
                  {getCurrencySymbol(popupInfo.price_currency)}
                  {formatPrice(popupInfo.price)}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#555",
                    marginTop: 6,
                    fontWeight: "600",
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <Bed size={15} strokeWidth={2} /> {popupInfo.bedrooms}
                  </span>
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <Bath size={15} strokeWidth={2} /> {popupInfo.bathrooms}
                  </span>
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <Square size={15} strokeWidth={2} />{" "}
                    {formatPrice(popupInfo.square_footage)}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#888",
                    marginTop: 8,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {popupInfo.address}, {popupInfo.city}
                </div>
              </div>
            </div>
          </Marker>
        )}
      </Map>

      {/* --- GLOBAL STYLES FOR ANIMATIONS --- */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        
        .location-pin-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
        }

        .pulse-ring {
            position: absolute;
            bottom: 2px;
            width: 14px;
            height: 14px;
            background-color: ${BRAND_COLOR};
            border-radius: 50%;
            box-shadow: 0 0 0 6px rgba(9, 112, 125, 0.25);
            animation: pulse 2s infinite;
            z-index: -1;
        }

        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(9, 112, 125, 0.6); }
            70% { box-shadow: 0 0 0 20px rgba(9, 112, 125, 0); }
            100% { box-shadow: 0 0 0 0 rgba(9, 112, 125, 0); }
        }
      `}</style>
    </div>
  );
};

export default MapLibreMapViewer;
