import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').unique().notNull(),
    createdAt: integer('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const publicKeys = sqliteTable('public_keys', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    publicKey: text('public_key').unique().notNull(),
    createdAt: integer('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const emails = sqliteTable('emails', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    email: text('email').unique().notNull(),
    createdAt: integer('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const usersRelations = relations(users, ({ many }) => ({
    publicKeys: many(publicKeys),
    emails: many(emails),
}));

export const publicKeysRelations = relations(publicKeys, ({ one }) => ({
    user: one(users, {
        fields: [publicKeys.userId],
        references: [users.id],
    }),
}));

export const emailsRelations = relations(emails, ({ one }) => ({
    user: one(users, {
        fields: [emails.userId],
        references: [users.id],
    }),
}));