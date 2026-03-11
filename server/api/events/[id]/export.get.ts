import { requireAuth } from '../../../utils/auth'
import { getEvents, getConfirmedDates } from '../../../utils/db'

function fmtICSDate(dateStr: string, timeStr?: string): string {
  // dateStr: YYYY-MM-DD, timeStr: HH:MM
  const d = dateStr.replace(/-/g, '')
  if (timeStr) {
    const t = timeStr.replace(':', '') + '00'
    return `${d}T${t}`
  }
  return d
}

function escapeICS(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

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

  const confirmedDates = await getConfirmedDates()
  const entries = (confirmedDates[id!] || []).filter(e => !e.cancelled)

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DnD Scheduler//EN',
    'CALSCALE:GREGORIAN',
  ]

  for (const entry of entries) {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${id}-${entry.date}@dnd-scheduler`)

    if (entry.startTime) {
      lines.push(`DTSTART:${fmtICSDate(entry.date, entry.startTime)}`)
    } else {
      lines.push(`DTSTART;VALUE=DATE:${fmtICSDate(entry.date)}`)
    }

    if (entry.endTime) {
      lines.push(`DTEND:${fmtICSDate(entry.date, entry.endTime)}`)
    } else if (entry.startTime) {
      lines.push(`DTEND:${fmtICSDate(entry.date, entry.startTime)}`)
    } else {
      lines.push(`DTEND;VALUE=DATE:${fmtICSDate(entry.date)}`)
    }

    lines.push(`SUMMARY:${escapeICS(dndEvent.name)}`)

    if (entry.location) {
      lines.push(`LOCATION:${escapeICS(entry.location)}`)
    }

    let desc = 'Bestätigter DnD Termin'
    if (entry.rescheduledFrom) desc += ` (verschoben von ${entry.rescheduledFrom})`
    lines.push(`DESCRIPTION:${escapeICS(desc)}`)
    lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  const icsContent = lines.join('\r\n')
  const safeName = dndEvent.name.replace(/[^a-zA-Z0-9-_]/g, '_')

  setHeader(event, 'Content-Type', 'text/calendar; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="${safeName}.ics"`)

  return icsContent
})
