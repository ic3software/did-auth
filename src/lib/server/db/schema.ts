import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').unique().notNull(),
});

export const publicKeys = sqliteTable('public_keys', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    publicKey: text('public_key').unique().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
    publicKeys: many(publicKeys),
}));

export const publicKeysRelations = relations(publicKeys, ({ one }) => ({
    user: one(users, {
        fields: [publicKeys.userId],
        references: [users.id],
    }),
}));