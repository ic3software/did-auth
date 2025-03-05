import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users, publicKeys } from '../server/db/schema';

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type PublicKey = InferSelectModel<typeof publicKeys>;
export type NewPublicKey = InferInsertModel<typeof publicKeys>;