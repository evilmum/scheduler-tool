import { requireAuth } from '../../utils/auth'
import { getAbsences, saveAbsences, generateId } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const sessionUser = await requireAuth(event)
  const body = await readBody(event)
  const { start, end, note } = body

  if (!start || !end) {
    throw createError({ statusCode: 400, message: 'start and end are required' })
  }

  const absences = await getAbsences()
  if (!absences[sessionUser.id]) {
    absences[sessionUser.id] = []
  }

  const userAbsences = absences[sessionUser.id]
  if (!userAbsences) {
    throw createError({ statusCode: 500, message: 'Failed to initialize absences' })
  }

  const newAbsence = {
    id: generateId(),
    start,
    end,
    note: note || '',
  }

  userAbsences.push(newAbsence)
  await saveAbsences(absences)
  return newAbsence
})
