export default defineEventHandler(async (event) => {
  try {
    // In a real app, get user from session/auth
    const userId = 'user-1' // This would come from auth middleware

    // Mock workspace data - in real app this would query the database
    const workspaces = [
      {
        id: 'ws-demo',
        name: 'Demo Workspace',
        description: 'A demonstration workspace with sample content',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
        ownerId: userId,
        collaborators: [
          {
            id: userId,
            name: 'Canvas User',
            email: 'user@example.com',
            avatar: null,
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
        ownerId: userId,
        collaborators: [
          {
            id: userId,
            name: 'Canvas User',
            email: 'user@example.com',
            avatar: null,
            role: 'owner'
          }
        ],
        documentsCount: 1,
        isPublic: false
      }
    ]

    return {
      success: true,
      data: workspaces
    }
  } catch (error) {
    console.error('Failed to fetch workspaces:', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch workspaces'
    })
  }
})
