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
  currentUserId?: string
}>()

const cursorColors = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
]

const getUserColor = (userId: string) => {
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  return cursorColors[Math.abs(hash) % cursorColors.length]
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
  <div class="pointer-events-none fixed inset-0 z-50">
    <!-- User Cursors -->
    <div
      v-for="user in users.filter(u => u.id !== currentUserId && u.cursor)"
      :key="user.id"
      :style="{
        left: user.cursor!.x + 'px',
        top: user.cursor!.y + 'px',
        transform: 'translate(-2px, -2px)'
      }"
      class="absolute transition-all duration-100 ease-out"
    >
      <!-- Cursor -->
      <div class="relative">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 4L16 10L10 12L8 18L4 4Z"
            :fill="getUserColor(user.id)"
            stroke="white"
            stroke-width="1"
          />
        </svg>
        
        <!-- User Label -->
        <div
          class="absolute top-5 left-2 pointer-events-auto"
          :style="{ backgroundColor: getUserColor(user.id) }"
        >
          <div class="flex items-center gap-1 px-2 py-1 rounded-md text-white text-xs font-medium shadow-lg">
            <div
              v-if="user.avatar"
              class="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center overflow-hidden"
            >
              <img :src="user.avatar" :alt="user.name" class="w-full h-full object-cover">
            </div>
            <div
              v-else
              class="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold"
            >
              {{ getInitials(user.name) }}
            </div>
            <span>{{ user.name }}</span>
            <div
              v-if="user.isTyping"
              class="flex gap-0.5"
            >
              <div class="w-1 h-1 bg-white/60 rounded-full animate-pulse"></div>
              <div class="w-1 h-1 bg-white/60 rounded-full animate-pulse" style="animation-delay: 0.1s"></div>
              <div class="w-1 h-1 bg-white/60 rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Typing Indicators in Blocks -->
    <div
      v-for="user in users.filter(u => u.id !== currentUserId && u.isTyping && u.typingBlockId)"
      :key="`typing-${user.id}`"
      class="absolute"
    >
      <!-- This would be positioned relative to the block being typed in -->
      <div class="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 shadow-sm">
        <div
          class="w-3 h-3 rounded-full flex-shrink-0"
          :style="{ backgroundColor: getUserColor(user.id) }"
        ></div>
        <span class="text-xs text-gray-600 dark:text-gray-400">{{ user.name }} is typing...</span>
        <div class="flex gap-0.5">
          <div class="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
          <div class="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style="animation-delay: 0.1s"></div>
          <div class="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes pulse {
  0%, 50%, 100% {
    opacity: 1;
  }
  25%, 75% {
    opacity: 0.3;
  }
}

.animate-pulse {
  animation: pulse 1.5s ease-in-out infinite;
}
</style>