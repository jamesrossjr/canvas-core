<script setup lang="ts">
const auth = useAuth()
const router = useRouter()
const route = useRoute()

const form = reactive({
  email: ''
})

const isLoading = ref(false)
const isSuccess = ref(false)
const errorMessage = ref('')

const handleResetPassword = async () => {
  if (!form.email) {
    errorMessage.value = 'Email is required'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await auth.resetPassword(form.email)
    isSuccess.value = true
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to send reset email'
  } finally {
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
  title: 'Reset Password - Canvas'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center mb-6">
        <Logo class="h-12 w-auto" />
      </div>
      <h2 class="text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        Reset your password
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
        Remember your password?
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
        <!-- Success Message -->
        <UAlert
          v-if="isSuccess"
          color="green"
          variant="soft"
          title="Reset email sent"
          description="Check your email for instructions to reset your password."
          class="mb-6"
        />

        <!-- Error Message -->
        <UAlert
          v-else-if="errorMessage"
          color="red"
          variant="soft"
          :title="errorMessage"
          class="mb-6"
          @close="errorMessage = ''"
        />

        <!-- Reset Form -->
        <div v-if="!isSuccess">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <form class="space-y-6" @submit.prevent="handleResetPassword">
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

            <UButton
              type="submit"
              color="blue"
              variant="solid"
              block
              size="lg"
              :loading="isLoading"
            >
              Send reset email
            </UButton>
          </form>
        </div>

        <!-- Success Actions -->
        <div v-else class="space-y-4">
          <UButton
            to="/auth/login"
            color="blue"
            variant="solid"
            block
            size="lg"
          >
            Back to login
          </UButton>

          <UButton
            color="gray"
            variant="outline"
            block
            size="lg"
            @click="() => { isSuccess = false; form.email = '' }"
          >
            Send another email
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
