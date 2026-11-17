import { sql } from 'drizzle-orm'
import { boolean, index, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

/**
 * Where jobs come from. One row per company board (Greenhouse, Lever, Ashby, SmartRecruiters, Workday),
 * per big-tech search API, or per aggregated list (Hacker News "Who is hiring", curated GitHub lists).
 */
export const sources = pgTable('sources', {
  id: serial('id').primaryKey(),
  /** Stable key, e.g. "greenhouse:postman". */
  key: text('key').notNull().unique(),
  kind: text('kind').notNull(),
  /** Company name for company boards; a label for aggregated sources. */
  name: text('name').notNull(),
  /** Adapter settings: board token, Workday host/tenant/site, list URL… */
  config: jsonb('config').$type<Record<string, string>>().notNull().default({}),
  enabled: boolean('enabled').notNull().default(true),
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  lastSuccessAt: timestamp('last_success_at', { withTimezone: true }),
  lastError: text('last_error'),
  /** Postings seen in the last successful run, before filters. */
  lastSeen: integer('last_seen').notNull().default(0),
  /** Postings that passed the filters in the last successful run. */
  lastKept: integer('last_kept').notNull().default(0),
})

export type Level = 'intern' | 'new-grad' | 'entry' | 'unspecified'
export type Region = 'hyderabad' | 'india' | 'remote' | 'international'

/** Postings that passed the hard filters. Never deleted; closed ones get `closedAt`. */
export const jobs = pgTable(
  'jobs',
  {
    id: serial('id').primaryKey(),
    sourceId: integer('source_id')
      .notNull()
      .references(() => sources.id, { onDelete: 'cascade' }),
    externalId: text('external_id').notNull(),
    company: text('company').notNull(),
    title: text('title').notNull(),
    location: text('location').notNull(),
    region: text('region').$type<Region>().notNull(),
    /** ISO country code from the location (src/jobs/countries.ts), when one is named. */
    country: text('country'),
    level: text('level').$type<Level>().notNull(),
    category: text('category').notNull(),
    url: text('url').notNull(),
    postedAt: timestamp('posted_at', { withTimezone: true }),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    /** 0–100. Keyword-based until Gemini scoring is connected. */
    score: integer('score').notNull().default(0),
    matched: text('matched')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    reasons: text('reasons')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    /** Canonical skills the posting mentions (see src/jobs/skills.ts). */
    required: text('required')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    /** `required` minus the profile's skills: what the posting asks for that the profile lacks. */
    missing: text('missing')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    /** Set when the job is dismissed from the list. Searches never clear it. */
    dismissedAt: timestamp('dismissed_at', { withTimezone: true }),
    /** Short notes the filters raised, e.g. "Visa sponsorship not mentioned". */
    flags: text('flags')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    /** A trimmed plain-text description, for scoring and the detail view. */
    summary: text('summary'),
  },
  (t) => [
    uniqueIndex('jobs_source_external').on(t.sourceId, t.externalId),
    index('jobs_open_score').on(t.closedAt, t.score),
    index('jobs_first_seen').on(t.firstSeenAt),
  ],
)

export type ApplicationStatus = 'saved' | 'applied' | 'oa' | 'interview' | 'offer' | 'rejected'

export const applications = pgTable(
  'applications',
  {
    id: serial('id').primaryKey(),
    jobId: integer('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    status: text('status').$type<ApplicationStatus>().notNull().default('applied'),
    appliedAt: timestamp('applied_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    notes: text('notes'),
  },
  (t) => [uniqueIndex('applications_job').on(t.jobId)],
)

/** One row per search run, so the menu and the run history can show what happened. */
export const runs = pgTable('runs', {
  id: serial('id').primaryKey(),
  trigger: text('trigger').$type<'refresh' | 'manual' | 'cron'>().notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  sourcesOk: integer('sources_ok').notNull().default(0),
  sourcesFailed: integer('sources_failed').notNull().default(0),
  seen: integer('seen').notNull().default(0),
  kept: integer('kept').notNull().default(0),
  added: integer('added').notNull().default(0),
  closed: integer('closed').notNull().default(0),
  errors: jsonb('errors').$type<{ source: string; error: string }[]>().notNull().default([]),
})

/** Resumes: the master and its versions. The editor (Phase 3) fills `content`. */
export const resumes = pgTable('resumes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  isMaster: boolean('is_master').notNull().default(false),
  content: jsonb('content').$type<Record<string, unknown>>().notNull().default({}),
  /** Template, font and accent chosen in the editor (see src/resume/design.ts). */
  design: jsonb('design').$type<Record<string, unknown>>().notNull().default({}),
  /** Optional: the company or role this version is for. */
  target: text('target'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

/**
 * "About you" descriptions: the owner's own words about their work, one per kind of application
 * (e.g. a general one, one for an AI role, one for a Salesforce-admin role). Copied into applications and
 * read for matching.
 */
export const abouts = pgTable('abouts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  /** Optional: the company or role it was written for. */
  target: text('target'),
  text: text('text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

/** Small key/value settings: the matching profile, the last dashboard visit… */
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
