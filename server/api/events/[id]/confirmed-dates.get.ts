import { requireAuth } from '../../../utils/auth'
import { getEvents, getConfirmedDates } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const sessionUser = await requireAuth(event)
  const id = getRouterParam(event, 'id')

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

  const confirmedDates = await getConfirmedDates()
  return { confirmedDates: confirmedDates[id!] || [] }
})
