import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from "react";
import { StyleSheet, View, Text } from "react-native";
import { WebView } from "react-native-webview";
import { MAPBOX_ACCESS_TOKEN } from "../../constants/Mapbox";

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface DriverMarker {
  id: string | number;
  latitude: number;
  longitude: number;
  rotation?: number;
}

export interface MapboxMapRef {
  animateToRegion: (region: Region, duration?: number) => void;
  fitToCoordinates: (
    coordinates: { latitude: number; longitude: number }[],
    options?: {
      edgePadding?: { top: number; right: number; bottom: number; left: number };
      animated?: boolean;
    }
  ) => void;
}

interface MapboxMapProps {
  initialRegion: Region;
  pickup?: { latitude: number; longitude: number } | null;
  dropoff?: { latitude: number; longitude: number } | null;
  drivers?: DriverMarker[];
  routeCoordinates?: { latitude: number; longitude: number }[];
  displayRoute?: { latitude: number; longitude: number }[];
  userLocation?: { latitude: number; longitude: number } | null;
  onRegionChangeComplete?: (region: Region) => void;
  style?: object;
}

function latitudeDeltaToZoom(latitudeDelta: number): number {
  return Math.round(Math.log2(360 / latitudeDelta));
}

function getMapHTML(token: string, initialRegion: Region): string {
  const center = [initialRegion.longitude, initialRegion.latitude];
  const zoom = latitudeDeltaToZoom(initialRegion.longitudeDelta);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link href="https://api.mapbox.com/mapbox-gl-js/v3.8.0/mapbox-gl.css" rel="stylesheet" />
  <script src="https://api.mapbox.com/mapbox-gl-js/v3.8.0/mapbox-gl.js"></script>
  <style>
    * { margin: 0; padding: 0; }
    body, #map { width: 100%; height: 100%; }
    .marker-pickup { background: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; }
    .marker-dropoff { background: #111; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; }
    .marker-driver { width: 32px; height: 32px; background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"%23111\"><path d=\"M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z\"/></svg>') center/contain no-repeat; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    if (!window.mapboxgl || !"${token}") {
      document.body.innerHTML = "<p style='padding:20px;text-align:center'>Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in .env</p>";
    } else {
      mapboxgl.accessToken = "${token}";
      const map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/streets-v12",
        center: ${JSON.stringify(center)},
        zoom: ${zoom},
      });

      let pickupMarker = null;
      let dropoffMarker = null;
      const driverMarkers = [];
      let routeLayerId = null;
      let displayRouteLayerId = null;
      let userMarker = null;

      map.on("load", () => {
        if (window.__mapboxInitialData) {
          applyData(window.__mapboxInitialData);
        }
      });

      map.on("moveend", () => {
        const c = map.getCenter();
        const bounds = map.getBounds();
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const region = {
          latitude: c.lat,
          longitude: c.lng,
          latitudeDelta: Math.abs(ne.lat - sw.lat),
          longitudeDelta: Math.abs(ne.lng - sw.lng),
        };
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: "regionChangeComplete", region }));
        }
      });

      function applyData(data) {
        if (data.pickup) {
          if (pickupMarker) pickupMarker.remove();
          pickupMarker = new mapboxgl.Marker({ element: createEl("marker-pickup") })
            .setLngLat([data.pickup.longitude, data.pickup.latitude])
            .addTo(map);
        } else if (pickupMarker) {
          pickupMarker.remove();
          pickupMarker = null;
        }

        if (data.dropoff) {
          if (dropoffMarker) dropoffMarker.remove();
          dropoffMarker = new mapboxgl.Marker({ element: createEl("marker-dropoff") })
            .setLngLat([data.dropoff.longitude, data.dropoff.latitude])
            .addTo(map);
        } else if (dropoffMarker) {
          dropoffMarker.remove();
          dropoffMarker = null;
        }

        driverMarkers.forEach((m) => m.remove());
        driverMarkers.length = 0;
        (data.drivers || []).forEach((d) => {
          const m = new mapboxgl.Marker({ element: createEl("marker-driver") })
            .setLngLat([d.longitude, d.latitude])
            .addTo(map);
          driverMarkers.push(m);
        });

        if (data.userLocation) {
          if (userMarker) userMarker.remove();
          userMarker = new mapboxgl.Marker({ color: "#111" })
            .setLngLat([data.userLocation.longitude, data.userLocation.latitude])
            .addTo(map);
        } else if (userMarker) {
          userMarker.remove();
          userMarker = null;
        }

        const routeCoords = data.routeCoordinates || [];
        if (routeLayerId && map.getLayer(routeLayerId)) {
          map.removeLayer(routeLayerId);
          map.removeSource(routeLayerId);
        }
        routeLayerId = null;
        if (routeCoords.length >= 2) {
          routeLayerId = "route-line";
          map.addSource(routeLayerId, {
            type: "geojson",
            data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: routeCoords.map((c) => [c.longitude, c.latitude]) } },
          });
          map.addLayer({
            id: routeLayerId,
            type: "line",
            source: routeLayerId,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#3b82f6", "line-width": 6 },
          });
        }

        const displayCoords = data.displayRoute || [];
        if (displayRouteLayerId && map.getLayer(displayRouteLayerId)) {
          map.removeLayer(displayRouteLayerId);
          map.removeSource(displayRouteLayerId);
        }
        displayRouteLayerId = null;
        if (displayCoords.length >= 2) {
          displayRouteLayerId = "display-route-line";
          map.addSource(displayRouteLayerId, {
            type: "geojson",
            data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: displayCoords.map((c) => [c.longitude, c.latitude]) } },
          });
          map.addLayer({
            id: displayRouteLayerId,
            type: "line",
            source: displayRouteLayerId,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#3b82f6", "line-width": 5, "line-dasharray": [2, 1] },
          });
        }
      }

      function createEl(className) {
        const el = document.createElement("div");
        el.className = className;
        return el;
      }

      window.updateMap = function (data) {
        if (map.loaded()) {
          applyData(data);
        } else {
          window.__mapboxInitialData = data;
        }
      };

      window.animateToRegion = function (region, duration) {
        map.flyTo({
          center: [region.longitude, region.latitude],
          zoom: latitudeDeltaToZoom(region.longitudeDelta),
          duration: duration || 1000,
        });
      };

      window.fitToCoordinates = function (coordinates, options) {
        if (!coordinates || coordinates.length < 2) return;
        const lngs = coordinates.map((c) => c.longitude);
        const lats = coordinates.map((c) => c.latitude);
        const padding = (options && options.edgePadding) || { top: 80, right: 50, bottom: 200, left: 50 };
        map.fitBounds(
          [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
          ],
          { padding, duration: (options && options.animated !== false) ? 800 : 0 }
        );
      };

      function latitudeDeltaToZoom(delta) {
        return Math.round(Math.log2(360 / (delta || 0.04)));
      }
    }
  </script>
</body>
</html>
  `.trim();
}

const MapboxMap = forwardRef<MapboxMapRef, MapboxMapProps>(function MapboxMap(
  {
    initialRegion,
    pickup,
    dropoff,
    drivers = [],
    routeCoordinates = [],
    displayRoute = [],
    userLocation,
    onRegionChangeComplete,
    style,
  },
  ref
) {
  const webViewRef = useRef<WebView>(null);

  const injectUpdate = useCallback(() => {
    const data = {
      pickup: pickup ?? null,
      dropoff: dropoff ?? null,
      drivers,
      routeCoordinates,
      displayRoute,
      userLocation: userLocation ?? null,
    };
    const script = `window.updateMap && window.updateMap(${JSON.stringify(data)}); true;`;
    webViewRef.current?.injectJavaScript(script);
  }, [pickup, dropoff, drivers, routeCoordinates, displayRoute, userLocation]);

  useEffect(() => {
    injectUpdate();
  }, [injectUpdate]);

  useImperativeHandle(
    ref,
    () => ({
      animateToRegion: (region: Region, duration?: number) => {
        webViewRef.current?.injectJavaScript(
          `window.animateToRegion && window.animateToRegion(${JSON.stringify(region)}, ${duration ?? 1000}); true;`
        );
      },
      fitToCoordinates: (
        coordinates: { latitude: number; longitude: number }[],
        options?: {
          edgePadding?: { top: number; right: number; bottom: number; left: number };
          animated?: boolean;
        }
      ) => {
        webViewRef.current?.injectJavaScript(
          `window.fitToCoordinates && window.fitToCoordinates(${JSON.stringify(coordinates)}, ${JSON.stringify(options || {})}); true;`
        );
      },
    }),
    []
  );

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === "regionChangeComplete" && msg.region && onRegionChangeComplete) {
          onRegionChangeComplete(msg.region);
        }
      } catch (_) {}
    },
    [onRegionChangeComplete]
  );

  if (!MAPBOX_ACCESS_TOKEN) {
    return (
      <View style={[styles.map, style]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <View style={{ backgroundColor: "#fef3c7", padding: 16, borderRadius: 8 }}>
            <Text style={{ fontWeight: "600", marginBottom: 4 }}>Mapbox token required</Text>
            <Text style={{ fontSize: 14, color: "#92400e" }}>
              Add EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN to your .env file. Get a free token at
              https://account.mapbox.com/access-tokens/
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <WebView
      ref={webViewRef}
      source={{ html: getMapHTML(MAPBOX_ACCESS_TOKEN, initialRegion) }}
      style={[styles.map, style]}
      onMessage={handleMessage}
      scrollEnabled={false}
      bounces={false}
      javaScriptEnabled
      originWhitelist={["*"]}
    />
  );
});

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});

export default MapboxMap;
