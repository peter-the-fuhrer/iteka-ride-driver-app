/**
 * Mapbox access token for map tiles and GL JS.
 * Get a free token at https://account.mapbox.com/access-tokens/
 * For Expo: you can use EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in .env or set here.
 */
export const MAPBOX_ACCESS_TOKEN =
  typeof process !== "undefined" && process.env?.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN
    ? process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN
    : "";
