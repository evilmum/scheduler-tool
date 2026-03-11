import { requireAuth } from '../../../utils/auth'
import { getEvents, getAvailabilities, saveAvailabilities, getMaybeAvailabilities, saveMaybeAvailabilities } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const sessionUser = await requireAuth(event)
  const id = getRouterParam(event, 'id') as string
  const body = await readBody(event)
  const { dates, type } = body

  if (!Array.isArray(dates)) {
    throw createError({ statusCode: 400, message: 'dates must be an array of date strings' })
  }

  const availType: 'yes' | 'maybe' = type === 'maybe' ? 'maybe' : 'yes'

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

  if (availType === 'yes') {
    const availabilities = await getAvailabilities()
    if (!availabilities[id]) {
      availabilities[id] = {}
    }
    availabilities[id][sessionUser.id] = dates
    await saveAvailabilities(availabilities)
  } else {
    const maybeAvailabilities = await getMaybeAvailabilities()
    if (!maybeAvailabilities[id]) {
      maybeAvailabilities[id] = {}
    }
    maybeAvailabilities[id][sessionUser.id] = dates
    await saveMaybeAvailabilities(maybeAvailabilities)
  }

  return { success: true, dates, type: availType }
})
