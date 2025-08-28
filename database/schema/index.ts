// Export all schema definitions
// Type exports for use throughout the app
import type { users, userSessions } from './users'
import type { workspaces, workspaceCollaborators, documents, documentCollaborators, documentVersions } from './workspaces'

export * from './users'
export * from './workspaces'

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type UserSession = typeof userSessions.$inferSelect
export type NewUserSession = typeof userSessions.$inferInsert

export type Workspace = typeof workspaces.$inferSelect
export type NewWorkspace = typeof workspaces.$inferInsert

export type WorkspaceCollaborator = typeof workspaceCollaborators.$inferSelect
export type NewWorkspaceCollaborator = typeof workspaceCollaborators.$inferInsert

export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert

export type DocumentCollaborator = typeof documentCollaborators.$inferSelect
export type NewDocumentCollaborator = typeof documentCollaborators.$inferInsert

export type DocumentVersion = typeof documentVersions.$inferSelect
export type NewDocumentVersion = typeof documentVersions.$inferInsert
