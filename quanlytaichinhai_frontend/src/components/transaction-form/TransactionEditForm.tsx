import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X, Check, DollarSign, Calendar, Tag, FileText } from "lucide-react";

export interface TransactionData {
  type: "expense" | "income";
  amount: number;
  category: string;
  description: string;
  transaction_date: string; // Format: "YYYY-MM-DD HH:mm:ss"
  user_id?: number;
  date?: string;
}

interface Props {
  initialData: TransactionData;
  onChange: (field: keyof TransactionData, value: string | number) => void;
  onSave: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function TransactionEditForm({
  initialData,
  onChange,
  onSave,
  onCancel,
  isLoading = false,
}: Props) {
  const formattedDate = initialData.transaction_date.slice(0, 10);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange("transaction_date", `${e.target.value} 00:00:00`); // Thêm thời gian mặc định
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Check className="h-5 w-5 text-primary" />
          Chỉnh sửa giao dịch
        </CardTitle>
        <CardDescription>Vui lòng điền đầy đủ thông tin giao dịch</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Loại giao dịch
          </span>
          <select
            value={initialData.type}
            onChange={(e) => onChange("type", e.target.value)}
            className="p-1 text-sm rounded-md border border-input bg-background focus:ring-1 focus:ring-ring"
          >
            <option value="expense">Chi tiêu</option>
            <option value="income">Thu nhập</option>
          </select>
        </div>
        <Separator />
        <div className="flex items-center gap-3">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium">Số tiền</p>
            <div className="relative">
              <input
                type="number"
                value={initialData.amount}
                onChange={(e) => onChange("amount", Number(e.target.value))}
                className="w-full p-2 text-sm rounded-md border border-input bg-background"
                placeholder="0"
              />
              <span className="absolute right-3 top-2 text-sm text-muted-foreground">₫</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium">Danh mục</p>
            <select
              value={initialData.category}
              onChange={(e) => onChange("category", e.target.value)}
              className="w-full p-2 text-sm rounded-md border border-input bg-background"
            >
              <option value="Ăn uống">🍽️ Ăn uống</option>
              <option value="Di chuyển">🚗 Di chuyển</option>
              <option value="Giải trí">🎮 Giải trí</option>
              <option value="Hóa đơn">📄 Hóa đơn</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium">Ngày giao dịch</p>
            <input
              type="date"
              value={formattedDate}
              onChange={handleDateChange}
              className="w-full p-2 text-sm rounded-md border border-input bg-background"
            />
          </div>
        </div>
        <div className="flex items-start gap-2">
          <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium">Mô tả</p>
            <input
              type="text"
              value={initialData.description}
              onChange={(e) => onChange("description", e.target.value)}
              className="w-full p-2 text-sm rounded-md border border-input bg-background"
              placeholder="Nhập mô tả..."
            />
          </div>
        </div>
      </CardContent>
      <div className="px-6 pb-4 flex gap-2 min-w-[300px]">
        <Button variant="outline" onClick={onCancel} className="flex-1 bg-red-600 text-white">
          <X className="h-4 w-4 mr-2" />
          Huỷ
        </Button>
        <Button onClick={onSave} disabled={isLoading} className="flex-1 bg-green-600">
          <Check className="h-4 w-4 mr-2" />
          {isLoading ? "Đang lưu..." : "Lưu"}
        </Button>
      </div>
    </Card>
  );
}