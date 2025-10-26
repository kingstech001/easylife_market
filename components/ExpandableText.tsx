import React, { useState } from 'react'

export default function ExpandableText({ text, limit = 120 }: { text?: string | null; limit?: number }) {
  const [expanded, setExpanded] = useState(false)
  const normalized = text ?? ""
  const isLong = normalized.length > limit
  const preview = isLong ? normalized.slice(0, limit).trimEnd() : normalized

  if (!normalized) {
    return <span className="text-muted-foreground">No description provided.</span>
  }

  return (
    <span className="text-base md:text-xl text-muted-foreground">
      {expanded ? normalized : `${preview}${isLong ? "…" : " "}`}&nbsp;
      {isLong && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((s) => !s)}
          className="text-primary underline-offset-2 transition-colors"
        >
          {expanded ? "less" : "more"}
        </button>
      )}
    </span>
  )
}
