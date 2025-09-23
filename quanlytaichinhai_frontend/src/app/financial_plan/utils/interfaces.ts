// financial_plan/utils/interfaces.ts
export interface Recommendation {
  type: string;
  title: string;
  description: string;
  impact: string;
  priority: string;
}

export interface Milestone {
  amount: number;
  timeframe: string;
  description: string;
}

export interface ForecastData {
  label: string;
  balance: number;
  target: number;
}

export interface MonthlyBreakdown {
  currentSavings: number;
  optimizedSavings: number;
  withInvestment: number;
}

export interface AIAnalysis {
  feasibilityScore: number;
  riskLevel: string;
  recommendations: Recommendation[];
  milestones: Milestone[];
  monthlyBreakdown: MonthlyBreakdown;
  challenges: string[];
  tips: string[];
}

export interface SavingsPlan {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  timeToGoal: number;
  priority: string;
  category: string;
  breakdown: Record<string, number>;
  aiAnalysis: AIAnalysis;
}