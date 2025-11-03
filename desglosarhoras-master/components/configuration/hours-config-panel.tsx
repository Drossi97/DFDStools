"use client"

import { useState } from "react"
import { Clock } from "lucide-react"
import type { HoursConfig } from "@/types"
import { Input } from "@/components/ui/input"
import { TimeInput } from "@/components/ui/time-input"
import { FormRow } from "@/components/ui/form-row"

interface HoursConfigPanelProps {
  hoursConfig: HoursConfig
  onUpdateHoursConfig: (config: Partial<HoursConfig>) => void
}

export function HoursConfigPanel({ hoursConfig, onUpdateHoursConfig }: HoursConfigPanelProps) {
  const [tempHoursConfig, setTempHoursConfig] = useState<HoursConfig>(hoursConfig)

  const handleSaveHoursConfig = () => {
    onUpdateHoursConfig(tempHoursConfig)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-visible">
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
        <div className="flex items-center justify-center gap-2">
          <Clock className="h-4 w-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Configurar Horas</h3>
        </div>
      </div>
      <div className="p-4">
        <div className="space-y-4">
          <FormRow label="Jornada estándar (h)" htmlFor="standard-daily-hours">
            <Input
              id="standard-daily-hours"
              type="text" // Cambiado de "number" a "text"
              inputMode="decimal" // Añadido para mostrar teclado numérico en móviles
              value={tempHoursConfig.standardDailyHours.toString()}
              onChange={(e) => {
                const value = e.target.value.replace(/[^\d.]/g, "") // Solo permitir números y punto decimal
                setTempHoursConfig({
                  ...tempHoursConfig,
                  standardDailyHours: value === "" ? 0 : Number.parseFloat(value) || 0,
                })
              }}
              required
              className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 text-center bg-gray-50"
            />
          </FormRow>

          <div className="flex h-[76px] flex-col">
            <div className="text-xs font-medium text-gray-700 text-center mb-0.5">Intervalo de horas nocturnas</div>
            <div className="flex-1 flex items-start justify-between pt-1">
              <div className="flex justify-center w-1/2 pr-2">
                <TimeInput
                  value={tempHoursConfig.nightStart}
                  onChange={(value) => setTempHoursConfig({ ...tempHoursConfig, nightStart: value })}
                  placeholder="HH:MM"
                  required
                />
              </div>
              <div className="flex justify-center w-1/2 pl-2">
                <TimeInput
                  value={tempHoursConfig.nightEnd}
                  onChange={(value) => setTempHoursConfig({ ...tempHoursConfig, nightEnd: value })}
                  placeholder="HH:MM"
                  required
                />
              </div>
            </div>
          </div>

          <FormRow label="Segundo Apellido" hideLabel={true}>
            <button
              type="button"
              onClick={handleSaveHoursConfig}
              className="w-full h-10 flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Guardar Configuración
            </button>
          </FormRow>
        </div>
      </div>
    </div>
  )
}
