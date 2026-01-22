import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Map, {
  Marker,
  NavigationControl,
  GeolocateControl,
  FullscreenControl,
  ScaleControl,
} from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Draw Libraries
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

import useSupercluster from "use-supercluster";
import { getCurrencySymbol, formatPrice } from "../utils/format";
import {
  Bed, Bath, Square, RotateCcw, MapPin, Globe, Satellite, Map as MapIcon
} from "lucide-react";

import style from "../styles/MapViewer.module.css"; 

const BRAND_COLOR = "#09707D";

// ✅ CUSTOM STYLES TO FIX THE "EXPRESSION" ERROR
const DRAW_STYLES = [
  // 1. ACTIVE (being drawn) - POLYGON FILL
  {
    'id': 'gl-draw-polygon-fill-active',
    'type': 'fill',
    'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
    'paint': {
      'fill-color': '#09707D',
      'fill-opacity': 0.2
    }
  },
  // 2. ACTIVE - POLYGON STROKE (The Border)
  {
    'id': 'gl-draw-polygon-stroke-active',
    'type': 'line',
    'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#09707D',
      'line-dasharray': [2, 2],
      'line-width': 2
    }
  },
  // 3. INACTIVE (Finished) - POLYGON FILL
  {
    'id': 'gl-draw-polygon-fill-inactive',
    'type': 'fill',
    'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    'paint': {
      'fill-color': '#09707D',
      'fill-opacity': 0.1
    }
  },
  // 4. INACTIVE - POLYGON STROKE
  {
    'id': 'gl-draw-polygon-stroke-inactive',
    'type': 'line',
    'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#09707D',
      'line-width': 2
    }
  },
  // 5. POINTS (Handles for editing)
  {
    'id': 'gl-draw-point-point-stroke-active',
    'type': 'circle',
    'filter': ['all', ['==', '$type', 'Point'], ['==', 'active', 'true'], ['!=', 'meta', 'midpoint']],
    'paint': {
      'circle-radius': 7,
      'circle-color': '#fff'
    }
  },
  {
    'id': 'gl-draw-point-point-active',
    'type': 'circle',
    'filter': ['all', ['==', '$type', 'Point'], ['!=', 'meta', 'midpoint'], ['==', 'active', 'true']],
    'paint': {
      'circle-radius': 5,
      'circle-color': '#09707D'
    }
  }
];

const MapLibreMapViewer = ({
  properties,
  hoveredId,
  onMarkerClick,
  onSearchArea,
  flyToCoords,
}) => {
  const mapRef = useRef(null);
  const drawRef = useRef(null);

  const [viewState, setViewState] = useState({
    latitude: 37.7749, 
    longitude: -122.4194,
    zoom: 10,
    pitch: 0,
    bearing: 0,
  });

  const [showSearchBtn, setShowSearchBtn] = useState(false);
  const [mapStyle, setMapStyle] = useState("google");
  const [popupInfo, setPopupInfo] = useState(null);
  const [showLocationPin, setShowLocationPin] = useState(false);

  // --- 1. DATA PREP ---
  const points = useMemo(() => {
    return properties
      .map((p) => {
        const lat = parseFloat(p.latitude);
        const lng = parseFloat(p.longitude);
        if (isNaN(lat) || isNaN(lng)) return null;
        if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return null;

        return {
          type: "Feature",
          properties: {
            cluster: false,
            productId: p.product_id,
            price: p.price,
            price_currency: p.price_currency,
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

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: viewState.zoom,
    options: { radius: 60, maxZoom: 16 },
  });

  // --- 2. AUTO-FIT ---
  useEffect(() => {
    if (mapRef.current && points.length > 0 && !flyToCoords) {
      const b = new maplibregl.LngLatBounds();
      let valid = false;
      points.forEach((p) => {
        b.extend(p.geometry.coordinates);
        valid = true;
      });
      if (valid && !b.isEmpty()) {
        mapRef.current.fitBounds(b, { padding: 80, maxZoom: 14, duration: 1500 });
      }
    }
  }, [points, flyToCoords]);

  // --- 3. SEARCH FLY-TO ---
  useEffect(() => {
    if (flyToCoords && mapRef.current) {
      setShowLocationPin(true);
      mapRef.current.flyTo({
        center: [flyToCoords.lng, flyToCoords.lat],
        zoom: 15,
        essential: true,
        duration: 2000
      });
    }
  }, [flyToCoords]);

  // --- 4. HOVER POPUP ---
  useEffect(() => {
    if (hoveredId && points.length > 0) {
      const target = points.find((p) => p.properties.productId === hoveredId);
      if (target) setPopupInfo(target.properties);
    } else {
      setPopupInfo(null);
    }
  }, [hoveredId, points]);

  // --- 5. INITIALIZE DRAW TOOLS ---
  const onMapLoad = useCallback((evt) => {
    const map = evt.target;
    if (!drawRef.current) {
      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true
        },
        defaultMode: 'simple_select',
        styles: DRAW_STYLES 
      });

      // Add to Top Right
      map.addControl(draw, 'top-right');
      drawRef.current = draw;

      const updateArea = (e) => {
        const data = draw.getAll();
        if (data.features.length > 0) {
          if (onSearchArea) onSearchArea({ type: 'polygon', geometry: data.features[0].geometry });
        } else {
          if (onSearchArea) onSearchArea(null);
        }
      };

      map.on('draw.create', updateArea);
      map.on('draw.delete', updateArea);
      map.on('draw.update', updateArea);
    }
  }, [onSearchArea]);

  // --- 6. MAP STYLES ---
  const styles = {
    google: {
      version: 8,
      sources: {
        "google-tiles": {
          type: "raster",
          tiles: ["https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"],
          tileSize: 256, attribution: "Google Maps"
        }
      },
      layers: [{ id: "google-tiles", type: "raster", source: "google-tiles" }]
    },
    satellite: {
      version: 8,
      sources: {
        "google-sat": {
          type: "raster",
          tiles: ["https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"],
          tileSize: 256, attribution: "Google Satellite"
        }
      },
      layers: [{ id: "google-sat", type: "raster", source: "google-sat" }]
    },
    osm: {
      version: 8,
      sources: {
        "osm-tiles": {
          type: "raster",
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256, attribution: "OpenStreetMap"
        }
      },
      layers: [{ id: "osm-tiles", type: "raster", source: "osm-tiles" }]
    }
  };

  return (
    <div className={style.mapWrapper}>
      
      {/* 1. Viewport Search Button */}
      {showSearchBtn && (
        <button
          className={style.searchBtn}
          onClick={() => {
            if (!mapRef.current) return;
            const b = mapRef.current.getMap().getBounds();
            if (onSearchArea) {
              onSearchArea({
                type: 'bounds',
                minLat: b.getSouth(), maxLat: b.getNorth(),
                minLng: b.getWest(), maxLng: b.getEast(),
              });
            }
            setShowSearchBtn(false);
          }}
        >
          <RotateCcw size={16} /> Search this area
        </button>
      )}

      {/* 2. Style Switcher (Top Left) */}
      <div className={style.styleSwitcher}>
        <button className={`${style.styleBtn} ${mapStyle === 'google' ? style.activeStyle : ''}`} onClick={() => setMapStyle("google")} title="Automatic">
          <MapIcon size={20} color={mapStyle === "google" ? BRAND_COLOR : "#666"} />
        </button>
        <div className={style.divider} />
        <button className={`${style.styleBtn} ${mapStyle === 'satellite' ? style.activeStyle : ''}`} onClick={() => setMapStyle("satellite")} title="Satellite">
          <Satellite size={20} color={mapStyle === "satellite" ? BRAND_COLOR : "#666"} />
        </button>
        <div className={style.divider} />
        <button className={`${style.styleBtn} ${mapStyle === 'osm' ? style.activeStyle : ''}`} onClick={() => setMapStyle("osm")} title="OpenStreetMap">
          <Globe size={20} color={mapStyle === "osm" ? BRAND_COLOR : "#666"} />
        </button>
      </div>

      {/* 3. Map Instance */}
      <Map
        {...viewState}
        ref={mapRef}
        onLoad={onMapLoad}
        onMove={(evt) => {
          setViewState(evt.viewState);
          if (!showSearchBtn) setShowSearchBtn(true);
        }}
        mapStyle={styles[mapStyle]}
        style={{ width: "100%", height: "100%" }}
        maxPitch={60}
      >
        <NavigationControl position="bottom-right" visualizePitch={true} showCompass={true} />
        <GeolocateControl position="bottom-right" />
        <FullscreenControl position="bottom-left" />
        <ScaleControl />

        {/* Location Pin */}
        {showLocationPin && flyToCoords && (
          <Marker longitude={flyToCoords.lng} latitude={flyToCoords.lat} anchor="bottom">
            <div className={style.locationPin}>
              <MapPin size={48} fill={BRAND_COLOR} color="#fff" strokeWidth={1.5} style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))", transform: "translateY(-5px)" }} />
              <div className={style.pulseRing} />
            </div>
          </Marker>
        )}

        {/* Clusters */}
        {clusters.map((cluster) => {
          const [lng, lat] = cluster.geometry.coordinates;
          const { cluster: isCluster, point_count } = cluster.properties;

          if (isCluster) {
            return (
              <Marker key={cluster.id} longitude={lng} latitude={lat}>
                <div
                  className={style.clusterMarker}
                  style={{
                    width: `${32 + (point_count / points.length) * 20}px`,
                    height: `${32 + (point_count / points.length) * 20}px`,
                  }}
                  onClick={() => {
                    const expansionZoom = Math.min(supercluster.getClusterExpansionZoom(cluster.id), 20);
                    mapRef.current.flyTo({ center: [lng, lat], zoom: expansionZoom, duration: 500 });
                  }}
                >
                  {point_count}
                </div>
              </Marker>
            );
          }

          // Individual Property
          return (
            <Marker key={cluster.properties.productId} longitude={lng} latitude={lat} anchor="bottom">
              <div
                className={style.priceMarker}
                onClick={() => onMarkerClick(cluster.properties.productId)}
                onMouseEnter={() => setPopupInfo({ ...cluster.properties, longitude: lng, latitude: lat })}
                onMouseLeave={() => setPopupInfo(null)}
                style={{ zIndex: hoveredId === cluster.properties.productId ? 100 : 1 }}
              >
                {viewState.zoom < 11 ? (
                  <div style={{
                    width: "14px", height: "14px", background: BRAND_COLOR, borderRadius: "50%",
                    border: "2px solid white", boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                    transform: hoveredId === cluster.properties.productId ? "scale(1.5)" : "scale(1)"
                  }} />
                ) : (
                  <>
                    <div className={style.priceTag} style={{ backgroundColor: hoveredId === cluster.properties.productId ? "#111" : BRAND_COLOR }}>
                      {getCurrencySymbol(cluster.properties.price_currency)}
                      {formatPrice(cluster.properties.price)}
                    </div>
                    <div className={style.markerArrow} style={{ borderTopColor: hoveredId === cluster.properties.productId ? "#111" : BRAND_COLOR }} />
                  </>
                )}
              </div>
            </Marker>
          );
        })}

        {/* Popups */}
        {popupInfo && (
          <Marker longitude={popupInfo.longitude} latitude={popupInfo.latitude} anchor="bottom" offset={[0, -50]}>
            <div className={style.popupContainer}>
              <div className={style.popupImageWrapper}>
                <img src={popupInfo.photos?.[0]?.url || "/placeholder.png"} className={style.popupImage} alt="" />
                <div className={style.popupBadge}>
                  {popupInfo.listing_type === "rent" ? "Rent" : "Sale"}
                </div>
              </div>
              <div className={style.popupContent}>
                <div className={style.popupPrice}>
                  {getCurrencySymbol(popupInfo.price_currency)}{formatPrice(popupInfo.price)}
                </div>
                <div className={style.popupStats}>
                  <span style={{display:'flex', gap:4}}><Bed size={14}/> {popupInfo.bedrooms}</span>
                  <span style={{display:'flex', gap:4}}><Bath size={14}/> {popupInfo.bathrooms}</span>
                  <span style={{display:'flex', gap:4}}><Square size={14}/> {formatPrice(popupInfo.square_footage)}</span>
                </div>
                <div className={style.popupAddress}>
                  {popupInfo.address}, {popupInfo.city}
                </div>
              </div>
            </div>
          </Marker>
        )}
      </Map>
    </div>
  );
};

export default MapLibreMapViewer;