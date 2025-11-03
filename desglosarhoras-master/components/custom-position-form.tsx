"use client"

import type React from "react"
import { useState } from "react"
import { TimeInput } from "./time-input"

interface CustomPositionFormProps {
  onAddPosition: (name: string, desde: string, hasta: string) => void
}

function CustomPositionForm({ onAddPosition }: CustomPositionFormProps) {
  const [name, setName] = useState("")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name && desde && hasta) {
      onAddPosition(name, desde, hasta)
      setName("")
      setDesde("")
      setHasta("")
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="flex flex-col h-[68px] justify-between">
        <label
          htmlFor="position-name"
          className="text-xs font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded shadow-sm text-center mb-1"
        >
          Nombre del puesto
        </label>
        <input
          id="position-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col h-[68px] justify-between">
          <label
            htmlFor="desde"
            className="text-xs font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded shadow-sm text-center mb-1"
          >
            Inicio
          </label>
          <TimeInput value={desde} onChange={setDesde} placeholder="HH:MM" />
        </div>
        <div className="flex flex-col h-[68px] justify-between">
          <label
            htmlFor="hasta"
            className="text-xs font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded shadow-sm text-center mb-1"
          >
            Fin
          </label>
          <TimeInput value={hasta} onChange={setHasta} placeholder="HH:MM" />
        </div>
      </div>

      <div className="flex flex-col h-[68px] justify-between">
        <label className="text-xs font-medium text-gray-700 opacity-0 text-center mb-1">Acción</label>
        <button
          type="submit"
          className="w-full h-9 flex items-center justify-center px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          disabled={!name || !desde || !hasta}
        >
          Añadir Nuevo Puesto
        </button>
      </div>
    </form>
  )
}

export default CustomPositionForm
