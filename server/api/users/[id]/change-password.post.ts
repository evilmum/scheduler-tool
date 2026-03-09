import bcrypt from 'bcryptjs'
import { requireAuth } from '../../../utils/auth'
import { getUsers, saveUsers } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const sessionUser = await requireAuth(event)
  const id = getRouterParam(event, 'id')

  // Users can only change their own password unless admin
  if (sessionUser.globalRole !== 'admin' && sessionUser.id !== id) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const body = await readBody(event)
  const { currentPassword, newPassword } = body

  if (!newPassword || newPassword.length < 6) {
    throw createError({ statusCode: 400, message: 'New password must be at least 6 characters' })
  }

  const users = await getUsers()
  const idx = users.findIndex(u => u.id === id)
  if (idx === -1) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  // Non-admins must provide current password
  if (sessionUser.globalRole !== 'admin') {
    if (!currentPassword) {
      throw createError({ statusCode: 400, message: 'Current password is required' })
    }
    const isValid = await bcrypt.compare(currentPassword, users[idx].passwordHash)
    if (!isValid) {
      throw createError({ statusCode: 401, message: 'Current password is incorrect' })
    }
  }

  users[idx].passwordHash = await bcrypt.hash(newPassword, 10)
  await saveUsers(users)
  return { success: true }
})
