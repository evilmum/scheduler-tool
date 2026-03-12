import { getEvents, getConfirmedDates, getUsers, getSentReminders, saveSentReminders } from '../utils/db'
import { sendReminderNotification } from '../utils/notifications'

async function checkAndSendReminders() {
  try {
    const events = await getEvents()
    const confirmedDates = await getConfirmedDates()
    const allUsers = await getUsers()
    const sentReminders = await getSentReminders()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const dndEvent of events) {
      if (dndEvent.archived) continue
      if (!dndEvent.reminderEnabled) continue

      const daysBefore = dndEvent.reminderDaysBefore ?? 1
      const entries = confirmedDates[dndEvent.id] || []

      for (const entry of entries) {
        if (entry.cancelled) continue

        const entryDate = new Date(entry.date + 'T00:00:00')
        const diffMs = entryDate.getTime() - today.getTime()
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

        if (diffDays !== daysBefore) continue

        const reminderKey = `${dndEvent.id}-${entry.date}`
        if (sentReminders[reminderKey]) continue

        // Find participants who are available on this date
        const participants = allUsers.filter(u =>
          dndEvent.participantIds.includes(u.id) || dndEvent.organizerId === u.id
        )

        try {
          await sendReminderNotification(dndEvent, entry, participants)
          sentReminders[reminderKey] = true
        } catch (e) {
          console.error(`Reminder failed for ${reminderKey}:`, e)
        }
      }
    }

    await saveSentReminders(sentReminders)
  } catch (e) {
    console.error('Reminder check failed:', e)
  }
}

export default defineNitroPlugin(() => {
  // Check once on startup, then every hour
  checkAndSendReminders()
  setInterval(checkAndSendReminders, 60 * 60 * 1000)

  console.log('DnD Scheduler: Reminder job registered (hourly check)')
})
