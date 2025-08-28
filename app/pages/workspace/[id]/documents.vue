<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const auth = useAuth()

// Redirect if not authenticated
if (!auth.isAuthenticated.value) {
  await router.push('/auth/login')
}

const workspaceId = route.params.id as string

interface Document {
  id: string
  title: string
  excerpt: string
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    name: string
    avatar?: string
  }
  collaborators: Array<{
    id: string
    name: string
    avatar?: string
  }>
  blocksCount: number
  isPublic: boolean
  tags: string[]
}

const isCreating = ref(false)
const showCreateModal = ref(false)
const searchQuery = ref('')
const selectedTag = ref<string | null>(null)

// Mock documents data
const documents = ref<Document[]>([
  {
    id: 'doc-1',
    title: 'Welcome to Canvas',
    excerpt: 'This is your Canvas workspace where you can create, organize, and collaborate on content...',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    createdBy: {
      id: auth.user.value?.id || 'user-1',
      name: auth.user.value?.name || 'Canvas User',
      avatar: auth.user.value?.avatar
    },
    collaborators: [
      {
        id: auth.user.value?.id || 'user-1',
        name: auth.user.value?.name || 'Canvas User',
        avatar: auth.user.value?.avatar
      }
    ],
    blocksCount: 3,
    isPublic: false,
    tags: ['getting-started', 'documentation']
  },
  {
    id: 'doc-2',
    title: 'Project Planning',
    excerpt: 'Planning document for the upcoming project milestone with key objectives and timelines...',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    createdBy: {
      id: auth.user.value?.id || 'user-1',
      name: auth.user.value?.name || 'Canvas User',
      avatar: auth.user.value?.avatar
    },
    collaborators: [
      {
        id: auth.user.value?.id || 'user-1',
        name: auth.user.value?.name || 'Canvas User',
        avatar: auth.user.value?.avatar
      }
    ],
    blocksCount: 8,
    isPublic: false,
    tags: ['planning', 'project']
  }
])

const createForm = reactive({
  title: '',
  isPublic: false,
  tags: [] as string[]
})

const filteredDocuments = computed(() => {
  let filtered = documents.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(doc =>
      doc.title.toLowerCase().includes(query)
      || doc.excerpt.toLowerCase().includes(query)
    )
  }

  if (selectedTag.value) {
    filtered = filtered.filter(doc =>
      doc.tags.includes(selectedTag.value!)
    )
  }

  return filtered
})

const allTags = computed(() => {
  const tags = new Set<string>()
  documents.value.forEach((doc) => {
    doc.tags.forEach(tag => tags.add(tag))
  })
  return Array.from(tags).sort()
})

const handleCreateDocument = async () => {
  if (!createForm.title.trim()) return

  isCreating.value = true

  try {
    const newDocument: Document = {
      id: 'doc-' + Math.random().toString(36).substr(2, 9),
      title: createForm.title.trim(),
      excerpt: 'New document...',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: {
        id: auth.user.value?.id || 'user-1',
        name: auth.user.value?.name || 'Canvas User',
        avatar: auth.user.value?.avatar
      },
      collaborators: [
        {
          id: auth.user.value?.id || 'user-1',
          name: auth.user.value?.name || 'Canvas User',
          avatar: auth.user.value?.avatar
        }
      ],
      blocksCount: 0,
      isPublic: createForm.isPublic,
      tags: createForm.tags
    }

    documents.value.unshift(newDocument)

    // Reset form
    createForm.title = ''
    createForm.isPublic = false
    createForm.tags = []
    showCreateModal.value = false

    // Navigate to new document
    await router.push(`/workspace/${workspaceId}`)
  } catch (error) {
    console.error('Failed to create document:', error)
  } finally {
    isCreating.value = false
  }
}

const handleDeleteDocument = async (documentId: string) => {
  if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
    return
  }

  try {
    documents.value = documents.value.filter(d => d.id !== documentId)
  } catch (error) {
    console.error('Failed to delete document:', error)
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return formatDate(dateString)
  }
}

// Page meta
useHead({
  title: `Documents - Workspace ${workspaceId} - Canvas`
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <UButton
                icon="i-lucide-arrow-left"
                variant="ghost"
                size="sm"
                :to="`/workspace/${workspaceId}`"
              >
                Back to Workspace
              </UButton>
            </div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              Documents
            </h1>
            <p class="mt-2 text-gray-600 dark:text-gray-400">
              Manage documents in this workspace
            </p>
          </div>
          <UButton
            icon="i-lucide-plus"
            size="lg"
            @click="showCreateModal = true"
          >
            New Document
          </UButton>
        </div>
      </div>

      <!-- Filters -->
      <div class="mb-6 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Search documents..."
            class="w-64"
          />

          <USelectMenu
            v-model="selectedTag"
            :options="[
              { label: 'All tags', value: null },
              ...allTags.map(tag => ({ label: tag, value: tag }))
            ]"
            placeholder="Filter by tag"
            class="w-48"
          />
        </div>

        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ filteredDocuments.length }} document{{ filteredDocuments.length !== 1 ? 's' : '' }}
        </div>
      </div>

      <!-- Documents List -->
      <div class="space-y-4">
        <div
          v-for="document in filteredDocuments"
          :key="document.id"
          class="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 dark:border-gray-700"
        >
          <div class="p-6">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-3">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ document.title }}
                  </h3>
                  <div class="flex items-center gap-2">
                    <UIcon
                      :name="document.isPublic ? 'i-lucide-globe' : 'i-lucide-lock'"
                      class="w-4 h-4 text-gray-400"
                    />
                    <div v-if="document.tags.length > 0" class="flex items-center gap-1">
                      <UBadge
                        v-for="tag in document.tags.slice(0, 2)"
                        :key="tag"
                        :label="tag"
                        variant="soft"
                        size="xs"
                      />
                      <span v-if="document.tags.length > 2" class="text-xs text-gray-500">
                        +{{ document.tags.length - 2 }}
                      </span>
                    </div>
                  </div>
                </div>

                <p class="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {{ document.excerpt }}
                </p>

                <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div class="flex items-center gap-4">
                    <span>{{ document.blocksCount }} blocks</span>
                    <span>{{ document.collaborators.length }} collaborator{{ document.collaborators.length !== 1 ? 's' : '' }}</span>
                  </div>
                  <div class="flex items-center gap-4">
                    <span>Updated {{ formatRelativeTime(document.updatedAt) }}</span>
                    <span>By {{ document.createdBy.name }}</span>
                  </div>
                </div>
              </div>

              <UDropdown
                :items="[
                  [
                    {
                      label: 'Open',
                      icon: 'i-lucide-external-link',
                      click: () => $router.push(`/workspace/${workspaceId}`)
                    },
                    {
                      label: 'Duplicate',
                      icon: 'i-lucide-copy',
                      disabled: true
                    },
                    {
                      label: 'Export',
                      icon: 'i-lucide-download',
                      disabled: true
                    }
                  ],
                  [
                    {
                      label: 'Delete',
                      icon: 'i-lucide-trash-2',
                      click: () => handleDeleteDocument(document.id),
                      class: 'text-red-600 dark:text-red-400'
                    }
                  ]
                ]"
              >
                <UButton
                  icon="i-lucide-more-horizontal"
                  variant="ghost"
                  size="sm"
                  class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                />
              </UDropdown>
            </div>

            <!-- Collaborators -->
            <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div class="flex items-center -space-x-2">
                <div
                  v-for="collaborator in document.collaborators.slice(0, 3)"
                  :key="collaborator.id"
                  class="relative"
                >
                  <UAvatar
                    :src="collaborator.avatar"
                    :alt="collaborator.name"
                    size="sm"
                    class="border-2 border-white dark:border-gray-800"
                  />
                </div>
                <div
                  v-if="document.collaborators.length > 3"
                  class="relative flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800 text-xs font-medium text-gray-600 dark:text-gray-300"
                >
                  +{{ document.collaborators.length - 3 }}
                </div>
              </div>

              <UButton
                :to="`/workspace/${workspaceId}`"
                variant="soft"
                size="sm"
              >
                Open Document
              </UButton>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredDocuments.length === 0 && documents.length > 0" class="text-center py-16">
          <UIcon name="i-lucide-search-x" class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No documents found
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            Try adjusting your search query or filter settings
          </p>
          <UButton
            variant="ghost"
            @click="searchQuery = ''; selectedTag = null"
          >
            Clear filters
          </UButton>
        </div>

        <!-- Empty State (no documents) -->
        <div v-if="documents.length === 0" class="text-center py-16">
          <UIcon name="i-lucide-file-plus" class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No documents yet
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            Create your first document to get started
          </p>
          <UButton
            icon="i-lucide-plus"
            size="lg"
            @click="showCreateModal = true"
          >
            Create First Document
          </UButton>
        </div>
      </div>
    </div>

    <!-- Create Document Modal -->
    <UModal v-model="showCreateModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Create New Document
          </h3>
        </template>

        <form class="space-y-4" @submit.prevent="handleCreateDocument">
          <UFormGroup label="Document Title" required>
            <UInput
              v-model="createForm.title"
              placeholder="Enter document title"
              :disabled="isCreating"
              size="lg"
            />
          </UFormGroup>

          <UFormGroup>
            <UCheckbox
              v-model="createForm.isPublic"
              label="Make this document public"
              :disabled="isCreating"
            />
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Public documents can be viewed by anyone with the link
            </p>
          </UFormGroup>
        </form>

        <template #footer>
          <div class="flex justify-end space-x-3">
            <UButton
              variant="ghost"
              :disabled="isCreating"
              @click="showCreateModal = false"
            >
              Cancel
            </UButton>
            <UButton
              :loading="isCreating"
              :disabled="!createForm.title.trim()"
              @click="handleCreateDocument"
            >
              Create Document
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
