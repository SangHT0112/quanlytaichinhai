'use client';
import { useState, useRef, ChangeEvent } from "react";
import { useRouter, usePathname } from "next/navigation";

export const ChatInput = ({
  isSidebarOpen,
  pathname,
}: {
  isSidebarOpen: boolean;
  pathname: string;
}) => {
  const [chatInput, setChatInput] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null); // Lưu file ảnh thay vì URL
  const [isRecording,  setIsRecording] = useState(false);
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
      fileInputRef.current.value = ""; // Reset input file
    }
  };

  //Voice chat
  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if(!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ tính năng nhận diện giọng nói.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN'; // Thiết lập ngôn ngữ tiếng Việt
    recognition.interimResults = false; // Không hiển thị kết quả tạm thời
    recognition.maxAlternatives = 1; // Chỉ lấy kết quả tốt nhất

    recognition.onStart = () => setIsRecording(true);
    recognition.onEnd = () => setIsRecording(false);

    recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
      setChatInput(prev => prev + (prev ? " " : "") + transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Lỗi ghi âm:", event.error);
      alert("Không thể ghi âm: " + event.error);
      setIsRecording(false);
    };

    recognition.start();
  }

  // Xử lý gửi tin nhắn hoặc hình ảnh
  const handleSend = () => {
    if (!chatInput.trim() && !selectedImage) return; // Không gửi nếu không có nội dung hoặc hình ảnh

    setIsNavigating(true);

    // Gửi tin nhắn hoặc hình ảnh
    if (selectedImage) {
      const formData = new FormData();
      formData.append("image", selectedImage);
      if (chatInput.trim()) {
        formData.append("message", chatInput);
      }
      (window as any).sendChatMessage?.(chatInput, formData); // Gửi cả văn bản và hình ảnh
    } else {
      localStorage.setItem("pendingChatMessage", chatInput);
      (window as any).sendChatMessage?.(chatInput); // Gửi văn bản
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
    <div
      className={`fixed bottom-4 z-50 transition-all duration-300 ${
        isSidebarOpen ? "left-64" : "left-0"
      } right-0`}
    >
      <div className="w-full max-w-5xl mx-auto px-4">
        <div className="bg-zinc-900 border border-zinc-500 rounded-xl px-4 py-3 space-y-2 shadow-xl">
          {/* Hiển thị ảnh xem trước (nếu có) */}
          {selectedImage && (
            <div className="relative">
              <img
                src={URL.createObjectURL(selectedImage)}
                alt="Ảnh đã chọn"
                className="max-h-40 rounded-lg mb-2"
              />
              <button
                onClick={removeImage}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button className="text-purple-400 text-xl">🤖</button>

            {/* Input file ẩn (chỉ nhận ảnh) */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
              accept="image/*"
            />

            {/* Nút để mở dialog chọn ảnh */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-purple-400 hover:text-purple-300"
              title="Tải lên ảnh"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
            </button>
            <button
              onClick={handleVoiceInput}
              className={`text-purple-400 hover:text-purple-300 ${isRecording ? "animate-pulse text-red-500" : ""}`}
              title="Ghi âm giọng nói"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18.75v1.5m0-1.5A4.5 4.5 0 007.5 14.25V12m9 0v2.25A4.5 4.5 0 0112 18.75m0-13.5a3 3 0 013 3v3a3 3 0 11-6 0v-3a3 3 0 013-3z"
                />
              </svg>
            </button>

            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (chatInput.trim() || selectedImage)) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Nhập yêu cầu tài chính hoặc ví dụ..."
              className="flex-1 px-4 py-2 rounded-full bg-zinc-700 text-white placeholder-zinc-400 focus:outline-none"
            />
            <button
              className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full"
              onClick={handleSend}
              disabled={isNavigating || (!chatInput.trim() && !selectedImage)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12l15 6V6l-15 6z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};