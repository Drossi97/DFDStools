"use client"

import { useState } from "react"
import { ConfigMenu } from "./configuration/config-menu"
import { Modal } from "./ui/modal"
import type { HoursConfig } from "@/types"
import { Settings } from "lucide-react"

interface HeaderProps {
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
  onAddCustomDesglose: (name: string, color: string, timeStart?: string, timeEnd?: string, positionId?: string) => void
  onRemoveCustomDesglose: (id: string) => void
  onUpdateDesgloseInterval: (id: string, timeStart: string, timeEnd: string) => void
  hoursConfig?: HoursConfig
  onUpdateHoursConfig?: (config: Partial<HoursConfig>) => void
  onOpenConfig?: () => void
}

export default function Header({
  customPositions,
  onAddCustomPosition,
  onUpdatePosition,
  onDeletePosition,
  customDesgloses,
  onAddCustomDesglose,
  onRemoveCustomDesglose,
  onUpdateDesgloseInterval,
  onOpenConfig,
}: HeaderProps) {
  const [showConfigModal, setShowConfigModal] = useState(false)

  return (
    <header className="bg-[#002244] text-white py-4 relative">
      <div className="w-full flex items-center justify-between px-4">
        <h1 className="text-2xl font-bold">Desglosar Horas Trabajadas</h1>
        {onOpenConfig && (
          <button
            onClick={onOpenConfig}
            className="p-1.5 rounded-full hover:bg-[#002444] transition-colors"
            aria-label="Configuración"
          >
            <Settings className="h-5 w-5 text-white" />
          </button>
        )}
      </div>

      {/* Modal para configuración unificada */}
      <Modal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} title="Configuración">
        <div className="max-h-[80vh] overflow-y-auto">
          <ConfigMenu
            customPositions={customPositions}
            onAddCustomPosition={onAddCustomPosition}
            onUpdatePosition={onUpdatePosition}
            onDeletePosition={onDeletePosition}
            customDesgloses={customDesgloses}
            onAddCustomDesglose={onAddCustomDesglose}
            onRemoveCustomDesglose={onRemoveCustomDesglose}
            onUpdateDesgloseInterval={onUpdateDesgloseInterval}
          />
        </div>
      </Modal>
    </header>
  )
}
