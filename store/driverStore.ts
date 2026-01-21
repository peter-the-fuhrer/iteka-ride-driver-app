import { create } from "zustand";

export interface RideRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerRating: number;
  customerPhone: string;
  pickupLocation: {
    address: string;
    coordinates: { latitude: number; longitude: number };
  };
  dropoffLocation: {
    address: string;
    coordinates: { latitude: number; longitude: number };
  };
  estimatedFare: number;
  distance: number; // in km
  duration: number; // in minutes
  requestTime: string;
}

export interface ActiveRide extends RideRequest {
  status: "accepted" | "arrived" | "started" | "completed";
  startTime?: string;
  endTime?: string;
  actualFare?: number;
}

export interface RideHistory {
  id: string;
  date: string;
  customerName: string;
  pickup: string;
  dropoff: string;
  fare: number;
  distance: number;
  duration: number;
  rating?: number;
  status: "completed" | "cancelled";
}

export interface DriverStats {
  todayEarnings: number;
  todayRides: number;
  hoursOnline: number;
  rating: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
}

interface DriverState {
  isOnline: boolean;
  currentLocation: { latitude: number; longitude: number } | null;
  rideRequest: RideRequest | null;
  activeRide: ActiveRide | null;
  rideHistory: RideHistory[];
  stats: DriverStats;

  // Actions
  setOnlineStatus: (status: boolean) => void;
  setCurrentLocation: (location: {
    latitude: number;
    longitude: number;
  }) => void;
  setRideRequest: (request: RideRequest | null) => void;
  acceptRide: () => void;
  declineRide: () => void;
  updateRideStatus: (status: ActiveRide["status"]) => void;
  completeRide: (fare: number, rating?: number) => void;
  cancelRide: () => void;
  addToHistory: (ride: RideHistory) => void;
  updateStats: (stats: Partial<DriverStats>) => void;
  reset: () => void;
}

const initialStats: DriverStats = {
  todayEarnings: 0,
  todayRides: 0,
  hoursOnline: 0,
  rating: 5.0,
  weeklyEarnings: 0,
  monthlyEarnings: 0,
};

export const useDriverStore = create<DriverState>((set, get) => ({
  isOnline: false,
  currentLocation: null,
  rideRequest: null,
  activeRide: null,
  rideHistory: [],
  stats: initialStats,

  setOnlineStatus: (status) => set({ isOnline: status }),

  setCurrentLocation: (location) => set({ currentLocation: location }),

  setRideRequest: (request) => set({ rideRequest: request }),

  acceptRide: () => {
    const { rideRequest } = get();
    if (rideRequest) {
      set({
        activeRide: {
          ...rideRequest,
          status: "accepted",
        },
        rideRequest: null,
      });
    }
  },

  declineRide: () => set({ rideRequest: null }),

  updateRideStatus: (status) => {
    const { activeRide } = get();
    if (activeRide) {
      const updates: Partial<ActiveRide> = { status };
      if (status === "started") {
        updates.startTime = new Date().toISOString();
      }
      set({ activeRide: { ...activeRide, ...updates } });
    }
  },

  completeRide: (fare, rating) => {
    const { activeRide, stats } = get();
    if (activeRide) {
      const completedRide: RideHistory = {
        id: activeRide.id,
        date: new Date().toISOString(),
        customerName: activeRide.customerName,
        pickup: activeRide.pickupLocation.address,
        dropoff: activeRide.dropoffLocation.address,
        fare,
        distance: activeRide.distance,
        duration: activeRide.duration,
        rating,
        status: "completed",
      };

      set({
        activeRide: null,
        rideHistory: [completedRide, ...get().rideHistory],
        stats: {
          ...stats,
          todayEarnings: stats.todayEarnings + fare,
          todayRides: stats.todayRides + 1,
          weeklyEarnings: stats.weeklyEarnings + fare,
          monthlyEarnings: stats.monthlyEarnings + fare,
        },
      });
    }
  },

  cancelRide: () => {
    const { activeRide } = get();
    if (activeRide) {
      const cancelledRide: RideHistory = {
        id: activeRide.id,
        date: new Date().toISOString(),
        customerName: activeRide.customerName,
        pickup: activeRide.pickupLocation.address,
        dropoff: activeRide.dropoffLocation.address,
        fare: 0,
        distance: activeRide.distance,
        duration: activeRide.duration,
        status: "cancelled",
      };

      set({
        activeRide: null,
        rideHistory: [cancelledRide, ...get().rideHistory],
      });
    }
  },

  addToHistory: (ride) => set({ rideHistory: [ride, ...get().rideHistory] }),

  updateStats: (newStats) => set({ stats: { ...get().stats, ...newStats } }),

  reset: () =>
    set({
      isOnline: false,
      rideRequest: null,
      activeRide: null,
      rideHistory: [],
      stats: initialStats,
    }),
}));
