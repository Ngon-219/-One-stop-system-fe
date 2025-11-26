'use client'

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

interface UseSocketOptions {
    onEvent?: (data: any) => void;
    onConnect?: () => void;
    onDisconnect?: (reason: string) => void;
    onError?: (error: Error) => void;
}

export const useSocket = (options: UseSocketOptions = {}) => {
    const { onEvent, onConnect, onDisconnect, onError } = options;
    const socketRef = useRef<Socket | null>(null);
    const callbacksRef = useRef(options);
    const { user, isAuthenticated } = useAuth();

    // Lưu callbacks vào ref để tránh re-connect khi callbacks thay đổi
    useEffect(() => {
        callbacksRef.current = options;
    }, [options]);

    useEffect(() => {
        if (!isAuthenticated || !user) {
            return;
        }

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3003";
        console.log("Connecting to socket server:", socketUrl);

        const socket = io(socketUrl, {
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);
            const roomId = `user:${user.user_id}`;
            
            socket.emit("join-room", {
                room: roomId
            });
            
            console.log("Joined room:", roomId);
            
            if (callbacksRef.current.onConnect) {
                callbacksRef.current.onConnect();
            }
        });

        socket.on("disconnect", (reason) => {
            console.log("Socket disconnected:", reason);
            if (callbacksRef.current.onDisconnect) {
                callbacksRef.current.onDisconnect(reason);
            }
        });

        socket.on("connect_error", (error) => {
            console.error("Socket connection error:", error);
            if (callbacksRef.current.onError) {
                callbacksRef.current.onError(error);
            }
        });

        socket.on("event", (data: any) => {
            console.log("Received event:", data);
            if (callbacksRef.current.onEvent) {
                callbacksRef.current.onEvent(data);
            }
        });

        return () => {
            socket.off("connect");
            socket.off("disconnect");
            socket.off("connect_error");
            socket.off("event");
            socket.disconnect();
            socketRef.current = null;
        };
    }, [isAuthenticated, user?.user_id]);

    return socketRef.current;
};

