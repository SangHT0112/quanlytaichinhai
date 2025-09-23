// financial_plan/utils/financialUtils.ts
import { ForecastData, SavingsPlan } from "./interfaces";

export const format = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(n);

export const calculateProgress = (current: number, target: number) =>
  Math.min((current / target) * 100, 100);

export const calculateForecast = (plan: SavingsPlan, months: number, scenario: "best" | "worst"): ForecastData[] => {
  const rate = scenario === "best" ? 0.075 : 0.03;
  const inflation = scenario === "worst" ? 0.042 : 0;
  const monthlyRate = rate / 12;
  const monthlyInflation = inflation / 12;
  const data: ForecastData[] = [];

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  if (!Number.isInteger(months) || months <= 0) {
    console.warn("Số tháng không hợp lệ:", months);
    return data; // Trả về mảng rỗng nếu months không hợp lệ
  }

  for (let i = 0; i <= months; i++) {
    const futureMonth = (currentMonth + i) % 12;
    const futureYear = currentYear + Math.floor((currentMonth + i) / 12);
    const label = `Tháng ${futureMonth + 1}/${futureYear}`;

    const futureValue =
      plan.currentAmount * Math.pow(1 + monthlyRate, i) +
      plan.monthlyContribution * ((Math.pow(1 + monthlyRate, i) - 1) / monthlyRate || 0);

    const effectiveTarget = plan.targetAmount * Math.pow(1 + monthlyInflation, i);

    data.push({
      label,
      balance: futureValue,
      target: effectiveTarget,
    });
  }

  return data;
};

export const generateTicks = (totalMonths: number, forecastData: ForecastData[]): string[] => {
  if (!Number.isInteger(totalMonths) || totalMonths <= 0 || !forecastData || forecastData.length === 0) {
    console.warn("totalMonths hoặc forecastData không hợp lệ:", totalMonths, forecastData);
    return []; // Trả về rỗng để tránh lỗi, nhưng sẽ không có nhãn
  }

  // Lấy tất cả các nhãn từ forecastData
  const allLabels = forecastData.map((item) => item.label);

  if (totalMonths <= 12) {
    // Hiển thị mỗi tháng
    return allLabels;
  } else if (totalMonths <= 36) {
    // Mỗi 3 tháng
    return allLabels.filter((_, index) => index % 3 === 0);
  } else if (totalMonths <= 60) {
    // Mỗi 6 tháng
    return allLabels.filter((_, index) => index % 6 === 0);
  } else {
    // Mỗi 12 tháng (hàng năm)
    return allLabels.filter((_, index) => index % 12 === 0);
  }
};