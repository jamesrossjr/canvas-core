<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const auth = useAuth()

// Handle OAuth callback
onMounted(async () => {
  try {
    // Get the auth code from URL params
    const { code, error, error_description } = route.query

    if (error) {
      console.error('OAuth error:', error, error_description)
      await router.push('/auth/login?error=' + encodeURIComponent(error_description as string || error as string))
      return
    }

    if (code) {
      // The Supabase client will automatically handle the code exchange
      // We just need to wait for the auth state change
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (auth.isAuthenticated.value) {
        await router.push('/')
      } else {
        await router.push('/auth/login?error=Authentication failed')
      }
    } else {
      await router.push('/auth/login')
    }
  } catch (error) {
    console.error('Callback error:', error)
    await router.push('/auth/login?error=Authentication failed')
  }
})

// Page meta
definePageMeta({
  layout: 'auth'
})

useHead({
  title: 'Authenticating - Canvas'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl rounded-lg sm:px-10">
        <div class="text-center">
          <div class="animate-spin inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mb-4" />
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Completing sign in...
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
            Please wait while we authenticate your account.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
