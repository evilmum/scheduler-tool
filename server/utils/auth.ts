import type { H3Event } from 'h3'

export interface SessionUser {
  id: string
  username: string
  globalRole: 'admin' | 'user'
}

export async function requireAuth(event: H3Event): Promise<SessionUser> {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  return session.user as SessionUser
}

export async function requireAdmin(event: H3Event): Promise<SessionUser> {
  const user = await requireAuth(event)
  if (user.globalRole !== 'admin') {
    throw createError({ statusCode: 403, message: 'Forbidden: Admin access required' })
  }
  return user
}
