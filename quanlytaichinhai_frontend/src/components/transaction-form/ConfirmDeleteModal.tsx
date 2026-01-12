// File: components/transaction-form/DeleteConfirmationForm.tsx (hoặc tương tự)
"use client";
import React from "react";

interface DeleteConfirmationFormProps {
  message: string; // message.id từ MessageItem
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const DeleteConfirmationForm: React.FC<DeleteConfirmationFormProps> = ({
  onConfirm,
  onCancel,
  loading = false,
}) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-4">
      {/* Icon cảnh báo */}
      <div className="flex items-center justify-center text-red-500">
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>

      {/* Thông báo */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-red-800">
          Xác nhận xóa dữ liệu
        </h3>
        <p className="text-sm text-red-700">
          Hành động này sẽ xóa vĩnh viễn tất cả giao dịch và kế hoạch của bạn. Không thể khôi phục.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 justify-center pt-2">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 font-medium"
        >
          Hủy
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium flex items-center gap-2"
        >
          {loading && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          )}
          Xóa dữ liệu
        </button>
      </div>
    </div>
  );
};

export default DeleteConfirmationForm;