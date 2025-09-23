'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Circle, Minus } from 'lucide-react';
import { PlanData } from '@/utils/types';

interface PriorityFormProps {
  onPrioritySelect: (priority: string) => void;
  plans: PlanData[];
  isLoading?: boolean; // Thêm prop isLoading
}

export function PriorityForm({ onPrioritySelect, plans, isLoading }: PriorityFormProps) {
  return (
    <div className="w-full bg-background p-4">
      <Card className="w-full max-w-md shadow-lg mx-auto">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-card-foreground text-balance">
            Chọn mức độ ưu tiên
          </CardTitle>
          <CardDescription className="text-muted-foreground text-pretty">
            Vui lòng chọn mức độ ưu tiên cho các kế hoạch sau:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="mb-4">
            {plans.map((plan, index) => (
              <div key={plan.id} className="mb-2">
                <p className="font-semibold">{index + 1}. {plan.name}</p>
                <p className="text-sm text-muted-foreground">
                  Mục tiêu: {plan.target_amount.toLocaleString('vi-VN')} VND | 
                  Góp hàng tháng: {plan.monthly_contribution.toLocaleString('vi-VN')} VND | 
                  Thời gian: {plan.time_to_goal} tháng
                </p>
                {plan.description && (
                  <p className="text-sm text-muted-foreground">Mô tả: {plan.description}</p>
                )}
              </div>
            ))}
          </div>

          <Button
            size="lg"
            className="w-full justify-start gap-3 h-16 text-left bg-red-500 hover:bg-red-600 text-white border-0 shadow-md transition-all duration-200"
            onClick={() => onPrioritySelect('high')}
            disabled={isLoading}
          >
            <AlertCircle className="w-6 h-6" />
            <div>
              <div className="font-bold text-lg">Ưu tiên cao</div>
              <div className="text-sm opacity-90">Cần xử lý ngay</div>
            </div>
          </Button>

          <Button
            size="lg"
            className="w-full justify-start gap-3 h-16 text-left bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-md transition-all duration-200"
            onClick={() => onPrioritySelect('medium')}
            disabled={isLoading}
          >
            <Circle className="w-6 h-6" />
            <div>
              <div className="font-bold text-lg">Trung bình</div>
              <div className="text-sm opacity-90">Xử lý bình thường</div>
            </div>
          </Button>

          <Button
            size="lg"
            className="w-full justify-start gap-3 h-16 text-left bg-green-500 hover:bg-green-600 text-white border-0 shadow-md transition-all duration-200"
            onClick={() => onPrioritySelect('low')}
            disabled={isLoading}
          >
            <Minus className="w-6 h-6" />
            <div>
              <div className="font-bold text-lg">Thấp</div>
              <div className="text-sm opacity-90">Có thể xử lý sau</div>
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}