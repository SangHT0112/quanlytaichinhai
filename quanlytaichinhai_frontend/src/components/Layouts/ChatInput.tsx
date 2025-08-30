"use client"

import { useEffect, useState, useRef, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { X, Send, Mic } from "lucide-react"

interface ChatInputProps {
  isSidebarOpen: boolean
  isSidebarRightOpen: boolean
  pathname: string
  centered?: boolean // Thêm prop mới để xác định vị trí
  
}

// Định nghĩa interface cho SpeechRecognition
interface SpeechRecognition extends EventTarget {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onstart: (() => void) | null
  onend: (() => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  start: () => void
}

// Định nghĩa interface cho SpeechRecognitionEvent
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

// Định nghĩa interface cho SpeechRecognitionErrorEvent
interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

// Định nghĩa interface cho window với sendChatMessage và SpeechRecognition
interface CustomWindow extends Window {
  sendChatMessage?: (message: string, formData?: FormData) => void
  SpeechRecognition?: new () => SpeechRecognition
  webkitSpeechRecognition?: new () => SpeechRecognition
}

declare let window: CustomWindow

export const ChatInput = ({ pathname, centered = false }: ChatInputProps) => {
  const [chatInput, setChatInput] = useState("")
  const [isNavigating, setIsNavigating] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Xử lý khi chọn ảnh
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file)
    } else {
      alert("Vui lòng chọn một file hình ảnh hợp lệ (jpg, png, ...).")
    }
  }

  // Xóa ảnh đã chọn
  const removeImage = () => {
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Voice chat
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ tính năng nhận diện giọng nói.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "vi-VN"
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsRecording(true)
    recognition.onend = () => setIsRecording(false)

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript
      setChatInput((prev) => prev + (prev ? " " : "") + transcript)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Lỗi ghi âm:", event.error)
      alert("Không thể ghi âm: " + event.error)
      setIsRecording(false)
    }

    recognition.start()
  }

  // Xử lý gửi tin nhắn hoặc hình ảnh
  const handleSend = () => {
    if (!chatInput.trim() && !selectedImage) return

    setIsNavigating(true)

    // Gửi tin nhắn hoặc hình ảnh
    if (selectedImage) {
      const formData = new FormData()
      formData.append("image", selectedImage)
      if (chatInput.trim()) {
        formData.append("message", chatInput)
      }
      window.sendChatMessage?.(chatInput, formData)
    } else {
      localStorage.setItem("pendingChatMessage", chatInput)
      window.sendChatMessage?.(chatInput)
    }

    // Reset trạng thái
    setChatInput("")
    setSelectedImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ""

    // Chuyển hướng nếu không ở trang chính
    if (pathname !== "/") {
      setTimeout(() => {
        router.replace("/")
        setIsNavigating(false)
      }, 700)
    } else {
      setIsNavigating(false)
    }
  }

  useEffect(() => {
    const handleFocus = () => {
      if (inputRef.current && window.innerWidth < 768) {
        setTimeout(() => {
          // Cuộn container chính thay vì input
          const container = document.querySelector('.message-container');
          if (container) {
            container.scrollTo({
              top: container.scrollHeight,
              behavior: 'smooth',
            });
          }
        }, 300); // Đợi bàn phím ảo xuất hiện
      }
    };

    const inputElement = inputRef.current;
    if (inputElement) {
      inputElement.addEventListener('focus', handleFocus);
    }

    return () => {
      if (inputElement) {
        inputElement.removeEventListener('focus', handleFocus);
      }
    };
  }, []);

  return (
    <div className={`w-full ${centered ? 'flex flex-col items-center justify-center' : ''}`}>
      <div className={`relative bg-gradient-to-r from-white via-white to-slate-50/80 backdrop-blur-xl border-2 border-teal-200/60 rounded-2xl px-4 py-3 shadow-2xl shadow-teal-500/10 ring-1 ring-teal-100/50 hover:shadow-2xl hover:shadow-teal-500/20 transition-all duration-300 hover:border-teal-300/70 ${centered ? 'max-w-2xl w-full' : ''}`}>
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-teal-50/30 to-cyan-50/30 rounded-2xl -z-10"></div>

        {/* Hiển thị ảnh xem trước */}
        {selectedImage && (
          <div className="relative mb-3">
            <Image
              src={URL.createObjectURL(selectedImage) || "/placeholder.svg"}
              alt="Ảnh đã chọn"
              width={160}
              height={160}
              className="max-h-40 rounded-xl mb-2 object-cover shadow-lg border border-slate-200"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg hover:scale-110 transform"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center w-full gap-2">
          {/* Nút thêm ảnh */}
          <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-teal-600 hover:text-teal-700 p-2 rounded-xl hover:bg-teal-50 transition-all duration-200 hover:scale-105 transform shadow-sm hover:shadow-md"
            title="Tải lên ảnh"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          </button>

          {/* Nút ghi âm */}
          <button
            onClick={handleVoiceInput}
            className={`p-2 rounded-xl transition-all duration-200 hover:scale-105 transform shadow-sm hover:shadow-md flex-shrink-0 ${
              isRecording
                ? "animate-pulse text-red-500 bg-red-50 ring-2 ring-red-200"
                : "text-teal-600 hover:text-teal-700 hover:bg-teal-50"
            }`}
            title="Ghi âm giọng nói"
          >
            <Mic className="w-5 h-5" />
          </button>

          <input
            type="text"
            ref={inputRef}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (chatInput.trim() || selectedImage)) {
                e.preventDefault()
                handleSend()
              }
            }}
            onPaste={(e) => {
              const items = e.clipboardData?.items
              if (items) {
                for (let i = 0; i < items.length; i++) {
                  const item = items[i]
                  if (item.type.startsWith("image/")) {
                    const file = item.getAsFile()
                    if (file) {
                      setSelectedImage(file) // set ảnh vào state
                    }
                  }
                }
              }
            }}
            placeholder="Thêm giao dịch..."
            className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-white/80 text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm border border-slate-200/50 hover:border-teal-300/50 shadow-inner backdrop-blur-sm"
          />

          <button
            className="bg-gradient-to-r from-teal-500 via-teal-600 to-cyan-600 hover:from-teal-600 hover:via-teal-700 hover:to-cyan-700 text-white p-3 rounded-xl transition-all duration-200 flex-shrink-0 shadow-lg hover:shadow-xl hover:scale-105 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ring-1 ring-teal-400/30"
            onClick={handleSend}
            disabled={isNavigating || (!chatInput.trim() && !selectedImage)}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}