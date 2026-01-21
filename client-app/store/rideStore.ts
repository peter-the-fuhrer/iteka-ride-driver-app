import { create } from "zustand";

export type RideStep =
  | "idle"
  | "searching"
  | "picking_location"
  | "selecting"
  | "confirming"
  | "finding"
  | "en_route"
  | "completing";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationWithAddress extends Coordinates {
  address: string;
}

export interface Driver {
  id: string;
  name: string;
  rating: number;
  carModel: string;
  carPlate: string;
  carColor: string;
  latitude: number;
  longitude: number;
  rotation: number;
  phone: string;
  image: string;
}

interface RideState {
  // Flow state
  step: RideStep;
  setStep: (step: RideStep) => void;

  // Location Selector Mode (when picking on map)
  locationPickerMode: "pickup" | "dropoff" | null;
  setLocationPickerMode: (mode: "pickup" | "dropoff" | null) => void;

  // Driver data
  currentDriver: Driver | null;
  setCurrentDriver: (driver: Driver | null) => void;
  updateDriverLocation: (
    latitude: number,
    longitude: number,
    rotation: number
  ) => void;
  isDriverArrived: boolean;
  setIsDriverArrived: (arrived: boolean) => void;

  // Ride type
  selectedRideType: string | null;
  setSelectedRideType: (type: string | null) => void;

  // Locations
  pickupLocation: LocationWithAddress | null;
  dropoffLocation: LocationWithAddress | null;
  setPickup: (location: LocationWithAddress | null) => void;
  setDropoff: (location: LocationWithAddress | null) => void;

  // Route data
  routeCoordinates: Coordinates[];
  distance: number | null; // meters
  duration: number | null; // seconds
  setRoute: (
    coordinates: Coordinates[],
    distance: number,
    duration: number
  ) => void;
  clearRoute: () => void;

  // Pricing
  estimatedPrice: number | null;
  setEstimatedPrice: (price: number | null) => void;

  // Scheduling
  scheduledTime: Date | null;
  setScheduledTime: (date: Date | null) => void;

  // Chat
  isChatOpen: boolean;
  setChatOpen: (isOpen: boolean) => void;

  // Real-time ETA (for driver arrival or trip)
  estimatedArrivalDuration: number | null; // seconds
  setEstimatedArrivalDuration: (duration: number | null) => void;

  // Saved Places & History
  savedPlaces: SavedPlace[];
  recentSearches: SavedPlace[];
  rideHistory: RideHistoryItem[];
  addSavedPlace: (place: SavedPlace) => void;
  removeSavedPlace: (id: string) => void;
  addRecentSearch: (place: SavedPlace) => void;
  addRideToHistory: (ride: RideHistoryItem) => void;

  // Reset
  reset: () => void;
}

export interface SavedPlace {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  type: "home" | "work" | "other" | "recent";
}

export interface RideHistoryItem {
  id: string;
  date: string;
  pickup: string;
  dropoff: string;
  price: number;
  status: "completed" | "cancelled" | "scheduled";
  rating?: number;
}

export const useRideStore = create<RideState>((set) => ({
  // Flow state
  step: "idle",
  setStep: (step) => set({ step }),

  // Location Selector
  locationPickerMode: null,
  setLocationPickerMode: (mode) => set({ locationPickerMode: mode }),

  // Driver data
  currentDriver: null,
  setCurrentDriver: (driver) => set({ currentDriver: driver }),
  updateDriverLocation: (latitude, longitude, rotation) =>
    set((state) => ({
      currentDriver: state.currentDriver
        ? { ...state.currentDriver, latitude, longitude, rotation }
        : null,
    })),
  isDriverArrived: false,
  setIsDriverArrived: (arrived) => set({ isDriverArrived: arrived }),

  // Ride type
  selectedRideType: null,
  setSelectedRideType: (type) => set({ selectedRideType: type }),

  // Locations
  pickupLocation: null,
  dropoffLocation: null,
  setPickup: (location) => set({ pickupLocation: location }),
  setDropoff: (location) => set({ dropoffLocation: location }),

  // Route data
  routeCoordinates: [],
  distance: null,
  duration: null,
  setRoute: (coordinates, distance, duration) =>
    set({ routeCoordinates: coordinates, distance, duration }),
  clearRoute: () =>
    set({ routeCoordinates: [], distance: null, duration: null }),

  // Pricing
  estimatedPrice: null,
  setEstimatedPrice: (price) => set({ estimatedPrice: price }),

  // Scheduling
  scheduledTime: null,
  setScheduledTime: (date) => set({ scheduledTime: date }),

  // Chat
  isChatOpen: false,
  setChatOpen: (isOpen) => set({ isChatOpen: isOpen }),

  // Real-time ETA
  estimatedArrivalDuration: null,
  setEstimatedArrivalDuration: (duration) =>
    set({ estimatedArrivalDuration: duration }),

  // Saved Places & History
  savedPlaces: [
    {
      id: "home",
      name: "Home",
      address: "Rohero, Av. de la JRR",
      coordinates: { latitude: -3.385, longitude: 29.366 },
      type: "home",
    },
    {
      id: "work",
      name: "Work",
      address: "Bujumbura City Center",
      coordinates: { latitude: -3.375, longitude: 29.36 },
      type: "work",
    },
    {
      id: "school",
      name: "School",
      address: "University of Burundi",
      coordinates: { latitude: -3.382, longitude: 29.38 },
      type: "other",
    },
  ],
  recentSearches: [
    {
      id: "mall-recent",
      name: "Zion Mall",
      address: "Zion Mall, Bujumbura",
      coordinates: { latitude: -3.39, longitude: 29.37 },
      type: "recent",
    },
  ],
  rideHistory: [
    {
      id: "ride-1",
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      pickup: "Home",
      dropoff: "Bujumbura City Center",
      price: 2500,
      status: "completed",
      rating: 5,
    },
    {
      id: "ride-2",
      date: new Date(Date.now() - 86400000 * 5).toISOString(),
      pickup: "University of Burundi",
      dropoff: "Home",
      price: 3500,
      status: "completed",
      rating: 4,
    },
  ],
  addSavedPlace: (place) =>
    set((state) => ({ savedPlaces: [...state.savedPlaces, place] })),
  removeSavedPlace: (id) =>
    set((state) => ({
      savedPlaces: state.savedPlaces.filter((p) => p.id !== id),
    })),
  addRecentSearch: (place) =>
    set((state) => {
      const exists = state.recentSearches.find(
        (p) => p.address === place.address
      );
      if (exists) return state;
      return { recentSearches: [place, ...state.recentSearches].slice(0, 5) };
    }),
  addRideToHistory: (ride) =>
    set((state) => ({ rideHistory: [ride, ...state.rideHistory] })),

  // Reset
  reset: () =>
    set({
      step: "idle",
      locationPickerMode: null,
      currentDriver: null,
      isDriverArrived: false,
      selectedRideType: null,
      pickupLocation: null,
      dropoffLocation: null,
      routeCoordinates: [],
      distance: null,
      duration: null,
      estimatedPrice: null,
      scheduledTime: null,
      isChatOpen: false,
      estimatedArrivalDuration: null,
    }),
}));
