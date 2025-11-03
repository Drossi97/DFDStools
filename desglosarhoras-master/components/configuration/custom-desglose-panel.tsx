"use client"

import { useState } from "react"
import { Trash2, Clock, Plus, Edit, Save, X } from "lucide-react"
import { ConfigTimeInput } from "@/components/ui/config-time-input"

interface CustomDesglosePanelProps {
  onAddCustomDesglose: (name: string, color: string, timeStart: string, timeEnd: string) => void
  customDesgloses: Record<
    string,
    {
      name: string
      color: string
      positionId?: string
      timeStart?: string
      timeEnd?: string
    }
  >
  onRemoveCustomDesglose: (id: string) => void
  onUpdateDesgloseInterval?: (id: string, timeStart: string, timeEnd: string) => void
}

export function CustomDesglosePanel({
  onAddCustomDesglose,
  customDesgloses,
  onRemoveCustomDesglose,
  onUpdateDesgloseInterval,
}: CustomDesglosePanelProps) {
  const [desgloseName, setDesgloseName] = useState("")
  const [desgloseColor, setDesgloseColor] = useState("#6366f1")
  const [timeStart, setTimeStart] = useState("")
  const [timeEnd, setTimeEnd] = useState("")

  const handleAddDesglose = () => {
    if (desgloseName) {
      onAddCustomDesglose(desgloseName, desgloseColor, timeStart, timeEnd)
      setDesgloseName("")
      setDesgloseColor("#6366f1")
      setTimeStart("")
      setTimeEnd("")
    }
  }

  // Filtrar solo los desgloses globales (sin positionId)
  const globalDesgloses = Object.entries(customDesgloses)
    .filter(([_, desglose]) => !desglose.positionId)
    .reduce(
      (acc, [id, desglose]) => {
        acc[id] = desglose
        return acc
      },
      {} as Record<
        string,
        {
          name: string
          color: string
          positionId?: string
          timeStart?: string
          timeEnd?: string
        }
      >,
    )

  return (
    <div className="text-gray-900 max-w-sm mx-auto">
      {/* Formulario para añadir nuevo desglose */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-4">
        <h3 className="text-xs font-medium text-gray-900 mb-3 text-center">Crear desglose de horas</h3>

        <div className="space-y-4">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-700 mb-0.5 text-center w-full">Nombre del desglose</label>
            <input
              type="text"
              value={desgloseName}
              onChange={(e) => setDesgloseName(e.target.value)}
              className="w-full h-7 px-2 py-1 text-xs border border-gray-300 rounded-md text-gray-900 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-500"
              placeholder="Ej: Horas Nocturnas"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-700 mb-0.5 text-center w-full">Color</label>
            <div className="flex items-center justify-center gap-2">
              <input
                type="color"
                value={desgloseColor}
                onChange={(e) => setDesgloseColor(e.target.value)}
                className="w-8 h-7 p-0.5 border border-gray-300 rounded-md"
              />
              <span className="text-xs text-gray-700">{desgloseColor}</span>
            </div>
          </div>

          {/* Intervalo de tiempo */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-700 mb-0.5 flex items-center gap-1 justify-center">
              <Clock className="h-3 w-3" />
              <span>Intervalo de tiempo</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col">
                <label className="text-xs text-gray-700 mb-0.5 text-center w-full">Hora de inicio</label>
                <ConfigTimeInput value={timeStart} onChange={setTimeStart} placeholder="HH:MM" />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-700 mb-0.5 text-center w-full">Hora de fin</label>
                <ConfigTimeInput value={timeEnd} onChange={setTimeEnd} placeholder="HH:MM" />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddDesglose}
            className="w-full h-7 py-1 mt-1 bg-[#002244] text-white rounded-md hover:bg-[#002444] flex items-center justify-center gap-1 text-xs font-medium transition-colors"
            disabled={!desgloseName}
          >
            <Plus className="h-3 w-3" />
            Añadir Desglose
          </button>
        </div>
      </div>

      {/* Lista de desgloses existentes */}
      {Object.keys(globalDesgloses).length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <h3 className="text-xs font-medium text-gray-900 mb-3 text-center">Desgloses existentes</h3>

          <div className="space-y-4">
            {Object.entries(globalDesgloses).map(([id, desglose]) => (
              <div key={id} className="border border-gray-200 rounded-md p-2 bg-gray-50">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: desglose.color }}></div>
                    <h4 className="text-xs font-medium text-gray-900">{desglose.name}</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveCustomDesglose(id)}
                    className="p-0.5 text-red-600 hover:text-red-800 flex items-center gap-0.5 text-xs"
                    title="Eliminar desglose"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Eliminar</span>
                  </button>
                </div>

                {/* Mostrar intervalo de tiempo si existe */}
                {(desglose.timeStart || desglose.timeEnd) && (
                  <div className="text-xs text-gray-600 flex items-center gap-1 mb-1">
                    <Clock className="h-2.5 w-2.5" />
                    <span>
                      Intervalo: {desglose.timeStart || "--:--"} - {desglose.timeEnd || "--:--"}
                    </span>
                  </div>
                )}

                {/* Permitir editar el intervalo */}
                {onUpdateDesgloseInterval && (
                  <DesgloseIntervalEditor
                    id={id}
                    initialStart={desglose.timeStart || ""}
                    initialEnd={desglose.timeEnd || ""}
                    onUpdate={onUpdateDesgloseInterval}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Componente para editar el intervalo de un desglose existente
function DesgloseIntervalEditor({
  id,
  initialStart,
  initialEnd,
  onUpdate,
}: {
  id: string
  initialStart: string
  initialEnd: string
  onUpdate: (id: string, start: string, end: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [start, setStart] = useState(initialStart)
  const [end, setEnd] = useState(initialEnd)

  const handleSave = () => {
    onUpdate(id, start, end)
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <button
        className="text-xs text-blue-600 hover:text-[#001a33] flex items-center gap-0.5"
        onClick={() => setIsEditing(true)}
      >
        <Edit className="h-3 w-3" />
        Editar intervalo
      </button>
    )
  }

  return (
    <div className="mt-2 pt-1 border-t border-gray-200">
      <div className="grid grid-cols-2 gap-2 mb-1">
        <div className="flex flex-col">
          <label className="text-xs text-gray-700 mb-0.5 text-center w-full">Hora de inicio</label>
          <ConfigTimeInput value={start} onChange={setStart} placeholder="HH:MM" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-700 mb-0.5 text-center w-full">Hora de fin</label>
          <ConfigTimeInput value={end} onChange={setEnd} placeholder="HH:MM" />
        </div>
      </div>
      <div className="flex justify-end gap-1">
        <button
          className="px-1 py-0.5 text-xs text-gray-600 hover:text-gray-800 flex items-center gap-0.5"
          onClick={() => setIsEditing(false)}
        >
          <X className="h-2.5 w-2.5" />
          Cancelar
        </button>
        <button
          className="px-1 py-0.5 text-xs text-white bg-[#002244] hover:bg-[#002444] rounded flex items-center gap-0.5"
          onClick={handleSave}
        >
          <Save className="h-2.5 w-2.5" />
          Guardar
        </button>
      </div>
    </div>
  )
}
