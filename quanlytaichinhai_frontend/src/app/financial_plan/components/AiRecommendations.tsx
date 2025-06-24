// components/AiRecommendations.tsx
"use client"

import { Lightbulb, AlertTriangle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AiRecommendations({ recommendations }: { recommendations: any[] }) {
  const getIcon = (t: string) => {
    if (t === "warning") return <AlertTriangle className="w-5 h-5 text-yellow-400" />
    if (t === "success") return <CheckCircle className="w-5 h-5 text-green-400" />
    return <Lightbulb className="w-5 h-5 text-blue-400" />
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec, i) => (
        <div key={i} className="flex gap-3 p-4 rounded-lg bg-zinc-800">
          {getIcon(rec.type)}
          <div className="flex-1">
            <h4 className="font-medium text-white mb-1">{rec.title}</h4>
            <p className="text-sm text-zinc-400 mb-2">{rec.description}</p>
            <Button size="sm" variant="outline" className="bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600">
              {rec.action}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
