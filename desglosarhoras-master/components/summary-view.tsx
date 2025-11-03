"use client"

import { BarChart, Download } from "lucide-react"
import type { TimeEntry, WorkerData } from "@/types"
import { format } from "date-fns"
import { CollapsibleSection } from "./ui/collapsible-section"
import * as XLSX from "xlsx"
import { useMemo } from "react"

// Tipos más específicos
interface CustomDesglose {
  name: string
  color: string
  positionId?: string
  timeStart?: string
  timeEnd?: string
}

interface SummaryData {
  total: number
  extra: number
  night: number
  holiday: number
  custom: Record<string, number>
}

interface HourType {
  id: string
  name: string
  value: number
  color: string
}

interface SummaryViewProps {
  entries: TimeEntry[]
  workerData: WorkerData
  startDate: Date | null
  endDate: Date | null
  summary: SummaryData
  customDesgloses: Record<string, CustomDesglose>
}

export function SummaryView({ entries, workerData, startDate, endDate, summary, customDesgloses }: SummaryViewProps) {
  // Función para formatear valores numéricos de manera segura
  const formatNumber = (value: number): string => {
    return isNaN(value) ? "0.00" : value.toFixed(2)
  }

  // Memoizar los tipos de horas para evitar recálculos innecesarios
  const allHourTypes = useMemo<HourType[]>(() => {
    // Crear un array con todos los tipos de horas (estándar y personalizadas)
    return [
      // Horas estándar
      { id: "total", name: "Horas Totales", value: summary.total, color: "#001a33" },
      { id: "extra", name: "Horas Extras", value: summary.extra, color: "#EF4444" },
      { id: "holiday", name: "Horas Festivas", value: summary.holiday, color: "#F59E0B" },

      // Horas personalizadas
      ...Object.entries(summary.custom || {}).map(([id, value]) => {
        const desglose = customDesgloses[id]
        return {
          id,
          name: desglose?.name || "Desglose",
          value,
          color: desglose?.color || "#6366F1",
        }
      }),
    ].filter((type) => type.value > 0) // Filtrar solo los tipos con valores > 0
  }, [summary, customDesgloses])

  const exportToExcel = () => {
    if (entries.length === 0 || !startDate || !endDate) {
      alert("No hay datos para exportar o no se ha seleccionado un período válido.")
      return
    }

    try {
      // Verificar qué columnas tienen datos
      const hasExtras = entries.some((entry) => entry.extraHours > 0) || summary.extra > 0
      const hasNight = entries.some((entry) => entry.nightHours > 0) || summary.night > 0
      const hasHoliday = entries.some((entry) => entry.holidayHours > 0) || summary.holiday > 0

      // Obtener todos los tipos de desgloses personalizados que tienen datos
      const customDesgloseIds = Object.keys(customDesgloses).filter((id) => {
        // Verificar si alguna entrada tiene este desglose con valor > 0
        return entries.some((entry) => (entry.customHours?.[id] || 0) > 0) || (summary.custom[id] || 0) > 0
      })

      // Crear encabezados base para la hoja de cálculo
      const baseHeaders = ["Fecha", "Puesto", "Turno (oficial)", "Jornada", "Horas Totales"]

      // Añadir encabezados opcionales solo si hay datos
      const optionalHeaders = []
      if (hasExtras) optionalHeaders.push("Horas Extras")
      if (hasNight) optionalHeaders.push("Horas Nocturnas")
      if (hasHoliday) optionalHeaders.push("Horas Festivas")

      // Añadir encabezados para cada tipo de desglose personalizado que tiene datos
      const customHeaders = customDesgloseIds.map((id) => customDesgloses[id].name)

      // Combinar todos los encabezados
      const headers = [...baseHeaders, ...optionalHeaders, ...customHeaders]

      // Create the worksheet with headers
      const ws = XLSX.utils.aoa_to_sheet([
        [`Registro de Horas - ${workerData.firstName || "Usuario"}`],
        [`Período: ${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`],
        [], // Empty row for spacing
        headers,
      ])

      // Add data rows
      const data = entries.map((entry) => {
        // Datos base que siempre se incluyen
        const baseRow = [
          format(entry.date, "dd/MM/yyyy"),
          entry.position,
          entry.shiftStart && entry.shiftEnd ? `${entry.shiftStart} - ${entry.shiftEnd}` : "",
          entry.workStart && entry.workEnd ? `${entry.workStart} - ${entry.workEnd}` : "",
          entry.totalHours > 0 ? formatNumber(entry.totalHours) : "",
        ]

        // Datos opcionales según si hay valores
        if (hasExtras) baseRow.push(entry.extraHours > 0 ? formatNumber(entry.extraHours) : "")
        if (hasNight) baseRow.push(entry.nightHours > 0 ? formatNumber(entry.nightHours) : "")
        if (hasHoliday) baseRow.push(entry.holidayHours > 0 ? formatNumber(entry.holidayHours) : "")

        // Añadir valores de desgloses personalizados para esta entrada
        customDesgloseIds.forEach((id) => {
          const value = entry.customHours?.[id] || 0
          baseRow.push(value > 0 ? formatNumber(value) : "")
        })

        return baseRow
      })

      XLSX.utils.sheet_add_aoa(ws, data, { origin: -1 })

      // Add empty row before totals
      XLSX.utils.sheet_add_aoa(ws, [[]], { origin: -1 })

      // Preparar la fila de totales
      const totalsRow = ["", "", "", "Σ Total", formatNumber(summary.total)]

      // Añadir totales opcionales
      if (hasExtras) totalsRow.push(summary.extra > 0 ? formatNumber(summary.extra) : "")
      if (hasNight) totalsRow.push(summary.night > 0 ? formatNumber(summary.night) : "")
      if (hasHoliday) totalsRow.push(summary.holiday > 0 ? formatNumber(summary.holiday) : "")

      // Añadir totales de desgloses personalizados
      customDesgloseIds.forEach((id) => {
        const value = summary.custom[id] || 0
        totalsRow.push(value > 0 ? formatNumber(value) : "")
      })

      // Add totals row with Σ symbol
      XLSX.utils.sheet_add_aoa(ws, [totalsRow], { origin: -1 })

      // Ajustar el ancho de las columnas automáticamente
      const colWidths = headers.map((header, index) => {
        // Obtener el ancho máximo basado en el encabezado y los datos
        let maxWidth = header.length

        // Revisar cada fila para encontrar el contenido más ancho
        data.forEach((row) => {
          if (row[index] && row[index].toString().length > maxWidth) {
            maxWidth = row[index].toString().length
          }
        })

        // Añadir un poco de espacio adicional y convertir a unidades de Excel
        return { wch: maxWidth + 2 }
      })

      // Aplicar los anchos de columna
      ws["!cols"] = colWidths

      // Create workbook and append worksheet
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Registro de Horas")

      // Generate filename
      const filename = `${(workerData.firstName || "Usuario").replace(/\s+/g, "_")}_RegistroHoras_${format(startDate, "dd-MM-yyyy")}_${format(endDate, "dd-MM-yyyy")}.xlsx`

      // Usar el método de exportación compatible con navegadores
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([wbout], { type: "application/octet-stream" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()

      // Limpieza de recursos
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 0)
    } catch (error) {
      console.error("Error al exportar a Excel:", error)

      // Mensaje de error más específico
      if (error instanceof TypeError) {
        alert("Error en el formato de datos. Por favor, revise la información ingresada.")
      } else {
        alert("Ocurrió un error al exportar a Excel. Por favor, inténtelo de nuevo.")
      }
    }
  }

  return (
    <CollapsibleSection title="Resumen del Desglose" icon={<BarChart className="section-icon text-white" />}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {allHourTypes.map((hourType) => (
          <div key={hourType.id} className="flex flex-col items-center">
            <span className="text-sm text-gray-600 mb-2 flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: hourType.id === "total" ? "#22c55e" : hourType.color }}
              ></div>
              <span>{hourType.name}</span>
            </span>
            <span className="text-2xl font-bold">{formatNumber(hourType.value)}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
        <button
          onClick={exportToExcel}
          disabled={entries.length === 0}
          className="w-48 h-9 flex items-center justify-center px-3 py-1.5 text-sm font-medium text-white bg-[#002244] rounded-md focus:outline-none disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar a Excel
        </button>
      </div>
    </CollapsibleSection>
  )
}
