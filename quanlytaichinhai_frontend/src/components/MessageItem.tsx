'use client'

import React, { useState } from 'react'
import { Bot, User, Check, X } from "lucide-react"
import { ChatMessage } from "./types"
import { MessageRenderer } from './MessageRenderer'
import TransactionConfirmationForm from './transaction-confirmation-form'
import TransactionEditForm from './TransactionEditForm'
import { renderCustomContent } from './hooks/renderCustomContent'

export interface TransactionData {
  type: 'expense' | 'income';
  amount: number;
  category: string;
  date?: string;
  user_id: number;
  description: string;
  transaction_date: string;
}

export const MessageItem = ({
  message,
  onConfirm,
  isConfirmed = false,
  confirmedIds = [],
  onSaveEdit,
}: {
  message: ChatMessage;
  onConfirm?: (message: ChatMessage, correctedData?: TransactionData) => Promise<void>;
  isConfirmed?: boolean;
  confirmedIds?: string[];
  onSaveEdit?: (messageId: string, editedData: TransactionData) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const defaultDescription = message.user_input || message.content || "Không có mô tả";
  const defaultDate = message.structured?.date || new Date().toISOString();

  const [editedData, setEditedData] = useState<TransactionData>({
    type: message.structured?.type || 'expense',
    amount: message.structured?.amount || 0,
    category: message.structured?.category || '',
    user_id: message.structured?.user_id ?? 1,
    description: defaultDescription,
    transaction_date: defaultDate,
    date: message.structured?.date,
  });

  const isTransaction = ["expense", "income"].includes(message.structured?.type);
  const hasCustomContent = Array.isArray(message.custom_content) &&
    message.custom_content.some(part => part.type === 'component' || part.type === 'function_call');

  const handleEditChange = (field: keyof TransactionData, value: any) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value,
      user_id: prev.user_id ?? 1,
      description: field === 'description' ? value : prev.description,
      transaction_date: field === 'transaction_date' ? value : prev.transaction_date,
    }));
  };

  const handleSaveEdit = async () => {
    onSaveEdit?.(message.id, editedData);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedData({
      type: message.structured?.type || 'expense',
      amount: message.structured?.amount || 0,
      category: message.structured?.category || '',
      user_id: message.structured?.user_id ?? 1,
      description: defaultDescription,
      transaction_date: defaultDate,
      date: message.structured?.date,
    });
    setIsEditing(false);
  };

  return (
    <div className={`flex gap-3 w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}>
      {message.role === "assistant" && (
        <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}

      <div className={`
        max-w-[min(90vw,800px)]
        w-fit min-w-[120px] min-h-[4rem]
        rounded-2xl px-4 py-3 overflow-x-auto break-words
        ${message.role === "user" ? "bg-blue-600 text-white" : "bg-zinc-800 text-white border border-zinc-700"}
        ${hasCustomContent ? '!min-w-[300px]' : ''}
      `}>
        {!message.structured && message.content && (
          <div className="mt-2">
            <MessageRenderer content={message.content} />
          </div>
        )}

        {isTransaction && (
          <div className="mt-2">
            {isEditing ? (
               <TransactionEditForm
                  initialData={editedData}
                  onChange={handleEditChange}
                  onCancel={handleCancelEdit}
                  onSave={handleSaveEdit}
                  isLoading={isLoading}
                />
            ) : (
              <TransactionConfirmationForm
                transactionData={editedData}
                isConfirmed={confirmedIds.includes(message.id)}
                onConfirm={() => onConfirm?.(message, editedData)} // Pass both message and editedData
                onEdit={() => setIsEditing(true)}
              />
            )}
          </div>
        )}

        {message.custom_content?.map((part, index) => (
          <div key={index} className="mt-2">
            {renderCustomContent(part, index)}
          </div>
        ))}

        {message.structured?.response && (
          <div className="mt-2">
            <MessageRenderer content={message.content} />
          </div>
        )}


        <div className={`text-xs mt-2 opacity-70 ${message.role === "user" ? "text-blue-100" : "text-zinc-400"}`}>
          {message.timestamp.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      {message.role === "user" && (
        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  )
}