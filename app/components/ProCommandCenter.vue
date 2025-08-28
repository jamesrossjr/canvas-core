<template>
  <div
    v-show="isOpen"
    class="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24"
    @click.self="close"
  >
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="close" />

    <!-- Command Palette -->
    <div
      class="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <UIcon name="i-lucide-sparkles" class="w-4 h-4 text-purple-500" />
          <span>ATHENA AI Assistant</span>
        </div>
        <div class="flex-1" />
        <UButton
          icon="i-lucide-mic"
          :color="isListening ? 'purple' : 'gray'"
          variant="ghost"
          size="sm"
          @click="toggleVoiceInput"
        />
        <UButton
          icon="i-lucide-x"
          color="gray"
          variant="ghost"
          size="sm"
          @click="close"
        />
      </div>

      <!-- Search Input -->
      <div class="relative">
        <UIcon
          name="i-lucide-search"
          class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
        />
        <input
          ref="searchInput"
          v-model="query"
          type="text"
          class="w-full px-12 py-4 text-lg bg-transparent border-0 focus:outline-none focus:ring-0"
          :placeholder="placeholder"
          @keydown.enter="executeCommand"
          @keydown.up="navigateUp"
          @keydown.down="navigateDown"
          @keydown.escape="close"
        >
        <div
          v-if="isProcessing"
          class="absolute right-4 top-1/2 -translate-y-1/2"
        >
          <div class="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>

      <!-- Results/Suggestions -->
      <div class="max-h-96 overflow-y-auto border-t border-gray-200 dark:border-gray-800">
        <!-- Quick Actions -->
        <div v-if="!query" class="p-2">
          <div class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
            Quick Actions
          </div>
          <button
            v-for="(action, index) in quickActions"
            :key="index"
            class="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            :class="{ 'bg-gray-100 dark:bg-gray-800': selectedIndex === index }"
            @click="selectAction(action)"
          >
            <UIcon :name="action.icon" class="w-5 h-5" :class="action.iconClass" />
            <div class="flex-1 text-left">
              <div class="text-sm font-medium">
                {{ action.label }}
              </div>
              <div class="text-xs text-gray-500">
                {{ action.description }}
              </div>
            </div>
            <kbd class="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
              {{ action.shortcut }}
            </kbd>
          </button>
        </div>

        <!-- Search Results -->
        <div v-else-if="searchResults.length" class="p-2">
          <div class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
            Results
          </div>
          <button
            v-for="(result, index) in searchResults"
            :key="index"
            class="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            :class="{ 'bg-gray-100 dark:bg-gray-800': selectedIndex === index }"
            @click="selectResult(result)"
          >
            <UIcon :name="result.icon" class="w-5 h-5" />
            <div class="flex-1 text-left">
              <div class="text-sm font-medium">
                {{ result.title }}
              </div>
              <div class="text-xs text-gray-500">
                {{ result.subtitle }}
              </div>
            </div>
          </button>
        </div>

        <!-- AI Response -->
        <div v-else-if="aiResponse" class="p-4">
          <div class="prose prose-sm dark:prose-invert max-w-none">
            <div v-html="aiResponse" />
          </div>
        </div>

        <!-- No Results -->
        <div v-else-if="query && !isProcessing" class="p-8 text-center text-gray-500">
          <UIcon name="i-lucide-search-x" class="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No results found for "{{ query }}"</p>
          <p class="text-sm mt-2">
            Try asking ATHENA a question or use different keywords
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center gap-4 text-xs text-gray-500">
        <div class="flex items-center gap-2">
          <kbd class="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↑↓</kbd>
          <span>Navigate</span>
        </div>
        <div class="flex items-center gap-2">
          <kbd class="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd>
          <span>Select</span>
        </div>
        <div class="flex items-center gap-2">
          <kbd class="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd>
          <span>Close</span>
        </div>
        <div class="flex-1" />
        <div class="flex items-center gap-2">
          <kbd class="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Cmd</kbd>
          <span>+</span>
          <kbd class="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">K</kbd>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import Fuse from 'fuse.js'

const emit = defineEmits(['close', 'execute'])

const isOpen = ref(false)
const query = ref('')
const selectedIndex = ref(0)
const isProcessing = ref(false)
const isListening = ref(false)
const aiResponse = ref('')
const searchInput = ref<HTMLInputElement>()

const placeholder = computed(() => {
  if (isListening.value) return 'Listening...'
  return 'Ask ATHENA anything or search for commands...'
})

const quickActions = [
  {
    label: 'Create New Workspace',
    description: 'Start a new project workspace',
    icon: 'i-lucide-folder-plus',
    iconClass: 'text-blue-500',
    shortcut: 'Cmd+N',
    action: 'create-workspace'
  },
  {
    label: 'Open Block Editor',
    description: 'Create and edit content blocks',
    icon: 'i-lucide-layout-grid',
    iconClass: 'text-green-500',
    shortcut: 'Cmd+E',
    action: 'open-editor'
  },
  {
    label: 'Start AI Conversation',
    description: 'Chat with ATHENA assistant',
    icon: 'i-lucide-message-square',
    iconClass: 'text-purple-500',
    shortcut: 'Cmd+/',
    action: 'start-chat'
  },
  {
    label: 'Open Terminal',
    description: 'Access integrated terminal',
    icon: 'i-lucide-terminal',
    iconClass: 'text-orange-500',
    shortcut: 'Cmd+T',
    action: 'open-terminal'
  },
  {
    label: 'View 3D Workspace',
    description: 'Navigate your workspace in 3D',
    icon: 'i-lucide-box',
    iconClass: 'text-indigo-500',
    shortcut: 'Cmd+3',
    action: 'view-3d'
  }
]

const searchResults = ref([])

// Search functionality
const performSearch = () => {
  if (!query.value) {
    searchResults.value = []
    return
  }

  // Simple fuzzy search implementation
  const fuse = new Fuse(quickActions, {
    keys: ['label', 'description'],
    threshold: 0.3
  })

  const results = fuse.search(query.value)
  searchResults.value = results.map(r => r.item)
}

watch(query, () => {
  performSearch()
  selectedIndex.value = 0
})

// Keyboard navigation
const navigateUp = () => {
  if (selectedIndex.value > 0) {
    selectedIndex.value--
  }
}

const navigateDown = () => {
  const maxIndex = searchResults.value.length || quickActions.length
  if (selectedIndex.value < maxIndex - 1) {
    selectedIndex.value++
  }
}

// Command execution
const executeCommand = async () => {
  if (query.value.startsWith('/')) {
    // AI command
    isProcessing.value = true
    try {
      // TODO: Implement AI processing
      aiResponse.value = `Processing: ${query.value.slice(1)}`
      await new Promise(resolve => setTimeout(resolve, 1000))
    } finally {
      isProcessing.value = false
    }
  } else if (searchResults.value.length) {
    selectResult(searchResults.value[selectedIndex.value])
  } else if (!query.value && quickActions.length) {
    selectAction(quickActions[selectedIndex.value])
  }
}

const selectAction = (action: any) => {
  emit('execute', action)
  close()
}

const selectResult = (result: any) => {
  emit('execute', result)
  close()
}

// Voice input
const toggleVoiceInput = () => {
  isListening.value = !isListening.value
  if (isListening.value) {
    startVoiceRecognition()
  } else {
    stopVoiceRecognition()
  }
}

const startVoiceRecognition = () => {
  // TODO: Implement voice recognition
  console.log('Starting voice recognition...')
}

const stopVoiceRecognition = () => {
  // TODO: Stop voice recognition
  console.log('Stopping voice recognition...')
}

// Public methods
const open = () => {
  isOpen.value = true
  query.value = ''
  selectedIndex.value = 0
  aiResponse.value = ''
  nextTick(() => {
    searchInput.value?.focus()
  })
}

const close = () => {
  isOpen.value = false
  isListening.value = false
  emit('close')
}

// Keyboard shortcut handler
const handleKeydown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    if (isOpen.value) {
      close()
    } else {
      open()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

defineExpose({ open, close })
</script>
