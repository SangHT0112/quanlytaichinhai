"use client"

import { useEffect, useState } from "react"
import { fetchTopCategories } from "@/api/overviewApi"
import { formatCurrency } from "@/lib/format"
import { useUser } from "@/contexts/UserProvider"

interface RawCategoryItem {
  category_name: string
  total: number
}

interface CategoryItem {
  name: string
  value: number
  color: string
}

export default function CategoryDetailList() {
  const [data, setData] = useState<CategoryItem[]>([])
  const user = useUser()
  const userId = user?.user_id

  useEffect(() => {
    if (!userId) return

    fetchTopCategories(userId).then((res: RawCategoryItem[]) => {
      const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff88", "#ff0088", "#ffbb28"]

      const formatted: CategoryItem[] = res.map((item, index) => ({
        name: item.category_name,
        value: Number(item.total),
        color: COLORS[index % COLORS.length],
      }))

      setData(formatted)
    })
  }, [userId])

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="space-y-4">
      {data.map((category, index) => {
        const percentage = total > 0 ? (category.value / total) * 100 : 0

        return (
          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
              <span className="font-medium">{category.name}</span>
            </div>
            <div className="text-right">
              <div className="font-semibold">{formatCurrency(category.value)}</div>
              <div className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
