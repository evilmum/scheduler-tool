export default defineNuxtRouteMiddleware(async () => {
  const { user, loggedIn } = useUserSession()
  if (!loggedIn.value) {
    return navigateTo('/login')
  }
  if ((user.value as { globalRole?: string })?.globalRole !== 'admin') {
    return navigateTo('/dashboard')
  }
})
