<template>
  <div
    class="slash-command-menu fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-w-sm"
    :style="{ left: `${position.x}px`, top: `${position.y}px` }"
  >
    <div class="p-2 border-b border-gray-200 dark:border-gray-700">
      <div class="text-xs text-gray-500 uppercase font-semibold">Blocks</div>
    </div>
    
    <div class="max-h-64 overflow-y-auto">
      <button
        v-for="(command, index) in filteredCommands"
        :key="command.type"
        class="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        :class="{ 'bg-gray-100 dark:bg-gray-700': selectedIndex === index }"
        @click="selectCommand(command)"
        @mouseenter="selectedIndex = index"
      >
        <div class="flex-shrink-0">
          <UIcon :name="command.icon" class="w-5 h-5" :class="command.iconClass || 'text-gray-500'" />
        </div>
        
        <div class="flex-1">
          <div class="text-sm font-medium text-gray-900 dark:text-white">
            {{ command.label }}
          </div>
          <div class="text-xs text-gray-500">
            {{ command.description }}
          </div>
        </div>
        
        <div v-if="command.shortcut" class="flex-shrink-0">
          <kbd class="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">
            {{ command.shortcut }}
          </kbd>
        </div>
      </button>
      
      <div v-if="filteredCommands.length === 0" class="p-4 text-center text-gray-500">
        <UIcon name="i-lucide-search-x" class="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p class="text-sm">No blocks found</p>
        <p class="text-xs">Try a different search term</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Command {
  type: string
  label: string
  description: string
  icon: string
  iconClass?: string
  shortcut?: string
  category: string
}

interface Props {
  position: { x: number; y: number }
  query: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'select': [command: Command]
  'close': []
}>()

const selectedIndex = ref(0)

const commands: Command[] = [
  // Text Blocks
  {
    type: 'paragraph',
    label: 'Text',
    description: 'Start writing with plain text',
    icon: 'i-lucide-type',
    iconClass: 'text-gray-500',
    category: 'text'
  },
  {
    type: 'heading',
    label: 'Heading 1',
    description: 'Big section heading',
    icon: 'i-lucide-heading-1',
    iconClass: 'text-blue-500',
    shortcut: '# ',
    category: 'text'
  },
  {
    type: 'heading',
    label: 'Heading 2',
    description: 'Medium section heading',
    icon: 'i-lucide-heading-2', 
    iconClass: 'text-blue-500',
    shortcut: '## ',
    category: 'text'
  },
  {
    type: 'heading',
    label: 'Heading 3',
    description: 'Small section heading',
    icon: 'i-lucide-heading-3',
    iconClass: 'text-blue-500',
    shortcut: '### ',
    category: 'text'
  },
  {
    type: 'quote',
    label: 'Quote',
    description: 'Capture a quote or citation',
    icon: 'i-lucide-quote',
    iconClass: 'text-purple-500',
    shortcut: '> ',
    category: 'text'
  },
  {
    type: 'callout',
    label: 'Callout',
    description: 'Make writing stand out',
    icon: 'i-lucide-message-square',
    iconClass: 'text-yellow-500',
    category: 'text'
  },
  
  // List Blocks
  {
    type: 'list',
    label: 'Bulleted List',
    description: 'Create a simple bulleted list',
    icon: 'i-lucide-list',
    iconClass: 'text-green-500',
    shortcut: '- ',
    category: 'lists'
  },
  {
    type: 'list-ordered',
    label: 'Numbered List',
    description: 'Create a list with numbering',
    icon: 'i-lucide-list-ordered',
    iconClass: 'text-green-500',
    shortcut: '1. ',
    category: 'lists'
  },
  {
    type: 'task-list',
    label: 'To-do List',
    description: 'Track tasks with checkboxes',
    icon: 'i-lucide-check-square',
    iconClass: 'text-orange-500',
    shortcut: '[] ',
    category: 'lists'
  },
  
  // Code Blocks
  {
    type: 'code',
    label: 'Code',
    description: 'Capture a code snippet',
    icon: 'i-lucide-code',
    iconClass: 'text-gray-700',
    shortcut: '``` ',
    category: 'code'
  },
  
  // Media Blocks
  {
    type: 'image',
    label: 'Image',
    description: 'Upload or embed with link',
    icon: 'i-lucide-image',
    iconClass: 'text-indigo-500',
    category: 'media'
  },
  {
    type: 'video',
    label: 'Video',
    description: 'Embed from YouTube, Vimeo, etc.',
    icon: 'i-lucide-video',
    iconClass: 'text-red-500',
    category: 'media'
  },
  {
    type: 'audio',
    label: 'Audio',
    description: 'Embed audio files',
    icon: 'i-lucide-music',
    iconClass: 'text-pink-500',
    category: 'media'
  },
  {
    type: 'file',
    label: 'File',
    description: 'Upload any file',
    icon: 'i-lucide-paperclip',
    iconClass: 'text-gray-500',
    category: 'media'
  },
  
  // Layout Blocks
  {
    type: 'divider',
    label: 'Divider',
    description: 'Visually divide blocks',
    icon: 'i-lucide-minus',
    iconClass: 'text-gray-400',
    shortcut: '---',
    category: 'layout'
  },
  {
    type: 'columns',
    label: 'Columns',
    description: 'Create side-by-side content',
    icon: 'i-lucide-columns',
    iconClass: 'text-blue-500',
    category: 'layout'
  },
  
  // Data Blocks
  {
    type: 'table',
    label: 'Table',
    description: 'Add a table to organize data',
    icon: 'i-lucide-table',
    iconClass: 'text-green-600',
    category: 'data'
  },
  
  // AI Blocks
  {
    type: 'ai-generated',
    label: 'Ask ATHENA',
    description: 'Generate content with AI',
    icon: 'i-lucide-sparkles',
    iconClass: 'text-purple-500',
    category: 'ai'
  }
]

const filteredCommands = computed(() => {
  if (!props.query) return commands
  
  const query = props.query.toLowerCase()
  return commands.filter(command => 
    command.label.toLowerCase().includes(query) ||
    command.description.toLowerCase().includes(query) ||
    command.type.toLowerCase().includes(query)
  )
})

const selectCommand = (command: Command) => {
  emit('select', command)
}

const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(0, selectedIndex.value - 1)
      break
      
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(filteredCommands.value.length - 1, selectedIndex.value + 1)
      break
      
    case 'Enter':
      event.preventDefault()
      if (filteredCommands.value[selectedIndex.value]) {
        selectCommand(filteredCommands.value[selectedIndex.value])
      }
      break
      
    case 'Escape':
      event.preventDefault()
      emit('close')
      break
  }
}

const handleClickOutside = (event: Event) => {
  const target = event.target as Element
  if (!target.closest('.slash-command-menu')) {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.slash-command-menu {
  min-width: 300px;
  max-height: 400px;
}

.slash-command-menu button:focus {
  @apply outline-none;
}
</style>