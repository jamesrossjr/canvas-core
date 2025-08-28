<script setup lang="ts">
interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  children?: FileNode[]
  expanded?: boolean
  size?: number
  modified?: string
}

const props = defineProps<{
  rootPath?: string
  showHidden?: boolean
  readonly?: boolean
}>()

const emit = defineEmits<{
  fileSelected: [file: FileNode]
  folderToggled: [folder: FileNode]
  fileCreated: [file: FileNode]
  fileDeleted: [file: FileNode]
  fileRenamed: [oldFile: FileNode, newFile: FileNode]
}>()

const expandedFolders = ref<Set<string>>(new Set())
const selectedFile = ref<FileNode | null>(null)
const contextMenuFile = ref<FileNode | null>(null)
const showContextMenu = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })

const mockFileTree = ref<FileNode[]>([
  {
    id: 'src',
    name: 'src',
    type: 'folder',
    path: '/src',
    expanded: true,
    children: [
      {
        id: 'components',
        name: 'components',
        type: 'folder',
        path: '/src/components',
        children: [
          { id: 'header', name: 'Header.vue', type: 'file', path: '/src/components/Header.vue', size: 2048, modified: '2024-01-15T10:30:00Z' },
          { id: 'sidebar', name: 'Sidebar.vue', type: 'file', path: '/src/components/Sidebar.vue', size: 1536, modified: '2024-01-15T09:45:00Z' }
        ]
      },
      {
        id: 'pages',
        name: 'pages',
        type: 'folder',
        path: '/src/pages',
        children: [
          { id: 'index', name: 'index.vue', type: 'file', path: '/src/pages/index.vue', size: 3072, modified: '2024-01-15T11:15:00Z' },
          { id: 'about', name: 'about.vue', type: 'file', path: '/src/pages/about.vue', size: 1024, modified: '2024-01-14T16:20:00Z' }
        ]
      },
      { id: 'main', name: 'main.ts', type: 'file', path: '/src/main.ts', size: 512, modified: '2024-01-15T08:30:00Z' }
    ]
  },
  {
    id: 'public',
    name: 'public',
    type: 'folder',
    path: '/public',
    children: [
      { id: 'favicon', name: 'favicon.ico', type: 'file', path: '/public/favicon.ico', size: 15406, modified: '2024-01-10T10:00:00Z' },
      { id: 'logo', name: 'logo.png', type: 'file', path: '/public/logo.png', size: 8192, modified: '2024-01-10T10:00:00Z' }
    ]
  },
  { id: 'package', name: 'package.json', type: 'file', path: '/package.json', size: 1256, modified: '2024-01-15T12:00:00Z' },
  { id: 'readme', name: 'README.md', type: 'file', path: '/README.md', size: 2048, modified: '2024-01-14T14:30:00Z' }
])

const toggleFolder = (folder: FileNode) => {
  if (folder.type !== 'folder') return

  folder.expanded = !folder.expanded
  if (folder.expanded) {
    expandedFolders.value.add(folder.id)
  } else {
    expandedFolders.value.delete(folder.id)
  }

  emit('folderToggled', folder)
}

const selectFile = (file: FileNode) => {
  selectedFile.value = file
  emit('fileSelected', file)
}

const getFileIcon = (file: FileNode) => {
  if (file.type === 'folder') {
    return file.expanded ? 'i-lucide-folder-open' : 'i-lucide-folder'
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'vue': return 'i-logos-vue'
    case 'ts': return 'i-logos-typescript-icon'
    case 'js': return 'i-logos-javascript'
    case 'json': return 'i-lucide-braces'
    case 'md': return 'i-lucide-file-text'
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg': return 'i-lucide-image'
    case 'ico': return 'i-lucide-star'
    default: return 'i-lucide-file'
  }
}

const formatFileSize = (bytes: number) => {
  const sizes = ['B', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const showFileContextMenu = (event: MouseEvent, file: FileNode) => {
  event.preventDefault()
  contextMenuFile.value = file
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
  showContextMenu.value = true
}

const hideContextMenu = () => {
  showContextMenu.value = false
  contextMenuFile.value = null
}

onMounted(() => {
  document.addEventListener('click', hideContextMenu)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', hideContextMenu)
})
</script>

<template>
  <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
    <div class="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800">
      <h3 class="text-sm font-medium text-gray-900 dark:text-white">
        Explorer
      </h3>
      <div class="flex items-center gap-1">
        <UButton
          icon="i-lucide-file-plus"
          size="xs"
          variant="ghost"
          :disabled="readonly"
          @click="$emit('fileCreated', { id: '', name: '', type: 'file', path: '' })"
        />
        <UButton
          icon="i-lucide-folder-plus"
          size="xs"
          variant="ghost"
          :disabled="readonly"
          @click="$emit('fileCreated', { id: '', name: '', type: 'folder', path: '' })"
        />
        <UButton
          icon="i-lucide-refresh-cw"
          size="xs"
          variant="ghost"
        />
      </div>
    </div>

    <div class="flex-1 overflow-auto p-2">
      <FileExplorerNode
        v-for="node in mockFileTree"
        :key="node.id"
        :node="node"
        :level="0"
        :selected-file="selectedFile"
        :readonly="readonly"
        @file-selected="selectFile"
        @folder-toggled="toggleFolder"
        @context-menu="showFileContextMenu"
      />
    </div>

    <!-- Context Menu -->
    <Teleport to="body">
      <div
        v-if="showContextMenu && contextMenuFile"
        :style="{ top: contextMenuPosition.y + 'px', left: contextMenuPosition.x + 'px' }"
        class="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 min-w-[160px]"
      >
        <button
          class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
          @click="selectFile(contextMenuFile!)"
        >
          <UIcon name="i-lucide-edit" class="w-4 h-4" />
          Open
        </button>
        <button
          v-if="!readonly"
          class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <UIcon name="i-lucide-copy" class="w-4 h-4" />
          Copy
        </button>
        <button
          v-if="!readonly"
          class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <UIcon name="i-lucide-scissors" class="w-4 h-4" />
          Cut
        </button>
        <button
          v-if="!readonly"
          class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <UIcon name="i-lucide-edit-2" class="w-4 h-4" />
          Rename
        </button>
        <hr class="my-1 border-gray-200 dark:border-gray-700">
        <button
          v-if="!readonly"
          class="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
          @click="$emit('fileDeleted', contextMenuFile!)"
        >
          <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
          Delete
        </button>
      </div>
    </Teleport>
  </div>
</template>
