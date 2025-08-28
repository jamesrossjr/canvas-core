<script setup lang="ts">
const auth = useAuth()
const router = useRouter()
const route = useRoute()

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const isLoading = ref(false)
const errorMessage = ref('')

const handleSignUp = async () => {
  if (form.password !== form.confirmPassword) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  if (form.password.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters long'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await auth.signUp(form.email, form.password, {
      name: form.name
    })

    // Redirect to dashboard on success
    await router.push('/')
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to create account'
  } finally {
    isLoading.value = false
  }
}

const handleGoogleSignIn = async () => {
  isLoading.value = true
  try {
    await auth.signInWithOAuth('google')
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to sign in with Google'
    isLoading.value = false
  }
}

const handleGitHubSignIn = async () => {
  isLoading.value = true
  try {
    await auth.signInWithOAuth('github')
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to sign in with GitHub'
    isLoading.value = false
  }
}

const handleDiscordSignIn = async () => {
  isLoading.value = true
  try {
    await auth.signInWithOAuth('discord')
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to sign in with Discord'
    isLoading.value = false
  }
}

// Show error from URL params if present
onMounted(() => {
  const error = route.query.error as string
  if (error) {
    errorMessage.value = decodeURIComponent(error)
  }
})

// Page meta
definePageMeta({
  layout: 'auth'
})

useHead({
  title: 'Sign Up - Canvas'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center mb-6">
        <Logo class="h-12 w-auto" />
      </div>
      <h2 class="text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        Create your account
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?
        <NuxtLink
          to="/auth/login"
          class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Sign in
        </NuxtLink>
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl rounded-lg sm:px-10">
        <!-- Error Message -->
        <UAlert
          v-if="errorMessage"
          color="red"
          variant="soft"
          :title="errorMessage"
          class="mb-6"
          @close="errorMessage = ''"
        />

        <!-- OAuth Buttons -->
        <div class="space-y-3 mb-6">
          <UButton
            color="white"
            variant="solid"
            block
            size="lg"
            :loading="isLoading"
            @click="handleGoogleSignIn"
          >
            <template #leading>
              <Icon name="logos:google-icon" class="w-5 h-5" />
            </template>
            Continue with Google
          </UButton>

          <UButton
            color="gray"
            variant="solid"
            block
            size="lg"
            :loading="isLoading"
            @click="handleGitHubSignIn"
          >
            <template #leading>
              <Icon name="simple-icons:github" class="w-5 h-5" />
            </template>
            Continue with GitHub
          </UButton>

          <UButton
            color="blue"
            variant="solid"
            block
            size="lg"
            :loading="isLoading"
            @click="handleDiscordSignIn"
          >
            <template #leading>
              <Icon name="simple-icons:discord" class="w-5 h-5" />
            </template>
            Continue with Discord
          </UButton>
        </div>

        <!-- Divider -->
        <div class="relative mb-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              Or continue with email
            </span>
          </div>
        </div>

        <!-- Sign Up Form -->
        <form class="space-y-6" @submit.prevent="handleSignUp">
          <UFormGroup label="Full Name">
            <UInput
              v-model="form.name"
              placeholder="Enter your full name"
              required
              :disabled="isLoading"
              size="lg"
            />
          </UFormGroup>

          <UFormGroup label="Email address">
            <UInput
              v-model="form.email"
              type="email"
              placeholder="Enter your email"
              required
              :disabled="isLoading"
              size="lg"
            />
          </UFormGroup>

          <UFormGroup label="Password">
            <UInput
              v-model="form.password"
              type="password"
              placeholder="Create a password"
              required
              :disabled="isLoading"
              size="lg"
            />
          </UFormGroup>

          <UFormGroup label="Confirm Password">
            <UInput
              v-model="form.confirmPassword"
              type="password"
              placeholder="Confirm your password"
              required
              :disabled="isLoading"
              size="lg"
            />
          </UFormGroup>

          <UButton
            type="submit"
            color="blue"
            variant="solid"
            block
            size="lg"
            :loading="isLoading"
          >
            Create Account
          </UButton>
        </form>

        <!-- Terms -->
        <p class="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          By signing up, you agree to our
          <a href="#" class="text-blue-600 hover:text-blue-500 dark:text-blue-400">Terms of Service</a>
          and
          <a href="#" class="text-blue-600 hover:text-blue-500 dark:text-blue-400">Privacy Policy</a>
        </p>
      </div>
    </div>
  </div>
</template>
