import { requireAdmin } from '../../utils/auth'
import { getUsers, saveUsers } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')

  const users = await getUsers()
  const idx = users.findIndex(u => u.id === id)
  if (idx === -1) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  // Prevent deleting the last admin
  const admins = users.filter(u => u.globalRole === 'admin')
  if (admins.length === 1 && users[idx].globalRole === 'admin') {
    throw createError({ statusCode: 400, message: 'Cannot delete the last admin user' })
  }

  users.splice(idx, 1)
  await saveUsers(users)
  return { success: true }
})
