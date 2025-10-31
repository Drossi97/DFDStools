import type { CustomPositions, CustomDesgloses } from "@/types"

// ID del desglose de horas nocturnas (constante para referencia)
export const NIGHT_HOURS_DESGLOSE_ID = "default-night-hours"

// Posiciones que no tienen horas
export const NO_HOURS_POSITIONS = ["D", "P", "B", "V", "--"]

// Descripciones de los turnos
export const POSITION_DESCRIPTIONS: Record<string, string> = {
  CM: "Turno Mañana C",
  CT: "Turno Tarde C",
  CTd: "Turno Tarde C Desplazado",
  CN: "Turno Noche C",
  AM: "Turno Mañana A",
  AT: "Turno Tarde A",
  AN: "Turno Noche A",
  TM1: "Turno Mañana T1",
  TT1: "Turno Tarde T1",
  TN1: "Turno Noche T1",
  TM: "Turno Mañana T",
  TT: "Turno Tarde T",
  TN: "Turno Noche T",
  D: "Descanso",
  P: "Permiso",
  B: "Baja",
  V: "Vacaciones",
  "--": "Sin asignar",
}

// Horarios predeterminados - Simplificado a solo los turnos sin horas
export const DEFAULT_SCHEDULES: Record<string, { start: string; end: string } | string> = {
  D: "Descanso",
  P: "Permiso", 
  B: "Baja",
  V: "Vacaciones",
  "--": "Sin asignar",
}

// Posiciones predeterminadas
export const DEFAULT_POSITIONS: CustomPositions = {
  // Puestos predeterminados según la tabla proporcionada
  CM: {
    start: "06:30",
    end: "14:30",
    standardHours: 8,
    desgloses: [],
  },
  CT: {
    start: "14:30",
    end: "22:30",
    standardHours: 8,
    desgloses: [NIGHT_HOURS_DESGLOSE_ID],
  },
  CTd: {
    start: "15:15",
    end: "23:15",
    standardHours: 8,
    desgloses: [NIGHT_HOURS_DESGLOSE_ID],
  },
  CN: {
    start: "22:30",
    end: "06:30",
    standardHours: 8,
    desgloses: [NIGHT_HOURS_DESGLOSE_ID],
  },
  AM: {
    start: "07:00",
    end: "15:00",
    standardHours: 8,
    desgloses: [],
  },
  AT: {
    start: "15:00", 
    end: "23:00",
    standardHours: 8,
    desgloses: [NIGHT_HOURS_DESGLOSE_ID],
  },
  AN: {
    start: "23:00",
    end: "07:00",
    standardHours: 8,
    desgloses: [NIGHT_HOURS_DESGLOSE_ID],
  },
  TM1: {
    start: "06:00",
    end: "14:00", 
    standardHours: 8,
    desgloses: [],
  },
  TT1: {
    start: "14:00",
    end: "22:00",
    standardHours: 8,
    desgloses: [],
  },
  TN1: {
    start: "22:00",
    end: "06:00",
    standardHours: 8,
    desgloses: [NIGHT_HOURS_DESGLOSE_ID],
  },
  TM: {
    start: "07:00",
    end: "15:00",
    standardHours: 8,
    desgloses: [],
  },
  TT: {
    start: "15:00",
    end: "23:00",
    standardHours: 8,
    desgloses: [NIGHT_HOURS_DESGLOSE_ID],
  },
  TN: {
    start: "23:00",
    end: "07:00", 
    standardHours: 8,
    desgloses: [NIGHT_HOURS_DESGLOSE_ID],
  },
}

// Desgloses predeterminados
export const DEFAULT_DESGLOSES: CustomDesgloses = {
  // Desglose predeterminado para horas nocturnas
  [NIGHT_HOURS_DESGLOSE_ID]: {
    name: "Horas Nocturnas",
    color: "#6366f1",
    timeStart: "22:00",
    timeEnd: "06:00",
  },
}

// Configuración predeterminada de horas
export const DEFAULT_HOURS_CONFIG = {
  nightStart: "22:00",
  nightEnd: "06:00",
  standardDailyHours: 8,
}
