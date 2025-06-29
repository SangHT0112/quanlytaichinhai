"use client"

import { Button } from "@/components/ui/button"

interface PeriodSelectorProps {
  selected: string
  onSelect: (period: string) => void
}

export default function PeriodSelector({ selected, onSelect }: PeriodSelectorProps) {
  const periods = [
    // {label: "Ngày", value:"week"},
    // { label: "Tuần", value: "week" },
    { label: "Tháng", value: "month" },
    //{ label: "Năm", value: "year" },
  ]

  return (
    <div className="flex gap-2">
      {periods.map((p) => (
        <Button
          key={p.value}
          variant={selected === p.value ? "default" : "outline"}
          size="sm"
          className="bg-zinc-800 border-zinc-700"
          onClick={() => onSelect(p.value)}
        >
          {p.label}
        </Button>
      ))}
    </div>
  )
}
