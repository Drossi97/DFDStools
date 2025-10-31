import { useState, useCallback, useMemo } from "react"
import { v4 as uuidv4 } from "uuid"
import { eachDayOfInterval, isSameDay, format, addDays, subDays, startOfDay, endOfDay } from "date-fns"
import type { TimeEntry, WorkerData, HoursConfig, PeriodConfig, CalculatedHours } from "@/types"
import {
  NO_HOURS_POSITIONS,
  DEFAULT_SCHEDULES,
  DEFAULT_POSITIONS,
  DEFAULT_DESGLOSES,
  DEFAULT_HOURS_CONFIG,
} from "@/lib/default-data"

// Función para calcular horas entre dos rangos de tiempo
function calculateHours(start: string, end: string, holidays: Date[], date: Date): CalculatedHours {
  const startDate = new Date(`${format(date, "yyyy-MM-dd")}T${start}:00`)
  let endDate = new Date(`${format(date, "yyyy-MM-dd")}T${end}:00`)

  // Si endDate es anterior a startDate, asumimos que es del día siguiente
  if (endDate <= startDate) {
    endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000)
  }

  // Calcular horas totales
  const totalMilliseconds = endDate.getTime() - startDate.getTime()
  const totalHours = totalMilliseconds / (1000 * 60 * 60)

  // Inicializar resultado con valores predeterminados
  const result: CalculatedHours = {
    total: totalHours,
    night: 0,
    holiday: 0,
    extra: 0,
    custom: {},
  }

  // Calcular horas festivas
  const isCurrentDayHoliday = holidays.some((holiday) => isSameDay(holiday, date))
  const nextDay = addDays(date, 1)
  const isNextDayHoliday = holidays.some((holiday) => isSameDay(holiday, nextDay))

  if (isCurrentDayHoliday) {
    const dayEnd = endOfDay(date)
    const endTimeForCalc = endDate < dayEnd ? endDate : dayEnd
    result.holiday += (endTimeForCalc.getTime() - startDate.getTime()) / (1000 * 60 * 60)
  }

  if (isNextDayHoliday && endDate > startOfDay(nextDay)) {
    const dayStart = startOfDay(nextDay)
    const startTimeForCalc = startDate > dayStart ? startDate : dayStart
    result.holiday += (endDate.getTime() - startTimeForCalc.getTime()) / (1000 * 60 * 60)
  }

  return result
}

export function useTimeTracker() {
  // Estado para datos del trabajador
  const [workerData, setWorkerData] = useState<WorkerData>({
    firstName: "",
    lastName: "",
    secondLastName: "",
  })

  // Estado para el período
  const [period, setPeriod] = useState<PeriodConfig>({
    startDate: null,
    endDate: null,
  })

  // Estado para las entradas
  const [entries, setEntries] = useState<TimeEntry[]>([])

  // Estado para posiciones personalizadas con sus desgloses
  const [customPositions, setCustomPositions] = useState(DEFAULT_POSITIONS)

  // Estado para días festivos
  const [holidays, setHolidays] = useState<Date[]>([])

  // Estado para la fecha seleccionada
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Estado para la configuración de horas
  const [hoursConfig, setHoursConfig] = useState<HoursConfig>(DEFAULT_HOURS_CONFIG)

  // Estado para desgloses personalizados
  const [customDesgloses, setCustomDesgloses] = useState(DEFAULT_DESGLOSES)

  // Actualizar datos del trabajador
  const updateWorkerData = useCallback((data: Partial<WorkerData>) => {
    setWorkerData((prev) => ({ ...prev, ...data }))
  }, [])

  // Actualizar período y generar entradas
  const updatePeriod = useCallback(
    (newPeriod: Partial<PeriodConfig>) => {
      setPeriod((prev) => ({ ...prev, ...newPeriod }))
      const updatedPeriod = { ...period, ...newPeriod }

      if (updatedPeriod.startDate && updatedPeriod.endDate) {
        try {
          const start = updatedPeriod.startDate <= updatedPeriod.endDate ? updatedPeriod.startDate : updatedPeriod.endDate
          const end = updatedPeriod.startDate <= updatedPeriod.endDate ? updatedPeriod.endDate : updatedPeriod.startDate

          const allDays = eachDayOfInterval({ start, end })
          const newEntries = allDays.map((date) => ({
            id: uuidv4(),
            date,
            position: "",
            shiftStart: "",
            shiftEnd: "",
            workStart: "",
            workEnd: "",
            totalHours: 0,
            extraHours: 0,
            nightHours: 0,
            holidayHours: 0,
            customHours: {},
          }))

          setEntries(newEntries)
        } catch (error) {
          console.error("Error al crear intervalo de fechas:", error)
          setEntries([])
        }
      } else {
        setEntries([])
      }
    },
    [period],
  )

  // Añadir posición personalizada
  const addCustomPosition = useCallback(
    (name: string, start: string, end: string, standardHours?: number, desgloseIds?: string[]) => {
      setCustomPositions((prev) => ({
        ...prev,
        [name]: {
          start,
          end,
          standardHours,
          desgloses: desgloseIds || [],
        },
      }))
    },
    [],
  )

  // Añadir desglose personalizado
  const addCustomDesglose = useCallback(
    (name: string, color: string, timeStart?: string, timeEnd?: string, positionId?: string) => {
      const id = uuidv4()
      setCustomDesgloses((prev) => ({
        ...prev,
        [id]: {
          name,
          color,
          positionId,
          timeStart,
          timeEnd,
        },
      }))
    },
    [],
  )

  // Eliminar desglose personalizado
  const removeCustomDesglose = useCallback((id: string) => {
    setCustomDesgloses((prev) => {
      const newDesgloses = { ...prev }
      delete newDesgloses[id]
      return newDesgloses
    })
  }, [])

  // Alternar festivo para una fecha
  const toggleHoliday = useCallback(
    (date: Date) => {
      setHolidays((prevHolidays) => {
        const isAlreadyHoliday = prevHolidays.some((holiday) => isSameDay(holiday, date))
        return isAlreadyHoliday
          ? prevHolidays.filter((holiday) => !isSameDay(holiday, date))
          : [...prevHolidays, date]
      })
    },
    [],
  )

  // Actualizar entrada
  const updateEntry = useCallback(
    (entryId: string, updates: Partial<TimeEntry>) => {
      setEntries((prevEntries) => {
        return prevEntries.map((entry) => {
          if (entry.id === entryId) {
            const updatedEntry = { ...entry, ...updates }

            // Si se actualiza la posición
            if (updates.position !== undefined) {
              if (NO_HOURS_POSITIONS.includes(updates.position)) {
                // Resetear valores para puestos especiales
                updatedEntry.shiftStart = ""
                updatedEntry.shiftEnd = ""
                updatedEntry.workStart = ""
                updatedEntry.workEnd = ""
                updatedEntry.totalHours = 0
                updatedEntry.extraHours = 0
                updatedEntry.nightHours = 0
                updatedEntry.holidayHours = 0
                updatedEntry.customHours = {}
              } else {
                // Configurar horarios para puestos normales
                const position = customPositions[updates.position]
                if (position) {
                  updatedEntry.shiftStart = position.start
                  updatedEntry.shiftEnd = position.end
                  updatedEntry.workStart = position.start
                  updatedEntry.workEnd = position.end
                }
              }
            }

            // Calcular horas si es necesario
            if (!NO_HOURS_POSITIONS.includes(updatedEntry.position) && updatedEntry.workStart && updatedEntry.workEnd) {
              const position = customPositions[updatedEntry.position]
              const specificStandardHours = position?.standardHours
              const hours = calculateHours(updatedEntry.workStart, updatedEntry.workEnd, holidays, updatedEntry.date)

              updatedEntry.totalHours = hours.total
              updatedEntry.nightHours = 0
              updatedEntry.extraHours = Math.max(0, hours.total - (specificStandardHours || hoursConfig.standardDailyHours))
              updatedEntry.holidayHours = hours.holiday
            }

            return updatedEntry
          }
          return entry
        })
      })
    },
    [customPositions, holidays, hoursConfig],
  )

  // Resumen consolidado de horas
  const summary = useMemo(() => {
    const result = entries.reduce(
      (acc, entry) => {
        acc.total += entry.totalHours
        acc.extra += entry.extraHours
        acc.night += entry.nightHours
        acc.holiday += entry.holidayHours

        if (entry.customHours) {
          Object.entries(entry.customHours).forEach(([id, hours]) => {
            if (!id.endsWith("_manual")) {
              acc.custom[id] = (acc.custom[id] || 0) + hours
            }
          })
        }

        return acc
      },
      { total: 0, extra: 0, night: 0, holiday: 0, custom: {} as Record<string, number> },
    )

    return result
  }, [entries])

  // Obtener todas las posiciones disponibles
  const availablePositions = useMemo(() => {
    const result: Record<string, { start: string; end: string } | string> = { ...DEFAULT_SCHEDULES }

    Object.entries(customPositions).forEach(([key, value]) => {
      result[key] = { start: value.start, end: value.end }
    })

    return result
  }, [customPositions])

  return {
    // Estado
    workerData,
    period,
    entries,
    customPositions,
    holidays,
    selectedDate,
    hoursConfig,
    summary,
    availablePositions,
    customDesgloses,

    // Acciones
    updateWorkerData,
    updatePeriod,
    addCustomPosition,
    toggleHoliday,
    updateEntry,
    setSelectedDate,
    addCustomDesglose,
    removeCustomDesglose,

    // Constantes
    NO_HOURS_POSITIONS,
  }
}
