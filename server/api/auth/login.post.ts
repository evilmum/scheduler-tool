import bcrypt from 'bcryptjs'
import { getUsers } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body

  if (!username || !password) {
    throw createError({ statusCode: 400, message: 'Username and password are required' })
  }

  const users = await getUsers()
  const user = users.find(u => u.username === username)

  if (!user) {
    throw createError({ statusCode: 401, message: 'Invalid username or password' })
  }

  const isValid = await bcrypt.compare(password, user.passwordHash)
  if (!isValid) {
    throw createError({ statusCode: 401, message: 'Invalid username or password' })
  }

  await setUserSession(event, {
    user: {
      id: user.id,
      username: user.username,
      globalRole: user.globalRole,
    },
  })

  return { success: true, user: { id: user.id, username: user.username, globalRole: user.globalRole } }
})
