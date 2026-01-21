import { Coordinates } from "./location";

const PHOTON_BASE_URL = "https://photon.komoot.io/api";
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

export interface AddressSuggestion {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
}

export interface ReverseGeocodeResult {
  address: string;
  city?: string;
  country?: string;
}

/**
 * Search for addresses using Photon API (FREE, no API key)
 * https://photon.komoot.io/
 */
export async function searchAddress(
  query: string,
  limit: number = 5,
  countryCode?: string
): Promise<AddressSuggestion[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query.trim(),
      limit: limit.toString(),
    });

    // Optionally bias towards a specific country
    if (countryCode) {
      params.append("lang", countryCode);
    }

    const response = await fetch(`${PHOTON_BASE_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Photon API error: ${response.status}`);
    }

    const data = await response.json();

    return data.features.map((feature: any, index: number) => {
      const props = feature.properties;
      const coords = feature.geometry.coordinates;

      // Build a readable address string
      const addressParts = [
        props.name,
        props.street,
        props.city || props.locality,
        props.state,
        props.country,
      ].filter(Boolean);

      return {
        id: `${index}-${coords[0]}-${coords[1]}`,
        name: props.name || props.street || "Unknown",
        address: addressParts.join(", "),
        coordinates: {
          latitude: coords[1], // GeoJSON is [lng, lat]
          longitude: coords[0],
        },
      };
    });
  } catch (error) {
    console.error("Error searching address:", error);
    return [];
  }
}

/**
 * Reverse geocode coordinates to address using Nominatim (FREE)
 * https://nominatim.openstreetmap.org/
 * ⚠️ Rate limited: 1 request per second
 */
export async function reverseGeocode(
  coordinates: Coordinates
): Promise<ReverseGeocodeResult | null> {
  try {
    const params = new URLSearchParams({
      lat: coordinates.latitude.toString(),
      lon: coordinates.longitude.toString(),
      format: "json",
      addressdetails: "1",
    });

    const response = await fetch(
      `${NOMINATIM_BASE_URL}/reverse?${params.toString()}`,
      {
        headers: {
          // Required by Nominatim usage policy
          "User-Agent": "ItekaRideApp/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      return null;
    }

    const addr = data.address || {};

    return {
      address: data.display_name || "Unknown location",
      city: addr.city || addr.town || addr.village || addr.municipality,
      country: addr.country,
    };
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    return null;
  }
}

/**
 * Debounce helper for search input
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}
