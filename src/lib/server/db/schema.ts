import { relations, sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').unique().notNull(),
	createdAt: integer('created_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updatedAt: integer('updated_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
});

export const publicKeys = sqliteTable('public_keys', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	publicKey: text('public_key').unique().notNull(),
	createdAt: integer('created_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
});

export const emails = sqliteTable('emails', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	email: text('email').unique().notNull(),
	createdAt: integer('created_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
});

export const registrationTokens = sqliteTable('registration_tokens', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	token: text('token').unique().notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' })
		.notNull(),
	createdAt: integer('created_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
});

export const usersRelations = relations(users, ({ many }) => ({
	publicKeys: many(publicKeys),
	emails: many(emails),
	registrationTokens: many(registrationTokens)
}));

export const publicKeysRelations = relations(publicKeys, ({ one }) => ({
	user: one(users, {
		fields: [publicKeys.userId],
		references: [users.id]
	})
}));

export const emailsRelations = relations(emails, ({ one }) => ({
	user: one(users, {
		fields: [emails.userId],
		references: [users.id]
	})
}));

export const registrationTokensRelations = relations(registrationTokens, ({ one }) => ({
	user: one(users, {
		fields: [registrationTokens.userId],
		references: [users.id]
	})
}));