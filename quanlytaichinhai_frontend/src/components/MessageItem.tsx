'use client'

import React from 'react'
import { Bot, User } from "lucide-react"
import { ChatMessage } from "./types"
import { MessageRenderer } from './MessageRenderer'
import TransactionConfirmationForm from './transaction-confirmation-form'
import { renderCustomContent } from './hooks/renderCustomContent'

export const MessageItem = ({
  message,
  onConfirm,
  isConfirmed = false,
  confirmedIds = [],
}: {
  message: ChatMessage,
  onConfirm?: (m: ChatMessage) => void,
  isConfirmed?: boolean,
  confirmedIds?: string[]
}) => {
  const hasCustomContent = Array.isArray(message.custom_content) &&
    message.custom_content.some(part => part.type === 'component' || part.type === 'function_call')

  return (
    <div className={`flex gap-3 w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}>
      
      {/* Avatar của AI */}
      {message.role === "assistant" && (
        <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}

      {/* Nội dung chính */}
      <div className={`
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
        ${hasCustomContent ? '!min-w-[300px]' : ''}
      `}>

        {/* Nếu không structured thì hiển thị nội dung văn bản bình thường */}
        {!message.structured && message.content && (
          <div className="mt-2">
            <MessageRenderer content={message.content} />
          </div>
        )}

        {/* Nếu là structured transaction và chưa được xác nhận */}
        {message.structured && !message.structured.error && (
          <div className="mt-2">
            <TransactionConfirmationForm
              transactionData={{
                user_id: message.structured.user_id || 1,
                amount: message.structured.amount,
                category: message.structured.category,
                type: message.structured.type,
                description: message.user_input || message.content || "Không có mô tả",
                transaction_date: message.structured.date,
              }}
              isConfirmed={confirmedIds.includes(message.id)}
              onConfirm={() => onConfirm?.(message)}
              onCancel={() => console.log("❌ Huỷ xác nhận")}
            />
          </div>
        )}

        {/* Nếu là function call từ AI */}
        {message.function_call && (
          <div className="mt-2 p-2 bg-zinc-700 rounded-lg text-xs">
            <div className="font-mono">Function: {message.function_call.name}</div>
            <pre className="overflow-x-auto mt-1">
              {JSON.stringify(JSON.parse(message.function_call.arguments), null, 2)}
            </pre>
          </div>
        )}

        {/* Custom component từ AI - Sử dụng renderCustomContent */}
        {message.custom_content?.map((part, index) => (
          <div key={index} className="mt-2">
            {renderCustomContent(part, index)}
          </div>
        ))}

        {/* Thời gian gửi */}
        <div className={`text-xs mt-2 opacity-70 ${
          message.role === "user" ? "text-blue-100" : "text-zinc-400"
        }`}>
          {message.timestamp.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      {/* Avatar user */}
      {message.role === "user" && (
        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  )
}