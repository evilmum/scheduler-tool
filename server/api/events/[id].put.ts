import { requireAdmin } from '../../utils/auth'
import { getEvents, saveEvents } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const events = await getEvents()
  const idx = events.findIndex(e => e.id === id)
  if (idx === -1) {
    throw createError({ statusCode: 404, message: 'Event not found' })
  }

  const updatableFields = [
    'name', 'description', 'type', 'planningWindowWeeks', 'minParticipants',
    'organizerId', 'participantIds', 'requiredParticipantIds', 'notificationMethod',
    'archived', 'allowedWeekdays', 'dayExceptions', 'discordChannelId',
    'reminderEnabled', 'reminderDaysBefore',
  ]
  const target = events[idx] as unknown as Record<string, unknown>
  for (const field of updatableFields) {
    if (body[field] !== undefined) {
      target[field] = body[field]
    }
  }

  await saveEvents(events)
  return events[idx]
})
