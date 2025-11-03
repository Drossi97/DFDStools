"use client"

import type React from "react"

import { useReducer, type KeyboardEvent, useEffect } from "react"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { CalendarIcon } from "lucide-react"
import SimpleCalendar from "./simple-calendar"
import { cn } from "@/lib/utils"

interface SimpleDateInputProps {
  onChange?: (date: Date | null) => void
  value?: Date | null
  className?: string
  placeholder?: string
}

// Definir el estado y las acciones
type State = {
  inputValue: string
  isError: boolean
  date: Date | undefined
  open: boolean
  pendingChange: Date | null | undefined // Para manejar cambios pendientes
}

type Action =
  | { type: "SET_INPUT_VALUE"; payload: string }
  | { type: "SET_ERROR"; payload: boolean }
  | { type: "SET_DATE"; payload: Date | undefined }
  | { type: "SET_OPEN"; payload: boolean }
  | { type: "RESET" }
  | { type: "FINALIZE_INPUT" }
  | { type: "SELECT_DATE"; payload: Date }
  | { type: "SET_PENDING_CHANGE"; payload: Date | null | undefined }
  | { type: "CLEAR_PENDING_CHANGE" }

// Función para validar fechas
const validateDate = (input: string): { formatted: string; isValid: boolean; date: Date | null } => {
  if (!input.trim()) {
    return { formatted: "", isValid: true, date: null }
  }

  let day = 0,
    month = 0,
    year = 0
  let formatted = input

  if (input.includes("/")) {
    const parts = input.split("/")
    day = Number.parseInt(parts[0] || "0", 10)
    month = parts.length > 1 ? Number.parseInt(parts[1] || "0", 10) : 0

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
  } else {
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

  const isValidDay = day >= 1 && day <= 31
  const isValidMonth = month >= 1 && month <= 12

  let maxDaysInMonth = 31
  if ([4, 6, 9, 11].includes(month)) {
    maxDaysInMonth = 30
  } else if (month === 2) {
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
    maxDaysInMonth = isLeapYear ? 29 : 28
  }

  const isDayValidForMonth = day <= maxDaysInMonth
  const isValid = isValidDay && isValidMonth && isDayValidForMonth && year >= 1900 && year <= 2100

  let dateObj: Date | null = null
  if (isValid) {
    dateObj = new Date(year, month - 1, day)
  }

  return { formatted, isValid, date: dateObj }
}

// Reducer para manejar el estado
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_INPUT_VALUE":
      return { ...state, inputValue: action.payload }
    case "SET_ERROR":
      return { ...state, isError: action.payload }
    case "SET_DATE":
      return { ...state, date: action.payload }
    case "SET_OPEN":
      return { ...state, open: action.payload }
    case "RESET":
      return {
        ...state,
        inputValue: "",
        isError: false,
        date: undefined,
        pendingChange: null, // Establecer cambio pendiente en lugar de llamar a onChange directamente
      }
    case "FINALIZE_INPUT": {
      if (state.inputValue.trim()) {
        const { formatted, isValid, date } = validateDate(state.inputValue)

        return {
          ...state,
          inputValue: formatted,
          isError: !isValid,
          date: date || undefined,
          pendingChange: isValid ? date : null, // Establecer cambio pendiente
        }
      } else {
        return {
          ...state,
          inputValue: "",
          isError: false,
          date: undefined,
          pendingChange: null, // Establecer cambio pendiente
        }
      }
    }
    case "SELECT_DATE": {
      const formattedDate = format(action.payload, "dd/MM/yyyy")

      return {
        ...state,
        inputValue: formattedDate,
        date: action.payload,
        isError: false,
        open: false,
        pendingChange: action.payload, // Establecer cambio pendiente
      }
    }
    case "SET_PENDING_CHANGE":
      return { ...state, pendingChange: action.payload }
    case "CLEAR_PENDING_CHANGE":
      return { ...state, pendingChange: undefined }
    default:
      return state
  }
}

export default function SimpleDateInput({
  onChange,
  value,
  className = "",
  placeholder = "dd/mm/aaaa",
}: SimpleDateInputProps) {
  // Estado inicial
  const initialState: State = {
    inputValue: value ? format(value, "dd/MM/yyyy") : "",
    isError: false,
    date: value || undefined,
    open: false,
    pendingChange: undefined,
  }

  // Usar useReducer en lugar de múltiples useState
  const [state, dispatch] = useReducer(reducer, initialState)
  const { inputValue, isError, date, open, pendingChange } = state

  // Efecto para manejar cambios pendientes
  useEffect(() => {
    if (pendingChange !== undefined && onChange) {
      onChange(pendingChange)
      dispatch({ type: "CLEAR_PENDING_CHANGE" })
    }
  }, [pendingChange, onChange])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value

    if (inputValue.length < e.target.value.length) {
      dispatch({ type: "SET_INPUT_VALUE", payload: inputValue })
      dispatch({ type: "SET_ERROR", payload: false })
      return
    }

    inputValue = inputValue.replace(/[^\d/]/g, "")
    const limitedValue = inputValue.length <= 10 ? inputValue : inputValue.slice(0, 10)

    const parts = limitedValue.split("/")
    if (parts.length > 3) {
      dispatch({ type: "SET_INPUT_VALUE", payload: parts[0] + "/" + parts[1] + "/" + parts.slice(2).join("") })
    } else {
      dispatch({ type: "SET_INPUT_VALUE", payload: limitedValue })
    }

    if (limitedValue.length === 2 && !limitedValue.includes("/") && !inputValue.includes("/")) {
      dispatch({ type: "SET_INPUT_VALUE", payload: limitedValue + "/" })
    } else if (limitedValue.length === 5 && limitedValue.split("/").length === 2 && !limitedValue.endsWith("/")) {
      dispatch({ type: "SET_INPUT_VALUE", payload: limitedValue + "/" })
    }

    dispatch({ type: "SET_ERROR", payload: false })
  }

  const finalizeInput = () => {
    dispatch({ type: "FINALIZE_INPUT" })
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      finalizeInput()
      dispatch({ type: "SET_OPEN", payload: false })
    } else if (e.key === "Escape") {
      dispatch({ type: "RESET" })
      dispatch({ type: "SET_OPEN", payload: false })
    }
  }

  const handleDateSelect = (selectedDate: Date) => {
    dispatch({ type: "SELECT_DATE", payload: selectedDate })
  }

  return (
    <Popover open={open} onOpenChange={(open) => dispatch({ type: "SET_OPEN", payload: open })}>
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
        <SimpleCalendar selectedDate={date} onChange={handleDateSelect} />
      </PopoverContent>
    </Popover>
  )
}
