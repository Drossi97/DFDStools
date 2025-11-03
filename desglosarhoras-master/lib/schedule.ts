import { format, isSameDay, addDays, startOfDay, endOfDay } from "date-fns"

interface Schedule {
  desde: string
  hasta: string
}

interface Schedules {
  [key: string]: Schedule | string
}

export const SCHEDULES: Schedules = {
  CM: { desde: "06:30", hasta: "14:30" },
  CT: { desde: "14:30", hasta: "22:30" },
  CTd: { desde: "15:15", hasta: "23:15" },
  CN: { desde: "22:30", hasta: "06:30" },
  AM: { desde: "07:00", hasta: "15:00" },
  AT: { desde: "15:00", hasta: "23:00" },
  AN: { desde: "23:00", hasta: "07:00" },
  TM1: { desde: "06:00", hasta: "14:00" },
  TT1: { desde: "14:00", hasta: "22:00" },
  TN1: { desde: "22:00", hasta: "06:00" },
  TM: { desde: "07:00", hasta: "15:00" },
  TT: { desde: "15:00", hasta: "23:00" },
  TN: { desde: "23:00", hasta: "07:00" },
  D: "Descanso",
  V: "Vacaciones",
  P: "Permiso",
  B: "Baja",
  "--": "--",
}

// Función auxiliar para calcular superposición entre dos intervalos de tiempo
function calcularSuperposicion(inicio1: Date, fin1: Date, inicio2: Date, fin2: Date): number {
  const inicioSuperposicion = new Date(Math.max(inicio1.getTime(), inicio2.getTime()))
  const finSuperposicion = new Date(Math.min(fin1.getTime(), fin2.getTime()))

  if (inicioSuperposicion < finSuperposicion) {
    return finSuperposicion.getTime() - inicioSuperposicion.getTime()
  }
  return 0
}

// Función auxiliar para calcular horas festivas
function calcularHorasFestivas(startDate: Date, endDate: Date, holidays: Date[]): number {
  // Verificar si el día actual es festivo
  const isCurrentDayHoliday = holidays.some((holiday) => isSameDay(holiday, startDate))

  // Verificar si el día siguiente es festivo (para turnos que cruzan la medianoche)
  const nextDay = addDays(startDate, 1)
  const isNextDayHoliday = holidays.some((holiday) => isSameDay(holiday, nextDay))

  let festivasHours = 0

  if (isCurrentDayHoliday) {
    // Si el día actual es festivo, calcular las horas trabajadas en este día
    const dayEnd = endOfDay(startDate)
    const endTimeForCalc = endDate < dayEnd ? endDate : dayEnd
    festivasHours += (endTimeForCalc.getTime() - startDate.getTime()) / (1000 * 60 * 60)
  }

  if (isNextDayHoliday && endDate > startOfDay(nextDay)) {
    // Si el día siguiente es festivo y el turno se extiende a ese día
    const dayStart = startOfDay(nextDay)
    const startTimeForCalc = startDate > dayStart ? startDate : dayStart
    festivasHours += (endDate.getTime() - startTimeForCalc.getTime()) / (1000 * 60 * 60)
  }

  return festivasHours
}

// Función auxiliar para calcular horas nocturnas
function calcularHorasNocturnas(
  startDate: Date,
  endDate: Date,
  nocturnasStart: string,
  nocturnasEnd: string,
  date: Date,
): number {
  // Crear objetos Date para el horario nocturno del día de inicio
  const [horasInicioNocturno, minutosInicioNocturno] = nocturnasStart.split(":").map(Number)
  const [horasFinNocturno, minutosFinNocturno] = nocturnasEnd.split(":").map(Number)

  // Fecha base para el día de inicio
  const baseDate = new Date(date)
  baseDate.setHours(0, 0, 0, 0)

  // Crear objetos Date para el horario nocturno
  const fechaInicioNocturno = new Date(baseDate)
  fechaInicioNocturno.setHours(horasInicioNocturno, minutosInicioNocturno, 0)

  const fechaFinNocturno = new Date(baseDate)
  fechaFinNocturno.setHours(horasFinNocturno, minutosFinNocturno, 0)

  // Si el fin del horario nocturno es menor que el inicio, asumimos que es del día siguiente
  if (fechaFinNocturno <= fechaInicioNocturno) {
    fechaFinNocturno.setDate(fechaFinNocturno.getDate() + 1)
  }

  // Calcular superposición para el primer ciclo nocturno
  let tiempoNocturno = calcularSuperposicion(startDate, endDate, fechaInicioNocturno, fechaFinNocturno)

  // Si el horario nocturno cruza la medianoche, necesitamos verificar también el período nocturno anterior
  if (fechaFinNocturno.getDate() > fechaInicioNocturno.getDate()) {
    // Crear fechas para el ciclo nocturno anterior (día anterior)
    const fechaInicioNocturnoAnterior = new Date(fechaInicioNocturno)
    fechaInicioNocturnoAnterior.setDate(fechaInicioNocturnoAnterior.getDate() - 1)

    const fechaFinNocturnoAnterior = new Date(fechaFinNocturno)
    fechaFinNocturnoAnterior.setDate(fechaFinNocturnoAnterior.getDate() - 1)

    // Añadir superposición del ciclo nocturno anterior
    tiempoNocturno += calcularSuperposicion(startDate, endDate, fechaInicioNocturnoAnterior, fechaFinNocturnoAnterior)
  }

  // Si el turno cruza la medianoche, verificar el ciclo nocturno siguiente
  if (endDate.getDate() > startDate.getDate()) {
    // Crear fechas para el ciclo nocturno siguiente (día siguiente)
    const fechaInicioNocturnoSiguiente = new Date(fechaInicioNocturno)
    fechaInicioNocturnoSiguiente.setDate(fechaInicioNocturnoSiguiente.getDate() + 1)

    const fechaFinNocturnoSiguiente = new Date(fechaFinNocturno)
    fechaFinNocturnoSiguiente.setDate(fechaFinNocturnoSiguiente.getDate() + 1)

    // Añadir superposición del ciclo nocturno siguiente
    tiempoNocturno += calcularSuperposicion(startDate, endDate, fechaInicioNocturnoSiguiente, fechaFinNocturnoSiguiente)
  }

  // Convertir tiempo nocturno de milisegundos a horas
  return tiempoNocturno / (1000 * 60 * 60)
}

export function calculateHours(
  desde: string,
  hasta: string,
  holidays: Date[],
  date: Date,
  nocturnasStart: string,
  nocturnasEnd: string,
): { total: number; nocturnas: number; festivas: number } {
  const startDate = new Date(`${format(date, "yyyy-MM-dd")}T${desde}:00`)
  let endDate = new Date(`${format(date, "yyyy-MM-dd")}T${hasta}:00`)

  // Si endDate es antes que startDate, asumimos que es del día siguiente
  if (endDate <= startDate) {
    endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000)
  }

  // Calcular horas totales
  const totalMilliseconds = endDate.getTime() - startDate.getTime()
  const totalHours = totalMilliseconds / (1000 * 60 * 60)

  // Calcular horas nocturnas usando la función auxiliar
  const nocturnasHours = calcularHorasNocturnas(startDate, endDate, nocturnasStart, nocturnasEnd, date)

  // Calcular horas festivas usando la función auxiliar
  const festivasHours = calcularHorasFestivas(startDate, endDate, holidays)

  return {
    total: totalHours,
    nocturnas: nocturnasHours,
    festivas: festivasHours,
  }
}

export function calculateExtraHours(totalHours: number, standardHours: number): number {
  return Math.max(0, totalHours - standardHours)
}
