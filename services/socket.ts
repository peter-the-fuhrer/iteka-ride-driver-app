import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SOCKET_URL } from "./api";

let socket: Socket | null = null;

// Event handlers that can be set from outside
type EventHandler = (data: any) => void;
const eventHandlers: Map<string, Set<EventHandler>> = new Map();

// Track rooms to rejoin on reconnect
let _driverIdForRoom: string | null = null;
let _rideRoomId: string | null = null;

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
      reconnectionAttempts: Infinity, // Never stop trying
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // --- Socket lifecycle ---
    socket.on("connect", () => {
      console.log("✅ Driver socket connected:", socket?.id);

      // Auto-rejoin rooms on reconnect
      if (_driverIdForRoom && socket?.connected) {
        socket.emit("join_driver", _driverIdForRoom);
        console.log("🔄 Auto-rejoined driver room:", _driverIdForRoom);
      }
      if (_rideRoomId && socket?.connected) {
        socket.emit("join_ride_room", { tripId: _rideRoomId });
        console.log("🔄 Auto-rejoined ride room:", _rideRoomId);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("⚠️ Driver socket disconnected:", reason);
    });

    socket.on("reconnect", (attemptNumber: number) => {
      console.log("🔄 Socket reconnected after", attemptNumber, "attempts");
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Driver socket connection error:", error.message);
    });

    // --- Forwarding all events to registered handlers ---

    socket.on("new_ride_request", (data) => {
      console.log("🚗 New ride request received via socket");
      const handlers = eventHandlers.get("new_ride_request");
      handlers?.forEach((handler) => handler(data));
    });

    socket.on("ride_cancelled", (data) => {
      console.log("🚫 Ride cancelled event received:", JSON.stringify(data));
      const handlers = eventHandlers.get("ride_cancelled");
      handlers?.forEach((handler) => handler(data));
    });

    socket.on("ride_status_update", (data) => {
      console.log("📡 Ride status update received:", data?.status);
      const handlers = eventHandlers.get("ride_status_update");
      handlers?.forEach((handler) => handler(data));
    });

    socket.on("driver_location_update", (data) => {
      const handlers = eventHandlers.get("driver_location_update");
      handlers?.forEach((handler) => handler(data));
    });

    socket.on("nearby_driver_location_update", (data) => {
      const handlers = eventHandlers.get("nearby_driver_location_update");
      handlers?.forEach((handler) => handler(data));
    });

    socket.on("new_message", (data) => {
      console.log("💬 New message received via socket");
      const handlers = eventHandlers.get("new_message");
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

// Join driver room to receive ride requests
export const joinDriverRoom = (driverId: string) => {
  _driverIdForRoom = driverId; // Remember for auto-rejoin
  if (socket?.connected) {
    socket.emit("join_driver", driverId);
    console.log("✅ Joined driver room:", driverId);
  } else {
    console.warn("⚠️ Socket not connected, will join driver room on reconnect");
  }
};

// Update driver location
export const updateLocation = (driverId: string, lat: number, lng: number) => {
  if (socket?.connected) {
    socket.emit("update_location", { driverId, lat, lng });
  }
};

// Join a specific ride room
export const joinRideRoom = (tripId: string) => {
  _rideRoomId = tripId; // Remember for auto-rejoin
  if (socket?.connected) {
    socket.emit("join_ride_room", { tripId });
    console.log("✅ Joined ride room:", tripId);
  } else {
    console.warn("⚠️ Socket not connected, will join ride room on reconnect");
  }
};

// Leave a ride room
export const leaveRideRoom = (tripId: string) => {
  if (_rideRoomId === tripId) {
    _rideRoomId = null; // Stop auto-rejoin
  }
  if (socket?.connected) {
    socket.emit("leave_ride_room", { tripId });
    console.log("Left ride room:", tripId);
  }
};

// Send a chat message via socket
export const sendMessage = (
  tripId: string,
  sender: "driver" | "user",
  text: string,
) => {
  if (socket?.connected) {
    socket.emit("send_message", { tripId, sender, text });
  } else {
    console.warn("Socket not connected, cannot send message");
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
    _driverIdForRoom = null;
    _rideRoomId = null;
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
