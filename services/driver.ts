import api, { getApiErrorMessage } from "./api";

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
}

export interface Trip {
  _id: string;
  client_id: TripClient | string;
  driver_id?: string;
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
  status: "request" | "driver_assigned" | "driver_arrived" | "ongoing" | "completed" | "cancelled";
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
export const updateRideState = async (tripId: string, status: string): Promise<Trip> => {
  try {
    const response = await api.put<Trip>(`/driver-app/ride/${tripId}/state`, { status });
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
export const getRideHistory = async (): Promise<Trip[]> => {
  try {
    const response = await api.get<Trip[]>("/driver-app/rides");
    return response.data;
  } catch (error: any) {
    throw new Error(getApiErrorMessage(error));
  }
};

// Get driver earnings
export const getEarnings = async (): Promise<any> => {
  try {
    const response = await api.get("/driver-app/earnings");
    return response.data;
  } catch (error: any) {
    throw new Error(getApiErrorMessage(error));
  }
};
