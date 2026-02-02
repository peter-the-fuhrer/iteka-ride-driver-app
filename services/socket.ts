import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SOCKET_URL } from "./api";

let socket: Socket | null = null;

// Event handlers that can be set from outside
type EventHandler = (data: any) => void;
const eventHandlers: Map<string, Set<EventHandler>> = new Map();

// Initialize socket connection
export const initSocket = async (): Promise<Socket | null> => {
  try {
    const token = await AsyncStorage.getItem("driverAuthToken");

    if (!token) {
      console.log("No auth token, cannot connect to socket");
      return null;
    }

    // Close existing connection if any
    if (socket?.connected) {
      socket.disconnect();
    }

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Socket events
    socket.on("connect", () => {
      console.log("Driver socket connected:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("Driver socket disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      console.error("Driver socket connection error:", error.message);
    });

    // Listen for new ride requests
    socket.on("new_ride_request", (data) => {
      console.log("New ride request received:", data);
      const handlers = eventHandlers.get("new_ride_request");
      handlers?.forEach((handler) => handler(data));
    });

    // Listen for ride cancellation (by client)
    socket.on("ride_cancelled", (data) => {
      console.log("Ride cancelled by client:", data);
      const handlers = eventHandlers.get("ride_cancelled");
      handlers?.forEach((handler) => handler(data));
    });

    return socket;
  } catch (error) {
    console.error("Error initializing driver socket:", error);
    return null;
  }
};

// Get current socket instance
export const getSocket = (): Socket | null => socket;

// Join driver room to receive ride requests (backend accepts string or { driverId })
export const joinDriverRoom = (driverId: string) => {
  if (socket?.connected) {
    socket.emit("join_driver", driverId);
    console.log("Joined driver room:", driverId);
  } else {
    console.warn("Socket not connected, cannot join driver room");
  }
};

// Update driver location (sent to backend, then forwarded to rider's ride room)
export const updateLocation = (driverId: string, lat: number, lng: number) => {
  if (socket?.connected) {
    socket.emit("update_location", { driverId, lat, lng });
  }
};

// Join a specific ride room to send/receive updates for that ride
export const joinRideRoom = (tripId: string) => {
  if (socket?.connected) {
    socket.emit("join_ride_room", { tripId });
    console.log("Joined ride room:", tripId);
  }
};

// Leave a ride room
export const leaveRideRoom = (tripId: string) => {
  if (socket?.connected) {
    socket.emit("leave_ride_room", { tripId });
    console.log("Left ride room:", tripId);
  }
};

// Subscribe to an event
export const subscribeToEvent = (event: string, handler: EventHandler) => {
  if (!eventHandlers.has(event)) {
    eventHandlers.set(event, new Set());
  }
  eventHandlers.get(event)?.add(handler);
};

// Unsubscribe from an event
export const unsubscribeFromEvent = (event: string, handler: EventHandler) => {
  eventHandlers.get(event)?.delete(handler);
};

// Clear all handlers for an event
export const clearEventHandlers = (event: string) => {
  eventHandlers.delete(event);
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    eventHandlers.clear();
    console.log("Driver socket disconnected and cleared");
  }
};

// Check if socket is connected
export const isSocketConnected = (): boolean => {
  return socket?.connected ?? false;
};

// Reconnect socket
export const reconnectSocket = async () => {
  if (socket?.connected) {
    return socket;
  }
  return initSocket();
};
