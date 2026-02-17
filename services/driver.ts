import api, { getApiErrorMessage } from "./api";
import type {
  RideRequest,
  ActiveRide,
  RideHistory,
} from "../store/driverStore";

export interface StatusUpdateData {
  is_online: boolean;
  lat?: number;
  lng?: number;
}

export interface TripClient {
  _id: string;
  name: string;
  phone: string;
  rating?: number;
  profile_picture?: string;
}

export interface Trip {
  _id: string;
  client_id: TripClient | string;
  driver_id?: string;
  ride_type_id?:
    | string
    | { _id: string; name: string; is_ride: boolean; is_delivery: boolean };
  trip_type?: "ride" | "delivery";
  pickup: {
    address: string;
    lat: number;
    lng: number;
  };
  destination: {
    address: string;
    lat: number;
    lng: number;
  };
  distance: number;
  price: number;
  status:
    | "request"
    | "driver_assigned"
    | "driver_arrived"
    | "ongoing"
    | "completed"
    | "cancelled";
  date_time: string;
  payment_method?: string;
  createdAt: string;
  updatedAt: string;
}

// Update driver status (online/offline) and location
export const updateStatus = async (data: StatusUpdateData): Promise<void> => {
  try {
    await api.put("/driver-app/status", data);
  } catch (error: any) {
    throw new Error(getApiErrorMessage(error));
  }
};

// Accept a ride request
export const acceptRide = async (tripId: string): Promise<Trip> => {
  try {
    const response = await api.put<Trip>(`/driver-app/ride/${tripId}/accept`);
    return response.data;
  } catch (error: any) {
    throw new Error(getApiErrorMessage(error));
  }
};

// Update ride state (driver_arrived, ongoing, completed)
export const updateRideState = async (
  tripId: string,
  status: string,
): Promise<Trip> => {
  try {
    const response = await api.put<Trip>(`/driver-app/ride/${tripId}/state`, {
      status,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(getApiErrorMessage(error));
  }
};

// Get driver's active ride (if any)
export const getActiveRide = async (): Promise<Trip | null> => {
  try {
    const response = await api.get<Trip>("/driver-app/active-ride");
    return response.data;
  } catch (error: any) {
    // If 404, no active ride
    if (error.response?.status === 404) {
      return null;
    }
    throw new Error(getApiErrorMessage(error));
  }
};

// Get driver's ride history
export const getRideHistory = async (params?: {
  page?: number;
  limit?: number;
}): Promise<{ rides: Trip[]; total: number; page: number; limit: number }> => {
  try {
    const response = await api.get<{
      rides: Trip[];
      total: number;
      page: number;
      limit: number;
    }>("/driver-app/rides", { params });
    return response.data;
  } catch (error: any) {
    throw new Error(getApiErrorMessage(error));
  }
};

// Get driver earnings
export const getEarnings = async (): Promise<{
  todayEarnings: number;
  todayRides: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  totalEarnings: number;
  totalDebt: number;
  netBalance: number;
  hoursOnline: number;
  weeklyData: { day: string; amount: number }[];
}> => {
  try {
    const response = await api.get("/driver-app/earnings");
    return response.data;
  } catch (error: any) {
    throw new Error(getApiErrorMessage(error));
  }
};

// Get global settings (support info, etc.)
export const getSettings = async (): Promise<{
  support_email: string;
  support_phone: string;
}> => {
  try {
    const response = await api.get("/settings");
    return response.data;
  } catch (error: any) {
    throw new Error(getApiErrorMessage(error));
  }
};

// Get chat messages for a trip
export const getChatMessages = async (tripId: string): Promise<any[]> => {
  try {
    const response = await api.get(`/chat/${tripId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(getApiErrorMessage(error));
  }
};

export function mapTripToRideRequest(trip: Trip): RideRequest {
  const clientData = typeof trip.client_id === "object" ? trip.client_id : null;
  return {
    id: trip._id,
    customerId:
      clientData?._id ??
      (typeof trip.client_id === "string" ? trip.client_id : ""),
    customerName: clientData?.name ?? "Customer",
    customerRating: clientData?.rating ?? 4.5,
    customerPhone: clientData?.phone ?? "",
    customerImage: clientData?.profile_picture,
    pickupLocation: {
      address: trip.pickup.address,
      coordinates: { latitude: trip.pickup.lat, longitude: trip.pickup.lng },
    },
    dropoffLocation: {
      address: trip.destination.address,
      coordinates: {
        latitude: trip.destination.lat,
        longitude: trip.destination.lng,
      },
    },
    estimatedFare: trip.price,
    distance: (trip.distance || 0) / 1000,
    duration: Math.round((trip.distance || 0) / 500),
    requestTime: trip.createdAt ?? trip.date_time,
  };
}

const statusMap = {
  driver_assigned: "accepted" as const,
  driver_arrived: "arrived" as const,
  ongoing: "started" as const,
  completed: "completed" as const,
};

export function mapTripToActiveRide(trip: Trip): ActiveRide {
  const base = mapTripToRideRequest(trip);
  const status = statusMap[trip.status as keyof typeof statusMap] ?? "accepted";
  return { ...base, status };
}

export function mapTripToRideHistory(trip: Trip): RideHistory {
  const clientData = typeof trip.client_id === "object" ? trip.client_id : null;
  return {
    id: trip._id,
    date: trip.createdAt ?? trip.date_time,
    customerName: clientData?.name ?? "Customer",
    customerPhone: clientData?.phone ?? "",
    customerImage: clientData?.profile_picture,
    pickup: trip.pickup?.address ?? "",
    dropoff: trip.destination?.address ?? "",
    fare: trip.price ?? 0,
    commission: 0,
    distance: (trip.distance ?? 0) / 1000,
    duration: Math.round((trip.distance ?? 0) / 500),
    status: trip.status === "cancelled" ? "cancelled" : "completed",
  };
}
