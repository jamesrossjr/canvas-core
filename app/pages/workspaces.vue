<script setup lang="ts">
const auth = useAuth()
const router = useRouter()

// Redirect if not authenticated
if (!auth.isAuthenticated.value) {
  await router.push('/auth/login')
}

const isCreating = ref(false)
const showCreateModal = ref(false)

interface Workspace {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  ownerId: string
  collaborators: Array<{
    id: string
    name: string
    email: string
    avatar?: string
    role: 'owner' | 'admin' | 'editor' | 'viewer'
  }>
  documentsCount: number
  isPublic: boolean
}

// Mock workspaces data - in real app this would come from API
const workspaces = ref<Workspace[]>([
  {
    id: 'ws-demo',
    name: 'Demo Workspace',
    description: 'A demonstration workspace with sample content',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    ownerId: auth.user.value?.id || 'user-1',
    collaborators: [
      {
        id: auth.user.value?.id || 'user-1',
        name: auth.user.value?.name || 'Canvas User',
        email: auth.user.value?.email || 'user@example.com',
        avatar: auth.user.value?.avatar,
        role: 'owner'
      }
    ],
    documentsCount: 3,
    isPublic: false
  },
  {
    id: 'ws-personal',
    name: 'Personal Notes',
    description: 'My personal workspace for notes and ideas',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    ownerId: auth.user.value?.id || 'user-1',
    collaborators: [
      {
        id: auth.user.value?.id || 'user-1',
        name: auth.user.value?.name || 'Canvas User',
        email: auth.user.value?.email || 'user@example.com',
        avatar: auth.user.value?.avatar,
        role: 'owner'
      }
    ],
    documentsCount: 1,
    isPublic: false
  }
])

const createForm = reactive({
  name: '',
  description: '',
  isPublic: false
})

const handleCreateWorkspace = async () => {
  if (!createForm.name.trim()) return

  isCreating.value = true

  try {
    // In real app, this would be an API call
    const newWorkspace: Workspace = {
      id: 'ws-' + Math.random().toString(36).substr(2, 9),
      name: createForm.name.trim(),
      description: createForm.description.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: auth.user.value?.id || 'user-1',
      collaborators: [
        {
          id: auth.user.value?.id || 'user-1',
          name: auth.user.value?.name || 'Canvas User',
          email: auth.user.value?.email || 'user@example.com',
          avatar: auth.user.value?.avatar,
          role: 'owner'
        }
      ],
      documentsCount: 0,
      isPublic: createForm.isPublic
    }

    workspaces.value.unshift(newWorkspace)

    // Reset form
    createForm.name = ''
    createForm.description = ''
    createForm.isPublic = false
    showCreateModal.value = false

    // Navigate to new workspace
    await router.push(`/workspace/${newWorkspace.id}`)
  } catch (error) {
    console.error('Failed to create workspace:', error)
  } finally {
    isCreating.value = false
  }
}

const handleDeleteWorkspace = async (workspaceId: string) => {
  if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
    return
  }

  try {
    // In real app, this would be an API call
    workspaces.value = workspaces.value.filter(w => w.id !== workspaceId)
  } catch (error) {
    console.error('Failed to delete workspace:', error)
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

const getCollaboratorString = (workspace: Workspace) => {
  const count = workspace.collaborators.length
  if (count === 1) return 'Only you'
  return `${count} collaborators`
}

// Page meta
useHead({
  title: 'Workspaces - Canvas'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              Workspaces
            </h1>
            <p class="mt-2 text-gray-600 dark:text-gray-400">
              Organize your work into collaborative spaces
            </p>
          </div>
          <UButton
            icon="i-lucide-plus"
            size="lg"
            @click="showCreateModal = true"
          >
            New Workspace
          </UButton>
        </div>
      </div>

      <!-- Workspaces Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Workspace Cards -->
        <div
          v-for="workspace in workspaces"
          :key="workspace.id"
          class="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 dark:border-gray-700"
        >
          <div class="p-6">
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {{ workspace.name }}
                </h3>
                <p v-if="workspace.description" class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {{ workspace.description }}
                </p>
              </div>

              <UDropdown
                :items="[
                  [
                    {
                      label: 'Open',
                      icon: 'i-lucide-external-link',
                      click: () => $router.push(`/workspace/${workspace.id}`)
                    },
                    {
                      label: 'Settings',
                      icon: 'i-lucide-settings',
                      disabled: true
                    }
                  ],
                  [
                    {
                      label: 'Delete',
                      icon: 'i-lucide-trash-2',
                      click: () => handleDeleteWorkspace(workspace.id),
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

            <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
              <span>{{ workspace.documentsCount }} documents</span>
              <span>{{ getCollaboratorString(workspace) }}</span>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <UIcon
                  :name="workspace.isPublic ? 'i-lucide-globe' : 'i-lucide-lock'"
                  class="w-4 h-4 text-gray-400"
                />
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  {{ workspace.isPublic ? 'Public' : 'Private' }}
                </span>
              </div>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                Updated {{ formatDate(workspace.updatedAt) }}
              </span>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 rounded-b-xl">
            <UButton
              :to="`/workspace/${workspace.id}`"
              variant="soft"
              block
            >
              Open Workspace
            </UButton>
          </div>
        </div>

        <!-- Create New Workspace Card -->
        <button
          class="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 border-dashed hover:border-blue-300 dark:hover:border-blue-600 flex flex-col items-center justify-center p-12 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 min-h-[200px]"
          @click="showCreateModal = true"
        >
          <UIcon name="i-lucide-plus" class="w-8 h-8 mb-3" />
          <span class="text-lg font-medium">Create New Workspace</span>
          <span class="text-sm text-center mt-2">
            Start fresh with a new collaborative workspace
          </span>
        </button>
      </div>

      <!-- Empty State (if no workspaces) -->
      <div v-if="workspaces.length === 0" class="text-center py-16">
        <UIcon name="i-lucide-folder-plus" class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No workspaces yet
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          Create your first workspace to get started with Canvas
        </p>
        <UButton
          icon="i-lucide-plus"
          size="lg"
          @click="showCreateModal = true"
        >
          Create First Workspace
        </UButton>
      </div>
    </div>

    <!-- Create Workspace Modal -->
    <UModal v-model="showCreateModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Create New Workspace
          </h3>
        </template>

        <form class="space-y-4" @submit.prevent="handleCreateWorkspace">
          <UFormGroup label="Workspace Name" required>
            <UInput
              v-model="createForm.name"
              placeholder="Enter workspace name"
              :disabled="isCreating"
              size="lg"
            />
          </UFormGroup>

          <UFormGroup label="Description (optional)">
            <UTextarea
              v-model="createForm.description"
              placeholder="Describe what this workspace is for..."
              :disabled="isCreating"
              :rows="3"
            />
          </UFormGroup>

          <UFormGroup>
            <UCheckbox
              v-model="createForm.isPublic"
              label="Make this workspace public"
              :disabled="isCreating"
            />
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Public workspaces can be discovered and viewed by anyone
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
              :disabled="!createForm.name.trim()"
              @click="handleCreateWorkspace"
            >
              Create Workspace
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
