"use client"

import { useState, useEffect, useCallback } from "react"
import type { ChangeEvent, FocusEvent } from "react"
import { cn } from "@/lib/utils"

interface TimeInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  required?: boolean
}

export function TimeInput({
  value,
  onChange,
  placeholder = "HH:MM",
  disabled = false,
  className = "",
  required = false,
}: TimeInputProps) {
  const [internalValue, setInternalValue] = useState(value)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setInternalValue(value)
  }, [value])

  // Memoizar la función para evitar recreaciones innecesarias
  const formatAndValidateTime = useCallback(
    (input: string): { formatted: string; isValid: boolean; error?: string } => {
      // Si la entrada está vacía y no es requerida, no hay error
      if (!input.trim()) {
        return { formatted: "", isValid: !required, error: required ? "Este campo es requerido" : undefined }
      }

      // Si el usuario ya incluyó los dos puntos
      if (input.includes(":")) {
        const [hoursStr, minutesStr] = input.split(":")

        // Validar que sean números
        if (!/^\d*$/.test(hoursStr) || !/^\d*$/.test(minutesStr)) {
          return {
            formatted: input,
            isValid: false,
            error: "Formato inválido. Use HH:MM",
          }
        }

        const hours = Number.parseInt(hoursStr.padStart(2, "0"), 10)
        const minutes = Number.parseInt(minutesStr.padStart(2, "0"), 10)
        const formatted = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`

        // Validar rango de horas y minutos
        if (hours < 0 || hours > 23) {
          return {
            formatted,
            isValid: false,
            error: "Las horas deben estar entre 0 y 23",
          }
        }

        if (minutes < 0 || minutes > 59) {
          return {
            formatted,
            isValid: false,
            error: "Los minutos deben estar entre 0 y 59",
          }
        }

        return { formatted, isValid: true }
      }
      // Si el usuario no incluyó los dos puntos
      else {
        const numericValue = input.replace(/\D/g, "").slice(0, 4)

        if (numericValue.length < 3) {
          return {
            formatted: numericValue,
            isValid: false,
            error: "Formato incompleto",
          }
        }

        const paddedValue = numericValue.padStart(4, "0")
        const formatted = `${paddedValue.slice(0, 2)}:${paddedValue.slice(2)}`
        const [hours, minutes] = formatted.split(":").map(Number)

        // Validar rango de horas y minutos
        if (hours < 0 || hours > 23) {
          return {
            formatted,
            isValid: false,
            error: "Las horas deben estar entre 0 y 23",
          }
        }

        if (minutes < 0 || minutes > 59) {
          return {
            formatted,
            isValid: false,
            error: "Los minutos deben estar entre 0 y 59",
          }
        }

        return { formatted, isValid: true }
      }
    },
    [required],
  )

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

    // Formateo automático al escribir
    if (limitedValue.length === 2 && !limitedValue.includes(":") && !inputValue.includes(":")) {
      setInternalValue(limitedValue + ":")
    }

    // Limpiar error al escribir
    setError(null)

    // Si tenemos un formato válido, actualizar el valor
    if (limitedValue.length === 5 && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(limitedValue)) {
      onChange(limitedValue)
    }
  }

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    if (internalValue) {
      const { formatted, isValid, error: validationError } = formatAndValidateTime(internalValue)

      if (isValid) {
        setInternalValue(formatted)
        onChange(formatted)
        setError(null)
      } else {
        // Mostrar error pero mantener el valor para que el usuario pueda corregirlo
        setError(validationError || "Formato inválido")
        // Restablecer al último valor válido solo si está completamente mal
        if (internalValue.length !== 5 || !internalValue.includes(":")) {
          setInternalValue(value)
        }
      }
    } else {
      if (required) {
        setError("Este campo es requerido")
      } else {
        onChange("")
        setError(null)
      }
    }
  }

  // Asegurar que el tamaño del input sea el correcto
  return (
    <div className="w-full">
      <input
        type="text"
        value={internalValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        maxLength={5}
        aria-invalid={!!error}
        aria-describedby={error ? "time-input-error" : undefined}
        className={cn(
          "w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-0 text-center mx-auto block disabled:bg-gray-100 disabled:text-gray-500",
          error ? "border-red-500 focus:border-red-500" : "",
          className,
        )}
      />
      {error && (
        <p id="time-input-error" className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}
