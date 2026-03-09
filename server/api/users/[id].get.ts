import { requireAuth } from '../../utils/auth'
import { getUsers } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const sessionUser = await requireAuth(event)
  const id = getRouterParam(event, 'id')

  // Users can only view their own profile unless admin
  if (sessionUser.globalRole !== 'admin' && sessionUser.id !== id) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const users = await getUsers()
  const user = users.find(u => u.id === id)
  if (!user) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  return { ...user, passwordHash: undefined }
})
