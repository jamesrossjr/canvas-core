<script setup lang="ts">
const auth = useAuth()
const isOpen = ref(false)

const handleSignOut = async () => {
  isOpen.value = false
  await auth.signOut()
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
</script>

<template>
  <UDropdown
    v-if="auth.user.value"
    :items="[
      [
        {
          label: auth.user.value.email,
          slot: 'account',
          disabled: true
        }
      ],
      [
        {
          label: 'Profile',
          icon: 'i-lucide-user',
          to: '/profile'
        },
        {
          label: 'Settings',
          icon: 'i-lucide-settings',
          to: '/settings'
        },
        {
          label: 'Workspaces',
          icon: 'i-lucide-folder',
          to: '/workspaces'
        }
      ],
      [
        {
          label: 'Documentation',
          icon: 'i-lucide-book-open',
          to: '/docs'
        },
        {
          label: 'Support',
          icon: 'i-lucide-help-circle',
          to: '/support'
        }
      ],
      [
        {
          label: 'Sign out',
          icon: 'i-lucide-log-out',
          click: handleSignOut
        }
      ]
    ]"
    :popper="{ placement: 'bottom-start' }"
  >
    <UButton
      color="white"
      variant="ghost"
      class="flex items-center gap-2"
    >
      <div
        v-if="auth.user.value.avatar"
        class="w-8 h-8 rounded-full overflow-hidden"
      >
        <img
          :src="auth.user.value.avatar"
          :alt="auth.user.value.name"
          class="w-full h-full object-cover"
        >
      </div>
      <div
        v-else
        class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium"
      >
        {{ getInitials(auth.user.value.name) }}
      </div>
      <div class="hidden sm:block text-left">
        <div class="text-sm font-medium text-gray-900 dark:text-white">
          {{ auth.user.value.name }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          {{ auth.user.value.subscription.plan }}
        </div>
      </div>
      <UIcon name="i-lucide-chevron-down" class="w-4 h-4" />
    </UButton>

    <template #account="{ item }">
      <div class="text-left">
        <p class="truncate font-medium text-gray-900 dark:text-white">
          {{ auth.user.value.name }}
        </p>
        <p class="truncate text-sm text-gray-500 dark:text-gray-400">
          {{ item.label }}
        </p>
      </div>
    </template>
  </UDropdown>
</template>
