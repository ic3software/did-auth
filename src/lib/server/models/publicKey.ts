import { publicKeys } from "../db/schema";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";

export async function getUserIdByPublicKey(db: DrizzleD1Database, publicKey: string) {
    return await db
        .select({ userId: publicKeys.userId })
        .from(publicKeys)
        .where(eq(publicKeys.publicKey, publicKey))
        .get();
}

export async function insertPublicKey(db: DrizzleD1Database, userId: number, publicKey: string) {
    return await db.insert(publicKeys).values({ userId, publicKey }).returning({ id: publicKeys.id }).get();
}
