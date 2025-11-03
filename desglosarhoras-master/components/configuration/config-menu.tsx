"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PositionsPanel } from "./positions-panel"
import { CustomDesglosePanel } from "./custom-desglose-panel"
import { Clock, ListPlus } from "lucide-react"
import type { HoursConfig } from "@/types"

interface ConfigMenuProps {
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
}

export function ConfigMenu({
  customPositions,
  onAddCustomPosition,
  onUpdatePosition,
  onDeletePosition,
  customDesgloses,
  onAddCustomDesglose,
  onRemoveCustomDesglose,
  onUpdateDesgloseInterval,
}: ConfigMenuProps) {
  const [activeTab, setActiveTab] = useState("positions")

  return (
    <div className="w-full mx-auto p-2">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-5 max-w-xs mx-auto bg-gray-100">
          <TabsTrigger
            value="positions"
            className="flex items-center justify-center gap-1 py-1 text-xs text-black data-[state=active]:bg-[#002244] data-[state=active]:text-white"
          >
            <Clock className="h-3 w-3" />
            <span>Crear nuevo puesto</span>
          </TabsTrigger>
          <TabsTrigger
            value="desgloses"
            className="flex items-center justify-center gap-1 py-1 text-xs text-black data-[state=active]:bg-[#002244] data-[state=active]:text-white"
          >
            <ListPlus className="h-3 w-3" />
            <span>Crear desglose</span>
          </TabsTrigger>
        </TabsList>

        <div className="max-h-[70vh] overflow-y-auto">
          <TabsContent value="positions" className="mt-0">
            <PositionsPanel
              customPositions={customPositions}
              onAddCustomPosition={onAddCustomPosition}
              onUpdatePosition={onUpdatePosition}
              onDeletePosition={onDeletePosition}
              customDesgloses={customDesgloses}
            />
          </TabsContent>

          <TabsContent value="desgloses" className="mt-0">
            <CustomDesglosePanel
              onAddCustomDesglose={onAddCustomDesglose}
              customDesgloses={customDesgloses}
              onRemoveCustomDesglose={onRemoveCustomDesglose}
              onUpdateDesgloseInterval={onUpdateDesgloseInterval}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
