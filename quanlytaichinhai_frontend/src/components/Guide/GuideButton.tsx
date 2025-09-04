"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle, X } from "lucide-react";
import { MessageItem } from "@/components/MessageItem";
import { ChatMessage, MessageRole } from "@/utils/types";
import { sampleMessageSequences } from "./sampleMessages";

interface GuideButtonProps {
  onClick?: () => void;
  label?: string;
}

export default function GuideButton({
  onClick,
  label = "Hướng dẫn",
}: GuideButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [exampleMessages, setExampleMessages] = useState<ChatMessage[]>([]);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsModalOpen(false);
        setSelectedItem(null);
        setExampleMessages([]);
      }
    };

    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModalOpen]);



  // Menu items data with descriptions
  const menuItems = [
    {
      category: "Thêm giao dịch",
      items: [
        {
          name: "Thêm giao dịch thủ công qua chat",
          description: "Nhập giao dịch đơn lẻ qua tin nhắn văn bản.",
        },
        {
          name: "Thêm nhiều giao dịch cùng lúc",
          description: "Nhập nhiều giao dịch trong một tin nhắn.",
        },
        {
          name: "Thêm giao dịch dạng chi tiết trong 1 lần đi chợ/mua sắm",
          description: "Nhập danh sách các món hàng trong một lần mua sắm.",
        },
        {
          name: "Thêm giao dịch khi thiếu giá tiền → AI hỏi bổ sung",
          description: "Nhập giao dịch thiếu thông tin, AI sẽ hỏi để bổ sung.",
        },
        {
          name: "Thêm giao dịch qua hình ảnh hóa đơn (Baml + Gemini)",
          description: "Tải lên hình ảnh hóa đơn để AI tự động trích xuất giao dịch.",
        },
      ],
    },
    {
      category: "Xem báo cáo, thống kê",
      items: [
        {
          name: "Xem số dư hiện tại",
          description: "Kiểm tra số dư tài khoản hiện tại của bạn.",
        },
        {
          name: "Xem giao dịch trong 1 ngày yêu cầu",
          description: "Xem danh sách giao dịch trong một ngày cụ thể.",
        },
        {
          name: "Xem thống kê chi tiêu theo tháng",
          description: "Xem báo cáo chi tiêu tổng hợp theo tháng.",
        },
        {
          name: "Xem chi tiêu trong 1 tuần vừa qua",
          description: "Xem tổng hợp chi tiêu trong tuần gần nhất.",
        },
      ],
    },
    {
      category: "Truy vấn dữ liệu",
      items: [
        {
          name: "Hỏi AI về chi tiêu của một cái gì đó bao nhiêu tiền",
          description: "Hỏi tổng chi tiêu cho một danh mục cụ thể.",
        },
        {
          name: "Hỏi AI chi tiêu tháng nào cao nhất",
          description: "Tìm tháng có chi tiêu cao nhất trong năm.",
        },
        {
          name: "Hỏi AI liệt kê theo yêu cầu",
          description: "Yêu cầu AI liệt kê giao dịch theo tiêu chí cụ thể.",
        },
        {
          name: "Hỏi AI so sánh giữa tháng x và tháng y",
          description: "So sánh chi tiêu giữa hai tháng bất kỳ.",
        },
        {
          name: "Hỏi AI xu hướng chi tiêu",
          description: "Phân tích xu hướng chi tiêu trong một khoảng thời gian.",
        },
      ],
    },
  ];

  // Auto-display sample message sequence when item is selected
  useEffect(() => {
    if (selectedItem) {
      const messages = sampleMessageSequences[selectedItem] || [];
      setExampleMessages(messages);
    }
  }, [selectedItem]);

  // Content for selected item
  const getItemContent = (item: string | null) => {
    if (!item) {
      return (
        <div className="space-y-4 text-slate-300">
          <p className="text-sm">Vui lòng chọn một chức năng từ menu bên trái để xem hướng dẫn chi tiết.</p>
        </div>
      );
    }

    const itemDescription = menuItems
      .flatMap(category => category.items)
      .find(i => i.name === item)?.description || "Không có mô tả.";

    return (
      <div className="space-y-4 text-slate-300">
        <h3 className="text-xl font-semibold text-cyan-300">{item}</h3>
        <p className="text-sm text-teal-200">{itemDescription}</p>
        <p className="text-sm">
          Dưới đây là ví dụ đoạn chat minh họa cách sử dụng chức năng này, tương tự giao diện chat chính.
        </p>
        <div className="bg-slate-700/50 p-3 rounded-md text-sm overflow-y-auto max-h-[80vh] border border-slate-600">
          {exampleMessages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
        <p className="text-sm">
          <strong>Lưu ý:</strong> Đây là chế độ xem trước. Các tin nhắn chỉ là mô phỏng và không được lưu vào lịch sử chat chính.
        </p>
      </div>
    );
  };

  // Handle button click
  const handleButtonClick = () => {
    setIsModalOpen(!isModalOpen);
    if (onClick) {
      onClick();
    }
  };

  // Handle item selection
  const handleSelectItem = (item: string) => {
    if (selectedItem !== item) {
      setExampleMessages([]);
    }
    setSelectedItem(item);
  };

  return (
    <>
      <button
        onClick={handleButtonClick}
        className={`fixed top-5 right-80 z-50 p-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg hover:scale-110 transition-transform group ${
          isModalOpen ? "border-2 border-green-500" : ""
        }`}
        aria-label={label}
      >
        <HelpCircle className="w-6 h-6" />
        <span className="absolute right-14 bottom-1/2 translate-y-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
          {label}
        </span>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            ref={modalRef}
            className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl max-w-7xl w-full h-[90vh] p-6 mx-4 transform transition-all duration-300 scale-100 animate-in fade-in-50 flex"
          >
            <button
              onClick={() => {
                setIsModalOpen(false);
                setSelectedItem(null);
                setExampleMessages([]);
              }}
              className="absolute top-3 right-3 p-1 rounded-full bg-slate-700/50 hover:bg-slate-600 text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex w-full">
              <div className="w-1/3 border-r border-slate-700 pr-4 overflow-y-auto">
                <h2 className="text-xl font-bold text-white mb-4 bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">
                  Hướng dẫn sử dụng AI Finance
                </h2>
                {menuItems.map((category, index) => (
                  <div key={index} className="mb-4">
                    <h3 className="text-lg font-semibold text-cyan-300">{category.category}</h3>
                    <ul className="list-none pl-2 space-y-2 text-sm text-slate-300">
                      {category.items.map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className={`cursor-pointer hover:text-teal-300 ${
                            selectedItem === item.name ? "text-teal-300 font-medium" : ""
                          }`}
                          onClick={() => handleSelectItem(item.name)}
                        >
                          {item.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="w-2/3 pl-6 overflow-y-auto">{getItemContent(selectedItem)}</div>
            </div>

            <div className="mt-6 flex justify-end absolute bottom-6 right-6">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedItem(null);
                  setExampleMessages([]);
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}