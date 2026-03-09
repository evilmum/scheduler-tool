import { requireAuth } from '../../../utils/auth'
import { getEvents, getAvailabilities, getUsers } from '../../../utils/db'

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

  const availabilities = await getAvailabilities()
  const users = await getUsers()

  const eventAvailability = availabilities[id] || {}

  // Return with user info
  const result = Object.entries(eventAvailability).map(([userId, dates]) => {
    const user = users.find(u => u.id === userId)
    return {
      userId,
      username: user?.username || 'Unknown',
      dates,
    }
  })

  return result
})
