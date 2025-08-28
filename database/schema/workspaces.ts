import { sqliteTable, text, integer, primaryKey, foreignKey } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

export const workspaces = sqliteTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  ownerId: text('owner_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  isPublic: integer('is_public', { mode: 'boolean' }).default(false).notNull(),
  settings: text('settings', { mode: 'json' }).$type<{
    allowPublicAccess: boolean
    defaultPermission: 'view' | 'edit'
    enableComments: boolean
    enableVersionHistory: boolean
  }>().default({
    allowPublicAccess: false,
    defaultPermission: 'view',
    enableComments: true,
    enableVersionHistory: true
  }),
  createdAt: text('created_at').notNull().$default(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$default(() => new Date().toISOString())
})

export const workspaceCollaborators = sqliteTable('workspace_collaborators', {
  workspaceId: text('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: text('role', { enum: ['owner', 'admin', 'editor', 'viewer'] }).notNull(),
  invitedAt: text('invited_at').notNull().$default(() => new Date().toISOString()),
  joinedAt: text('joined_at'),
  invitedBy: text('invited_by').references(() => users.id)
}, table => ({
  pk: primaryKey({ columns: [table.workspaceId, table.userId] })
}))

export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  excerpt: text('excerpt').default(''),
  content: text('content', { mode: 'json' }).$type<{
    blocks: Array<{
      id: string
      type: string
      content: any
      metadata: any
      position: { order: number }
    }>
  }>().default({ blocks: [] }),
  createdBy: text('created_by').references(() => users.id).notNull(),
  isPublic: integer('is_public', { mode: 'boolean' }).default(false).notNull(),
  tags: text('tags', { mode: 'json' }).$type<string[]>().default([]),
  metadata: text('metadata', { mode: 'json' }).$type<{
    version: number
    wordCount?: number
    readTime?: number
  }>().default({ version: 1 }),
  createdAt: text('created_at').notNull().$default(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$default(() => new Date().toISOString())
})

export const documentCollaborators = sqliteTable('document_collaborators', {
  documentId: text('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: text('role', { enum: ['owner', 'editor', 'viewer'] }).notNull(),
  addedAt: text('added_at').notNull().$default(() => new Date().toISOString()),
  addedBy: text('added_by').references(() => users.id)
}, table => ({
  pk: primaryKey({ columns: [table.documentId, table.userId] })
}))

export const documentVersions = sqliteTable('document_versions', {
  id: text('id').primaryKey(),
  documentId: text('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  version: integer('version').notNull(),
  title: text('title').notNull(),
  content: text('content', { mode: 'json' }).notNull(),
  changes: text('changes', { mode: 'json' }).$type<{
    summary: string
    additions: number
    deletions: number
    modified: number
  }>(),
  createdBy: text('created_by').references(() => users.id).notNull(),
  description: text('description'),
  isAutoSave: integer('is_auto_save', { mode: 'boolean' }).default(false).notNull(),
  createdAt: text('created_at').notNull().$default(() => new Date().toISOString())
})

// Relations
export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, {
    fields: [workspaces.ownerId],
    references: [users.id]
  }),
  collaborators: many(workspaceCollaborators),
  documents: many(documents)
}))

export const workspaceCollaboratorsRelations = relations(workspaceCollaborators, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceCollaborators.workspaceId],
    references: [workspaces.id]
  }),
  user: one(users, {
    fields: [workspaceCollaborators.userId],
    references: [users.id]
  }),
  inviter: one(users, {
    fields: [workspaceCollaborators.invitedBy],
    references: [users.id]
  })
}))

export const documentsRelations = relations(documents, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [documents.workspaceId],
    references: [workspaces.id]
  }),
  creator: one(users, {
    fields: [documents.createdBy],
    references: [users.id]
  }),
  collaborators: many(documentCollaborators),
  versions: many(documentVersions)
}))

export const documentCollaboratorsRelations = relations(documentCollaborators, ({ one }) => ({
  document: one(documents, {
    fields: [documentCollaborators.documentId],
    references: [documents.id]
  }),
  user: one(users, {
    fields: [documentCollaborators.userId],
    references: [users.id]
  }),
  adder: one(users, {
    fields: [documentCollaborators.addedBy],
    references: [users.id]
  })
}))

export const documentVersionsRelations = relations(documentVersions, ({ one }) => ({
  document: one(documents, {
    fields: [documentVersions.documentId],
    references: [documents.id]
  }),
  creator: one(users, {
    fields: [documentVersions.createdBy],
    references: [users.id]
  })
}))
