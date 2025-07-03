export interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

export type QuickAction = {
  text: string
  emoji: string
}