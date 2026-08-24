/**
 * DateTime & Slot Arithmetic Utilities
 */

export interface SlotInterval {
  startTime: string; // "09:00"
  endTime: string;   // "09:30"
  slotStartTime: Date;
  slotEndTime: Date;
}

/**
 * Converts "HH:mm" to total minutes from midnight
 */
export function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Converts total minutes from midnight to "HH:mm"
 */
export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Creates a UTC/ISO Date object from a date string (YYYY-MM-DD) and time string (HH:mm)
 */
export function createSlotDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  // Creates standard UTC Date representation
  const date = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
  return date;
}

/**
 * Checks if two time intervals [startA, endA) and [startB, endB) overlap
 */
export function doIntervalsOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return Math.max(startA, startB) < Math.min(endA, endB);
}

/**
 * Checks if a slot time interval overlaps with break time
 */
export function isSlotDuringBreak(
  slotStartMin: number,
  slotEndMin: number,
  breakStartStr?: string | null,
  breakEndStr?: string | null
): boolean {
  if (!breakStartStr || !breakEndStr) return false;
  const breakStartMin = timeStringToMinutes(breakStartStr);
  const breakEndMin = timeStringToMinutes(breakEndStr);
  return doIntervalsOverlap(slotStartMin, slotEndMin, breakStartMin, breakEndMin);
}
