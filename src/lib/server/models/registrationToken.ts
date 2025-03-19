import type { DrizzleD1Database } from 'drizzle-orm/d1';

import { registrationTokens } from "../db/schema";
import { eq, and, gt, sql } from 'drizzle-orm';

export async function isTokenValidAndGetUserId(db: DrizzleD1Database, token: string): Promise<number | null> {
    const currentTime = Date.now();
    const result = await db
        .select({ userId: registrationTokens.userId })
        .from(registrationTokens)
        .where(and(eq(registrationTokens.token, token), gt(registrationTokens.expiresAt, new Date(currentTime))))
        .get();

    return result ? result.userId : null;
}


export async function insertRegistrationToken(db: DrizzleD1Database, userId: number, token: string) {
    return await db.insert(registrationTokens).values({ token, userId, expiresAt: sql`(strftime('%s', 'now') + 300)` }).returning({ id: registrationTokens.id }).get();
}
