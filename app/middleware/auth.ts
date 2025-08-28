export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuth()

  // If not authenticated and not going to auth pages
  if (!auth.isAuthenticated.value && !to.path.startsWith('/auth')) {
    return navigateTo('/auth/login')
  }

  // If authenticated and going to auth pages, redirect to home
  if (auth.isAuthenticated.value && to.path.startsWith('/auth')) {
    return navigateTo('/')
  }
})
