import nodemailer from 'nodemailer'
import { getSettings } from './db'
import type { DnDEvent, User, ConfirmedDateEntry } from './db'

export async function sendConfirmationNotification(
  event: DnDEvent,
  date: string,
  participants: User[],
  entry?: ConfirmedDateEntry
): Promise<void> {
  const settings = await getSettings()
  const method = event.notificationMethod

  if (method === 'none') return

  let message = `📅 DnD Session Confirmed!\n\nEvent: ${event.name}\nDate: ${date}`
  if (entry?.location) message += `\nOrt: ${entry.location}`
  if (entry?.startTime) message += `\nUhrzeit: ${entry.startTime}${entry.endTime ? ' – ' + entry.endTime : ''}`
  message += '\n\nSee you there, adventurers!'

  const promises: Promise<void>[] = []

  // Feature 4: use per-event channelId if set, else fall back to global
  const channelId = event.discordChannelId || settings.discord.channelId

  if ((method === 'discord' || method === 'both') && settings.discord.token && channelId) {
    promises.push(sendDiscordNotification(settings.discord.token, channelId, message))
  }

  if ((method === 'email' || method === 'both') && settings.smtp.host) {
    const emails = participants.filter(p => p.email).map(p => p.email)
    if (emails.length > 0) {
      promises.push(sendEmailNotification(settings.smtp, emails, `DnD Session Confirmed: ${event.name}`, message))
    }
  }

  await Promise.allSettled(promises)
}

export async function sendReminderNotification(
  event: DnDEvent,
  entry: ConfirmedDateEntry,
  participants: User[]
): Promise<void> {
  const settings = await getSettings()
  const method = event.notificationMethod

  if (method === 'none') return

  let message = `🔔 Erinnerung: DnD Session morgen!\n\nEvent: ${event.name}\nDatum: ${entry.date}`
  if (entry.location) message += `\nOrt: ${entry.location}`
  if (entry.startTime) message += `\nUhrzeit: ${entry.startTime}${entry.endTime ? ' – ' + entry.endTime : ''}`
  message += '\n\nVergiss es nicht!'

  const promises: Promise<void>[] = []
  const channelId = event.discordChannelId || settings.discord.channelId

  if ((method === 'discord' || method === 'both') && settings.discord.token && channelId) {
    promises.push(sendDiscordNotification(settings.discord.token, channelId, message))
  }

  if ((method === 'email' || method === 'both') && settings.smtp.host) {
    const emails = participants.filter(p => p.email).map(p => p.email)
    if (emails.length > 0) {
      promises.push(sendEmailNotification(settings.smtp, emails, `Erinnerung: ${event.name} morgen`, message))
    }
  }

  await Promise.allSettled(promises)
}

async function sendDiscordNotification(token: string, channelId: string, message: string): Promise<void> {
  const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content: message }),
  })

  if (!response.ok) {
    const body = await response.text()
    let hint = ''
    if (response.status === 401) hint = ' – Ungültiger Bot-Token'
    else if (response.status === 403) hint = ' – Bot hat keine Schreibrechte in diesem Channel'
    else if (response.status === 404) hint = ' – Channel nicht gefunden (Channel-ID prüfen)'
    throw new Error(`Discord API ${response.status}${hint}: ${body}`)
  }
}

async function sendEmailNotification(
  smtp: { host: string; port: number; user: string; password: string; from: string },
  to: string[],
  subject: string,
  text: string
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: smtp.user ? { user: smtp.user, pass: smtp.password } : undefined,
  })

  await transporter.sendMail({
    from: smtp.from,
    to: to.join(', '),
    subject,
    text,
  })
}

export async function testDiscordNotification(
  override?: { token?: string; channelId?: string }
): Promise<void> {
  const settings = await getSettings()
  const token = override?.token || settings.discord.token
  const channelId = override?.channelId || settings.discord.channelId

  if (!token) throw new Error('Kein Bot-Token konfiguriert')
  if (!channelId) throw new Error('Keine Channel-ID konfiguriert')

  await sendDiscordNotification(token, channelId, '🎲 DnD Scheduler: Testbenachrichtigung erfolgreich!')
}

export async function testEmailNotification(to: string): Promise<void> {
  const settings = await getSettings()
  if (!settings.smtp.host) {
    throw new Error('SMTP not configured')
  }
  await sendEmailNotification(settings.smtp, [to], 'DnD Scheduler: Test notification', '🎲 This is a test notification from DnD Scheduler!')
}
