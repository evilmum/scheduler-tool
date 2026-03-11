// Returns NRW public holidays as { date: string, name: string }[]
// Static list for current + next year, auto-calculate Easter-based dates

function getEasterDate(year: number): Date {
  // Anonymous Gregorian algorithm
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month, day)
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function fmtDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getNRWHolidays(year: number): { date: string; name: string }[] {
  const easter = getEasterDate(year)

  const holidays = [
    // Fixed
    { date: `${year}-01-01`, name: 'Neujahr' },
    { date: `${year}-05-01`, name: 'Tag der Arbeit' },
    { date: `${year}-10-03`, name: 'Tag der Deutschen Einheit' },
    { date: `${year}-11-01`, name: 'Allerheiligen' },
    { date: `${year}-12-25`, name: '1. Weihnachtstag' },
    { date: `${year}-12-26`, name: '2. Weihnachtstag' },
    // Easter-based
    { date: fmtDate(addDays(easter, -2)), name: 'Karfreitag' },
    { date: fmtDate(addDays(easter, 1)), name: 'Ostermontag' },
    { date: fmtDate(addDays(easter, 39)), name: 'Christi Himmelfahrt' },
    { date: fmtDate(addDays(easter, 50)), name: 'Pfingstmontag' },
    { date: fmtDate(addDays(easter, 60)), name: 'Fronleichnam' },
  ]

  return holidays
}
