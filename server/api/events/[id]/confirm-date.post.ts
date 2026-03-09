import { requireAuth } from '../../../utils/auth'
import { getEvents, getConfirmedDates, saveConfirmedDates, getUsers, getAvailabilities } from '../../../utils/db'
import { sendConfirmationNotification } from '../../../utils/notifications'

export default defineEventHandler(async (event) => {
  const sessionUser = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { date, remove } = body

  if (!date) {
    throw createError({ statusCode: 400, message: 'date is required' })
  }

  const events = await getEvents()
  const dndEvent = events.find(e => e.id === id)
  if (!dndEvent) {
    throw createError({ statusCode: 404, message: 'Event not found' })
  }

  // Only organizer or admin can confirm dates
  if (sessionUser.globalRole !== 'admin' && dndEvent.organizerId !== sessionUser.id) {
    throw createError({ statusCode: 403, message: 'Only the organizer or admin can confirm dates' })
  }

  const confirmedDates = await getConfirmedDates()
  if (!confirmedDates[id]) {
    confirmedDates[id] = []
  }

  if (remove) {
    confirmedDates[id] = confirmedDates[id].filter(d => d !== date)
  } else {
    if (!confirmedDates[id].includes(date)) {
      const allUsers = await getUsers()
      const allAvailabilities = await getAvailabilities()
      const eventAvail = allAvailabilities[id!] || {}

      // Check that all required participants are available on this date
      const requiredIds: string[] = (dndEvent as Record<string, unknown>).requiredParticipantIds as string[] || []
      if (requiredIds.length > 0) {
        const missingRequired = requiredIds.filter(uid => {
          const userDates: string[] = eventAvail[uid] || []
          return !userDates.includes(date)
        })
        if (missingRequired.length > 0) {
          const missingNames = missingRequired.map(uid => allUsers.find(u => u.id === uid)?.username || uid).join(', ')
          throw createError({ statusCode: 400, message: `Cannot confirm: required participant(s) not available: ${missingNames}` })
        }
      }

      confirmedDates[id].push(date)

      // Send notifications
      const availableUserIds = Object.entries(eventAvail)
        .filter(([, dates]) => dates.includes(date))
        .map(([userId]) => userId)
      const participants = allUsers.filter(u => availableUserIds.includes(u.id))

      try {
        await sendConfirmationNotification(dndEvent, date, participants)
      } catch (e) {
        console.error('Notification failed:', e)
      }
    }
  }

  await saveConfirmedDates(confirmedDates)
  return { success: true, confirmedDates: confirmedDates[id] }
})
