/**
 * Database schema for Exit Button backend
 * Uses Drizzle ORM with PostgreSQL
 */

import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Tenants ─────────────────────────────────────────────────────────────────

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  apiKeyHash: text('api_key_hash').notNull(),
  allowedOrigins: text('allowed_origins').array().default([]),
  posthogApiKey: text('posthog_api_key'),
  posthogProjectId: text('posthog_project_id'),
  posthogHost: text('posthog_host'),
  elevenLabsApiKey: text('elevenlabs_api_key'),
  interventionAgentId: text('intervention_agent_id'),
  chatAgentId: text('chat_agent_id'),
  tier: varchar('tier', { length: 20 }).notNull().default('free'),
  sessionLimit: integer('session_limit').notNull().default(25),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── API Keys ────────────────────────────────────────────────────────────────

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id),
  keyPrefix: varchar('key_prefix', { length: 12 }).notNull(),
  keyHash: text('key_hash').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow(),
  revokedAt: timestamp('revoked_at'),
});

// ─── Sessions ────────────────────────────────────────────────────────────────

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  userId: text('user_id').notNull(),
  status: text('status').notNull().default('initiated'),
  agentId: text('agent_id'),
  elevenLabsConversationId: text('elevenlabs_conversation_id'),
  context: text('context'),
  dynamicVariables: jsonb('dynamic_variables'),
  transcript: jsonb('transcript'),
  offers: jsonb('offers'),
  outcome: text('outcome'),
  aiAnalysis: jsonb('ai_analysis'),
  timing: jsonb('timing'),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});

// ─── Usage ──────────────────────────────────────────────────────────────────

export const usage = pgTable('usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  period: varchar('period', { length: 7 }).notNull(), // "2026-02"
  sessionCount: integer('session_count').notNull().default(0),
  voiceMinutes: integer('voice_minutes').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ─── Relations ───────────────────────────────────────────────────────────────

export const tenantsRelations = relations(tenants, ({ many }) => ({
  apiKeys: many(apiKeys),
  sessions: many(sessions),
  usage: many(usage),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  tenant: one(tenants, {
    fields: [apiKeys.tenantId],
    references: [tenants.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [sessions.tenantId],
    references: [tenants.id],
  }),
}));

export const usageRelations = relations(usage, ({ one }) => ({
  tenant: one(tenants, {
    fields: [usage.tenantId],
    references: [tenants.id],
  }),
}));
