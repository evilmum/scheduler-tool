import { requireAdmin } from '../../utils/auth'
import { getEvents, saveEvents } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')

  const events = await getEvents()
  const idx = events.findIndex(e => e.id === id)
  if (idx === -1) {
    throw createError({ statusCode: 404, message: 'Event not found' })
  }

  events.splice(idx, 1)
  await saveEvents(events)
  return { success: true }
})
