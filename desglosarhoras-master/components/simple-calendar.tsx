"use client"

import { useState } from "react"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface SimpleCalendarProps {
  selectedDate?: Date
  onChange?: (date: Date) => void
}

export default function SimpleCalendar({ selectedDate, onChange }: SimpleCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selected, setSelected] = useState<Date | undefined>(selectedDate)

  const daysOfWeek = ["lu", "ma", "mi", "ju", "vi", "sá", "do"]

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

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const onDateClick = (day: Date) => {
    setSelected(day)
    if (onChange) {
      onChange(day)
    }
  }

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-4 py-2">
        <button onClick={prevMonth} className="p-1 rounded-full hover:bg-gray-200" aria-label="Mes anterior">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center font-medium">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <button onClick={nextMonth} className="p-1 rounded-full hover:bg-gray-200" aria-label="Mes siguiente">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    )
  }

  const renderDays = () => {
    return (
      <div className="grid grid-cols-7 mb-2">
        {daysOfWeek.map((day, i) => (
          <div key={i} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>
    )
  }

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const rows = []
    let days = []
    let day = startDate

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day
        days.push(
          <div
            key={day.toString()}
            className={`relative p-1 text-center cursor-pointer ${
              !isSameMonth(day, monthStart) ? "text-gray-400" : ""
            }`}
            onClick={() => onDateClick(cloneDay)}
          >
            <div
              className={`inline-flex items-center justify-center w-8 h-8 rounded-md ${
                isSameDay(day, selected || new Date())
                  ? isSameDay(day, new Date()) && !isSameDay(day, selected || new Date())
                    ? "bg-gray-200"
                    : "bg-[#002244] text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              {format(day, "d")}
            </div>
          </div>,
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>,
      )
      days = []
    }
    return <div className="bg-white">{rows}</div>
  }

  return (
    <div className="border rounded-md shadow bg-white">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  )
}
