"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

type Props = {
  userId: number;
  onSocketReady?: (socket: Socket) => void; // Thêm prop callback để expose socket
};

export default function OnlineStatus({ userId, onSocketReady }: Props) {
  const socketRef = useRef<Socket | null>(null);
  const keepAliveIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!userId) return;

    const socket = io(process.env.NEXT_PUBLIC_BACKEND_API_URL!, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      socket.emit("user_online", userId);
      onSocketReady?.(socket); // Gọi callback khi connect thành công
    });

    socket.on("user_status", (data: { userId: number; status: "online" | "offline" }) => {
      console.log("user_status received:", data);
      // Dispatch event nếu cần update UI global
      window.dispatchEvent(new CustomEvent('user_status', { detail: data }));
    });

    const intervalMs = 60_000;
    keepAliveIntervalRef.current = window.setInterval(() => {
      if (socket && socket.connected) {
        socket.emit("keep_alive", { userId });
      }
    }, intervalMs);

    return () => {
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId, onSocketReady]);

  return null;
}