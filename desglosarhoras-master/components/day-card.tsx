"use client"

import { useState, useRef, useEffect, useMemo, memo } from "react"
import { format } from "date-fns"
import { ChevronDown } from "lucide-react"
import type { TimeEntry } from "@/types"
import { TimeInput } from "@/components/ui/time-input"

interface DayCardProps {
  entry: TimeEntry
  onUpdateEntry: (entryId: string, updates: Partial<TimeEntry>) => void
  onToggleHoliday: (date: Date) => void
  availablePositions: Record<string, { start: string; end: string } | string>
  isHoliday: boolean
  noHoursPositions: string[]
  standardDailyHours: number
  nightStart: string
  nightEnd: string
  customDesgloses: Record<string, { name: string; color: string; positionId?: string }>
  customPositions: Record<string, { start: string; end: string; standardHours?: number; desgloses?: string[] }>
}

function DayCard({
  entry,
  onUpdateEntry,
  onToggleHoliday,
  availablePositions,
  isHoliday,
  noHoursPositions,
  standardDailyHours,
  nightStart,
  nightEnd,
  customDesgloses,
  customPositions,
}: DayCardProps) {
  const [isSelectOpen, setIsSelectOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)
  const [shouldShowUpwards, setShouldShowUpwards] = useState(false)
  const dropdownContainerRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Nombres de días en español
  const dayNames = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsSelectOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Efecto para determinar la dirección del desplegable
  useEffect(() => {
    if (isSelectOpen && dropdownContainerRef.current) {
      const rect = dropdownContainerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      setShouldShowUpwards(spaceBelow < 240 && rect.top > 240)
    }
  }, [isSelectOpen])

  // Efecto para detectar tamaño de pantalla
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  const handleSelectPosition = (value: string) => {
    onUpdateEntry(entry.id, { position: value })
    setIsSelectOpen(false)
  }

  // Memorizar la función getPositionLabel para evitar recálculos innecesarios
  const getPositionLabel = useMemo(() => {
    return (key: string) => {
      const position = availablePositions[key]
      return typeof position === "string" ? position : key
    }
  }, [availablePositions])

  // Función para formatear valores numéricos de manera segura
  const formatNumber = (value: number): string => {
    return isNaN(value) ? "0.00" : value.toFixed(2)
  }

  // Función para obtener el nombre del día en español
  const getDayName = (date: Date): string => {
    return dayNames[date.getDay()]
  }

  // Determinar si se deben mostrar los campos de horas
  const shouldShowHoursFields = !noHoursPositions.includes(entry.position) && entry.position !== ""

  // Determinar si hay horas extras para mostrar
  const hasExtraHours = entry.extraHours > 0

  // Determinar si hay horas festivas para mostrar
  const hasHolidayHours = isHoliday || entry.holidayHours > 0

  // Filtrar desgloses para mostrar SOLO los que están actualmente asociados al puesto seleccionado
  const positionDesgloses = useMemo(() => {
    if (!entry.position || noHoursPositions.includes(entry.position)) {
      return {}
    }

    // Obtener los desgloses asociados al puesto actual
    const position = availablePositions[entry.position]
    if (typeof position === "string" || !position) {
      return {}
    }

    // Buscar en customPositions para obtener la lista de desgloses asociados
    const positionConfig = customPositions[entry.position]
    if (!positionConfig || !positionConfig.desgloses || positionConfig.desgloses.length === 0) {
      return {}
    }

    // Filtrar solo los desgloses que están actualmente asociados al puesto
    return Object.entries(customDesgloses || {})
      .filter(([id, _]) => positionConfig.desgloses?.includes(id))
      .reduce(
        (acc, [id, desglose]) => {
          acc[id] = desglose
          return acc
        },
        {} as Record<string, { name: string; color: string; positionId?: string }>,
      )
  }, [entry.position, noHoursPositions, availablePositions, customPositions, customDesgloses])

  // Verificar si hay desgloses personalizados para mostrar
  const hasCustomDesgloses =
    entry.position && !noHoursPositions.includes(entry.position) && Object.keys(positionDesgloses).length > 0

  // Filtrar desgloses personalizados con valores mayores a cero
  const activeCustomDesgloses = useMemo(() => {
    if (!hasCustomDesgloses || !entry.customHours) return {}

    return Object.entries(positionDesgloses)
      .filter(([id]) => (entry.customHours?.[id] || 0) > 0)
      .reduce(
        (acc, [id, desglose]) => {
          acc[id] = desglose
          return acc
        },
        {} as Record<string, { name: string; color: string; positionId?: string }>,
      )
  }, [positionDesgloses, entry.customHours, hasCustomDesgloses])

  // Crear un array unificado de todos los tipos de horas para mostrar
  const allHourTypes = useMemo(() => {
    const hourTypes = []

    // Añadir horas estándar si corresponde
    if (shouldShowHoursFields) {
      hourTypes.push({
        id: "total",
        name: "Horas Totales",
        value: entry.totalHours,
        color: "#002244", // Color específico para Horas Totales
        show: true,
      })

      if (hasExtraHours) {
        hourTypes.push({
          id: "extras",
          name: "Horas Extras",
          value: entry.extraHours,
          color: "#EF4444", // Rojo para horas extras
          show: true,
        })
      }

      if (hasHolidayHours) {
        hourTypes.push({
          id: "holiday",
          name: "Horas Festivas",
          value: entry.holidayHours,
          color: "#F59E0B", // Ámbar para horas festivas
          show: true,
        })
      }
    }

    // Añadir horas personalizadas activas
    Object.entries(activeCustomDesgloses).forEach(([id, desglose]) => {
      hourTypes.push({
        id,
        name: desglose.name,
        value: entry.customHours?.[id] || 0,
        color: desglose.color,
        show: true,
      })
    })

    return hourTypes
  }, [
    shouldShowHoursFields,
    hasExtraHours,
    hasHolidayHours,
    activeCustomDesgloses,
    entry.totalHours,
    entry.extraHours,
    entry.holidayHours,
    entry.customHours,
  ])

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 min-h-[400px]">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <h3 className="text-lg font-medium text-gray-900 capitalize">
          {getDayName(entry.date)} {format(entry.date, "d")}
        </h3>
        <label className="relative inline-flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={isHoliday}
              onChange={() => onToggleHoliday(entry.date)}
              className="sr-only peer"
              id={`holiday-toggle-${entry.id}`}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-0 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#002244]"></div>
          </div>
          <span className="ml-2 text-sm font-semibold text-gray-700">Marcar Día Festivo</span>
        </label>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col space-y-1 mb-4">
          <label htmlFor="position" className="text-sm font-medium text-gray-700 text-center w-full">
            Puesto
          </label>
          <div
            className="relative mt-1"
            ref={(el) => {
              selectRef.current = el
              dropdownContainerRef.current = el
            }}
          >
            <button
              type="button"
              onClick={() => setIsSelectOpen(!isSelectOpen)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-0 bg-gray-50 flex items-center justify-between"
            >
              <span>{entry.position ? getPositionLabel(entry.position) : "Seleccionar puesto"}</span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>
            {isSelectOpen && (
              <div
                className={`${isMobile ? "fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[1000]" : "absolute z-50 mt-1"} w-full`}
                onClick={isMobile ? () => setIsSelectOpen(false) : undefined}
              >
                <div
                  className={`bg-white border border-gray-300 rounded-md shadow-lg overflow-auto ${isMobile ? "w-[90%] max-h-[80vh] m-auto" : "w-full"}`}
                  style={
                    isMobile
                      ? {}
                      : {
                          maxHeight: "240px",
                          bottom: shouldShowUpwards ? "calc(100% + 5px)" : "auto",
                          top: shouldShowUpwards ? "auto" : "calc(100% + 5px)",
                        }
                  }
                  onClick={isMobile ? (e) => e.stopPropagation() : undefined}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectPosition("")}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 block"
                  >
                    Seleccionar puesto
                  </button>
                  {Object.entries(availablePositions).map(([key, value]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectPosition(key)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 block"
                    >
                      {typeof value === "string" ? value : key}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {shouldShowHoursFields && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="workStart" className="block text-xs font-medium text-gray-700 text-center w-full mb-1">
                  Jornada Iniciada
                </label>
                <div className="w-full max-w-[120px] mx-auto">
                  <TimeInput
                    value={entry.workStart}
                    onChange={(value) => onUpdateEntry(entry.id, { workStart: value })}
                    placeholder="HH:MM"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="workEnd" className="block text-xs font-medium text-gray-700 text-center w-full mb-1">
                  Jornada Finalizada
                </label>
                <div className="w-full max-w-[120px] mx-auto">
                  <TimeInput
                    value={entry.workEnd}
                    onChange={(value) => onUpdateEntry(entry.id, { workEnd: value })}
                    placeholder="HH:MM"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mostrar todos los tipos de horas en un formato unificado */}
        {allHourTypes.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mt-3">
            {allHourTypes.map((hourType) => (
              <div key={hourType.id} className="flex flex-col items-center">
                <label className="text-xs text-gray-600 mb-0.5 flex items-center justify-center gap-1 w-full">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: hourType.id === "total" ? "#22c55e" : hourType.color,
                    }}
                  ></div>
                  <span>{hourType.name}</span>
                </label>
                <div className="w-full max-w-[120px] mx-auto">
                  <input
                    type="text"
                    value={formatNumber(hourType.value)}
                    readOnly
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-900 text-center focus:outline-none focus:ring-0 focus:border-gray-300"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mostrar configuración aplicada para este puesto después de los desgloses */}
        {entry.position && !noHoursPositions.includes(entry.position) && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500 text-center">
              Configuración aplicada para este puesto:
              <div className="flex justify-center gap-4 mt-1">
                <span>Jornada: {standardDailyHours}h</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Exportar como componente memorizado para evitar renderizados innecesarios
export default memo(DayCard)
