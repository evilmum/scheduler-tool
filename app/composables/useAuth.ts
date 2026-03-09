export interface AuthUser {
  id: string
  username: string
  globalRole: 'admin' | 'user'
}

export function useAuth() {
  const { user, loggedIn, fetch: refreshSession } = useUserSession()

  const authUser = computed(() => user.value as AuthUser | null)
  const isAdmin = computed(() => authUser.value?.globalRole === 'admin')

  async function login(username: string, password: string) {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    })
    await refreshSession()
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await refreshSession()
    await navigateTo('/login')
  }

  return {
    user: authUser,
    loggedIn,
    isAdmin,
    login,
    logout,
  }
}
