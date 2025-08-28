import type { Document, Block } from '~/shared/types/blocks'

interface DocumentVersion {
  id: string
  documentId: string
  version: number
  title: string
  content: Document
  createdAt: string
  createdBy: string
  changeDescription?: string
  changeType: 'manual' | 'autosave' | 'collaboration'
  size: number
}

interface VersionHistoryState {
  versions: DocumentVersion[]
  currentVersion: number
  isLoading: boolean
  autoSaveEnabled: boolean
  lastSaved: string | null
  isDirty: boolean
}

export const useVersionHistory = (documentId: string) => {
  const state = reactive<VersionHistoryState>({
    versions: [],
    currentVersion: 0,
    isLoading: false,
    autoSaveEnabled: true,
    lastSaved: null,
    isDirty: false
  })

  let autoSaveTimer: NodeJS.Timeout | null = null
  const AUTO_SAVE_DELAY = 3000 // 3 seconds

  // Load version history from storage/API
  const loadVersionHistory = async () => {
    state.isLoading = true
    try {
      // In a real app, this would fetch from API
      const mockVersions: DocumentVersion[] = [
        {
          id: 'v1',
          documentId,
          version: 1,
          title: 'Initial version',
          content: {} as Document, // Would contain actual document content
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          createdBy: 'user-1',
          changeType: 'manual',
          size: 1024
        },
        {
          id: 'v2',
          documentId,
          version: 2,
          title: 'Added introduction',
          content: {} as Document,
          createdAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
          createdBy: 'user-1',
          changeDescription: 'Added introduction section',
          changeType: 'manual',
          size: 1536
        },
        {
          id: 'v3',
          documentId,
          version: 3,
          title: 'Auto-save',
          content: {} as Document,
          createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          createdBy: 'user-1',
          changeType: 'autosave',
          size: 1792
        }
      ]
      
      state.versions = mockVersions
      state.currentVersion = mockVersions.length
    } catch (error) {
      console.error('Failed to load version history:', error)
    } finally {
      state.isLoading = false
    }
  }

  // Save a new version
  const saveVersion = async (
    document: Document, 
    changeType: DocumentVersion['changeType'] = 'manual',
    changeDescription?: string
  ) => {
    try {
      const newVersion: DocumentVersion = {
        id: `v${state.versions.length + 1}`,
        documentId: document.id,
        version: state.versions.length + 1,
        title: changeType === 'autosave' ? 'Auto-save' : document.title,
        content: JSON.parse(JSON.stringify(document)), // Deep clone
        createdAt: new Date().toISOString(),
        createdBy: 'current-user', // In real app, get from auth
        changeDescription,
        changeType,
        size: JSON.stringify(document).length
      }

      // In a real app, this would save to API
      state.versions.push(newVersion)
      state.currentVersion = newVersion.version
      state.lastSaved = newVersion.createdAt
      state.isDirty = false

      // Limit version history to prevent bloat (keep last 50 versions)
      if (state.versions.length > 50) {
        state.versions = state.versions.slice(-50)
      }

      console.log(`Saved version ${newVersion.version} (${changeType})`)
      return newVersion
    } catch (error) {
      console.error('Failed to save version:', error)
      throw error
    }
  }

  // Auto-save functionality
  const scheduleAutoSave = (document: Document) => {
    if (!state.autoSaveEnabled) return

    // Clear existing timer
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
    }

    // Mark as dirty
    state.isDirty = true

    // Schedule auto-save
    autoSaveTimer = setTimeout(() => {
      saveVersion(document, 'autosave')
    }, AUTO_SAVE_DELAY)
  }

  // Manual save
  const manualSave = async (document: Document, description?: string) => {
    // Cancel any pending auto-save
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
      autoSaveTimer = null
    }

    return await saveVersion(document, 'manual', description)
  }

  // Restore a specific version
  const restoreVersion = async (versionId: string): Promise<Document | null> => {
    const version = state.versions.find(v => v.id === versionId)
    if (!version) {
      console.error('Version not found:', versionId)
      return null
    }

    try {
      // In a real app, this would restore from API
      state.currentVersion = version.version
      console.log(`Restored to version ${version.version}`)
      return JSON.parse(JSON.stringify(version.content))
    } catch (error) {
      console.error('Failed to restore version:', error)
      return null
    }
  }

  // Compare versions
  const compareVersions = (version1Id: string, version2Id: string) => {
    const v1 = state.versions.find(v => v.id === version1Id)
    const v2 = state.versions.find(v => v.id === version2Id)
    
    if (!v1 || !v2) {
      console.error('One or both versions not found')
      return null
    }

    // Simple comparison - in a real app you'd use a proper diff library
    return {
      version1: v1,
      version2: v2,
      changes: {
        titleChanged: v1.content.title !== v2.content.title,
        blockCount: {
          before: v1.content.blocks.length,
          after: v2.content.blocks.length
        },
        sizeChange: v2.size - v1.size
      }
    }
  }

  // Get version diff
  const getVersionDiff = (versionId: string, compareToId?: string) => {
    const version = state.versions.find(v => v.id === versionId)
    const compareVersion = compareToId 
      ? state.versions.find(v => v.id === compareToId)
      : state.versions.find(v => v.version === version!.version - 1)

    if (!version || !compareVersion) return null

    return compareVersions(compareVersion.id, version.id)
  }

  // Enable/disable auto-save
  const toggleAutoSave = (enabled: boolean) => {
    state.autoSaveEnabled = enabled
    if (!enabled && autoSaveTimer) {
      clearTimeout(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  // Clean up on unmount
  onBeforeUnmount(() => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
    }
  })

  // Computed properties
  const latestVersion = computed(() => 
    state.versions.length > 0 ? state.versions[state.versions.length - 1] : null
  )

  const versionsSortedByDate = computed(() => 
    [...state.versions].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  )

  const hasUnsavedChanges = computed(() => state.isDirty)

  const timeSinceLastSave = computed(() => {
    if (!state.lastSaved) return null
    const now = new Date().getTime()
    const lastSave = new Date(state.lastSaved).getTime()
    const diff = now - lastSave
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  })

  return {
    // State
    state: readonly(state),
    
    // Methods
    loadVersionHistory,
    saveVersion,
    manualSave,
    scheduleAutoSave,
    restoreVersion,
    compareVersions,
    getVersionDiff,
    toggleAutoSave,
    
    // Computed
    latestVersion,
    versionsSortedByDate,
    hasUnsavedChanges,
    timeSinceLastSave
  }
}