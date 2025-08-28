<script setup lang="ts">
import type { Document, Block } from '~/shared/types/blocks'

const route = useRoute()
const workspaceId = route.params.id as string

// Initialize collaboration
const collaboration = useCollaboration(workspaceId)
const showCollaborationPanel = ref(false)
const collaborationPanelWidth = ref(280)

// Initialize version history
const versionHistory = useVersionHistory('doc-1')
const showVersionHistory = ref(false)
const versionHistoryWidth = ref(320)

// Mock current user - in real app this would come from auth
const currentUser = {
  name: 'Canvas User',
  avatar: null
}

// Connect to collaboration on mount
onMounted(() => {
  collaboration.connect(currentUser)
  versionHistory.loadVersionHistory()
})

// Mouse tracking for cursor collaboration
const handleMouseMove = (event: MouseEvent) => {
  if (collaboration.state.isConnected) {
    collaboration.updateCursor({
      x: event.clientX,
      y: event.clientY
    })
  }
}

// Mock document data - in real app this would come from API
const document = ref<Document>({
  id: 'doc-1',
  title: 'Welcome to Canvas',
  workspaceId,
  blocks: [
    {
      id: 'block-1',
      type: 'heading',
      content: {
        text: 'Welcome to Canvas',
        level: 1,
        anchor: 'welcome-to-canvas'
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'user-1',
        version: 1
      },
      position: {
        order: 0
      },
      workspaceId
    },
    {
      id: 'block-2',
      type: 'text',
      content: {
        text: 'This is your Canvas workspace where you can create, organize, and collaborate on content using our powerful block-based editor.'
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'user-1',
        version: 1
      },
      position: {
        order: 1
      },
      workspaceId
    },
    {
      id: 'block-3',
      type: 'callout',
      content: {
        text: 'Try typing "/" to see all available block types, or use keyboard shortcuts for quick formatting.',
        variant: 'info',
        title: 'Getting Started'
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'user-1',
        version: 1
      },
      position: {
        order: 2
      },
      workspaceId
    }
  ] as Block[],
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'user-1',
    version: 1
  },
  permissions: {
    read: [],
    write: [],
    admin: [],
    public: true
  },
  version: 1,
  collaborators: []
})

const handleDocumentUpdate = (updatedDocument: Document) => {
  document.value = updatedDocument
  
  // Schedule auto-save
  versionHistory.scheduleAutoSave(updatedDocument)
  
  console.log('Document updated:', updatedDocument)
}

const handleBlockCreated = (block: Block) => {
  console.log('Block created:', block)
  // In real app, might trigger real-time collaboration events
}

const handleBlockUpdated = (block: Block) => {
  console.log('Block updated:', block)
  
  // Send block update to collaborators
  collaboration.sendBlockOperation('block-update', {
    blockId: block.id,
    block,
    timestamp: Date.now()
  })
}

const handleBlockDeleted = (blockId: string) => {
  console.log('Block deleted:', blockId)
  // In real app, might trigger real-time collaboration events
}

const handleAIMessage = (message: any) => {
  console.log('AI Message:', message)
  // Handle AI assistant messages
}

const handleAIAction = (action: string, data?: any) => {
  console.log('AI Action:', action, data)
  
  // Handle AI assistant actions
  switch (action) {
    case 'create-document':
      // Create new document block
      break
    case 'summarize':
      // Summarize current document
      break
    case 'generate-code':
      // Generate code block
      break
    case 'help':
      // Show help information
      break
  }
}

// Version history handlers
const handleRestoreVersion = async (versionId: string) => {
  const restoredDocument = await versionHistory.restoreVersion(versionId)
  if (restoredDocument) {
    document.value = restoredDocument
  }
}

const handleCompareVersions = (version1Id: string, version2Id: string) => {
  const comparison = versionHistory.compareVersions(version1Id, version2Id)
  console.log('Version comparison:', comparison)
  // In a real app, you'd show a diff UI
}

const handleManualSave = async (description?: string) => {
  await versionHistory.manualSave(document.value, description)
}

const handleToggleAutoSave = (enabled: boolean) => {
  versionHistory.toggleAutoSave(enabled)
}

// Page metadata
useHead({
  title: computed(() => `${document.value.title} - Canvas`)
})
</script>

<template>
  <UDashboardPanel
    id="workspace"
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
              Workspace {{ workspaceId }}
            </div>
          </div>
        </template>
        
        <template #right>
          <div class="flex items-center gap-2">
            <UButton
              icon="i-lucide-code"
              variant="ghost"
              size="sm"
              :to="`/ide/${workspaceId}`"
            >
              IDE
            </UButton>
            <UButton
              :icon="showCollaborationPanel ? 'i-lucide-users-2' : 'i-lucide-users'"
              variant="ghost"
              size="sm"
              @click="showCollaborationPanel = !showCollaborationPanel"
            >
              Collaborate
              <template v-if="collaboration.userCount.value > 1" #trailing>
                <UBadge size="xs" color="green">{{ collaboration.userCount.value }}</UBadge>
              </template>
            </UButton>
            <UButton
              :icon="showVersionHistory ? 'i-lucide-history' : 'i-lucide-history'"
              variant="ghost"
              size="sm"
              @click="showVersionHistory = !showVersionHistory"
            >
              History
              <template v-if="versionHistory.hasUnsavedChanges.value" #trailing>
                <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
              </template>
            </UButton>
            <UButton
              icon="i-lucide-share"
              variant="ghost"
              size="sm"
              disabled
            >
              Share
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
      <div 
        class="h-full flex"
        @mousemove="handleMouseMove"
      >
        <!-- Main Content Area -->
        <div class="flex-1 flex flex-col">
          <!-- Block Editor -->
          <BlockEditor
            :document="document"
            :collaborative="true"
            :show-header="false"
            @update:document="handleDocumentUpdate"
            @block-created="handleBlockCreated"
            @block-updated="handleBlockUpdated"
            @block-deleted="handleBlockDeleted"
          />
        </div>

        <!-- Side Panels -->
        <div v-if="showCollaborationPanel || showVersionHistory" class="flex">
          <!-- Collaboration Panel -->
          <div
            v-if="showCollaborationPanel"
            :style="{ width: collaborationPanelWidth + 'px' }"
            class="flex-shrink-0 border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
          >
            <div class="p-4">
              <CollaborationPanel
                :users="collaboration.connectedUsers.value"
                :current-user="collaboration.state.currentUser"
                :is-connected="collaboration.state.isConnected"
                :user-count="collaboration.userCount.value"
                @invite-user="() => {}"
                @share-workspace="() => {}"
              />
            </div>
          </div>

          <!-- Version History Panel -->
          <div
            v-if="showVersionHistory"
            :style="{ width: versionHistoryWidth + 'px' }"
            class="flex-shrink-0 border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
          >
            <div class="p-4">
              <VersionHistoryPanel
                :versions="versionHistory.versionsSortedByDate.value"
                :current-version="versionHistory.state.currentVersion"
                :is-loading="versionHistory.state.isLoading"
                :auto-save-enabled="versionHistory.state.autoSaveEnabled"
                :last-saved="versionHistory.state.lastSaved"
                :has-unsaved-changes="versionHistory.hasUnsavedChanges.value"
                :time-since-last-save="versionHistory.timeSinceLastSave.value"
                @restore="handleRestoreVersion"
                @compare="handleCompareVersions"
                @toggle-auto-save="handleToggleAutoSave"
                @manual-save="handleManualSave"
              />
            </div>
          </div>
        </div>
      </div>
      
      <!-- Collaboration Cursors -->
      <CollaborationCursors
        :users="collaboration.connectedUsers.value"
        :current-user-id="collaboration.state.currentUser?.id"
      />
      
      <!-- ATHENA AI Assistant -->
      <AthenaAssistant
        @message="handleAIMessage"
        @action="handleAIAction"
      />
    </template>
  </UDashboardPanel>
</template>