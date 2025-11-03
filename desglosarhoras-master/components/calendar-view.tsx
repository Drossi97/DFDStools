"use client"

import { isSameDay } from "date-fns"
import { Calendar } from "lucide-react"
import type { TimeEntry } from "@/types"
import { CollapsibleSection } from "./ui/collapsible-section"
import InteractiveCalendar from "./interactive-calendar"
import DayCard from "./day-card"

interface CalendarViewProps {
  entries: TimeEntry[]
  selectedDate: Date | null
  startDate: Date | null
  endDate: Date | null
  holidays: Date[]
  availablePositions: Record<string, { start: string; end: string } | string>
  noHoursPositions: string[]
  nightStart: string
  nightEnd: string
  standardDailyHours: number
  onSelectDay: (date: Date) => void
  onToggleHoliday: (date: Date) => void
  onUpdateEntry: (entryId: string, updates: Partial<TimeEntry>) => void
  customDesgloses: Record<string, { name: string; color: string; positionId?: string }>
  customPositions: Record<string, { start: string; end: string; standardHours?: number; desgloses?: string[] }>
}

export function CalendarView({
  entries,
  selectedDate,
  startDate,
  endDate,
  holidays,
  availablePositions,
  noHoursPositions,
  nightStart,
  nightEnd,
  standardDailyHours,
  onSelectDay,
  onToggleHoliday,
  onUpdateEntry,
  customDesgloses,
  customPositions,
}: CalendarViewProps) {
  const selectedEntry = entries.find((entry) => selectedDate && isSameDay(entry.date, selectedDate))

  return (
    <CollapsibleSection title="Calendario" icon={<Calendar className="section-icon text-white" />}>
      <div className="flex flex-col md:flex-row md:divide-x divide-border">
        <div className="md:w-1/2 md:pr-6">
          <InteractiveCalendar
            entries={entries}
            onSelectDay={onSelectDay}
            selectedDate={selectedDate}
            startDate={startDate}
            endDate={endDate}
          />
        </div>
        <div className="md:w-1/2 md:pl-6 mt-6 md:mt-0">
          {selectedEntry ? (
            <DayCard
              key={`${selectedEntry.id}-${JSON.stringify(selectedEntry.position)}`}
              entry={selectedEntry}
              onUpdateEntry={onUpdateEntry}
              onToggleHoliday={onToggleHoliday}
              availablePositions={availablePositions}
              isHoliday={holidays.some(
                (holiday) => holiday && selectedEntry.date && isSameDay(holiday, selectedEntry.date),
              )}
              noHoursPositions={noHoursPositions}
              standardDailyHours={standardDailyHours}
              nightStart={nightStart}
              nightEnd={nightEnd}
              customDesgloses={customDesgloses}
              customPositions={customPositions}
            />
          ) : (
            <p className="text-center text-muted-foreground">Seleccione un día para ver los detalles</p>
          )}
        </div>
      </div>
    </CollapsibleSection>
  )
}
