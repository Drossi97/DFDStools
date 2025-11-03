export interface TimeEntry {
  id: string
  date: Date
  position: string
  shiftStart: string
  shiftEnd: string
  workStart: string
  workEnd: string
  totalHours: number
  extraHours: number
  nightHours: number
  holidayHours: number
  customHours?: Record<string, number> // Nuevo campo para horas personalizadas
}

export interface WorkerData {
  firstName: string
  lastName: string
  secondLastName: string
}

export interface CustomPosition {
  start: string
  end: string
  standardHours?: number // Horas estándar específicas para este puesto
  nightStart?: string // Inicio de horas nocturnas específico para este puesto
  nightEnd?: string // Fin de horas nocturnas específico para este puesto
  desgloses?: string[] // IDs de los desgloses asociados a este puesto
}

export interface CustomPositions {
  [key: string]: CustomPosition
}

export interface CustomDesglose {
  name: string
  color: string
  positionId?: string
  timeStart?: string
  timeEnd?: string
}

export interface CustomDesgloses {
  [key: string]: CustomDesglose
}

export interface HoursConfig {
  nightStart: string
  nightEnd: string
  standardDailyHours: number
}

export interface PeriodConfig {
  startDate: Date | null
  endDate: Date | null
}

export interface CalculatedHours {
  total: number
  night: number
  extra: number
  holiday: number
  custom?: Record<string, number> // Nuevo campo para horas personalizadas
}
