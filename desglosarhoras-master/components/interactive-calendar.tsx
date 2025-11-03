"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addDays,
  startOfWeek,
  isWithinInterval,
} from "date-fns"
import type { TimeEntry } from "@/types"

interface InteractiveCalendarProps {
  entries: TimeEntry[]
  onSelectDay: (date: Date) => void
  selectedDate: Date | null
  startDate?: Date | null
  endDate?: Date | null
}

export default function InteractiveCalendar({
  entries,
  onSelectDay,
  selectedDate,
  startDate,
  endDate,
}: InteractiveCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Nombres de meses en español
  const monthNames = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ]

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: addDays(monthEnd, 7 - monthEnd.getDay()),
  })

  const isInSelectedPeriod = (date: Date) => {
    if (!startDate || !endDate) return false

    // Asegurarse de que start sea anterior o igual a end
    const start = startDate <= endDate ? startDate : endDate
    const end = startDate <= endDate ? endDate : startDate

    try {
      return isWithinInterval(date, { start, end })
    } catch (error) {
      console.error("Error checking interval:", error)
      return false
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="p-1 rounded-md hover:bg-gray-100"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold capitalize text-center">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="p-1 rounded-md hover:bg-gray-100"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const entry = entries.find((e) => isSameDay(e.date, day))
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const inPeriod = isInSelectedPeriod(day)

          return (
            <button
              key={day.toString()}
              onClick={() => onSelectDay(day)}
              className={`
                w-full aspect-square flex flex-col items-center justify-center p-1 rounded-lg transition-colors
                ${!isCurrentMonth ? "text-gray-400" : ""}
                ${isSelected ? "bg-[#002244] text-white hover:bg-[#003366]" : "hover:bg-gray-50"}
                ${inPeriod && !isSelected ? "bg-gray-100" : ""}
              `}
            >
              <span className="text-sm font-medium">{format(day, "d")}</span>
              {entry?.position && <span className="text-xs mt-0.5 font-medium">{entry.position}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
