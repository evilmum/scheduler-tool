import { requireAdmin } from '../../utils/auth'
import { getSettings } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return getSettings()
})
