"use client";
import React, { useState } from "react";

interface DeleteConfirmationFormProps {
  message?: string;
  requiresConfirm?: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel?: () => void;
}

const DeleteConfirmationForm: React.FC<DeleteConfirmationFormProps> = ({
  message = "Bạn có chắc chắn muốn xóa dữ liệu này không?",
  requiresConfirm = true,
  onConfirm,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (loading) return;
    try {
      setLoading(true);
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-xl bg-white shadow-md space-y-3">

      <p className="text-sm text-gray-700">
        {message}
      </p>

      {requiresConfirm && (
        <p className="text-sm text-red-500 font-semibold">
          ⚠️ Hành động này không thể hoàn tác.
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">

        <button
          onClick={onCancel}
          className="px-3 py-2 rounded-lg border bg-gray-100 hover:bg-gray-200"
          disabled={loading}
        >
          Hủy
        </button>

        <button
          onClick={handleConfirm}
          className="px-3 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Đang xóa..." : "Xác nhận xóa"}
        </button>
      </div>
    </div>
  );
};

export default DeleteConfirmationForm;