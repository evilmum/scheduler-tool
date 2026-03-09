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

export type Availabilities = Record<string, Record<string, string[]>>
export type ConfirmedDates = Record<string, string[]>

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

export async function getConfirmedDates(): Promise<ConfirmedDates> {
  return readJSON<ConfirmedDates>('confirmed-dates.json')
}

export async function saveConfirmedDates(data: ConfirmedDates): Promise<void> {
  return writeJSON('confirmed-dates.json', data)
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
