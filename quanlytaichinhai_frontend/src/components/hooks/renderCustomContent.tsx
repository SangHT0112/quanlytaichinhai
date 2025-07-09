import MonthlyBarChart from "@/app/thongke/MonthlyBarChart"
// ... import các component khác

import { MessageContentPart } from "@/components/types"

export const renderCustomContent = (part: MessageContentPart, index: number) => {
  if (part.type === "text") {
    return (
      <p key={index} className={`text-sm ${part.style === "important" ? "font-semibold" : ""}`}>
        {part.text}
      </p>
    )
  }

  if (part.type === "component") {
    const props = part.props || {}

    switch (part.name) {
      case "MonthlyBarChart":
        return <MonthlyBarChart key={index} {...props} />
      default:
        return null
    }
  }

  return null
}
