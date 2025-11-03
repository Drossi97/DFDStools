"use client"

import { useState } from "react"
import { Edit, Trash2, Save, X, Clock, Check, Plus } from "lucide-react"
import { ConfigTimeInput } from "@/components/ui/config-time-input"

interface PositionsPanelProps {
  customPositions: Record<
    string,
    {
      start: string
      end: string
      standardHours?: number
      desgloses?: string[]
    }
  >
  onAddCustomPosition: (
    name: string,
    start: string,
    end: string,
    standardHours?: number,
    desgloseIds?: string[],
  ) => void
  onUpdatePosition: (
    id: string,
    updates: {
      start: string
      end: string
      standardHours?: number
      desgloses?: string[]
    },
  ) => void
  onDeletePosition: (id: string) => void
  customDesgloses: Record<
    string,
    { name: string; color: string; positionId?: string; timeStart?: string; timeEnd?: string }
  >
}

export function PositionsPanel({
  customPositions,
  onAddCustomPosition,
  onUpdatePosition,
  onDeletePosition,
  customDesgloses,
}: PositionsPanelProps) {
  // Estado para el formulario de nuevo puesto
  const [positionName, setPositionName] = useState("")
  const [positionStart, setPositionStart] = useState("")
  const [positionEnd, setPositionEnd] = useState("")
  // Ya no necesitamos esta variable de estado
  const [selectedDesgloses, setSelectedDesgloses] = useState<string[]>([])

  // Estado para edición de puestos existentes
  const [editingPosition, setEditingPosition] = useState<string | null>(null)
  const [editData, setEditData] = useState<{
    start: string
    end: string
    standardHours: string
    selectedDesgloses: string[]
  }>({
    start: "",
    end: "",
    standardHours: "",
    selectedDesgloses: [],
  })

  // Función para calcular las horas estándar basadas en hora de inicio y fin
  const calculateStandardHours = (start: string, end: string): string => {
    if (!start || !end) return "8" // Valor por defecto si no hay horas definidas

    // Convertir las horas a minutos para facilitar el cálculo
    const [startHours, startMinutes] = start.split(":").map(Number)
    const [endHours, endMinutes] = end.split(":").map(Number)

    const startTotalMinutes = startHours * 60 + startMinutes
    let endTotalMinutes = endHours * 60 + endMinutes

    // Si la hora de fin es menor que la de inicio, asumimos que es del día siguiente
    if (endTotalMinutes <= startTotalMinutes) {
      endTotalMinutes += 24 * 60 // Añadir un día completo en minutos
    }

    // Calcular la diferencia en horas
    const diffHours = (endTotalMinutes - startTotalMinutes) / 60

    // Redondear a 2 decimales y convertir a string
    return diffHours.toFixed(2)
  }

  // Filtrar solo los desgloses globales (sin positionId)
  const availableDesgloses = Object.entries(customDesgloses)
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

  // Funciones para gestionar puestos existentes
  const handleStartEdit = (id: string) => {
    const position = customPositions[id]
    setEditingPosition(id)
    setEditData({
      start: position.start,
      end: position.end,
      standardHours: position.standardHours?.toString() || "8",
      selectedDesgloses: position.desgloses || [],
    })
  }

  const handleCancelEdit = () => {
    setEditingPosition(null)
  }

  const handleSaveEdit = (id: string) => {
    // Calcular las horas estándar
    const calculatedHours = Number(calculateStandardHours(editData.start, editData.end))

    // Guardar los cambios
    onUpdatePosition(id, {
      start: editData.start,
      end: editData.end,
      standardHours: calculatedHours,
      desgloses: editData.selectedDesgloses,
    })

    // Cerrar el modo de edición
    setEditingPosition(null)

    // Forzar un refresco de la UI después de un breve retraso
    setTimeout(() => {
      const event = new CustomEvent("positionUpdated", { detail: { id } })
      window.dispatchEvent(event)
    }, 50)
  }

  const handleDeletePosition = (id: string) => {
    onDeletePosition(id)
  }

  // Funciones para añadir nuevo puesto
  const handleAddPosition = () => {
    if (positionName && positionStart && positionEnd) {
      const calculatedHours = Number(calculateStandardHours(positionStart, positionEnd))
      onAddCustomPosition(
        positionName,
        positionStart,
        positionEnd,
        calculatedHours,
        selectedDesgloses.length > 0 ? selectedDesgloses : undefined,
      )
      setPositionName("")
      setPositionStart("")
      setPositionEnd("")
      setSelectedDesgloses([])
    }
  }

  // Función para manejar la selección/deselección de desgloses (para ambos casos)
  const toggleDesglose = (desgloseId: string, isForEdit = false) => {
    if (isForEdit) {
      setEditData((prev) => ({
        ...prev,
        selectedDesgloses: prev.selectedDesgloses.includes(desgloseId)
          ? prev.selectedDesgloses.filter((id) => id !== desgloseId)
          : [...prev.selectedDesgloses, desgloseId],
      }))
    } else {
      setSelectedDesgloses((prev) =>
        prev.includes(desgloseId) ? prev.filter((id) => id !== desgloseId) : [...prev, desgloseId],
      )
    }
  }

  // Filtrar solo los puestos personalizados
  const positionsArray = Object.entries(customPositions).map(([id, position]) => ({
    id,
    ...position,
  }))

  return (
    <div className="text-gray-900 max-w-sm mx-auto">
      {/* Formulario para añadir nuevo puesto */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-4">
        <h3 className="text-xs font-medium text-gray-900 mb-3 text-center">Crear nuevo puesto</h3>

        <div className="space-y-4">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-700 mb-0.5 text-center w-full">Nombre del puesto</label>
            <input
              type="text"
              value={positionName}
              onChange={(e) => setPositionName(e.target.value)}
              className="w-full h-7 px-2 py-1 text-xs border border-gray-300 rounded-md text-gray-900 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-500"
              placeholder="Ej: Turno Mañana"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-700 mb-0.5 text-center w-full">Hora de inicio</label>
              <ConfigTimeInput value={positionStart} onChange={setPositionStart} placeholder="HH:MM" />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-700 mb-0.5 text-center w-full">Hora de fin</label>
              <ConfigTimeInput value={positionEnd} onChange={setPositionEnd} placeholder="HH:MM" />
            </div>
          </div>

          {Object.keys(availableDesgloses).length > 0 && (
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-700 mb-0.5 text-center w-full">Desgloses asociados</label>
              <div className="space-y-1 border border-gray-200 rounded-md p-1.5 bg-gray-50">
                {Object.entries(availableDesgloses).map(([id, desglose]) => (
                  <div
                    key={id}
                    className={`flex items-center justify-between p-1 rounded-md cursor-pointer ${
                      selectedDesgloses.includes(id) ? "border border-[#001a33]" : "bg-white border border-gray-100"
                    }`}
                    onClick={() => toggleDesglose(id)}
                  >
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: desglose.color }}></div>
                      <span className="text-xs text-gray-900">{desglose.name}</span>
                    </div>
                    <div className="w-4 h-4 flex items-center justify-center">
                      {selectedDesgloses.includes(id) ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 text-gray-300" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleAddPosition}
            className="w-full h-7 py-1 mt-1 bg-[#002244] text-white rounded-md hover:bg-[#003366] flex items-center justify-center gap-1 text-xs font-medium transition-colors"
            disabled={!positionName || !positionStart || !positionEnd}
          >
            <Plus className="h-3 w-3" />
            Añadir Puesto
          </button>
        </div>
      </div>

      {/* Lista de puestos existentes */}
      {positionsArray.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <h3 className="text-xs font-medium text-gray-900 mb-3 text-center">Puestos existentes</h3>

          <div className="space-y-4">
            {positionsArray.map((position) => (
              <div key={position.id} className="border border-gray-200 rounded-md p-2 bg-gray-50">
                {editingPosition === position.id ? (
                  // Modo edición
                  <div className="space-y-3">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-xs font-medium text-gray-900">{position.id}</h4>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleSaveEdit(position.id)}
                          className="p-0.5 text-green-600 hover:text-green-800 flex items-center gap-0.5 text-xs"
                          title="Guardar cambios"
                        >
                          <Save className="h-3 w-3" />
                          <span>Guardar</span>
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-0.5 text-gray-600 hover:text-gray-800 flex items-center gap-0.5 text-xs"
                          title="Cancelar"
                        >
                          <X className="h-3 w-3" />
                          <span>Cancelar</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-700 block mb-0.5 text-center w-full">Hora de inicio</label>
                        <ConfigTimeInput
                          value={editData.start}
                          onChange={(value) => setEditData({ ...editData, start: value })}
                          placeholder="HH:MM"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-700 block mb-0.5 text-center w-full">Hora de fin</label>
                        <ConfigTimeInput
                          value={editData.end}
                          onChange={(value) => setEditData({ ...editData, end: value })}
                          placeholder="HH:MM"
                        />
                      </div>
                    </div>

                    {/* Selección de desgloses */}
                    {Object.keys(availableDesgloses).length > 0 && (
                      <div>
                        <label className="text-xs text-gray-700 block mb-0.5 text-center w-full">
                          Desgloses asignados
                        </label>
                        <div className="border border-gray-200 rounded-md p-1 bg-white">
                          {Object.entries(availableDesgloses).map(([id, desglose]) => (
                            <div
                              key={id}
                              className={`flex items-center justify-between p-1 rounded-md cursor-pointer mb-0.5 ${
                                editData.selectedDesgloses.includes(id)
                                  ? "border border-[#001a33]"
                                  : "bg-white border border-gray-100"
                              }`}
                              onClick={() => toggleDesglose(id, true)}
                            >
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: desglose.color }}></div>
                                <span className="text-xs text-gray-900">{desglose.name}</span>
                              </div>
                              <div className="w-3.5 h-3.5 flex items-center justify-center">
                                {editData.selectedDesgloses.includes(id) ? (
                                  <Check className="h-2.5 w-2.5 text-green-600" />
                                ) : (
                                  <X className="h-2.5 w-2.5 text-gray-300" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Modo visualización
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-xs font-medium text-gray-900">{position.id}</h4>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStartEdit(position.id)}
                          className="p-0.5 text-blue-600 hover:text-blue-800 flex items-center gap-0.5 text-xs"
                          title="Editar puesto"
                        >
                          <Edit className="h-3 w-3" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => handleDeletePosition(position.id)}
                          className="p-0.5 text-red-600 hover:text-red-800 flex items-center gap-0.5 text-xs"
                          title="Eliminar puesto"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col text-xs text-gray-600 mb-1">
                      <div className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        <span>
                          {position.start} - {position.end}
                        </span>
                      </div>
                      <div className="mt-0.5">Jornada: {position.standardHours || 8}h</div>
                    </div>

                    {/* Mostrar desgloses asociados si existen */}
                    {position.desgloses && position.desgloses.length > 0 && (
                      <div className="mt-1 pt-1 border-t border-gray-200">
                        <div className="text-xs text-gray-700 mb-0.5">Desgloses asociados:</div>
                        <div className="flex flex-wrap gap-1">
                          {position.desgloses.map((desgloseId) => {
                            const desglose = customDesgloses[desgloseId]
                            if (!desglose) return null
                            return (
                              <div
                                key={desgloseId}
                                className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-gray-100 rounded text-xs"
                              >
                                <div
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: desglose.color }}
                                ></div>
                                <span>{desglose.name}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
