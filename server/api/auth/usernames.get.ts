import { getUsers } from '../../utils/db'

// Public endpoint — only returns usernames, no sensitive data
export default defineEventHandler(async () => {
  const users = await getUsers()
  return users.map(u => u.username)
})
