export const WEEKDAYS_SHORT = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"]
export const WEEKDAYS_LONG = [
  "Pazar",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
]
export const MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
]
export const MONTHS_SHORT = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
]

/** local YYYY-MM-DD key (no UTC drift) */
export function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function todayKey(): string {
  return dateKey(new Date())
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function diffDays(a: Date, b: Date): number {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime()
  return Math.round(ms / 86400000)
}

export function startOfDay(d: Date): Date {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  return r
}

export function isSameDay(a: Date, b: Date): boolean {
  return dateKey(a) === dateKey(b)
}

export function startOfWeek(d: Date, weekStart: 0 | 1): Date {
  const r = startOfDay(d)
  const day = r.getDay()
  const delta = (day - weekStart + 7) % 7
  return addDays(r, -delta)
}

/** ISO-ish week id "YYYY-Www" using given week start, stable for grouping */
export function weekId(d: Date, weekStart: 0 | 1): string {
  const s = startOfWeek(d, weekStart)
  return dateKey(s)
}

export function formatLongDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function relativeDayLabel(d: Date): string {
  const today = startOfDay(new Date())
  const diff = diffDays(d, today)
  if (diff === 0) return "Bugün"
  if (diff === -1) return "Dün"
  if (diff === 1) return "Yarın"
  return WEEKDAYS_LONG[d.getDay()]
}
