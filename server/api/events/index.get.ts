import { requireAuth } from '../../utils/auth'
import { getEvents } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const sessionUser = await requireAuth(event)
  const events = await getEvents()

  if (sessionUser.globalRole === 'admin') {
    return events
  }

  // Regular users see only events they participate in
  return events.filter(e =>
    e.participantIds.includes(sessionUser.id) || e.organizerId === sessionUser.id
  )
})
