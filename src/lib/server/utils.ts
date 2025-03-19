import { createId } from '@paralleldrive/cuid2';

export function generateRegistrationToken(): string {
    return createId();
}
