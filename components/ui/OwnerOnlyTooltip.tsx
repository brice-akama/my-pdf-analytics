"use client"

import { useRef, useState } from "react"

interface OwnerOnlyTooltipProps {
  isOwner: boolean
  children: React.ReactNode
  message?: string
}

export default function OwnerOnlyTooltip({
  isOwner,
  children,
  message = "Only the account owner can access this.",
}: OwnerOnlyTooltipProps) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // If owner — render children as-is, no wrapping behaviour
  if (isOwner) return <>{children}</>

  return (
    <div
      ref={ref}
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {/* Pointer-events none so the button underneath cannot be clicked */}
      <div className="pointer-events-none opacity-50 select-none">
        {children}
      </div>

      {/* Invisible click absorber — sits on top, swallows all clicks */}
      <div
        className="absolute inset-0 cursor-not-allowed z-10"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Tooltip */}
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 pointer-events-none">
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 text-center shadow-xl leading-relaxed">
            🔒 {message}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  )
}