export default defineEventHandler(async (event) => {
  try {
    const workspaceId = getRouterParam(event, 'id')

    if (!workspaceId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Workspace ID is required'
      })
    }

    // In a real app, get user from session/auth
    const userId = 'user-1' // This would come from auth middleware

    // Mock documents data - in real app this would query the database
    const documents = [
      {
        id: 'doc-1',
        workspaceId,
        title: 'Welcome to Canvas',
        excerpt: 'This is your Canvas workspace where you can create, organize, and collaborate on content...',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
        createdBy: {
          id: userId,
          name: 'Canvas User',
          avatar: null
        },
        collaborators: [
          {
            id: userId,
            name: 'Canvas User',
            avatar: null
          }
        ],
        blocksCount: 3,
        isPublic: false,
        tags: ['getting-started', 'documentation']
      },
      {
        id: 'doc-2',
        workspaceId,
        title: 'Project Planning',
        excerpt: 'Planning document for the upcoming project milestone with key objectives and timelines...',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        createdBy: {
          id: userId,
          name: 'Canvas User',
          avatar: null
        },
        collaborators: [
          {
            id: userId,
            name: 'Canvas User',
            avatar: null
          }
        ],
        blocksCount: 8,
        isPublic: false,
        tags: ['planning', 'project']
      }
    ]

    return {
      success: true,
      data: documents
    }
  } catch (error) {
    console.error('Failed to fetch documents:', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch documents'
    })
  }
})
