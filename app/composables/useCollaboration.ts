import { io, Socket } from 'socket.io-client'
import type { Block, Document } from '~/shared/types/blocks'

interface User {
  id: string
  name: string
  avatar?: string
  cursor?: {
    x: number
    y: number
    blockId?: string
  }
  isTyping?: boolean
  typingBlockId?: string
}

interface CollaborationEvent {
  type: 'block-update' | 'cursor-move' | 'user-join' | 'user-leave' | 'selection-change'
  userId: string
  workspaceId: string
  data: any
  timestamp: number
}

export interface CollaborationState {
  isConnected: boolean
  users: Map<string, User>
  currentUser: User | null
  socket: Socket | null
}

export const useCollaboration = (workspaceId: string) => {
  const state = reactive<CollaborationState>({
    isConnected: false,
    users: new Map(),
    currentUser: null,
    socket: null
  })

  const eventHandlers = new Map<string, Function[]>()

  // Initialize socket connection
  const connect = (user: Omit<User, 'id'>) => {
    if (state.socket) return

    // Create socket connection
    state.socket = io(process.env.NODE_ENV === 'development' ? 'http://localhost:3002' : '', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    state.currentUser = { ...user, id: '' }

    // Socket event handlers
    state.socket.on('connect', () => {
      console.log('Connected to collaboration server')
      state.isConnected = true
      
      if (state.currentUser) {
        state.currentUser.id = state.socket!.id
      }

      // Join the workspace
      state.socket!.emit('join-workspace', {
        workspaceId,
        user: state.currentUser
      })
    })

    state.socket.on('disconnect', () => {
      console.log('Disconnected from collaboration server')
      state.isConnected = false
      state.users.clear()
    })

    state.socket.on('user-joined', (data: { user: User, timestamp: number }) => {
      console.log('User joined:', data.user.name)
      state.users.set(data.user.id, data.user)
      emit('user-joined', data)
    })

    state.socket.on('user-left', (data: { userId: string, user: User, timestamp: number }) => {
      console.log('User left:', data.user.name)
      state.users.delete(data.userId)
      emit('user-left', data)
    })

    state.socket.on('workspace-state', (data: { users: User[], activeDocument?: string }) => {
      console.log('Received workspace state:', data)
      state.users.clear()
      data.users.forEach(user => {
        state.users.set(user.id, user)
      })
      emit('workspace-state', data)
    })

    state.socket.on('block-operation', (data: CollaborationEvent) => {
      console.log('Received block operation:', data.type)
      emit('block-operation', data)
    })

    state.socket.on('cursor-update', (data: { userId: string, cursor: User['cursor'], timestamp: number }) => {
      const user = state.users.get(data.userId)
      if (user) {
        user.cursor = data.cursor
      }
      emit('cursor-update', data)
    })

    state.socket.on('selection-change', (data: { userId: string, selection: any, timestamp: number }) => {
      emit('selection-change', data)
    })

    state.socket.on('typing-start', (data: { userId: string, blockId: string, timestamp: number }) => {
      const user = state.users.get(data.userId)
      if (user) {
        user.isTyping = true
        user.typingBlockId = data.blockId
      }
      emit('typing-start', data)
    })

    state.socket.on('typing-stop', (data: { userId: string, blockId: string, timestamp: number }) => {
      const user = state.users.get(data.userId)
      if (user) {
        user.isTyping = false
        user.typingBlockId = undefined
      }
      emit('typing-stop', data)
    })
  }

  // Disconnect from collaboration server
  const disconnect = () => {
    if (state.socket) {
      state.socket.emit('leave-workspace', { workspaceId })
      state.socket.disconnect()
      state.socket = null
    }
    state.isConnected = false
    state.users.clear()
    state.currentUser = null
  }

  // Send block operation to other collaborators
  const sendBlockOperation = (type: CollaborationEvent['type'], blockData: any) => {
    if (!state.socket || !state.isConnected) return

    state.socket.emit('block-operation', {
      type,
      workspaceId,
      data: blockData,
      timestamp: Date.now()
    })
  }

  // Update cursor position
  const updateCursor = (cursor: User['cursor']) => {
    if (!state.socket || !state.isConnected || !state.currentUser) return

    state.currentUser.cursor = cursor
    state.socket.emit('cursor-update', {
      workspaceId,
      cursor
    })
  }

  // Update selection
  const updateSelection = (selection: any) => {
    if (!state.socket || !state.isConnected) return

    state.socket.emit('selection-change', {
      workspaceId,
      selection
    })
  }

  // Start typing indicator
  const startTyping = (blockId: string) => {
    if (!state.socket || !state.isConnected) return

    state.socket.emit('typing-start', {
      workspaceId,
      blockId
    })
  }

  // Stop typing indicator
  const stopTyping = (blockId: string) => {
    if (!state.socket || !state.isConnected) return

    state.socket.emit('typing-stop', {
      workspaceId,
      blockId
    })
  }

  // Event system
  const on = (event: string, handler: Function) => {
    if (!eventHandlers.has(event)) {
      eventHandlers.set(event, [])
    }
    eventHandlers.get(event)!.push(handler)
  }

  const off = (event: string, handler: Function) => {
    const handlers = eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index !== -1) {
        handlers.splice(index, 1)
      }
    }
  }

  const emit = (event: string, data: any) => {
    const handlers = eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }

  // Block-specific collaboration methods
  const applyBlockOperation = (operation: CollaborationEvent) => {
    switch (operation.type) {
      case 'block-update':
        // Apply block content changes
        return operation.data
      
      default:
        return null
    }
  }

  // Operational Transform for conflict resolution
  const transformOperation = (op1: any, op2: any) => {
    // Simple implementation - in production you'd use a proper OT library
    // like ShareJS, Yjs, or implement your own OT algorithm
    
    if (op1.blockId !== op2.blockId) {
      return [op1, op2] // No conflict if different blocks
    }

    // For same block, apply timestamp-based resolution
    if (op1.timestamp < op2.timestamp) {
      return [op1, op2]
    } else {
      return [op2, op1]
    }
  }

  // Cleanup on component unmount
  onBeforeUnmount(() => {
    disconnect()
  })

  return {
    // State
    state: readonly(state),
    
    // Connection methods
    connect,
    disconnect,
    
    // Collaboration methods
    sendBlockOperation,
    updateCursor,
    updateSelection,
    startTyping,
    stopTyping,
    applyBlockOperation,
    transformOperation,
    
    // Event system
    on,
    off,
    
    // Computed properties
    connectedUsers: computed(() => Array.from(state.users.values())),
    isCollaborating: computed(() => state.isConnected && state.users.size > 0),
    userCount: computed(() => state.users.size + (state.currentUser ? 1 : 0))
  }
}