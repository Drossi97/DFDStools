"use client"

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
  // Comprobar si el día actual es festivo
  const isCurrentDayHoliday = holidays.some((holiday) => isSameDay(holiday, date))

  // Comprobar si el día siguiente es festivo (para turnos que cruzan la medianoche)
  const nextDay = addDays(date, 1)
  const isNextDayHoliday = holidays.some((holiday) => isSameDay(holiday, nextDay))

  if (isCurrentDayHoliday) {
    // Si el día actual es festivo, calcular las horas trabajadas en este día
    const dayEnd = endOfDay(date)
    const endTimeForCalc = endDate < dayEnd ? endDate : dayEnd
    result.holiday += (endTimeForCalc.getTime() - startDate.getTime()) / (1000 * 60 * 60)
  }

  if (isNextDayHoliday && endDate > startOfDay(nextDay)) {
    // Si el día siguiente es festivo y el turno se extiende a ese día
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

  // Estado para intervalos de tiempo
  const [timeIntervals, setTimeIntervals] = useState<Record<string, { start: string; end: string }>>({})

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
          // Asegurarse de que startDate sea anterior o igual a endDate
          const start =
            updatedPeriod.startDate <= updatedPeriod.endDate ? updatedPeriod.startDate : updatedPeriod.endDate

          const end = updatedPeriod.startDate <= updatedPeriod.endDate ? updatedPeriod.endDate : updatedPeriod.startDate

          const allDays = eachDayOfInterval({
            start,
            end,
          })

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
          // En caso de error, limpiar las entradas
          setEntries([])
        }
      } else {
        setEntries([])
      }
    },
    [period],
  )

  // Añadir posición personalizada con desgloses
  const addCustomPosition = useCallback(
    (name: string, start: string, end: string, standardHours?: number, desgloseIds?: string[]) => {
      const positionId = name // Usar el nombre como ID del puesto

      // Crear el puesto
      setCustomPositions((prev) => ({
        ...prev,
        [positionId]: {
          start,
          end,
          standardHours,
          desgloses: desgloseIds || [],
        },
      }))
    },
    [],
  )

  // Modificar la función addCustomDesglose para incluir los intervalos de tiempo
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

      // Si se proporcionan intervalos de tiempo, recalcular entradas
      if (timeStart && timeEnd) {
        recalculateEntriesForInterval(id, timeStart, timeEnd)
      }
    },
    [],
  )

  // Añadir una función para actualizar el intervalo de un desglose existente
  const updateDesgloseInterval = useCallback((desgloseId: string, timeStart: string, timeEnd: string) => {
    // Actualizar el desglose
    setCustomDesgloses((prev) => {
      const updatedDesgloses = { ...prev }
      if (updatedDesgloses[desgloseId]) {
        updatedDesgloses[desgloseId] = {
          ...updatedDesgloses[desgloseId],
          timeStart,
          timeEnd,
        }
      }
      return updatedDesgloses
    })

    // Recalcular todas las entradas para aplicar este intervalo
    recalculateEntriesForInterval(desgloseId, timeStart, timeEnd)
  }, [])

  // Modificar la función recalculateEntriesForInterval para respetar los valores editados manualmente
  const recalculateEntriesForInterval = useCallback(
    (desgloseId: string, startTime: string, endTime: string) => {
      if (!startTime || !endTime) return

      setEntries((prevEntries) =>
        prevEntries.map((entry) => {
          if (!NO_HOURS_POSITIONS.includes(entry.position) && entry.workStart && entry.workEnd) {
            // Verificar si este desglose está asociado con la posición actual
            const position = customPositions[entry.position]
            if (!position || !position.desgloses || !position.desgloses.includes(desgloseId)) {
              return entry
            }

            const newEntry = { ...entry }
            const newCustomHours = { ...(newEntry.customHours || {}) }

            // Verificar si el valor fue editado manualmente
            const manualEditFlag = newCustomHours[desgloseId + "_manual"]

            // Si el valor fue editado manualmente, no lo recalculamos automáticamente
            if (manualEditFlag) {
              return newEntry
            }

            const intervalStart = new Date(`${format(entry.date, "yyyy-MM-dd")}T${startTime}:00`)
            let intervalEnd = new Date(`${format(entry.date, "yyyy-MM-dd")}T${endTime}:00`)

            // Si el fin es antes que el inicio, asumimos que es del día siguiente
            if (intervalEnd <= intervalStart) {
              intervalEnd = new Date(intervalEnd.getTime() + 24 * 60 * 60 * 1000)
            }

            const workStart = new Date(`${format(entry.date, "yyyy-MM-dd")}T${entry.workStart}:00`)
            let workEnd = new Date(`${format(entry.date, "yyyy-MM-dd")}T${entry.workEnd}:00`)

            // Si el fin es antes que el inicio, asumimos que es del día siguiente
            if (workEnd <= workStart) {
              workEnd = new Date(workEnd.getTime() + 24 * 60 * 60 * 1000)
            }

            // Calcular superposición
            const overlapStart = new Date(Math.max(workStart.getTime(), intervalStart.getTime()))
            const overlapEnd = new Date(Math.min(workEnd.getTime(), intervalEnd.getTime()))

            if (overlapStart < overlapEnd) {
              const overlapMilliseconds = overlapEnd.getTime() - overlapStart.getTime()
              const overlapHours = overlapMilliseconds / (1000 * 60 * 60)
              newCustomHours[desgloseId] = overlapHours
            } else {
              newCustomHours[desgloseId] = 0
            }

            newEntry.customHours = newCustomHours
            return newEntry
          }
          return entry
        }),
      )
    },
    [customPositions],
  )

  // Eliminar desglose personalizado
  const removeCustomDesglose = useCallback((id: string) => {
    // Eliminar el desglose
    setCustomDesgloses((prev) => {
      const newDesgloses = { ...prev }
      delete newDesgloses[id]
      return newDesgloses
    })

    // Eliminar este desglose de todas las posiciones que lo usan
    setCustomPositions((prev) => {
      const newPositions = { ...prev }
      Object.entries(newPositions).forEach(([posId, position]) => {
        if (position.desgloses && position.desgloses.includes(id)) {
          newPositions[posId] = {
            ...position,
            desgloses: position.desgloses.filter((desgloseId) => desgloseId !== id),
          }
        }
      })
      return newPositions
    })

    // Eliminar este desglose de todas las entradas
    setEntries((prevEntries) =>
      prevEntries.map((entry) => {
        const newEntry = { ...entry }
        if (newEntry.customHours && newEntry.customHours[id]) {
          const newCustomHours = { ...newEntry.customHours }
          delete newCustomHours[id]
          newEntry.customHours = newCustomHours
        }
        return entry
      }),
    )
  }, [])

  // Actualizar configuración de horas
  const updateHoursConfig = useCallback(
    (config: Partial<HoursConfig>) => {
      setHoursConfig((prev) => {
        const updated = { ...prev, ...config }

        // Recalcular todas las entradas
        setEntries((entries) =>
          entries.map((entry) => {
            if (!NO_HOURS_POSITIONS.includes(entry.position) && entry.workStart && entry.workEnd) {
              const position = customPositions[entry.position]
              const specificStandardHours = position?.standardHours

              const hours = calculateHours(entry.workStart, entry.workEnd, holidays, entry.date)

              return {
                ...entry,
                totalHours: hours.total,
                nightHours: 0,
                extraHours: Math.max(0, hours.total - (specificStandardHours || updated.standardDailyHours)),
                holidayHours: hours.holiday,
              }
            }
            return entry
          }),
        )

        return updated
      })
    },
    [holidays, customPositions],
  )

  // Alternar festivo para una fecha
  const toggleHoliday = useCallback(
    (date: Date) => {
      setHolidays((prevHolidays) => {
        const isAlreadyHoliday = prevHolidays.some((holiday) => isSameDay(holiday, date))
        const updatedHolidays = isAlreadyHoliday
          ? prevHolidays.filter((holiday) => !isSameDay(holiday, date))
          : [...prevHolidays, date]

        // Recalcular entradas afectadas
        setEntries((prevEntries) =>
          prevEntries.map((entry) => {
            // Comprobar si esta entrada o una entrada del día anterior/siguiente está afectada
            if (
              isSameDay(entry.date, date) ||
              isSameDay(entry.date, subDays(date, 1)) ||
              isSameDay(entry.date, addDays(date, 1))
            ) {
              if (!NO_HOURS_POSITIONS.includes(entry.position) && entry.workStart && entry.workEnd) {
                // Obtener configuración específica del puesto si existe
                const position = customPositions[entry.position]
                const specificStandardHours = position?.standardHours

                const hours = calculateHours(entry.workStart, entry.workEnd, updatedHolidays, entry.date)

                return {
                  ...entry,
                  totalHours: hours.total,
                  nightHours: 0,
                  extraHours: Math.max(0, hours.total - (specificStandardHours || hoursConfig.standardDailyHours)),
                  holidayHours: hours.holiday,
                }
              }
            }
            return entry
          }),
        )

        return updatedHolidays
      })
    },
    [hoursConfig, customPositions],
  )

  // Actualizar entrada
  const updateEntry = useCallback(
    (entryId: string, updates: Partial<TimeEntry>) => {
      setEntries((prevEntries) => {
        return prevEntries.map((entry) => {
          if (entry.id === entryId) {
            const updatedEntry = { ...entry, ...updates }

            // Si se actualiza la posición, actualizar shift times y configuración específica
            if (updates.position !== undefined) {
              if (NO_HOURS_POSITIONS.includes(updates.position)) {
                // Si es un puesto especial (baja, permiso, etc.), resetear todos los valores
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
                // Si es un puesto normal con horario
                const position = customPositions[updates.position]

                if (position) {
                  updatedEntry.shiftStart = position.start
                  updatedEntry.shiftEnd = position.end
                  updatedEntry.workStart = position.start
                  updatedEntry.workEnd = position.end

                  // Usar configuración específica del puesto si existe
                  const specificStandardHours = position.standardHours

                  // Calcular horas con configuración específica o global
                  if (
                    !NO_HOURS_POSITIONS.includes(updatedEntry.position) &&
                    updatedEntry.workStart &&
                    updatedEntry.workEnd
                  ) {
                    const hours = calculateHours(
                      updatedEntry.workStart,
                      updatedEntry.workEnd,
                      holidays,
                      updatedEntry.date,
                    )

                    updatedEntry.totalHours = hours.total
                    updatedEntry.nightHours = 0
                    updatedEntry.extraHours = Math.max(
                      0,
                      hours.total - (specificStandardHours || hoursConfig.standardDailyHours),
                    )
                    updatedEntry.holidayHours = hours.holiday

                    // Inicializar horas personalizadas para los desgloses de este puesto
                    const newCustomHours: Record<string, number> = {}

                    // Obtener los desgloses asociados a este puesto
                    const positionDesgloses = position.desgloses || []

                    // Calcular las horas solo para los desgloses asociados a este puesto
                    positionDesgloses.forEach((desgloseId) => {
                      // Obtener el intervalo de tiempo para este desglose
                      const desglose = customDesgloses[desgloseId]
                      if (!desglose) return

                      const interval = {
                        start: desglose.timeStart || "",
                        end: desglose.timeEnd || "",
                      }

                      // Si hay un intervalo definido y tenemos horas de trabajo, calcular la superposición
                      if (interval.start && interval.end && updatedEntry.workStart && updatedEntry.workEnd) {
                        const workStart = new Date(
                          `${format(updatedEntry.date, "yyyy-MM-dd")}T${updatedEntry.workStart}:00`,
                        )
                        let workEnd = new Date(`${format(updatedEntry.date, "yyyy-MM-dd")}T${updatedEntry.workEnd}:00`)

                        // Si el fin es antes que el inicio, asumimos que es del día siguiente
                        if (workEnd <= workStart) {
                          workEnd = new Date(workEnd.getTime() + 24 * 60 * 60 * 1000)
                        }

                        const intervalStart = new Date(
                          `${format(updatedEntry.date, "yyyy-MM-dd")}T${interval.start}:00`,
                        )
                        let intervalEnd = new Date(`${format(updatedEntry.date, "yyyy-MM-dd")}T${interval.end}:00`)

                        // Si el fin del intervalo es antes que el inicio, asumimos que es del día siguiente
                        if (intervalEnd <= intervalStart) {
                          intervalEnd = new Date(intervalEnd.getTime() + 24 * 60 * 60 * 1000)
                        }

                        // Calcular superposición
                        const overlapStart = new Date(Math.max(workStart.getTime(), intervalStart.getTime()))
                        const overlapEnd = new Date(Math.min(workEnd.getTime(), intervalEnd.getTime()))

                        if (overlapStart < overlapEnd) {
                          const overlapMilliseconds = overlapEnd.getTime() - overlapStart.getTime()
                          const overlapHours = overlapMilliseconds / (1000 * 60 * 60)
                          newCustomHours[desgloseId] = overlapHours
                        } else {
                          newCustomHours[desgloseId] = 0
                        }
                      } else {
                        // Si no hay intervalo definido o no hay horas de trabajo, inicializar a 0
                        newCustomHours[desgloseId] = 0
                      }
                    })

                    updatedEntry.customHours = newCustomHours
                  }
                }
              }
            }

            // Actualizar horas personalizadas si se proporciona
            if (updates.customHours) {
              updatedEntry.customHours = {
                ...(updatedEntry.customHours || {}),
                ...updates.customHours,
              }
            }

            // Calcular horas si es necesario
            if (!NO_HOURS_POSITIONS.includes(updatedEntry.position) && updatedEntry.workStart && updatedEntry.workEnd) {
              // Obtener configuración específica del puesto si existe
              const position = customPositions[updatedEntry.position]
              const specificStandardHours = position?.standardHours

              const hours = calculateHours(updatedEntry.workStart, updatedEntry.workEnd, holidays, updatedEntry.date)

              updatedEntry.totalHours = hours.total
              updatedEntry.nightHours = 0
              updatedEntry.extraHours = Math.max(
                0,
                hours.total - (specificStandardHours || hoursConfig.standardDailyHours),
              )
              updatedEntry.holidayHours = hours.holiday

              // Recalcular horas personalizadas para los desgloses si se han actualizado las horas de trabajo
              if (updates.workStart !== undefined || updates.workEnd !== undefined) {
                // Obtener los desgloses asociados a este puesto
                const position = customPositions[updatedEntry.position]
                const positionDesgloses = position?.desgloses || []
                const newCustomHours = { ...(updatedEntry.customHours || {}) }

                // Obtener todos los desgloses globales (sin positionId)
                const globalDesgloses = Object.entries(customDesgloses)
                  .filter(([_, desglose]) => !desglose.positionId)
                  .map(([id]) => id)

                // Combinar desgloses específicos del puesto y globales
                const allDesgloses = [...new Set([...positionDesgloses, ...globalDesgloses])]

                allDesgloses.forEach((desgloseId) => {
                  // Verificar si el valor fue editado manualmente
                  const manualEditFlag = newCustomHours[desgloseId + "_manual"]

                  // Si el valor fue editado manualmente, no lo recalculamos automáticamente
                  if (manualEditFlag) {
                    return
                  }

                  // Obtener el intervalo de tiempo para este desglose
                  const desglose = customDesgloses[desgloseId]
                  const interval = {
                    start: desglose?.timeStart || "",
                    end: desglose?.timeEnd || "",
                  }

                  // Si hay un intervalo definido, calcular la superposición
                  if (interval.start && interval.end) {
                    const workStart = new Date(
                      `${format(updatedEntry.date, "yyyy-MM-dd")}T${updatedEntry.workStart}:00`,
                    )
                    let workEnd = new Date(`${format(updatedEntry.date, "yyyy-MM-dd")}T${updatedEntry.workEnd}:00`)

                    // Si el fin es antes que el inicio, asumimos que es del día siguiente
                    if (workEnd <= workStart) {
                      workEnd = new Date(workEnd.getTime() + 24 * 60 * 60 * 1000)
                    }

                    const intervalStart = new Date(`${format(updatedEntry.date, "yyyy-MM-dd")}T${interval.start}:00`)
                    let intervalEnd = new Date(`${format(updatedEntry.date, "yyyy-MM-dd")}T${interval.end}:00`)

                    // Si el fin del intervalo es antes que el inicio, asumimos que es del día siguiente
                    if (intervalEnd <= intervalStart) {
                      intervalEnd = new Date(intervalEnd.getTime() + 24 * 60 * 60 * 1000)
                    }

                    // Calcular superposición
                    const overlapStart = new Date(Math.max(workStart.getTime(), intervalStart.getTime()))
                    const overlapEnd = new Date(Math.min(workEnd.getTime(), intervalEnd.getTime()))

                    if (overlapStart < overlapEnd) {
                      const overlapMilliseconds = overlapEnd.getTime() - overlapStart.getTime()
                      const overlapHours = overlapMilliseconds / (1000 * 60 * 60)
                      newCustomHours[desgloseId] = overlapHours
                    } else {
                      newCustomHours[desgloseId] = 0
                    }
                  }
                })

                updatedEntry.customHours = newCustomHours
              }
            }

            return updatedEntry
          }
          return entry
        })
      })
    },
    [holidays, hoursConfig, customPositions, customDesgloses],
  )

  // Guardar intervalo de tiempo
  const saveTimeInterval = useCallback(
    (desgloseId: string, startTime: string, endTime: string) => {
      // Actualizar el intervalo
      setTimeIntervals((prev) => ({
        ...prev,
        [desgloseId]: { start: startTime, end: endTime },
      }))

      // Actualizar también el desglose para mantener la consistencia
      setCustomDesgloses((prev) => {
        const updatedDesgloses = { ...prev }
        if (updatedDesgloses[desgloseId]) {
          updatedDesgloses[desgloseId] = {
            ...updatedDesgloses[desgloseId],
            timeStart: startTime,
            timeEnd: endTime,
          }
        }
        return updatedDesgloses
      })

      // Recalcular todas las entradas para aplicar este intervalo
      recalculateEntriesForInterval(desgloseId, startTime, endTime)
    },
    [recalculateEntriesForInterval],
  )

  // Actualizar un puesto existente
  const updatePosition = useCallback(
    (
      id: string,
      updates: {
        start: string
        end: string
        standardHours?: number
        desgloses?: string[]
      },
    ) => {
      // Obtener los desgloses anteriores antes de actualizar el estado
      const previousDesgloses = customPositions[id]?.desgloses || []
      const newDesgloses = updates.desgloses || []

      // Identificar los desgloses que se han eliminado y los que se han añadido
      const removedDesgloses = previousDesgloses.filter((desgloseId) => !newDesgloses.includes(desgloseId))

      const addedDesgloses = newDesgloses.filter((desgloseId) => !previousDesgloses.includes(desgloseId))

      // Actualizar el puesto
      setCustomPositions((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          ...updates,
        },
      }))

      // Actualizar todas las entradas que usan este puesto
      setEntries((prevEntries) =>
        prevEntries.map((entry) => {
          if (entry.position === id) {
            // Crear una copia de la entrada para modificarla
            const updatedEntry = { ...entry }

            // Actualizar horarios del turno y jornada si coinciden con los originales
            const currentPosition = customPositions[id]
            if (currentPosition) {
              if (entry.shiftStart === currentPosition.start && entry.shiftEnd === currentPosition.end) {
                updatedEntry.shiftStart = updates.start
                updatedEntry.shiftEnd = updates.end
              }

              if (entry.workStart === currentPosition.start && entry.workEnd === currentPosition.end) {
                updatedEntry.workStart = updates.start
                updatedEntry.workEnd = updates.end
              }
            }

            // Recalcular horas si es necesario
            if (updatedEntry.workStart && updatedEntry.workEnd) {
              const hours = calculateHours(updatedEntry.workStart, updatedEntry.workEnd, holidays, updatedEntry.date)

              updatedEntry.totalHours = hours.total
              updatedEntry.nightHours = 0
              updatedEntry.extraHours = Math.max(
                0,
                hours.total - (updates.standardHours || hoursConfig.standardDailyHours),
              )
              updatedEntry.holidayHours = hours.holiday
            }

            // Gestionar los desgloses personalizados
            const newCustomHours = { ...(updatedEntry.customHours || {}) }

            // 1. Eliminar los desgloses que ya no están asociados al puesto
            removedDesgloses.forEach((desgloseId) => {
              if (desgloseId in newCustomHours) {
                delete newCustomHours[desgloseId]
              }
              // También eliminar el flag de edición manual si existe
              if (`${desgloseId}_manual` in newCustomHours) {
                delete newCustomHours[`${desgloseId}_manual`]
              }
            })

            // 2. Añadir los nuevos desgloses con cálculo automático
            addedDesgloses.forEach((desgloseId) => {
              const desglose = customDesgloses[desgloseId]
              if (!desglose) return

              // Solo calcular si tiene intervalos definidos
              if (desglose.timeStart && desglose.timeEnd && updatedEntry.workStart && updatedEntry.workEnd) {
                const workStart = new Date(`${format(updatedEntry.date, "yyyy-MM-dd")}T${updatedEntry.workStart}:00`)
                let workEnd = new Date(`${format(updatedEntry.date, "yyyy-MM-dd")}T${updatedEntry.workEnd}:00`)

                // Si el fin es antes que el inicio, asumimos que es del día siguiente
                if (workEnd <= workStart) {
                  workEnd = new Date(workEnd.getTime() + 24 * 60 * 60 * 1000)
                }

                const intervalStart = new Date(`${format(updatedEntry.date, "yyyy-MM-dd")}T${desglose.timeStart}:00`)
                let intervalEnd = new Date(`${format(updatedEntry.date, "yyyy-MM-dd")}T${desglose.timeEnd}:00`)

                // Si el fin del intervalo es antes que el inicio, asumimos que es del día siguiente
                if (intervalEnd <= intervalStart) {
                  intervalEnd = new Date(intervalEnd.getTime() + 24 * 60 * 60 * 1000)
                }

                // Calcular superposición
                const overlapStart = new Date(Math.max(workStart.getTime(), intervalStart.getTime()))
                const overlapEnd = new Date(Math.min(workEnd.getTime(), intervalEnd.getTime()))

                if (overlapStart < overlapEnd) {
                  const overlapMilliseconds = overlapEnd.getTime() - overlapStart.getTime()
                  const overlapHours = overlapMilliseconds / (1000 * 60 * 60)
                  newCustomHours[desgloseId] = overlapHours
                } else {
                  newCustomHours[desgloseId] = 0
                }
              } else {
                newCustomHours[desgloseId] = 0
              }
            })

            updatedEntry.customHours = newCustomHours
            return updatedEntry
          }
          return entry
        }),
      )

      // Disparar evento para forzar actualización de la UI
      const event = new CustomEvent("positionUpdated", { detail: { id } })
      window.dispatchEvent(event)
    },
    [customPositions, holidays, hoursConfig.standardDailyHours, customDesgloses],
  )

  // Eliminar un puesto existente
  const deletePosition = useCallback((id: string) => {
    setCustomPositions((prev) => {
      const newPositions = { ...prev }
      delete newPositions[id]
      return newPositions
    })

    // Actualizar las entradas que usan este puesto
    setEntries((prevEntries) =>
      prevEntries.map((entry) => {
        if (entry.position === id) {
          return {
            ...entry,
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
          }
        }
        return entry
      }),
    )
  }, [])

  // Resumen consolidado de horas
  const summary = useMemo(() => {
    const result = entries.reduce(
      (acc, entry) => {
        acc.total += entry.totalHours
        acc.extra += entry.extraHours
        acc.night += entry.nightHours
        acc.holiday += entry.holidayHours

        // Sumar horas personalizadas
        if (entry.customHours) {
          Object.entries(entry.customHours).forEach(([id, hours]) => {
            // Solo sumar si no es un flag de edición manual
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

  // Obtener todas las posiciones disponibles (combinadas predeterminadas y personalizadas)
  const availablePositions = useMemo(() => {
    const result: Record<string, { start: string; end: string } | string> = { ...DEFAULT_SCHEDULES }

    // Añadir posiciones personalizadas
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
    timeIntervals,

    // Acciones
    updateWorkerData,
    updatePeriod,
    addCustomPosition,
    updateHoursConfig,
    toggleHoliday,
    updateEntry,
    setSelectedDate,
    addCustomDesglose,
    removeCustomDesglose,
    updateDesgloseInterval,
    updatePosition,
    deletePosition,

    // Constantes
    NO_HOURS_POSITIONS,
  }
}
