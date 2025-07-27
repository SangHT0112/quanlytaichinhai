// components/AiRecommendations.tsx
"use client"

import { Lightbulb, AlertTriangle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
type RecommendationType = "warning" | "success" | "info"; // Có thể thêm các type khác nếu cần

interface Recommendation {
  type: RecommendationType;
  title: string;
  description: string;
  action: string;
  // Có thể thêm các trường khác nếu cần
}
export default function AiRecommendations({ 
  recommendations 
}: { 
  recommendations: Recommendation[] 
}) {
  const getIcon = (type: RecommendationType) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      default:
        return <Lightbulb className="w-5 h-5 text-blue-400" />;
    }
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec, i) => (
        <div key={i} className="flex gap-3 p-4 rounded-lg bg-zinc-800">
          {getIcon(rec.type)}
          <div className="flex-1">
            <h4 className="font-medium text-white mb-1">{rec.title}</h4>
            <p className="text-sm text-zinc-400 mb-2">{rec.description}</p>
            {rec.action && (
              <Button 
                size="sm" 
                variant="outline" 
                className="bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600"
              >
                {rec.action}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
