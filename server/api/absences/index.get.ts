import { requireAuth } from '../../utils/auth'
import { getAbsences } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const sessionUser = await requireAuth(event)
  const absences = await getAbsences()
  return absences[sessionUser.id] || []
})
