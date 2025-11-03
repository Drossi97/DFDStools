"use client"

import type React from "react"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  icon?: React.ReactNode
  defaultOpen?: boolean
  rightElement?: React.ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
}

export function CollapsibleSection({
  title,
  children,
  icon,
  defaultOpen = true,
  rightElement,
  className,
  headerClassName,
  contentClassName,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={cn("bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden", className)}>
      <div
        className={cn("flex items-center justify-between bg-[#002244] text-white cursor-pointer h-12", headerClassName)}
      >
        <div className="flex items-center justify-between w-full px-4" onClick={() => setIsOpen(!isOpen)}>
          <div className="flex items-center gap-2">
            {icon && <div className="flex-shrink-0">{icon}</div>}
            <h2 className="text-base font-medium">{title}</h2>
          </div>
          {/* Se eliminaron las flechas de chevron */}
        </div>
        {rightElement && (
          <div className="pr-4" onClick={(e) => e.stopPropagation()}>
            {rightElement}
          </div>
        )}
      </div>
      <div
        className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isOpen ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className={cn("p-4", contentClassName)}>{children}</div>
      </div>
    </div>
  )
}
