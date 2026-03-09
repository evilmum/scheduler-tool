import { requireAuth } from '../../../utils/auth'
import { getEvents, getAvailabilities, saveAvailabilities } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const sessionUser = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { dates } = body

  if (!Array.isArray(dates)) {
    throw createError({ statusCode: 400, message: 'dates must be an array of date strings' })
  }

  const events = await getEvents()
  const dndEvent = events.find(e => e.id === id)
  if (!dndEvent) {
    throw createError({ statusCode: 404, message: 'Event not found' })
  }

  if (sessionUser.globalRole !== 'admin' &&
    !dndEvent.participantIds.includes(sessionUser.id) &&
    dndEvent.organizerId !== sessionUser.id) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const availabilities = await getAvailabilities()
  if (!availabilities[id]) {
    availabilities[id] = {}
  }
  availabilities[id][sessionUser.id] = dates

  await saveAvailabilities(availabilities)
  return { success: true, dates }
})
