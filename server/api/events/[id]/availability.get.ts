import { requireAuth } from '../../../utils/auth'
import { getEvents, getAvailabilities, getMaybeAvailabilities, getUsers } from '../../../utils/db'

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
  const maybeAvailabilities = await getMaybeAvailabilities()
  const users = await getUsers()

  const eventAvailability = availabilities[id!] || {}
  const eventMaybe = maybeAvailabilities[id!] || {}

  // Collect all userIds that have any availability
  const allUserIds = new Set([
    ...Object.keys(eventAvailability),
    ...Object.keys(eventMaybe),
  ])

  const result = Array.from(allUserIds).map(userId => {
    const user = users.find(u => u.id === userId)
    return {
      userId,
      username: user?.username || 'Unknown',
      dates: eventAvailability[userId] || [],
      maybeDates: eventMaybe[userId] || [],
    }
  })

  return result
})
