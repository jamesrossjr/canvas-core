<script setup lang="ts">
interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  size?: number
  modified?: string
}

const props = defineProps<{
  file: FileNode | null
  readonly?: boolean
  theme?: 'light' | 'dark'
}>()

const emit = defineEmits<{
  contentChanged: [content: string]
  saved: [file: FileNode, content: string]
}>()

const editorRef = ref<HTMLElement>()
const content = ref('')
const hasUnsavedChanges = ref(false)
const language = ref('javascript')

const mockFileContents: Record<string, string> = {
  'header': `<script setup lang="ts">
const props = defineProps<{
  title?: string
  showLogo?: boolean
}>()
</script>

<template>
  <header class="bg-white border-b border-gray-200">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center py-6">
        <div class="flex items-center">
          <img v-if="showLogo" class="h-8 w-auto" src="/logo.png" alt="Logo">
          <h1 v-if="title" class="ml-3 text-2xl font-bold text-gray-900">{{ title }}</h1>
        </div>
      </div>
    </div>
  </header>
</template>`,
  'sidebar': `<script setup lang="ts">
const navigation = [
  { name: 'Dashboard', href: '/', icon: 'home' },
  { name: 'Projects', href: '/projects', icon: 'folder' },
  { name: 'Settings', href: '/settings', icon: 'cog-6-tooth' },
]
</script>

<template>
  <aside class="w-64 bg-gray-50 h-screen border-r border-gray-200">
    <nav class="p-4">
      <ul class="space-y-2">
        <li v-for="item in navigation" :key="item.name">
          <a
            :href="item.href"
            class="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100"
          >
            {{ item.name }}
          </a>
        </li>
      </ul>
    </nav>
  </aside>
</template>`,
  'index': `<script setup lang="ts">
const { data: posts } = await $fetch('/api/posts')
</script>

<template>
  <div>
    <h1 class="text-4xl font-bold text-center mb-8">Welcome to Canvas</h1>
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div v-for="post in posts" :key="post.id" class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-semibold mb-2">{{ post.title }}</h2>
        <p class="text-gray-600">{{ post.excerpt }}</p>
      </div>
    </div>
  </div>
</template>`,
  'about': `<template>
  <div class="max-w-4xl mx-auto py-12 px-4">
    <h1 class="text-3xl font-bold mb-6">About Canvas</h1>
    <div class="prose max-w-none">
      <p>
        Canvas is a revolutionary digital workspace that combines the power of AI 
        with intuitive block-based editing to help you create, collaborate, and innovate.
      </p>
      <h2>Features</h2>
      <ul>
        <li>Block-based content editing</li>
        <li>AI-powered assistance</li>
        <li>Real-time collaboration</li>
        <li>Cross-platform compatibility</li>
      </ul>
    </div>
  </div>
</template>`,
  'main': `import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(router)
app.mount('#app')`,
  'package': `{
  "name": "canvas-workspace",
  "version": "1.0.0",
  "description": "AI-powered digital workspace",
  "main": "index.js",
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "preview": "nuxt preview"
  },
  "dependencies": {
    "nuxt": "^4.0.3",
    "vue": "^3.3.0"
  }
}`,
  'readme': `# Canvas Digital Workspace

An AI-powered digital workspace with block-based editing, real-time collaboration, and intelligent assistance.

## Features

- **Block-based Editor**: Create rich content with modular blocks
- **AI Assistant (ATHENA)**: Get intelligent help with your work
- **Real-time Collaboration**: Work together seamlessly
- **Cross-platform**: Web, iOS, and Android support

## Getting Started

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

## Tech Stack

- Nuxt 4
- Vue 3
- TypeScript
- Three.js
- Tailwind CSS

## License

MIT License`
}

const getLanguageFromFile = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'vue': return 'vue'
    case 'ts': return 'typescript'
    case 'js': return 'javascript'
    case 'json': return 'json'
    case 'md': return 'markdown'
    case 'css': return 'css'
    case 'scss': return 'scss'
    case 'html': return 'html'
    case 'yml':
    case 'yaml': return 'yaml'
    case 'xml': return 'xml'
    case 'sql': return 'sql'
    default: return 'plaintext'
  }
}

const loadFileContent = () => {
  if (!props.file || props.file.type === 'folder') {
    content.value = ''
    return
  }
  
  content.value = mockFileContents[props.file.id] || `// File: ${props.file.name}\n// Content will be loaded here`
  language.value = getLanguageFromFile(props.file.name)
  hasUnsavedChanges.value = false
}

const handleContentChange = () => {
  hasUnsavedChanges.value = true
  emit('contentChanged', content.value)
}

const handleSave = () => {
  if (!props.file || props.readonly) return
  
  hasUnsavedChanges.value = false
  emit('saved', props.file, content.value)
}

const handleKeydown = (event: KeyboardEvent) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 's') {
    event.preventDefault()
    handleSave()
  }
}

watch(() => props.file, loadFileContent, { immediate: true })

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="h-full flex flex-col bg-white dark:bg-gray-900">
    <!-- Editor Header -->
    <div v-if="file" class="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800">
      <div class="flex items-center gap-2">
        <UIcon :name="file.type === 'folder' ? 'i-lucide-folder' : 'i-lucide-file'" class="w-4 h-4" />
        <span class="text-sm font-medium">{{ file.name }}</span>
        <span v-if="hasUnsavedChanges" class="text-xs text-orange-500">●</span>
      </div>
      <div class="flex items-center gap-2">
        <UBadge :label="language" size="xs" variant="soft" />
        <UButton
          v-if="!readonly"
          icon="i-lucide-save"
          size="xs"
          variant="ghost"
          :disabled="!hasUnsavedChanges"
          @click="handleSave"
        >
          Save
        </UButton>
      </div>
    </div>

    <!-- Editor Content -->
    <div v-if="file && file.type === 'file'" class="flex-1 relative">
      <textarea
        ref="editorRef"
        v-model="content"
        class="w-full h-full p-4 font-mono text-sm bg-transparent border-none outline-none resize-none"
        :readonly="readonly"
        placeholder="Start typing..."
        spellcheck="false"
        @input="handleContentChange"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="flex-1 flex items-center justify-center text-gray-500">
      <div class="text-center">
        <UIcon name="i-lucide-file-text" class="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p class="text-lg font-medium mb-2">No file selected</p>
        <p class="text-sm">Select a file from the explorer to start editing</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
textarea {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  line-height: 1.5;
  tab-size: 2;
}
</style>