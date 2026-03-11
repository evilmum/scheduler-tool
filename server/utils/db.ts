import { promises as fs } from 'fs'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), 'server', 'data')

export async function readJSON<T>(filename: string): Promise<T> {
  const filePath = join(DATA_DIR, filename)
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content) as T
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw createError({ statusCode: 500, message: `Data file not found: ${filename}` })
    }
    throw error
  }
}

export async function writeJSON<T>(filename: string, data: T): Promise<void> {
  const filePath = join(DATA_DIR, filename)
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export interface User {
  id: string
  username: string
  passwordHash: string
  email: string
  globalRole: 'admin' | 'user'
  createdAt: string
}

export interface DnDEvent {
  id: string
  name: string
  description: string
  type: 'recurring' | 'one-time'
  planningWindowWeeks: number
  minParticipants: number
  organizerId: string
  participantIds: string[]
  notificationMethod: 'discord' | 'email' | 'both' | 'none'
  createdAt: string
  archived: boolean
  // Feature 3: allowed weekdays
  allowedWeekdays: number[]   // 0=Sun,1=Mon,...,6=Sat. Empty = all allowed
  dayExceptions: string[]     // specific dates that override allowedWeekdays
  // Feature 4: per-event Discord channel
  discordChannelId?: string
  // Feature 6: reminders
  reminderEnabled: boolean
  reminderDaysBefore: number
}

export interface Settings {
  discord: {
    token: string
    channelId: string
  }
  smtp: {
    host: string
    port: number
    user: string
    password: string
    from: string
  }
}

// Feature 1: ConfirmedDateEntry with location/time/cancel/reschedule
export interface ConfirmedDateEntry {
  date: string
  location: string
  startTime: string
  endTime: string
  cancelled: boolean
  rescheduledFrom: string | null
  rescheduledTo: string | null
}

// Feature 8: Absence
export interface Absence {
  id: string
  start: string
  end: string
  note: string
}

export type Availabilities = Record<string, Record<string, string[]>>
export type MaybeAvailabilities = Record<string, Record<string, string[]>>
export type ConfirmedDates = Record<string, ConfirmedDateEntry[]>
export type Absences = Record<string, Absence[]>
export type SentReminders = Record<string, boolean>

export async function getUsers(): Promise<User[]> {
  return readJSON<User[]>('users.json')
}

export async function saveUsers(users: User[]): Promise<void> {
  return writeJSON('users.json', users)
}

export async function getEvents(): Promise<DnDEvent[]> {
  return readJSON<DnDEvent[]>('events.json')
}

export async function saveEvents(events: DnDEvent[]): Promise<void> {
  return writeJSON('events.json', events)
}

export async function getAvailabilities(): Promise<Availabilities> {
  return readJSON<Availabilities>('availabilities.json')
}

export async function saveAvailabilities(data: Availabilities): Promise<void> {
  return writeJSON('availabilities.json', data)
}

export async function getMaybeAvailabilities(): Promise<MaybeAvailabilities> {
  return readJSON<MaybeAvailabilities>('maybe-availabilities.json')
}

export async function saveMaybeAvailabilities(data: MaybeAvailabilities): Promise<void> {
  return writeJSON('maybe-availabilities.json', data)
}

export async function getConfirmedDates(): Promise<ConfirmedDates> {
  return readJSON<ConfirmedDates>('confirmed-dates.json')
}

export async function saveConfirmedDates(data: ConfirmedDates): Promise<void> {
  return writeJSON('confirmed-dates.json', data)
}

export async function getAbsences(): Promise<Absences> {
  return readJSON<Absences>('absences.json')
}

export async function saveAbsences(data: Absences): Promise<void> {
  return writeJSON('absences.json', data)
}

export async function getSentReminders(): Promise<SentReminders> {
  return readJSON<SentReminders>('sent-reminders.json')
}

export async function saveSentReminders(data: SentReminders): Promise<void> {
  return writeJSON('sent-reminders.json', data)
}

export async function getSettings(): Promise<Settings> {
  return readJSON<Settings>('settings.json')
}

export async function saveSettings(data: Settings): Promise<void> {
  return writeJSON('settings.json', data)
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}
