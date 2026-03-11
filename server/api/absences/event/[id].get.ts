import { requireAuth } from '../../../utils/auth'
import { getEvents, getAbsences, getUsers } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const sessionUser = await requireAuth(event)
  const eventId = getRouterParam(event, 'id')

  const events = await getEvents()
  const dndEvent = events.find(e => e.id === eventId)
  if (!dndEvent) {
    throw createError({ statusCode: 404, message: 'Event not found' })
  }

  // Only organizer or admin can see all absences
  if (sessionUser.globalRole !== 'admin' && dndEvent.organizerId !== sessionUser.id) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const absences = await getAbsences()
  const users = await getUsers()

  // Return absences for all participants
  const participantIds = [...new Set([...dndEvent.participantIds, dndEvent.organizerId])]

  const result = participantIds
    .map(uid => {
      const user = users.find(u => u.id === uid)
      const userAbsences = absences[uid] || []
      return {
        userId: uid,
        username: user?.username || uid,
        absences: userAbsences,
      }
    })
    .filter(entry => entry.absences.length > 0)

  return result
})
