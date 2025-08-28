import type { Server as HTTPServer } from 'http'
import type { Socket } from 'socket.io'
import { Server as SocketIOServer } from 'socket.io'

interface User {
  id: string
  name: string
  avatar?: string
  cursor?: {
    x: number
    y: number
    blockId?: string
  }
}

interface CollaborationData {
  type: 'block-update' | 'cursor-move' | 'user-join' | 'user-leave' | 'selection-change'
  userId: string
  workspaceId: string
  data: any
  timestamp: number
}

interface WorkspaceRoom {
  id: string
  users: Map<string, User>
  activeDocument?: string
}

class CollaborationServer {
  private io: SocketIOServer
  private workspaces = new Map<string, WorkspaceRoom>()

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'development' ? '*' : false,
        methods: ['GET', 'POST']
      },
      pingTimeout: 60000,
      pingInterval: 25000
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`User connected: ${socket.id}`)

      socket.on('join-workspace', async (data: { workspaceId: string, user: User }) => {
        await this.handleJoinWorkspace(socket, data)
      })

      socket.on('leave-workspace', async (data: { workspaceId: string }) => {
        await this.handleLeaveWorkspace(socket, data)
      })

      socket.on('block-operation', async (data: CollaborationData) => {
        await this.handleBlockOperation(socket, data)
      })

      socket.on('cursor-update', async (data: { workspaceId: string, cursor: User['cursor'] }) => {
        await this.handleCursorUpdate(socket, data)
      })

      socket.on('selection-change', async (data: { workspaceId: string, selection: any }) => {
        await this.handleSelectionChange(socket, data)
      })

      socket.on('typing-start', async (data: { workspaceId: string, blockId: string }) => {
        await this.handleTypingStart(socket, data)
      })

      socket.on('typing-stop', async (data: { workspaceId: string, blockId: string }) => {
        await this.handleTypingStop(socket, data)
      })

      socket.on('disconnect', async () => {
        await this.handleDisconnect(socket)
      })
    })
  }

  private async handleJoinWorkspace(socket: Socket, { workspaceId, user }: { workspaceId: string, user: User }) {
    // Join the workspace room
    await socket.join(workspaceId)

    // Get or create workspace room
    let workspace = this.workspaces.get(workspaceId)
    if (!workspace) {
      workspace = {
        id: workspaceId,
        users: new Map()
      }
      this.workspaces.set(workspaceId, workspace)
    }

    // Add user to workspace
    user.id = socket.id
    workspace.users.set(socket.id, user)

    // Notify other users in the workspace
    socket.to(workspaceId).emit('user-joined', {
      user,
      timestamp: Date.now()
    })

    // Send current workspace state to the joining user
    socket.emit('workspace-state', {
      users: Array.from(workspace.users.values()).filter(u => u.id !== socket.id),
      activeDocument: workspace.activeDocument
    })

    console.log(`User ${user.name} joined workspace ${workspaceId}`)
  }

  private async handleLeaveWorkspace(socket: Socket, { workspaceId }: { workspaceId: string }) {
    const workspace = this.workspaces.get(workspaceId)
    if (!workspace) return

    const user = workspace.users.get(socket.id)
    if (!user) return

    // Remove user from workspace
    workspace.users.delete(socket.id)
    await socket.leave(workspaceId)

    // Notify other users
    socket.to(workspaceId).emit('user-left', {
      userId: socket.id,
      user,
      timestamp: Date.now()
    })

    // Clean up empty workspaces
    if (workspace.users.size === 0) {
      this.workspaces.delete(workspaceId)
    }

    console.log(`User ${user.name} left workspace ${workspaceId}`)
  }

  private async handleBlockOperation(socket: Socket, data: CollaborationData) {
    const workspace = this.workspaces.get(data.workspaceId)
    if (!workspace) return

    // Broadcast the operation to other users in the workspace
    socket.to(data.workspaceId).emit('block-operation', {
      ...data,
      userId: socket.id,
      timestamp: Date.now()
    })

    // Log the operation for debugging
    console.log(`Block operation in workspace ${data.workspaceId}:`, data.type)
  }

  private async handleCursorUpdate(socket: Socket, { workspaceId, cursor }: { workspaceId: string, cursor: User['cursor'] }) {
    const workspace = this.workspaces.get(workspaceId)
    if (!workspace) return

    const user = workspace.users.get(socket.id)
    if (!user) return

    // Update user's cursor position
    user.cursor = cursor

    // Broadcast cursor update to other users
    socket.to(workspaceId).emit('cursor-update', {
      userId: socket.id,
      cursor,
      timestamp: Date.now()
    })
  }

  private async handleSelectionChange(socket: Socket, { workspaceId, selection }: { workspaceId: string, selection: any }) {
    // Broadcast selection change to other users
    socket.to(workspaceId).emit('selection-change', {
      userId: socket.id,
      selection,
      timestamp: Date.now()
    })
  }

  private async handleTypingStart(socket: Socket, { workspaceId, blockId }: { workspaceId: string, blockId: string }) {
    socket.to(workspaceId).emit('typing-start', {
      userId: socket.id,
      blockId,
      timestamp: Date.now()
    })
  }

  private async handleTypingStop(socket: Socket, { workspaceId, blockId }: { workspaceId: string, blockId: string }) {
    socket.to(workspaceId).emit('typing-stop', {
      userId: socket.id,
      blockId,
      timestamp: Date.now()
    })
  }

  private async handleDisconnect(socket: Socket) {
    // Find and clean up user from all workspaces
    for (const [workspaceId, workspace] of this.workspaces.entries()) {
      const user = workspace.users.get(socket.id)
      if (user) {
        workspace.users.delete(socket.id)

        // Notify other users
        socket.to(workspaceId).emit('user-left', {
          userId: socket.id,
          user,
          timestamp: Date.now()
        })

        // Clean up empty workspaces
        if (workspace.users.size === 0) {
          this.workspaces.delete(workspaceId)
        }
      }
    }

    console.log(`User disconnected: ${socket.id}`)
  }

  public getWorkspaceStats(workspaceId: string) {
    const workspace = this.workspaces.get(workspaceId)
    return {
      userCount: workspace?.users.size || 0,
      users: workspace ? Array.from(workspace.users.values()) : []
    }
  }
}

// Export for Nuxt 3 server API
export default defineNitroPlugin((nitroApp) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Socket.IO collaboration server initialized')
    // In development, we'll need to manually initialize this
    // when the HTTP server is available
  }
})
