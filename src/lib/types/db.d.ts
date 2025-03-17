import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import { publicKeys, users } from '../server/db/schema';

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type PublicKey = InferSelectModel<typeof publicKeys>;
export type NewPublicKey = InferInsertModel<typeof publicKeys>;
