import { Coordinates } from "./location";

// OpenRouteService - Free tier: 2,000 requests/day
// Sign up at https://openrouteservice.org/dev/#/signup for a free API key
const ORS_BASE_URL = "https://api.openrouteservice.org/v2";
const ORS_API_KEY =
  "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImRjMzVkNTgzMmJjMTRlZmM5ZGNjYTBkMDhhMmUwZjNiIiwiaCI6Im11cm11cjY0In0="; // Applied user key

export interface RouteInfo {
  coordinates: Coordinates[];
  distance: number; // meters
  duration: number; // seconds
  summary: string;
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
}

/**
 * Get driving route between two points using OpenRouteService
 * Free tier: 2,000 requests/day
 */
export async function getRoute(
  origin: Coordinates,
  destination: Coordinates
): Promise<RouteInfo | null> {
  try {
    const response = await fetch(
      `${ORS_BASE_URL}/directions/driving-car?start=${origin.longitude},${origin.latitude}&end=${destination.longitude},${destination.latitude}`,
      {
        headers: {
          Authorization: ORS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      // Fallback to OSRM if ORS fails
      return await getRouteOSRM(origin, destination);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      return null;
    }

    const route = data.features[0];
    const geometry = route.geometry;
    const properties = route.properties;
    const summary = properties.summary;

    // Convert GeoJSON coordinates [lng, lat] to our format
    const coordinates: Coordinates[] = geometry.coordinates.map(
      (coord: number[]) => ({
        latitude: coord[1],
        longitude: coord[0],
      })
    );

    // CRITICAL: Set the actual destination to exactly the last point on the road
    if (coordinates.length > 0) {
      const snappedDestination = coordinates[coordinates.length - 1];
      destination.latitude = snappedDestination.latitude;
      destination.longitude = snappedDestination.longitude;
    }

    return {
      coordinates,
      distance: summary.distance, // meters
      duration: summary.duration, // seconds
      summary: `${formatDistance(summary.distance)} • ${formatDuration(
        summary.duration
      )}`,
    };
  } catch (error) {
    console.error("Error getting route from ORS:", error);
    // Try OSRM as backup
    return await getRouteOSRM(origin, destination);
  }
}

/**
 * Backup routing using OSRM public server (FREE, no API key)
 * ⚠️ No SLA, use for development/fallback only
 */
async function getRouteOSRM(
  origin: Coordinates,
  destination: Coordinates
): Promise<RouteInfo | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`OSRM error: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      return null;
    }

    const route = data.routes[0];
    const geometry = route.geometry;

    const coordinates: Coordinates[] = geometry.coordinates.map(
      (coord: number[]) => ({
        latitude: coord[1],
        longitude: coord[0],
      })
    );

    // CRITICAL: Set the actual destination to exactly the last point on the road
    if (coordinates.length > 0) {
      const snappedDestination = coordinates[coordinates.length - 1];
      destination.latitude = snappedDestination.latitude;
      destination.longitude = snappedDestination.longitude;
    }

    return {
      coordinates,
      distance: route.distance, // meters
      duration: route.duration, // seconds
      summary: `${formatDistance(route.distance)} • ${formatDuration(
        route.duration
      )}`,
    };
  } catch (error) {
    console.error("Error getting route from OSRM:", error);
    return null;
  }
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} sec`;
  }
  if (seconds < 3600) {
    return `${Math.round(seconds / 60)} min`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

/**
 * Calculate fare based on distance (DRIVING distance)
 * Pricing: Base fare + per km rate
 * Per previous user request: Price configuration is "per KM only"
 */
export function calculateFare(
  distance: number, // meters
  duration: number, // seconds (unused now, kept for signature compatibility)
  rideType: string = "standard"
): number {
  const pricing = {
    standard: { base: 1000, perKm: 500 },
    comfort: { base: 1500, perKm: 700 },
    premium: { base: 2500, perKm: 1000 },
    delivery: { base: 1000, perKm: 500 }, // Same as standard for now
  };

  const rates = pricing[rideType as keyof typeof pricing] || pricing.standard;

  // distance is in meters, convert to km
  const distanceKm = Math.max(0, distance / 1000);

  const fare = rates.base + distanceKm * rates.perKm;

  // Round to nearest 100 FBU
  const roundedFare = Math.round(fare / 100) * 100;

  return isNaN(roundedFare) ? 0 : roundedFare;
}

/**
 * Calculate bearing between two points
 */
export function getBearing(start: Coordinates, end: Coordinates): number {
  const startLat = (start.latitude * Math.PI) / 180;
  const startLng = (start.longitude * Math.PI) / 180;
  const endLat = (end.latitude * Math.PI) / 180;
  const endLng = (end.longitude * Math.PI) / 180;

  const dLng = endLng - startLng;
  const y = Math.sin(dLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);
  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Calculate distance between two points in meters (Haversine formula)
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371e3; // Earth radius in meters
  const lat1 = (coord1.latitude * Math.PI) / 180;
  const lat2 = (coord2.latitude * Math.PI) / 180;
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
