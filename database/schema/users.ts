import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// Import workspace and document tables for relations
import { workspaces, documents, workspaceCollaborators } from './workspaces'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  role: text('role', { enum: ['user', 'admin', 'moderator'] }).default('user').notNull(),
  preferences: text('preferences', { mode: 'json' }).$type<{
    theme: 'light' | 'dark' | 'system'
    language: string
    notifications: boolean
  }>().default({
    theme: 'system',
    language: 'en',
    notifications: true
  }),
  subscription: text('subscription', { mode: 'json' }).$type<{
    plan: 'free' | 'pro' | 'enterprise'
    expiresAt?: string
  }>().default({
    plan: 'free'
  }),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  lastLoginAt: text('last_login_at'),
  createdAt: text('created_at').notNull().$default(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$default(() => new Date().toISOString())
})

export const userSessions = sqliteTable('user_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').unique().notNull(),
  expiresAt: text('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: text('created_at').notNull().$default(() => new Date().toISOString())
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(userSessions),
  workspaces: many(workspaces),
  documents: many(documents),
  collaborations: many(workspaceCollaborators)
}))

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id]
  })
}))
