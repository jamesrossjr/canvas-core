import { checkRateLimit, sanitizeName, sanitizeDescription } from '../../../utils/security'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // Rate limiting check
    const clientIP = (event.node.req.headers['x-forwarded-for'] as string) || (event.node.req.socket.remoteAddress as string) || 'unknown'
    const rateLimit = checkRateLimit(`workspace-create:${clientIP}`, 10, 15 * 60 * 1000) // 10 requests per 15 minutes

    if (!rateLimit.allowed) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Too many requests. Please try again later.'
      })
    }

    // Validate and sanitize input
    const name = sanitizeName(body.name)
    const description = body.description ? sanitizeDescription(body.description) : null

    // In a real app, get user from session/auth
    const userId = 'user-1' // This would come from auth middleware

    // Create new workspace
    const newWorkspace = {
      id: 'ws-' + Math.random().toString(36).substr(2, 9),
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: userId,
      collaborators: [
        {
          id: userId,
          name: 'Canvas User', // This would come from user data
          email: 'user@example.com', // This would come from user data
          avatar: null,
          role: 'owner'
        }
      ],
      documentsCount: 0,
      isPublic: Boolean(body.isPublic)
    }

    // In a real app, save to database here
    console.log('Creating workspace:', newWorkspace)

    return {
      success: true,
      data: newWorkspace
    }
  } catch (error: any) {
    console.error('Failed to create workspace:', error)

    // Re-throw if already a createError
    if (error?.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create workspace'
    })
  }
})
