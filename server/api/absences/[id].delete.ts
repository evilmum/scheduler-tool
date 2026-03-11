import { requireAuth } from '../../utils/auth'
import { getAbsences, saveAbsences } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const sessionUser = await requireAuth(event)
  const absenceId = getRouterParam(event, 'id')

  const absences = await getAbsences()
  const userAbsences = absences[sessionUser.id] || []
  const newList = userAbsences.filter(a => a.id !== absenceId)

  if (newList.length === userAbsences.length) {
    throw createError({ statusCode: 404, message: 'Absence not found' })
  }

  absences[sessionUser.id] = newList
  await saveAbsences(absences)
  return { success: true }
})
