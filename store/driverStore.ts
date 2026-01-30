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
  commission: number; // Commission owed to platform
  distance: number;
  duration: number;
  rating?: number;
  customerPhone?: string;
  status: "completed" | "cancelled";
}

export interface DriverStats {
  todayEarnings: number;
  todayRides: number;
  hoursOnline: number;
  rating: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  totalDebt: number; // Total commission owed
  totalEarnings: number; // Gross earnings
  netBalance: number; // totalEarnings - totalDebt
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
  todayEarnings: 45000,
  todayRides: 5,
  hoursOnline: 6.5,
  rating: 4.8,
  weeklyEarnings: 515000,
  monthlyEarnings: 2100000,
  totalDebt: 51500,
  totalEarnings: 515000,
  netBalance: 463500,
};

// Mock ride history for demonstration
const mockRideHistory: RideHistory[] = [
  {
    id: "ride-001",
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    customerName: "Jean-Pierre M.",
    pickup: "Avenue de la Liberté, Bujumbura",
    dropoff: "Marché Central, Bujumbura",
    fare: 12000,
    commission: 1200,
    distance: 4.2,
    duration: 15,
    rating: 5,
    customerPhone: "+257 79 123 456",
    status: "completed",
  },
  {
    id: "ride-002",
    date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    customerName: "Marie K.",
    pickup: "Quartier Asiatique, Bujumbura",
    dropoff: "Aéroport International de Bujumbura",
    fare: 25000,
    commission: 2500,
    distance: 12.5,
    duration: 30,
    rating: 5,
    customerPhone: "+257 71 888 999",
    status: "completed",
  },
  {
    id: "ride-003",
    date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    customerName: "David N.",
    pickup: "Rohero, Bujumbura",
    dropoff: "Musée Vivant, Bujumbura",
    fare: 8000,
    commission: 800,
    distance: 3.1,
    duration: 12,
    rating: 4,
    status: "completed",
  },
  {
    id: "ride-004",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    customerName: "Sophie L.",
    pickup: "Kiriri, Bujumbura",
    dropoff: "Centre Ville, Bujumbura",
    fare: 15000,
    commission: 1500,
    distance: 6.8,
    duration: 20,
    rating: 5,
    status: "completed",
  },
  {
    id: "ride-005",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    customerName: "Thomas B.",
    pickup: "Nyakabiga, Bujumbura",
    dropoff: "Quartier Asiatique, Bujumbura",
    fare: 18000,
    commission: 1800,
    distance: 8.2,
    duration: 25,
    status: "completed",
  },
  {
    id: "ride-006",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    customerName: "Alice M.",
    pickup: "Bwiza, Bujumbura",
    dropoff: "Kamenge, Bujumbura",
    fare: 22000,
    commission: 2200,
    distance: 9.5,
    duration: 28,
    rating: 5,
    status: "completed",
  },
  {
    id: "ride-007",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    customerName: "Patrick R.",
    pickup: "Prince Régent, Bujumbura",
    dropoff: "Carama, Bujumbura",
    fare: 10000,
    commission: 1000,
    distance: 4.5,
    duration: 18,
    status: "cancelled",
  },
];

// Mock active ride for testing navigation
const mockActiveRide: ActiveRide = {
  id: "ride-active-001",
  customerId: "customer-001",
  customerName: "Jean-Pierre M.",
  customerRating: 4.9,
  customerPhone: "+257 79 123 456",
  pickupLocation: {
    address: "Avenue de la Liberté, Bujumbura",
    coordinates: { latitude: -3.3761, longitude: 29.3644 },
  },
  dropoffLocation: {
    address: "Aéroport International de Bujumbura",
    coordinates: { latitude: -3.324, longitude: 29.3185 },
  },
  estimatedFare: 25000,
  distance: 8.5,
  duration: 22,
  requestTime: new Date().toISOString(),
  status: "accepted",
};

export const useDriverStore = create<DriverState>((set, get) => ({
  isOnline: false,
  currentLocation: null,
  rideRequest: null,
  activeRide: mockActiveRide, // Set active ride for testing
  rideHistory: mockRideHistory,
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
      // Calculate commission (10% for now - will be from admin settings later)
      const COMMISSION_RATE = 0.1;
      const commission = Math.round(fare * COMMISSION_RATE);

      const completedRide: RideHistory = {
        id: activeRide.id,
        date: new Date().toISOString(),
        customerName: activeRide.customerName,
        pickup: activeRide.pickupLocation.address,
        dropoff: activeRide.dropoffLocation.address,
        fare,
        commission,
        distance: activeRide.distance,
        duration: activeRide.duration,
        rating,
        customerPhone: activeRide.customerPhone,
        status: "completed",
      };

      const newTotalEarnings = stats.totalEarnings + fare;
      const newTotalDebt = stats.totalDebt + commission;
      const newNetBalance = newTotalEarnings - newTotalDebt;

      set({
        activeRide: null,
        rideHistory: [completedRide, ...get().rideHistory],
        stats: {
          ...stats,
          todayEarnings: stats.todayEarnings + fare,
          todayRides: stats.todayRides + 1,
          weeklyEarnings: stats.weeklyEarnings + fare,
          monthlyEarnings: stats.monthlyEarnings + fare,
          totalEarnings: newTotalEarnings,
          totalDebt: newTotalDebt,
          netBalance: newNetBalance,
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
        commission: 0,
        distance: activeRide.distance,
        duration: activeRide.duration,
        customerPhone: activeRide.customerPhone,
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
