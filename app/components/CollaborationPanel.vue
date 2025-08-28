<script setup lang="ts">
interface User {
  id: string
  name: string
  avatar?: string
  cursor?: {
    x: number
    y: number
    blockId?: string
  }
  isTyping?: boolean
  typingBlockId?: string
}

const props = defineProps<{
  users: User[]
  currentUser: User | null
  isConnected: boolean
  userCount: number
}>()

const emit = defineEmits<{
  inviteUser: []
  shareWorkspace: []
}>()

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getUserColor = (userId: string) => {
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
  ]
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  return colors[Math.abs(hash) % colors.length]
}

const getStatusColor = (user: User) => {
  if (user.isTyping) return 'text-yellow-500'
  return 'text-green-500'
}

const getStatusText = (user: User) => {
  if (user.isTyping && user.typingBlockId) return 'Typing...'
  return 'Active'
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1">
          <div
            :class="[
              'w-2 h-2 rounded-full',
              isConnected ? 'bg-green-500' : 'bg-red-500'
            ]"
          />
          <h3 class="text-sm font-medium text-gray-900 dark:text-white">
            Collaboration
          </h3>
        </div>
        <UBadge
          :color="isConnected ? 'green' : 'red'"
          variant="soft"
          size="xs"
        >
          {{ userCount }} {{ userCount === 1 ? 'user' : 'users' }}
        </UBadge>
      </div>

      <div class="flex items-center gap-1">
        <UButton
          icon="i-lucide-user-plus"
          size="xs"
          variant="ghost"
          @click="$emit('inviteUser')"
        />
        <UButton
          icon="i-lucide-share"
          size="xs"
          variant="ghost"
          @click="$emit('shareWorkspace')"
        />
      </div>
    </div>

    <!-- Current User -->
    <div v-if="currentUser" class="p-3 border-b border-gray-100 dark:border-gray-700">
      <div class="flex items-center gap-3">
        <div
          v-if="currentUser.avatar"
          class="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
        >
          <img :src="currentUser.avatar" :alt="currentUser.name" class="w-full h-full object-cover">
        </div>
        <div
          v-else
          class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0"
        >
          <span class="text-xs font-bold text-white">{{ getInitials(currentUser.name) }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
              {{ currentUser.name }} (You)
            </p>
          </div>
          <p class="text-xs text-green-500">
            Active
          </p>
        </div>
      </div>
    </div>

    <!-- Other Users -->
    <div class="max-h-64 overflow-y-auto">
      <div v-if="users.length === 0 && isConnected" class="p-4 text-center">
        <div class="text-gray-400 dark:text-gray-500 text-sm">
          <UIcon name="i-lucide-users" class="w-6 h-6 mx-auto mb-2" />
          <p>You're working alone</p>
          <p class="text-xs mt-1">
            Invite others to collaborate
          </p>
        </div>
      </div>

      <div v-if="!isConnected" class="p-4 text-center">
        <div class="text-red-400 text-sm">
          <UIcon name="i-lucide-wifi-off" class="w-6 h-6 mx-auto mb-2" />
          <p>Disconnected</p>
          <p class="text-xs mt-1">
            Trying to reconnect...
          </p>
        </div>
      </div>

      <div v-for="user in users" :key="user.id" class="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
        <div class="flex items-center gap-3">
          <div
            v-if="user.avatar"
            class="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
          >
            <img :src="user.avatar" :alt="user.name" class="w-full h-full object-cover">
          </div>
          <div
            v-else
            class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            :style="{ backgroundColor: getUserColor(user.id) }"
          >
            <span class="text-xs font-bold text-white">{{ getInitials(user.name) }}</span>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ user.name }}
              </p>
              <div
                class="w-2 h-2 rounded-full flex-shrink-0"
                :style="{ backgroundColor: getUserColor(user.id) }"
              />
            </div>
            <p :class="['text-xs', getStatusColor(user)]">
              {{ getStatusText(user) }}
            </p>
          </div>

          <div class="flex items-center gap-1">
            <UButton
              icon="i-lucide-message-circle"
              size="xs"
              variant="ghost"
              disabled
            />
            <UButton
              icon="i-lucide-more-horizontal"
              size="xs"
              variant="ghost"
              disabled
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="p-3 border-t border-gray-200 dark:border-gray-700">
      <div class="flex gap-2">
        <UButton
          icon="i-lucide-link"
          size="xs"
          variant="soft"
          class="flex-1"
          @click="$emit('shareWorkspace')"
        >
          Share Link
        </UButton>
        <UButton
          icon="i-lucide-settings"
          size="xs"
          variant="ghost"
          disabled
        />
      </div>
    </div>
  </div>
</template>
