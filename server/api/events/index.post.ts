import { requireAdmin } from '../../utils/auth'
import { getEvents, saveEvents, generateId } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)

  const { name, description, type, planningWindowWeeks, minParticipants, organizerId, participantIds, requiredParticipantIds, notificationMethod } = body

  if (!name || !organizerId) {
    throw createError({ statusCode: 400, message: 'Name and organizerId are required' })
  }

  const events = await getEvents()
  const newEvent = {
    id: generateId(),
    name,
    description: description || '',
    type: type || 'recurring',
    planningWindowWeeks: planningWindowWeeks || 4,
    minParticipants: minParticipants || 2,
    organizerId,
    participantIds: participantIds || [],
    requiredParticipantIds: requiredParticipantIds || [],
    notificationMethod: notificationMethod || 'none',
    createdAt: new Date().toISOString(),
    archived: false,
  }

  events.push(newEvent)
  await saveEvents(events)
  return newEvent
})
