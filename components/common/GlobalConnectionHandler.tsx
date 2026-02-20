import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAlertStore } from "../../store/alertStore";
import { useDriverStore } from "../../store/driverStore";
import { getSocket, subscribeToEvent, unsubscribeFromEvent } from "../../services/socket";
import { updateRideState } from "../../services/driver";

export default function GlobalConnectionHandler() {
    const { t } = useTranslation();
    const { activeRide, setActiveRide, setOnlineStatus } = useDriverStore();
    const disconnectTimerRef = useRef<any>(null);
    const isAlertShownRef = useRef(false);

    useEffect(() => {
        const socket = getSocket();

        const handleDisconnect = (reason: string) => {
            console.log("GlobalConnectionHandler: Socket disconnected", reason);

            // If we have an active ride, we need to monitor this closely
            if (activeRide && !disconnectTimerRef.current) {
                // Start a timer. If not reconnected in 60 seconds, warn/cancel
                disconnectTimerRef.current = setTimeout(() => {
                    if (!isAlertShownRef.current) {
                        isAlertShownRef.current = true;
                        useAlertStore.getState().showAlert({
                            title: t("connection_lost") || "Connection Lost",
                            message: t("connection_lost_ride_msg") || "Connection lost. If not restored soon, your ride may be cancelled.",
                            type: "warning",
                            buttons: [
                                {
                                    text: t("ok"),
                                    onPress: () => {
                                        isAlertShownRef.current = false;
                                    }
                                }
                            ]
                        });
                    }
                }, 30000); // 30 seconds
            }
        };

        const handleConnect = () => {
            console.log("GlobalConnectionHandler: Socket connected");
            if (disconnectTimerRef.current) {
                clearTimeout(disconnectTimerRef.current);
                disconnectTimerRef.current = null;
            }
        };

        if (socket) {
            socket.on("disconnect", handleDisconnect);
            socket.on("connect", handleConnect);
        }

        // Also listen for server-initiated cancellations due to connection
        const handleRideCancelled = (data: { tripId: string, reason?: string }) => {
            if (activeRide && activeRide.id === data.tripId && data.reason?.includes("Connection")) {
                useAlertStore.getState().showAlert({
                    title: t("ride_cancelled") || "Ride Cancelled",
                    message: t("ride_cancelled_connection_msg") || "Your ride was cancelled due to a prolonged connection loss.",
                    type: "error",
                });
                setActiveRide(null);
                setOnlineStatus(true);
            }
        };

        subscribeToEvent("ride_cancelled", handleRideCancelled);

        return () => {
            if (socket) {
                socket.off("disconnect", handleDisconnect);
                socket.off("connect", handleConnect);
            }
            unsubscribeFromEvent("ride_cancelled", handleRideCancelled);
            if (disconnectTimerRef.current) {
                clearTimeout(disconnectTimerRef.current);
            }
        };
    }, [activeRide?.id]);

    return null;
}
