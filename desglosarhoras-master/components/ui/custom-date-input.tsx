"use client"

import type React from "react"

import { useState, type KeyboardEvent } from "react"
import { format } from "date-fns"
import { CustomCalendar } from "@/components/ui/custom-calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"

interface CustomDateInputProps {
  onChange?: (date: Date | null) => void
  value?: Date | null
  className?: string
  placeholder?: string
}

export default function CustomDateInput({
  onChange,
  value,
  className = "",
  placeholder = "dd/mm/aaaa",
}: CustomDateInputProps) {
  const [inputValue, setInputValue] = useState<string>(value ? format(value, "dd/MM/yyyy") : "")
  const [isError, setIsError] = useState(false)
  const [date, setDate] = useState<Date | undefined>(value || undefined)
  const [open, setOpen] = useState(false)

  const validateDate = (input: string): { formatted: string; isValid: boolean; date: Date | null } => {
    // Si la entrada está vacía, no hay error
    if (!input.trim()) {
      return { formatted: "", isValid: true, date: null }
    }

    // Extraer día, mes y año
    let day = 0,
      month = 0,
      year = 0
    let formatted = input

    // Si el usuario incluyó barras
    if (input.includes("/")) {
      const parts = input.split("/")

      day = Number.parseInt(parts[0] || "0", 10)
      month = parts.length > 1 ? Number.parseInt(parts[1] || "0", 10) : 0

      // Extraer y formatear año
      if (parts.length > 2 && parts[2]) {
        if (parts[2].length <= 2) {
          const twoDigitYear = Number.parseInt(parts[2], 10)
          year = 2000 + twoDigitYear
          formatted = `${parts[0]}/${parts[1]}/${year}`
        } else {
          year = Number.parseInt(parts[2], 10)
        }
      } else {
        year = new Date().getFullYear()
      }
    }
    // Si el usuario no incluyó barras
    else {
      const numericValue = input.replace(/\D/g, "")

      if (numericValue.length < 4) {
        return { formatted: input, isValid: false, date: null }
      }

      day = Number.parseInt(numericValue.substring(0, 2), 10)
      month = Number.parseInt(numericValue.substring(2, 4), 10)

      if (numericValue.length >= 5) {
        const yearStr = numericValue.substring(4)
        year = yearStr.length <= 2 ? 2000 + Number.parseInt(yearStr, 10) : Number.parseInt(yearStr, 10)
      } else {
        year = new Date().getFullYear()
      }

      formatted = `${numericValue.substring(0, 2)}/${numericValue.substring(2, 4)}/${year}`
    }

    // Validar día y mes
    const isValidDay = day >= 1 && day <= 31
    const isValidMonth = month >= 1 && month <= 12

    // Validar días según el mes
    let maxDaysInMonth = 31
    if ([4, 6, 9, 11].includes(month)) {
      maxDaysInMonth = 30
    } else if (month === 2) {
      // Verificar si es año bisiesto
      const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
      maxDaysInMonth = isLeapYear ? 29 : 28
    }

    const isDayValidForMonth = day <= maxDaysInMonth

    // La fecha es válida si el día y el mes son válidos
    const isValid = isValidDay && isValidMonth && isDayValidForMonth && year >= 1900 && year <= 2100

    let dateObj: Date | null = null
    if (isValid) {
      dateObj = new Date(year, month - 1, day)
    }

    return { formatted, isValid, date: dateObj }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value

    // Si el usuario está borrando, permitirlo
    if (inputValue.length < inputValue.length) {
      setInputValue(inputValue)
      setIsError(false)
      return
    }

    // Filtrar caracteres no permitidos
    inputValue = inputValue.replace(/[^\d/]/g, "")

    // Limitar a 10 caracteres
    const limitedValue = inputValue.length <= 10 ? inputValue : inputValue.slice(0, 10)

    // Asegurar que solo haya dos "/" en la entrada
    const parts = limitedValue.split("/")
    if (parts.length > 3) {
      setInputValue(parts[0] + "/" + parts[1] + "/" + parts.slice(2).join(""))
    } else {
      setInputValue(limitedValue)
    }

    // Formateo automático al escribir
    if (limitedValue.length === 2 && !limitedValue.includes("/") && !inputValue.includes("/")) {
      setInputValue(limitedValue + "/")
    } else if (limitedValue.length === 5 && limitedValue.split("/").length === 2 && !limitedValue.endsWith("/")) {
      setInputValue(limitedValue + "/")
    }

    setIsError(false)
  }

  const finalizeInput = () => {
    if (inputValue.trim()) {
      const { formatted, isValid, date: newDate } = validateDate(inputValue)
      setInputValue(formatted)
      setIsError(!isValid)

      if (isValid && newDate) {
        setDate(newDate)
        if (onChange) {
          onChange(newDate)
        }
      } else if (!isValid && onChange) {
        onChange(null)
      }
    } else {
      setInputValue("")
      setIsError(false)
      setDate(undefined)
      if (onChange) {
        onChange(null)
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      finalizeInput()
      setOpen(false)
    } else if (e.key === "Escape") {
      setInputValue("")
      setIsError(false)
      setDate(undefined)
      if (onChange) {
        onChange(null)
      }
      setOpen(false)
    }
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const formattedDate = format(selectedDate, "dd/MM/yyyy")
      setInputValue(formattedDate)
      setDate(selectedDate)
      setIsError(false)
      if (onChange) {
        onChange(selectedDate)
      }
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative inline-block w-full">
          <Input
            type="text"
            value={inputValue}
            onChange={handleChange}
            onBlur={finalizeInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              "w-full h-10 text-center pr-8 bg-gray-50 border-gray-300 focus-visible:ring-0",
              className,
              isError ? "border-red-500" : "focus-visible:border-gray-400",
            )}
            maxLength={10}
          />
          <CalendarIcon className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-700" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white z-50" align="center">
        <CustomCalendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
          month={date}
          modifiersStyles={{
            today: {
              color: "black",
              backgroundColor: "#f3f4f6",
              fontWeight: "500",
            },
            selected: {
              backgroundColor: "#001a33",
              color: "white",
            },
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
