import { checkRateLimit, sanitizeName, isValidId } from '../../../../utils/security'

export default defineEventHandler(async (event) => {
  try {
    const workspaceId = getRouterParam(event, 'id')
    const body = await readBody(event)

    // Validate workspace ID
    if (!workspaceId || !isValidId(workspaceId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Valid workspace ID is required'
      })
    }

    // Rate limiting check
    const clientIP = (event.node.req.headers['x-forwarded-for'] as string) || (event.node.req.socket.remoteAddress as string) || 'unknown'
    const rateLimit = checkRateLimit(`document-create:${clientIP}`, 20, 15 * 60 * 1000) // 20 requests per 15 minutes

    if (!rateLimit.allowed) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Too many requests. Please try again later.'
      })
    }

    // Validate and sanitize input
    const title = sanitizeName(body.title)

    // In a real app, get user from session/auth
    const userId = 'user-1' // This would come from auth middleware

    // Create new document
    const newDocument = {
      id: 'doc-' + Math.random().toString(36).substr(2, 9),
      workspaceId,
      title,
      excerpt: 'New document...',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: {
        id: userId,
        name: 'Canvas User', // This would come from user data
        avatar: null
      },
      collaborators: [
        {
          id: userId,
          name: 'Canvas User', // This would come from user data
          avatar: null
        }
      ],
      blocksCount: 0,
      isPublic: Boolean(body.isPublic),
      tags: Array.isArray(body.tags) ? body.tags : [],
      blocks: []
    }

    // In a real app, save to database here
    console.log('Creating document:', newDocument)

    return {
      success: true,
      data: newDocument
    }
  } catch (error: any) {
    console.error('Failed to create document:', error)

    // Re-throw if already a createError
    if (error?.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create document'
    })
  }
})
