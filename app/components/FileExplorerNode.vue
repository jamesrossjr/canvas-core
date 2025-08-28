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
  node: FileNode
  level: number
  selectedFile: FileNode | null
  readonly?: boolean
}>()

const emit = defineEmits<{
  fileSelected: [file: FileNode]
  folderToggled: [folder: FileNode]
  contextMenu: [event: MouseEvent, file: FileNode]
}>()

const isSelected = computed(() => props.selectedFile?.id === props.node.id)

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

const handleClick = () => {
  if (props.node.type === 'folder') {
    emit('folderToggled', props.node)
  } else {
    emit('fileSelected', props.node)
  }
}

const handleContextMenu = (event: MouseEvent) => {
  emit('contextMenu', event, props.node)
}
</script>

<template>
  <div>
    <div
      :class="[
        'flex items-center gap-1 px-2 py-1 text-sm cursor-pointer rounded select-none',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        isSelected && 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      ]"
      :style="{ paddingLeft: `${level * 16 + 8}px` }"
      @click="handleClick"
      @contextmenu="handleContextMenu"
    >
      <UIcon
        v-if="node.type === 'folder'"
        :name="node.expanded ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
        class="w-3 h-3 text-gray-500"
      />
      <div v-else class="w-3" />
      
      <UIcon
        :name="getFileIcon(node)"
        class="w-4 h-4 flex-shrink-0"
      />
      
      <span class="flex-1 truncate">{{ node.name }}</span>
    </div>
    
    <div v-if="node.type === 'folder' && node.expanded && node.children">
      <FileExplorerNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :level="level + 1"
        :selected-file="selectedFile"
        :readonly="readonly"
        @file-selected="$emit('fileSelected', $event)"
        @folder-toggled="$emit('folderToggled', $event)"
        @context-menu="$emit('contextMenu', $event, child)"
      />
    </div>
  </div>
</template>