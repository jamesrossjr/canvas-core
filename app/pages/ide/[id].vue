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

const route = useRoute()
const workspaceId = route.params.id as string

const selectedFile = ref<FileNode | null>(null)
const sidebarWidth = ref(280)
const terminalHeight = ref(300)
const isResizing = ref(false)
const isResizingTerminal = ref(false)
const showFileExplorer = ref(true)
const showTerminal = ref(false)

const handleFileSelected = (file: FileNode) => {
  selectedFile.value = file
}

const handleFolderToggled = (folder: FileNode) => {
  console.log('Folder toggled:', folder)
}

const handleFileCreated = (file: FileNode) => {
  console.log('File created:', file)
}

const handleFileDeleted = (file: FileNode) => {
  console.log('File deleted:', file)
}

const handleFileRenamed = (oldFile: FileNode, newFile: FileNode) => {
  console.log('File renamed:', oldFile, newFile)
}

const handleContentChanged = (content: string) => {
  console.log('Content changed:', content.length, 'characters')
}

const handleFileSaved = (file: FileNode, content: string) => {
  console.log('File saved:', file.name, content.length, 'characters')
}

const startResize = (event: MouseEvent) => {
  isResizing.value = true
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  event.preventDefault()
}

const handleResize = (event: MouseEvent) => {
  if (!isResizing.value) return
  const newWidth = Math.max(200, Math.min(600, event.clientX))
  sidebarWidth.value = newWidth
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

const toggleFileExplorer = () => {
  showFileExplorer.value = !showFileExplorer.value
}

const toggleTerminal = () => {
  showTerminal.value = !showTerminal.value
}

const startTerminalResize = (event: MouseEvent) => {
  isResizingTerminal.value = true
  document.addEventListener('mousemove', handleTerminalResize)
  document.addEventListener('mouseup', stopTerminalResize)
  event.preventDefault()
}

const handleTerminalResize = (event: MouseEvent) => {
  if (!isResizingTerminal.value) return
  const rect = document.querySelector('.ide-container')?.getBoundingClientRect()
  if (rect) {
    const newHeight = Math.max(100, Math.min(500, rect.bottom - event.clientY))
    terminalHeight.value = newHeight
  }
}

const stopTerminalResize = () => {
  isResizingTerminal.value = false
  document.removeEventListener('mousemove', handleTerminalResize)
  document.removeEventListener('mouseup', stopTerminalResize)
}

const handleTerminalCommand = (command: string) => {
  console.log('Terminal command:', command)
}

const handleTerminalOutput = (output: string) => {
  console.log('Terminal output:', output)
}

// Page metadata
useHead({
  title: `IDE - Workspace ${workspaceId} - Canvas`
})
</script>

<template>
  <UDashboardPanel
    id="ide"
    :ui="{ body: 'p-0' }"
    class="h-screen"
  >
    <template #header>
      <DashboardNavbar>
        <template #left>
          <div class="flex items-center gap-4">
            <UButton
              icon="i-lucide-arrow-left"
              variant="ghost"
              to="/"
              size="sm"
            >
              Back
            </UButton>
            <div class="text-sm text-gray-500">
              IDE - Workspace {{ workspaceId }}
            </div>
          </div>
        </template>
        
        <template #right>
          <div class="flex items-center gap-2">
            <UButton
              :icon="showFileExplorer ? 'i-lucide-sidebar-close' : 'i-lucide-sidebar-open'"
              variant="ghost"
              size="sm"
              @click="toggleFileExplorer"
            >
              Explorer
            </UButton>
            <UButton
              :icon="showTerminal ? 'i-lucide-terminal-square' : 'i-lucide-terminal'"
              variant="ghost"
              size="sm"
              @click="toggleTerminal"
            >
              Terminal
            </UButton>
            <UButton
              icon="i-lucide-search"
              variant="ghost"
              size="sm"
              disabled
            >
              Search
            </UButton>
            <UButton
              icon="i-lucide-git-branch"
              variant="ghost"
              size="sm"
              disabled
            >
              Git
            </UButton>
            <UButton
              icon="i-lucide-settings"
              variant="ghost"
              size="sm"
              disabled
            >
              Settings
            </UButton>
          </div>
        </template>
      </DashboardNavbar>
    </template>

    <template #body>
      <div class="h-full flex bg-gray-50 dark:bg-gray-900 ide-container">
        <!-- File Explorer Sidebar -->
        <div
          v-if="showFileExplorer"
          :style="{ width: sidebarWidth + 'px' }"
          class="flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800"
        >
          <FileExplorer
            :root-path="`/workspace/${workspaceId}`"
            @file-selected="handleFileSelected"
            @folder-toggled="handleFolderToggled"
            @file-created="handleFileCreated"
            @file-deleted="handleFileDeleted"
            @file-renamed="handleFileRenamed"
          />
        </div>

        <!-- Resize Handle -->
        <div
          v-if="showFileExplorer"
          class="w-1 bg-gray-200 dark:bg-gray-800 cursor-col-resize hover:bg-blue-500 transition-colors"
          @mousedown="startResize"
        />

        <!-- Main Editor Area -->
        <div class="flex-1 flex flex-col">
          <!-- Tab Bar -->
          <div
            v-if="selectedFile"
            class="flex items-center bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
          >
            <div class="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
              <UIcon
                :name="selectedFile.type === 'folder' ? 'i-lucide-folder' : 'i-lucide-file'"
                class="w-4 h-4"
              />
              <span class="text-sm">{{ selectedFile.name }}</span>
              <UButton
                icon="i-lucide-x"
                size="2xs"
                variant="ghost"
                @click="selectedFile = null"
              />
            </div>
          </div>

          <!-- Editor and Terminal Container -->
          <div class="flex-1 flex flex-col">
            <!-- Code Editor -->
            <div :class="showTerminal ? 'flex-1' : 'h-full'">
              <CodeEditor
                :file="selectedFile"
                @content-changed="handleContentChanged"
                @saved="handleFileSaved"
              />
            </div>

            <!-- Terminal Resize Handle -->
            <div
              v-if="showTerminal"
              class="h-1 bg-gray-200 dark:bg-gray-800 cursor-row-resize hover:bg-blue-500 transition-colors"
              @mousedown="startTerminalResize"
            />

            <!-- Terminal -->
            <div
              v-if="showTerminal"
              :style="{ height: terminalHeight + 'px' }"
              class="flex-shrink-0 border-t border-gray-200 dark:border-gray-800"
            >
              <Terminal
                :workspace-id="workspaceId"
                @command="handleTerminalCommand"
                @output="handleTerminalOutput"
              />
            </div>
          </div>
        </div>
      </div>
      
      <!-- ATHENA AI Assistant -->
      <AthenaAssistant />
    </template>
  </UDashboardPanel>
</template>

<style scoped>
.cursor-col-resize {
  cursor: col-resize;
}

.cursor-row-resize {
  cursor: row-resize;
}
</style>