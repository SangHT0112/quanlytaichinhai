"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Tag, FileText, X, Plus, TrendingUp, TrendingDown } from "lucide-react";
import axiosInstance from "@/config/axios";
import type { TransactionData } from "@/utils/types";

interface CategoryData {
  name: string;
  type: "income" | "expense";
  parent_id: number | null;
  icon: string | null;
}

interface CategoryConfirmationFormProps {
  categoryData: CategoryData;
  user_id: number;
  messageId: string;
  onConfirm?: (confirmed: boolean, transactionData?: TransactionData) => Promise<void>;
  isConfirmed?: boolean; // Thêm lại prop isConfirmed
  temporary_transaction?: {
    group_name?: string;
    transaction_date?: string;
    user_id?: number;
    total_amount?: number;
    transactions: Array<{
      type: "expense" | "income";
      amount: number;
      category: string;
      description?: string;
      date?: string;
      user_id?: number;
      transaction_date?: string;
    }>;
  };
}

export default function CategoryConfirmationForm({
  categoryData,
  user_id,
  messageId,
  onConfirm,
  isConfirmed: propIsConfirmed = false, // Sử dụng prop isConfirmed
  temporary_transaction,
}: CategoryConfirmationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(propIsConfirmed);

  // Kiểm tra trạng thái danh mục khi component mount
  useEffect(() => {
    const checkCategoryExists = async () => {
      try {
        const response = await axiosInstance.get(`/category/check`, {
          params: { name: categoryData.name, user_id },
        });
        if (response.data.exists) {
          setIsConfirmed(true); // Nếu danh mục đã tồn tại, đặt isConfirmed thành true
        }
      } catch (error) {
        console.error("Error checking category existence:", error);
      }
    };

    if (!propIsConfirmed) {
      checkCategoryExists(); // Chỉ gọi API nếu propIsConfirmed là false
    }
  }, [categoryData.name, user_id, propIsConfirmed]);

  const handleConfirm = async (confirmed: boolean) => {
    if (isSubmitting || isConfirmed) return;

    // Kiểm tra dữ liệu trước khi gửi
    if (!user_id || !categoryData || !categoryData.name || !["income", "expense"].includes(categoryData.type)) {
      console.error("Invalid input data:", { user_id, categoryData });
      await onConfirm?.(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        user_id,
        suggested_category: { ...categoryData, create_category: !temporary_transaction },
        confirm: confirmed,
        temporary_transaction,
      };
      console.log("Sending payload:", payload);
      const response = await axiosInstance.post("/category", payload);
      console.log("Category confirmation response:", response.data);

      if (confirmed) {
        setIsConfirmed(true); // Cập nhật trạng thái xác nhận
        if (response.data?.structured?.response_type === "create_category") {
          await onConfirm?.(confirmed); // Gọi onConfirm để cập nhật confirmedIds
        } else if (
          response.data?.structured?.response_type === "transaction" &&
          Array.isArray(response.data.structured.transactions) &&
          response.data.structured.transactions.length === 1
        ) {
          const transactionData = response.data.structured.transactions[0];
          const formattedTransaction: TransactionData = {
            type: transactionData.type || "expense",
            amount: transactionData.amount || 0,
            category: transactionData.category || categoryData.name,
            user_id: transactionData.user_id ?? user_id,
            date: transactionData.date || transactionData.transaction_date || new Date().toISOString(),
            description: transactionData.description || `Giao dịch với danh mục ${categoryData.name}`,
            transaction_date: transactionData.transaction_date || new Date().toISOString(),
          };
          await onConfirm?.(confirmed, formattedTransaction);
        } else {
          await onConfirm?.(confirmed);
        }
      } else {
        await onConfirm?.(confirmed);
      }
    } catch (error) {
      console.error("Error confirming category:", error);
      await onConfirm?.(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFallbackCategory = async () => {
    if (isSubmitting) return;

    const fallbackName = categoryData.type === "expense" ? "Chi tiêu khác" : "Thu nhập khác";

    const payload = {
      user_id,
      suggested_category: {
        ...categoryData,
        name: fallbackName, // 👈 ép lại name
        create_category: false, // không tạo mới, dùng sẵn
      },
      confirm: true, // 👈 xác nhận luôn
      temporary_transaction,
    };

    setIsSubmitting(true);
    try {
      console.log("Sending fallback payload:", payload);
      const response = await axiosInstance.post("/category", payload);
      console.log("Fallback category response:", response.data);

      setIsConfirmed(true);

      // Nếu có transaction thì map lại để trả về cho onConfirm
      if (
        response.data?.structured?.response_type === "transaction" &&
        Array.isArray(response.data.structured.transactions)
      ) {
        const transactionData = response.data.structured.transactions[0];
        const formattedTransaction: TransactionData = {
          type: transactionData.type || "expense",
          amount: transactionData.amount || 0,
          category: transactionData.category || fallbackName,
          user_id: transactionData.user_id ?? user_id,
          date: transactionData.date || transactionData.transaction_date || new Date().toISOString(),
          description: transactionData.description || `Giao dịch với danh mục ${fallbackName}`,
          transaction_date: transactionData.transaction_date || new Date().toISOString(),
        };
        await onConfirm?.(true, formattedTransaction);
      } else {
        await onConfirm?.(true);
      }
    } catch (error) {
      console.error("Error confirming fallback category:", error);
      await onConfirm?.(false);
    } finally {
      setIsSubmitting(false);
    }
  };


  const isExpense = categoryData.type === "expense";

  return (
    <div className="w-full max-w-lg mx-auto p-2">
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
        <CardHeader className="text-center pb-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-400/10 dark:to-purple-400/10" />
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
          <div className="relative z-10">
            <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-2 shadow-lg">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Xác nhận danh mục mới
            </CardTitle>
            <CardDescription className="text-sm mt-1 text-gray-600 dark:text-gray-400">
              Vui lòng kiểm tra thông tin danh mục trước khi thêm vào hệ thống
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 px-4">
          <div className="flex justify-center">
            <Badge
              className={`px-3 py-1 text-sm font-semibold rounded-full flex items-center gap-2 ${
                isExpense
                  ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/25"
                  : "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25"
              }`}
            >
              {isExpense ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
              {isExpense ? "Chi tiêu" : "Thu nhập"}
            </Badge>
          </div>

          <Separator className="bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600" />

          <div className="space-y-2">
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Tag className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tên danh mục</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{categoryData.name}</p>
                </div>
              </div>
            </div>

            {categoryData.icon && (
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Biểu tượng</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{categoryData.icon}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex gap-3 px-4 pb-4">
          {isConfirmed || propIsConfirmed ? (
            <Button
              className="w-full h-10 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-green-500/25"
              disabled
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Đã xác nhận thành công
            </Button>
          ) : (
            <>
             <Button
                variant="outline"
                className="flex-1 h-10 border-2 border-gray-300 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all duration-200 bg-transparent"
                onClick={handleFallbackCategory} // 👈 đổi từ handleConfirm(false)
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                {categoryData.type === "expense" ? "Vào mục Chi tiêu khác" : "Vào mục Thu nhập khác"}
              </Button>


              <Button
                className="flex-1 h-10 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200"
                onClick={() => handleConfirm(true)}
                disabled={isSubmitting || isConfirmed}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isSubmitting ? "Đang xử lý..." : "Xác nhận"}
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}