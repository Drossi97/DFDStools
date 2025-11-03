"use client"

import { useState, useEffect } from "react"
import type { ChangeEvent, FocusEvent } from "react"

interface TimeInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function TimeInput({
  value,
  onChange,
  placeholder = "HH:MM",
  disabled = false,
  className = "",
}: TimeInputProps) {
  const [internalValue, setInternalValue] = useState(value)

  useEffect(() => {
    setInternalValue(value)
  }, [value])

  const formatAndValidateTime = (input: string): { formatted: string; isValid: boolean } => {
    // Si el usuario ya incluyó los dos puntos
    if (input.includes(":")) {
      const [hoursStr, minutesStr] = input.split(":")
      const hours = Number.parseInt(hoursStr.padStart(2, "0"), 10)
      const minutes = Number.parseInt(minutesStr.padStart(2, "0"), 10)
      const formatted = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
      const isValid = hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
      return { formatted, isValid }
    }
    // Si el usuario no incluyó los dos puntos
    else {
      const numericValue = input.replace(/\D/g, "").slice(0, 4)
      const paddedValue = numericValue.padStart(4, "0")
      const formatted = `${paddedValue.slice(0, 2)}:${paddedValue.slice(2)}`
      const [hours, minutes] = formatted.split(":").map(Number)
      const isValid = hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
      return { formatted, isValid }
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Permitir dígitos y dos puntos
    const inputValue = e.target.value.replace(/[^\d:]/g, "")

    // Limitar a 5 caracteres (incluyendo los dos puntos)
    const limitedValue = inputValue.length <= 5 ? inputValue : inputValue.slice(0, 5)

    // Asegurar que solo haya un ":" en la entrada
    const parts = limitedValue.split(":")
    if (parts.length > 2) {
      const newValue = parts[0] + ":" + parts.slice(1).join("")
      setInternalValue(newValue)
    } else {
      setInternalValue(limitedValue)
    }

    // Si tenemos un formato válido, actualizar el valor
    if (limitedValue.length === 5 && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(limitedValue)) {
      onChange(limitedValue)
    }
  }

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    if (internalValue) {
      const { formatted, isValid } = formatAndValidateTime(internalValue)
      if (isValid) {
        setInternalValue(formatted)
        onChange(formatted)
      } else {
        // Reset to the last valid value
        setInternalValue(value)
      }
    } else {
      onChange("")
    }
  }

  return (
    <input
      type="text"
      value={internalValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={5}
      className={`w-[80px] px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 text-center mx-auto block disabled:bg-gray-100 disabled:text-gray-500 ${className}`}
    />
  )
}
