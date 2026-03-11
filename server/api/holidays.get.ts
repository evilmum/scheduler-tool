import { getNRWHolidays } from '../utils/holidays'

export default defineEventHandler(async () => {
  const year = new Date().getFullYear()
  return [...getNRWHolidays(year), ...getNRWHolidays(year + 1)]
})
