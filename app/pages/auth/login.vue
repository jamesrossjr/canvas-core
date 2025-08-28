<script setup lang="ts">
const auth = useAuth()
const router = useRouter()

const isLoading = ref(false)
const showSignUp = ref(false)
const form = ref({
  email: '',
  password: '',
  fullName: '',
  confirmPassword: ''
})

const errors = ref({
  email: '',
  password: '',
  fullName: '',
  confirmPassword: '',
  general: ''
})

const validateForm = () => {
  errors.value = {
    email: '',
    password: '',
    fullName: '',
    confirmPassword: '',
    general: ''
  }

  let isValid = true

  // Email validation
  if (!form.value.email) {
    errors.value.email = 'Email is required'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'Please enter a valid email'
    isValid = false
  }

  // Password validation
  if (!form.value.password) {
    errors.value.password = 'Password is required'
    isValid = false
  } else if (showSignUp.value && form.value.password.length < 6) {
    errors.value.password = 'Password must be at least 6 characters'
    isValid = false
  }

  // Sign up specific validations
  if (showSignUp.value) {
    if (!form.value.fullName) {
      errors.value.fullName = 'Full name is required'
      isValid = false
    }

    if (form.value.password !== form.value.confirmPassword) {
      errors.value.confirmPassword = 'Passwords do not match'
      isValid = false
    }
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm() || isLoading.value) return

  isLoading.value = true
  errors.value.general = ''

  try {
    let result

    if (showSignUp.value) {
      result = await auth.signUpWithEmail(
        form.value.email,
        form.value.password,
        form.value.fullName
      )
    } else {
      result = await auth.signInWithEmail(
        form.value.email,
        form.value.password
      )
    }

    if (!result.success) {
      errors.value.general = result.error || 'Authentication failed'
    } else if (showSignUp.value && result.error) {
      // Sign up success with email confirmation message
      errors.value.general = result.error
    }
  } catch (error) {
    console.error('Authentication error:', error)
    errors.value.general = 'An unexpected error occurred'
  } finally {
    isLoading.value = false
  }
}

const handleOAuthLogin = async (provider: 'google' | 'github' | 'discord') => {
  isLoading.value = true
  errors.value.general = ''

  const result = await auth.signInWithProvider(provider)

  if (!result.success) {
    errors.value.general = result.error || 'OAuth authentication failed'
    isLoading.value = false
  }
  // Loading will be handled by redirect
}

const toggleMode = () => {
  showSignUp.value = !showSignUp.value
  errors.value = {
    email: '',
    password: '',
    fullName: '',
    confirmPassword: '',
    general: ''
  }
  form.value = {
    email: form.value.email,
    password: '',
    fullName: '',
    confirmPassword: ''
  }
}

// Redirect if already authenticated
watch(() => auth.isAuthenticated.value, (isAuth) => {
  if (isAuth) {
    router.push('/')
  }
}, { immediate: true })

// Page meta
definePageMeta({
  layout: 'auth'
})

useHead({
  title: 'Sign In - Canvas'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <!-- Logo -->
      <div class="flex justify-center">
        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
          <UIcon name="i-lucide-canvas" class="w-6 h-6 text-white" />
        </div>
      </div>

      <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        {{ showSignUp ? 'Create your account' : 'Sign in to Canvas' }}
      </h2>

      <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
        {{ showSignUp ? 'Already have an account?' : "Don't have an account?" }}
        <button
          type="button"
          class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          @click="toggleMode"
        >
          {{ showSignUp ? 'Sign in' : 'Sign up' }}
        </button>
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl rounded-lg sm:px-10">
        <!-- OAuth Buttons -->
        <div class="space-y-3 mb-6">
          <UButton
            variant="outline"
            size="lg"
            class="w-full justify-center"
            :disabled="isLoading"
            @click="handleOAuthLogin('google')"
          >
            <UIcon name="i-logos-google-icon" class="w-5 h-5 mr-2" />
            Continue with Google
          </UButton>

          <UButton
            variant="outline"
            size="lg"
            class="w-full justify-center"
            :disabled="isLoading"
            @click="handleOAuthLogin('github')"
          >
            <UIcon name="i-logos-github-icon" class="w-5 h-5 mr-2" />
            Continue with GitHub
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

        <!-- Form -->
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <!-- Full Name (Sign Up Only) -->
          <UFormGroup
            v-if="showSignUp"
            label="Full Name"
            :error="errors.fullName"
            required
          >
            <UInput
              v-model="form.fullName"
              type="text"
              placeholder="Enter your full name"
              :disabled="isLoading"
              icon="i-lucide-user"
            />
          </UFormGroup>

          <!-- Email -->
          <UFormGroup
            label="Email address"
            :error="errors.email"
            required
          >
            <UInput
              v-model="form.email"
              type="email"
              placeholder="Enter your email"
              :disabled="isLoading"
              icon="i-lucide-mail"
            />
          </UFormGroup>

          <!-- Password -->
          <UFormGroup
            label="Password"
            :error="errors.password"
            required
          >
            <UInput
              v-model="form.password"
              type="password"
              placeholder="Enter your password"
              :disabled="isLoading"
              icon="i-lucide-lock"
            />
          </UFormGroup>

          <!-- Confirm Password (Sign Up Only) -->
          <UFormGroup
            v-if="showSignUp"
            label="Confirm Password"
            :error="errors.confirmPassword"
            required
          >
            <UInput
              v-model="form.confirmPassword"
              type="password"
              placeholder="Confirm your password"
              :disabled="isLoading"
              icon="i-lucide-lock"
            />
          </UFormGroup>

          <!-- General Error -->
          <UAlert
            v-if="errors.general"
            :title="errors.general"
            color="red"
            variant="soft"
            :close-button="{ icon: 'i-lucide-x', color: 'gray', variant: 'link' }"
            @close="errors.general = ''"
          />

          <!-- Forgot Password Link (Sign In Only) -->
          <div v-if="!showSignUp" class="flex items-center justify-between">
            <NuxtLink
              to="/auth/reset-password"
              class="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Forgot your password?
            </NuxtLink>
          </div>

          <!-- Submit Button -->
          <UButton
            type="submit"
            size="lg"
            class="w-full justify-center"
            :loading="isLoading"
            :disabled="isLoading"
          >
            {{ showSignUp ? 'Create Account' : 'Sign In' }}
          </UButton>
        </form>

        <!-- Terms (Sign Up Only) -->
        <p v-if="showSignUp" class="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center">
          By creating an account, you agree to our
          <NuxtLink to="/legal/terms" class="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
            Terms of Service
          </NuxtLink>
          and
          <NuxtLink to="/legal/privacy" class="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
            Privacy Policy
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
