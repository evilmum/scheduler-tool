import bcrypt from 'bcryptjs'
import { requireAdmin } from '../../utils/auth'
import { getUsers, saveUsers, generateId } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  const { username, password, email, globalRole } = body

  if (!username || !password) {
    throw createError({ statusCode: 400, message: 'Username and password are required' })
  }

  const users = await getUsers()
  if (users.find(u => u.username === username)) {
    throw createError({ statusCode: 409, message: 'Username already exists' })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const newUser = {
    id: generateId(),
    username,
    passwordHash,
    email: email || '',
    globalRole: globalRole || 'user',
    createdAt: new Date().toISOString(),
  }

  users.push(newUser)
  await saveUsers(users)

  return { ...newUser, passwordHash: undefined }
})
