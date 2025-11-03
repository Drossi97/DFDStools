import type React from "react"
import { cn } from "@/lib/utils"

interface FormRowProps {
  label: string
  htmlFor?: string
  className?: string
  children: React.ReactNode
  hideLabel?: boolean
}

export function FormRow({ label, htmlFor, className, children, hideLabel = false }: FormRowProps) {
  return (
    <div className={cn("flex flex-col h-[76px]", className)}>
      {!hideLabel && (
        <label htmlFor={htmlFor} className="text-xs font-medium text-gray-700 text-center mb-0.5">
          {label}
        </label>
      )}
      {hideLabel && (
        <div className="text-xs font-medium text-gray-700 text-center mb-0.5 opacity-0">{label || "Espacio"}</div>
      )}
      <div className="flex-1 flex items-start justify-center pt-1">{children}</div>
    </div>
  )
}
