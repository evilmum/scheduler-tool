import { requireAdmin } from '../../utils/auth'
import { getSettings, saveSettings } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  const settings = await getSettings()

  if (body.discord) {
    settings.discord = { ...settings.discord, ...body.discord }
  }
  if (body.smtp) {
    settings.smtp = { ...settings.smtp, ...body.smtp }
  }

  await saveSettings(settings)
  return settings
})
