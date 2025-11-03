"use client"
import { Download, BarChart } from "lucide-react"

interface Entry {
  date: Date
  puesto: string
  turnoDesde: string
  turnoHasta: string
  jornadaDesde: string
  jornadaHasta: string
  total: number
  extras: number
  nocturnas: number
  festivas: number
}

interface SummaryCardProps {
  entries: Entry[]
  onExportToExcel: () => void
  defaultDailyHours?: number
  nocturnasStart?: string
  nocturnasEnd?: string
}

function SummaryCard({
  entries,
  onExportToExcel,
  defaultDailyHours = 8,
  nocturnasStart = "22:00",
  nocturnasEnd = "06:00",
}: SummaryCardProps) {
  const totalHours = entries.reduce(
    (acc, entry) => {
      acc.total += entry.total
      acc.extras += entry.extras
      acc.nocturnas += entry.nocturnas
      acc.festivas += entry.festivas
      return acc
    },
    { total: 0, extras: 0, nocturnas: 0, festivas: 0 },
  )

  const formatHours = (hours: number) => hours.toFixed(2)

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gray-900 px-4 py-2 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-white flex items-center justify-center gap-2">
          <BarChart className="h-4 w-4 text-white" />
          Resumen de Horas
        </h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex flex-col items-center">
            <p className="text-sm text-gray-600 mb-1">Horas Totales</p>
            <span className="text-2xl font-bold text-gray-900">
              {!isNaN(totalHours.total) ? formatHours(totalHours.total) : "0.00"}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-sm text-gray-600 mb-1">Horas Extras</p>
            <span className="text-2xl font-bold text-gray-900">
              {!isNaN(totalHours.extras) ? formatHours(totalHours.extras) : "0.00"}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-sm text-gray-600 mb-1">Horas Nocturnas</p>
            <span className="text-2xl font-bold text-gray-900">
              {!isNaN(totalHours.nocturnas) ? formatHours(totalHours.nocturnas) : "0.00"}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-sm text-gray-600 mb-1">Horas Festivas</p>
            <span className="text-2xl font-bold text-gray-900">
              {!isNaN(totalHours.festivas) ? formatHours(totalHours.festivas) : "0.00"}
            </span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex justify-end">
            <button onClick={onExportToExcel} disabled={entries.length === 0} className="export-button">
              <Download className="h-4 w-4 mr-2" />
              Exportar a Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SummaryCard
