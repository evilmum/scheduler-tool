import { requireAuth } from '../../utils/auth'
import { getUsers, saveUsers } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const sessionUser = await requireAuth(event)
  const id = getRouterParam(event, 'id')

  // Users can only update their own profile unless admin
  if (sessionUser.globalRole !== 'admin' && sessionUser.id !== id) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const body = await readBody(event)
  const users = await getUsers()
  const idx = users.findIndex(u => u.id === id)
  if (idx === -1) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  const allowedFields: (keyof typeof users[0])[] = ['email']
  if (sessionUser.globalRole === 'admin') {
    allowedFields.push('username', 'globalRole')
  }

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      (users[idx] as Record<string, unknown>)[field] = body[field]
    }
  }

  await saveUsers(users)
  return { ...users[idx], passwordHash: undefined }
})
