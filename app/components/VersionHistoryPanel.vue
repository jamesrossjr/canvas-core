<script setup lang="ts">
interface DocumentVersion {
  id: string
  documentId: string
  version: number
  title: string
  content: any
  createdAt: string
  createdBy: string
  changeDescription?: string
  changeType: 'manual' | 'autosave' | 'collaboration'
  size: number
}

const props = defineProps<{
  versions: DocumentVersion[]
  currentVersion: number
  isLoading: boolean
  autoSaveEnabled: boolean
  lastSaved: string | null
  hasUnsavedChanges: boolean
  timeSinceLastSave: string | null
}>()

const emit = defineEmits<{
  restore: [versionId: string]
  compare: [version1Id: string, version2Id: string]
  toggleAutoSave: [enabled: boolean]
  manualSave: [description?: string]
}>()

const selectedVersions = ref<string[]>([])
const showSaveDialog = ref(false)
const saveDescription = ref('')

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 86400000) { // Less than 24 hours
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else if (diff < 604800000) { // Less than 7 days
    return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
}

const formatFileSize = (bytes: number) => {
  const sizes = ['B', 'KB', 'MB']
  if (bytes === 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

const getVersionIcon = (changeType: DocumentVersion['changeType']) => {
  switch (changeType) {
    case 'manual': return 'i-lucide-save'
    case 'autosave': return 'i-lucide-clock'
    case 'collaboration': return 'i-lucide-users'
    default: return 'i-lucide-file'
  }
}

const getVersionColor = (changeType: DocumentVersion['changeType']) => {
  switch (changeType) {
    case 'manual': return 'text-blue-600 dark:text-blue-400'
    case 'autosave': return 'text-gray-500'
    case 'collaboration': return 'text-green-600 dark:text-green-400'
    default: return 'text-gray-500'
  }
}

const toggleVersionSelection = (versionId: string) => {
  const index = selectedVersions.value.indexOf(versionId)
  if (index === -1) {
    if (selectedVersions.value.length < 2) {
      selectedVersions.value.push(versionId)
    } else {
      selectedVersions.value = [selectedVersions.value[1], versionId]
    }
  } else {
    selectedVersions.value.splice(index, 1)
  }
}

const handleCompare = () => {
  if (selectedVersions.value.length === 2) {
    emit('compare', selectedVersions.value[0], selectedVersions.value[1])
  }
}

const handleManualSave = () => {
  emit('manualSave', saveDescription.value.trim() || undefined)
  showSaveDialog.value = false
  saveDescription.value = ''
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-history" class="w-4 h-4" />
        <h3 class="text-sm font-medium text-gray-900 dark:text-white">Version History</h3>
      </div>
      
      <div class="flex items-center gap-1">
        <UButton
          icon="i-lucide-save"
          size="xs"
          variant="ghost"
          @click="showSaveDialog = true"
        />
        <UDropdown :items="[
          [{ label: autoSaveEnabled ? 'Disable Auto-save' : 'Enable Auto-save', icon: 'i-lucide-clock', click: () => $emit('toggleAutoSave', !autoSaveEnabled) }]
        ]">
          <UButton
            icon="i-lucide-settings"
            size="xs"
            variant="ghost"
          />
        </UDropdown>
      </div>
    </div>

    <!-- Status Bar -->
    <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-2 text-sm">
        <div
          :class="[
            'w-2 h-2 rounded-full',
            hasUnsavedChanges ? 'bg-yellow-500' : 'bg-green-500'
          ]"
        ></div>
        <span class="text-gray-600 dark:text-gray-400">
          {{ hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved' }}
        </span>
      </div>
      
      <div v-if="timeSinceLastSave" class="text-xs text-gray-500">
        Last saved {{ timeSinceLastSave }}
      </div>
    </div>

    <!-- Auto-save Toggle -->
    <div class="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-clock" class="w-4 h-4 text-gray-400" />
        <span class="text-sm text-gray-700 dark:text-gray-300">Auto-save</span>
      </div>
      <UToggle
        :model-value="autoSaveEnabled"
        @update:model-value="$emit('toggleAutoSave', $event)"
      />
    </div>

    <!-- Compare Actions -->
    <div
      v-if="selectedVersions.length > 0"
      class="p-3 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700"
    >
      <div class="flex items-center justify-between">
        <span class="text-sm text-blue-700 dark:text-blue-300">
          {{ selectedVersions.length }} version{{ selectedVersions.length > 1 ? 's' : '' }} selected
        </span>
        <div class="flex gap-1">
          <UButton
            v-if="selectedVersions.length === 2"
            icon="i-lucide-git-compare"
            size="xs"
            variant="soft"
            @click="handleCompare"
          >
            Compare
          </UButton>
          <UButton
            icon="i-lucide-x"
            size="xs"
            variant="ghost"
            @click="selectedVersions = []"
          />
        </div>
      </div>
    </div>

    <!-- Version List -->
    <div class="max-h-96 overflow-y-auto">
      <div v-if="isLoading" class="p-8 text-center">
        <UIcon name="i-lucide-loader" class="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
        <p class="text-sm text-gray-500">Loading version history...</p>
      </div>

      <div v-else-if="versions.length === 0" class="p-8 text-center">
        <UIcon name="i-lucide-history" class="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p class="text-sm text-gray-500">No version history yet</p>
        <p class="text-xs text-gray-400 mt-1">Changes will appear here</p>
      </div>

      <div v-else>
        <div
          v-for="(version, index) in versions.slice().reverse()"
          :key="version.id"
          :class="[
            'flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border-l-2',
            version.version === currentVersion ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-transparent',
            selectedVersions.includes(version.id) && 'bg-blue-100 dark:bg-blue-900/30'
          ]"
          @click="toggleVersionSelection(version.id)"
        >
          <!-- Version Icon -->
          <div class="flex-shrink-0">
            <UIcon
              :name="getVersionIcon(version.changeType)"
              :class="['w-4 h-4', getVersionColor(version.changeType)]"
            />
          </div>

          <!-- Version Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                v{{ version.version }}
              </span>
              <span class="text-xs text-gray-500">
                {{ formatDate(version.createdAt) }}
              </span>
              <UBadge 
                :label="version.changeType" 
                size="xs" 
                :color="version.changeType === 'manual' ? 'blue' : version.changeType === 'collaboration' ? 'green' : 'gray'"
                variant="soft"
              />
            </div>
            
            <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
              {{ version.changeDescription || version.title }}
            </p>
            
            <div class="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <span>{{ formatFileSize(version.size) }}</span>
              <span>•</span>
              <span>{{ version.createdBy }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1">
            <UButton
              v-if="version.version !== currentVersion"
              icon="i-lucide-rotate-ccw"
              size="xs"
              variant="ghost"
              @click.stop="$emit('restore', version.id)"
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
  </div>

  <!-- Save Dialog -->
  <UModal v-model="showSaveDialog">
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Save Version</h3>
      </template>
      
      <div class="space-y-4">
        <UFormGroup label="Description (optional)" hint="Describe what changed in this version">
          <UTextarea
            v-model="saveDescription"
            placeholder="e.g., Added new section on collaboration features"
            :rows="3"
          />
        </UFormGroup>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            variant="ghost"
            @click="showSaveDialog = false"
          >
            Cancel
          </UButton>
          <UButton
            icon="i-lucide-save"
            @click="handleManualSave"
          >
            Save Version
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>