import { requireAdmin } from '../../utils/auth'
import { testDiscordNotification, testEmailNotification } from '../../utils/notifications'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  const { type, email, discord } = body

  try {
    if (type === 'discord') {
      // Allow passing discord config directly (so user doesn't have to save first)
      await testDiscordNotification(discord)
      return { success: true, message: 'Discord test notification sent!' }
    } else if (type === 'email') {
      if (!email) {
        throw createError({ statusCode: 400, message: 'Email address is required for email test' })
      }
      await testEmailNotification(email)
      return { success: true, message: `Email sent to ${email}` }
    } else {
      throw createError({ statusCode: 400, message: 'type must be "discord" or "email"' })
    }
  } catch (error: unknown) {
    if ((error as { statusCode?: number }).statusCode) throw error
    throw createError({ statusCode: 500, message: (error as Error).message })
  }
})
