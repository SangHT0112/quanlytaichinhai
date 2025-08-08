"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

type Props = {
  userId: number;
};

export default function OnlineStatus({ userId }: Props) {
  const socketRef = useRef<Socket | null>(null);
  const keepAliveIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!userId) return;

    // khởi tạo socket
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_API_URL!, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      socket.emit("user_online", userId);
    });

    // Nếu server broadcast status của người khác
    socket.on("user_status", (data: { userId: number; status: "online" | "offline" }) => {
      // Bạn có thể dispatch vào context / redux / setState để update UI
      console.log("user_status received:", data);
      // Ví dụ: window.dispatchEvent(new CustomEvent('user_status', { detail: data }));
    });

    // keep-alive: gửi mỗi 60s để update last_active_at
    const intervalMs = 60_000; // 60 giây
    keepAliveIntervalRef.current = window.setInterval(() => {
      if (socket && socket.connected) {
        socket.emit("keep_alive", { userId });
      }
    }, intervalMs);

    return () => {
      // cleanup
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId]);

  return null; // component chỉ để side-effect
}
