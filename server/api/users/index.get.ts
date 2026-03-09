import { requireAdmin } from '../../utils/auth'
import { getUsers } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const users = await getUsers()
  return users.map(u => ({ ...u, passwordHash: undefined }))
})
