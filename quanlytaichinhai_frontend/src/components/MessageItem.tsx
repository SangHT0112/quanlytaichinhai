'use client'
import React from 'react'
import { Bot, User } from "lucide-react"
import { ChatMessage } from "./types"
import { MessageRenderer } from './MessageRenderer'

export const MessageItem = ({ message }: { message: ChatMessage }) => {
  // Kiểm tra nếu có custom content với component
  const hasCustomContent = Array.isArray(message.custom_content) && 
    message.custom_content.some(part => part.type === 'component' || part.type === 'function_call');

  return (
    <div className={`flex gap-3 w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}>
      {/* Phần avatar assistant */}
      {message.role === "assistant" && (
        <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}

      {/* Nội dung tin nhắn */}
      <div
        className={`
          max-w-[min(90vw,800px)]
          w-fit
          min-w-[120px]
          min-h-[4rem]
          rounded-2xl 
          px-4 py-3 
          overflow-x-auto
          break-words
          ${message.role === "user" 
            ? "bg-blue-600 text-white" 
            : "bg-zinc-800 text-white border border-zinc-700"
          }
          ${hasCustomContent ? '!min-w-[300px]' : ''} // Rộng hơn nếu có component
        `}
      >
        {/* Hiển thị content chính (theo chuẩn OpenAI) */}
        {message.content && (
          <div className="mt-2">
            <MessageRenderer content={message.content} />
          </div>
        )}

        {/* Hiển thị custom content (components của bạn) */}
        {message.custom_content && (
          <div className="mt-2">
            <MessageRenderer content={message.custom_content} />
          </div>
        )}

        {/* Hiển thị function call nếu có */}
        {message.function_call && (
          <div className="mt-2 p-2 bg-zinc-700 rounded-lg text-xs">
            <div className="font-mono">Function: {message.function_call.name}</div>
            <pre className="overflow-x-auto mt-1">
              {JSON.stringify(JSON.parse(message.function_call.arguments), null, 2)}
            </pre>
          </div>
        )}

        {/* Phần thời gian */}
        <div className={`text-xs mt-2 opacity-70 ${
          message.role === "user" ? "text-blue-100" : "text-zinc-400"
        }`}>
          {message.timestamp.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      {/* Phần avatar user */}
      {message.role === "user" && (
        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  )
}