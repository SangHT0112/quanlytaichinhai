export interface User {
  user_id: number;
  username: string;
  email: string;
  role: "user" | "admin";
  status: "online" | "offline" | string;
  last_active_at?: string; // ISO date string, có thể undefined
}
