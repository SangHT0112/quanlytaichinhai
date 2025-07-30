'use client';
import { useState, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, Send, Mic, Paperclip, Bot } from "lucide-react";
interface ChatInputProps {
  isSidebarOpen: boolean;
  pathname: string; // Add pathname prop
}

// Định nghĩa interface cho SpeechRecognition
interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start: () => void;
}

// Định nghĩa interface cho SpeechRecognitionEvent
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

// Định nghĩa interface cho SpeechRecognitionErrorEvent
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

// Định nghĩa interface cho window với sendChatMessage và SpeechRecognition
interface CustomWindow extends Window {
  sendChatMessage?: (message: string, formData?: FormData) => void;
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}

declare let window: CustomWindow;

export const ChatInput = ({ isSidebarOpen, pathname }: ChatInputProps) => {
  const [chatInput, setChatInput] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Xử lý khi chọn ảnh
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file);
    } else {
      alert("Vui lòng chọn một file hình ảnh hợp lệ (jpg, png, ...).");
    }
  };

  // Xóa ảnh đã chọn
  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Voice chat
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ tính năng nhận diện giọng nói.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setChatInput(prev => prev + (prev ? " " : "") + transcript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Lỗi ghi âm:", event.error);
      alert("Không thể ghi âm: " + event.error);
      setIsRecording(false);
    };

    recognition.start();
  };

  // Xử lý gửi tin nhắn hoặc hình ảnh
  const handleSend = () => {
    if (!chatInput.trim() && !selectedImage) return;

    setIsNavigating(true);

    // Gửi tin nhắn hoặc hình ảnh
    if (selectedImage) {
      const formData = new FormData();
      formData.append("image", selectedImage);
      if (chatInput.trim()) {
        formData.append("message", chatInput);
      }
      window.sendChatMessage?.(chatInput, formData);
    } else {
      localStorage.setItem("pendingChatMessage", chatInput);
      window.sendChatMessage?.(chatInput);
    }

    // Reset trạng thái
    setChatInput("");
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Chuyển hướng nếu không ở trang chính
    if (pathname !== "/") {
      setTimeout(() => {
        router.replace("/");
        setIsNavigating(false);
      }, 700);
    } else {
      setIsNavigating(false);
    }
  };

  return (
    <div className={`fixed bottom-1 z-50 transition-all duration-300 ${isSidebarOpen ? "left-64" : "left-0"} right-0`}>
      <div className="w-full max-w-5xl mx-auto px-4">
        <div className="bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-xl px-4 py-3 space-y-2 shadow-xl">
          {/* Hiển thị ảnh xem trước (nếu có) */}
          {selectedImage && (
            <div className="relative">
              <Image
                src={URL.createObjectURL(selectedImage) || "/placeholder.svg"}
                alt="Ảnh đã chọn"
                width={160}
                height={160}
                className="max-h-40 rounded-lg mb-2 object-cover"
              />
              <button
                onClick={removeImage}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button className="text-teal-600 text-xl p-1 rounded-full hover:bg-teal-50 transition-colors">
              <Bot className="w-6 h-6" />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-teal-600 hover:text-teal-700 p-1 rounded-full hover:bg-teal-50 transition-colors"
              title="Tải lên ảnh"
            >
              <Paperclip className="w-6 h-6" />
            </button>
            <button
              onClick={handleVoiceInput}
              className={`text-teal-600 hover:text-teal-700 p-1 rounded-full hover:bg-teal-50 transition-colors ${
                isRecording ? "animate-pulse text-red-500" : ""
              }`}
              title="Ghi âm giọng nói"
            >
              <Mic className="w-6 h-6" />
            </button>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (chatInput.trim() || selectedImage)) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Nhập yêu cầu tài chính hoặc ví dụ..."
              className="flex-1 px-4 py-2 rounded-full bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
            <button
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white p-2 rounded-full transition-all"
              onClick={handleSend}
              disabled={isNavigating || (!chatInput.trim() && !selectedImage)}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
};