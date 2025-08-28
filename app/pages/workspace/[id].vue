<script setup lang="ts">
import type { Document, Block } from '~/shared/types/blocks'

const route = useRoute()
const workspaceId = route.params.id as string

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
  // In real app, save to backend
  console.log('Document updated:', updatedDocument)
}

const handleBlockCreated = (block: Block) => {
  console.log('Block created:', block)
  // In real app, might trigger real-time collaboration events
}

const handleBlockUpdated = (block: Block) => {
  console.log('Block updated:', block)
  // In real app, might trigger real-time collaboration events
}

const handleBlockDeleted = (blockId: string) => {
  console.log('Block deleted:', blockId)
  // In real app, might trigger real-time collaboration events
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
              icon="i-lucide-users"
              variant="ghost"
              size="sm"
              disabled
            >
              Collaborate
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
      <div class="h-full flex flex-col">
        <!-- Block Editor -->
        <BlockEditor
          :document="document"
          :collaborative="false"
          :show-header="false"
          @update:document="handleDocumentUpdate"
          @block-created="handleBlockCreated"
          @block-updated="handleBlockUpdated"
          @block-deleted="handleBlockDeleted"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>