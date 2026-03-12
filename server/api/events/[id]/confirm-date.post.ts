import { requireAuth } from '../../../utils/auth'
import { getEvents, getConfirmedDates, saveConfirmedDates, getUsers, getAvailabilities, generateId } from '../../../utils/db'
import type { ConfirmedDateEntry } from '../../../utils/db'
import { sendConfirmationNotification } from '../../../utils/notifications'

export default defineEventHandler(async (event) => {
  const sessionUser = await requireAuth(event)
  const id = getRouterParam(event, 'id') as string
  const body = await readBody(event)
  const { date, remove, cancel, reschedule, newDate, location, startTime, endTime } = body

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
  const eventEntries = confirmedDates[id]

  if (remove) {
    confirmedDates[id] = eventEntries.filter(d => d.date !== date)
  } else if (cancel) {
    const entry = eventEntries.find(d => d.date === date)
    if (entry) {
      entry.cancelled = true
    }
  } else if (reschedule && newDate) {
    const oldEntry = eventEntries.find(d => d.date === date)
    if (oldEntry) {
      oldEntry.rescheduledTo = newDate
    }
    const existingNew = eventEntries.find(d => d.date === newDate)
    if (!existingNew) {
      const newEntry: ConfirmedDateEntry = {
        date: newDate,
        location: oldEntry?.location || '',
        startTime: oldEntry?.startTime || '',
        endTime: oldEntry?.endTime || '',
        cancelled: false,
        rescheduledFrom: date,
        rescheduledTo: null,
      }
      confirmedDates[id].push(newEntry)
    }
  } else {
    const existing = eventEntries.find(d => d.date === date)
    if (existing) {
      if (location !== undefined) existing.location = location
      if (startTime !== undefined) existing.startTime = startTime
      if (endTime !== undefined) existing.endTime = endTime
      existing.cancelled = false
    } else {
      const allUsers = await getUsers()
      const allAvailabilities = await getAvailabilities()
      const eventAvail = allAvailabilities[id] || {}

      const requiredIds: string[] = (dndEvent as unknown as Record<string, unknown>).requiredParticipantIds as string[] || []
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

      const newEntry: ConfirmedDateEntry = {
        date,
        location: location || '',
        startTime: startTime || '',
        endTime: endTime || '',
        cancelled: false,
        rescheduledFrom: null,
        rescheduledTo: null,
      }
      confirmedDates[id].push(newEntry)

      const availableUserIds = Object.entries(eventAvail)
        .filter(([, dates]) => (dates as string[]).includes(date))
        .map(([userId]) => userId)
      const participants = allUsers.filter(u => availableUserIds.includes(u.id))

      let notificationWarning: string | undefined
      try {
        await sendConfirmationNotification(dndEvent, date, participants, newEntry)
      } catch (e) {
        notificationWarning = (e as Error).message
        console.error('Notification failed:', e)
      }

      await saveConfirmedDates(confirmedDates)
      return { success: true, confirmedDates: confirmedDates[id], notificationWarning }
    }
  }

  await saveConfirmedDates(confirmedDates)
  return { success: true, confirmedDates: confirmedDates[id] }
})
