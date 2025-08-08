// components/hooks/renderCustomContent.tsx
import React from 'react'
import { MessageContentPart } from "../../utils/types"
import { componentMap } from './componentMap'

export const renderCustomContent = (part: MessageContentPart) => {
  if (part.type === "text") {
    return (
      <div className={`text-sm ${part.style === "important" ? "font-bold text-yellow-400" : ""}`}>
        {part.text}
      </div>
    )
  }

  if (part.type === "component") {
    const Component = componentMap[part.name]
    if (!Component) {
      return <div className="text-red-400 text-sm">⚠️ Component không hỗ trợ: {part.name}</div>
    }
    return <Component {...(part.props || {})} />
  }

  if (part.type === "function_call") {
    return (
      <div className="p-2 bg-zinc-700 rounded text-xs">
        <strong>Function:</strong> {part.name}
        <pre className="overflow-x-auto mt-1">
          {JSON.stringify(JSON.parse(part.arguments), null, 2)}
        </pre>
      </div>
    )
  }

  return <div>⚠️ Không thể hiển thị nội dung</div>
}
