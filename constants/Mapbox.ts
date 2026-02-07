/**
 * Mapbox access token for map tiles and GL JS.
 * Get a free token at https://account.mapbox.com/access-tokens/
 * For Expo: you can use EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in .env or set here.
 */
// Try to get from environment variable
const envToken =
  typeof process !== "undefined" && process.env?.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN
    ? process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN
    : "";

// Fallback: If env var not loaded, use hardcoded token from .env file
// TODO: Remove this fallback once env var loading is confirmed working
const FALLBACK_TOKEN = "pk.eyJ1IjoidGVydGNvZGVyIiwiYSI6ImNtaGFsb2huOTFmejQybHM3anhhZWpuNG4ifQ.K42sPr0YYWka8sp9joY51g";

export const MAPBOX_ACCESS_TOKEN = envToken || FALLBACK_TOKEN;

// Debug log to verify token is loaded
if (__DEV__) {
  console.log("🗺️ Mapbox token from env:", !!envToken);
  console.log("🗺️ Mapbox token (final):", MAPBOX_ACCESS_TOKEN ? "Present" : "Missing");
  if (MAPBOX_ACCESS_TOKEN) {
    console.log("🗺️ Mapbox token length:", MAPBOX_ACCESS_TOKEN.length);
    console.log("🗺️ Using fallback:", !envToken);
  }
}
