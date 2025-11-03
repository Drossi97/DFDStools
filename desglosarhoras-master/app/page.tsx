"use client"

import { useTimeTracker } from "@/hooks/use-time-tracker"
import { CalendarView } from "@/components/calendar-view"
import { SummaryView } from "@/components/summary-view"
import { useEffect, useState, useCallback } from "react"
import Header from "@/components/header"
import { CollapsibleSection } from "@/components/ui/collapsible-section"
import { User } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { ConfigMenu } from "@/components/configuration/config-menu"
import SimpleDateInput from "@/components/simple-date-input"

export default function Home() {
  const timeTracker = useTimeTracker()
  const [updateTrigger, setUpdateTrigger] = useState(0)
  const [showConfigModal, setShowConfigModal] = useState(false)

  // Memoizar el manejador de eventos para evitar recreaciones innecesarias
  const handlePositionUpdate = useCallback(() => {
    // Incrementar el contador para forzar una re-renderización
    setUpdateTrigger((prev) => prev + 1)
  }, [])

  // Escuchar el evento personalizado para forzar actualizaciones
  useEffect(() => {
    window.addEventListener("positionUpdated", handlePositionUpdate)

    // Limpieza del efecto
    return () => {
      window.removeEventListener("positionUpdated", handlePositionUpdate)
    }
  }, [handlePositionUpdate])

  // Forzar actualización cuando cambian las entradas o el período
  useEffect(() => {
    setUpdateTrigger((prev) => prev + 1)
  }, [timeTracker.entries.length, timeTracker.period.startDate, timeTracker.period.endDate])

  // Memoizar el manejador para abrir/cerrar el modal
  const toggleConfigModal = useCallback(() => {
    setShowConfigModal((prev) => !prev)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        customPositions={timeTracker.customPositions}
        onAddCustomPosition={timeTracker.addCustomPosition}
        onUpdatePosition={timeTracker.updatePosition}
        onDeletePosition={timeTracker.deletePosition}
        customDesgloses={timeTracker.customDesgloses || {}}
        onAddCustomDesglose={timeTracker.addCustomDesglose}
        onRemoveCustomDesglose={timeTracker.removeCustomDesglose}
        onUpdateDesgloseInterval={timeTracker.updateDesgloseInterval}
        onOpenConfig={toggleConfigModal}
      />

      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-5">
          {/* Panel de datos básicos y período con botón de configuración */}
          <CollapsibleSection title="Nombre y Fecha" icon={<User className="h-5 w-5 text-white" />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Nombre y Apellidos del Trabajador */}
              <div className="flex flex-col h-[76px]">
                <label className="text-xs font-medium text-gray-700 mb-1">Nombre y Apellidos del Trabajador</label>
                <input
                  type="text"
                  value={timeTracker.workerData.firstName}
                  onChange={(e) => timeTracker.updateWorkerData({ firstName: e.target.value })}
                  className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:border-gray-400"
                />
              </div>

              {/* Período - Fecha inicial */}
              <div className="flex flex-col h-[76px]">
                <label className="text-xs font-medium text-gray-700 mb-1">Fecha inicial</label>
                <SimpleDateInput
                  value={timeTracker.period.startDate}
                  onChange={(date) => timeTracker.updatePeriod({ startDate: date })}
                  className="h-10"
                />
              </div>

              {/* Período - Fecha final */}
              <div className="flex flex-col h-[76px]">
                <label className="text-xs font-medium text-gray-700 mb-1">Fecha final</label>
                <SimpleDateInput
                  value={timeTracker.period.endDate}
                  onChange={(date) => timeTracker.updatePeriod({ endDate: date })}
                  className="h-10"
                />
              </div>
            </div>
          </CollapsibleSection>

          <CalendarView
            key={`calendar-${updateTrigger}`}
            entries={timeTracker.entries}
            selectedDate={timeTracker.selectedDate}
            startDate={timeTracker.period.startDate}
            endDate={timeTracker.period.endDate}
            holidays={timeTracker.holidays}
            availablePositions={timeTracker.availablePositions}
            noHoursPositions={timeTracker.NO_HOURS_POSITIONS}
            nightStart={timeTracker.hoursConfig.nightStart}
            nightEnd={timeTracker.hoursConfig.nightEnd}
            standardDailyHours={timeTracker.hoursConfig.standardDailyHours}
            onSelectDay={timeTracker.setSelectedDate}
            onToggleHoliday={timeTracker.toggleHoliday}
            onUpdateEntry={timeTracker.updateEntry}
            customDesgloses={timeTracker.customDesgloses || {}}
            customPositions={timeTracker.customPositions}
          />

          <SummaryView
            key={`summary-${updateTrigger}`}
            entries={timeTracker.entries}
            workerData={timeTracker.workerData}
            startDate={timeTracker.period.startDate}
            endDate={timeTracker.period.endDate}
            summary={timeTracker.summary}
            customDesgloses={timeTracker.customDesgloses || {}}
          />

          {/* Modal para configuración unificada */}
          <Modal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} title="Configuración">
            <div className="max-h-[80vh] overflow-hidden">
              <ConfigMenu
                customPositions={timeTracker.customPositions}
                onAddCustomPosition={timeTracker.addCustomPosition}
                onUpdatePosition={timeTracker.updatePosition}
                onDeletePosition={timeTracker.deletePosition}
                customDesgloses={timeTracker.customDesgloses || {}}
                onAddCustomDesglose={timeTracker.addCustomDesglose}
                onRemoveCustomDesglose={timeTracker.removeCustomDesglose}
                onUpdateDesgloseInterval={timeTracker.updateDesgloseInterval}
              />
            </div>
          </Modal>
        </div>
      </main>
    </div>
  )
}
