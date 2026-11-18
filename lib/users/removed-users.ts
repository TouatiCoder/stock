/**
 * A user with history (orders, checklists, payments...) cannot be erased without
 * losing that history. Such an account is anonymized instead and gets an address
 * on this reserved domain, which keeps it out of the company's user lists.
 */
export const REMOVED_USER_EMAIL_SUFFIX = "@deleted.invalid";

export function removedUserEmail(userId: string) {
  return `deleted-${userId}${REMOVED_USER_EMAIL_SUFFIX}`;
}

export function isRemovedUserEmail(email: string) {
  return email.endsWith(REMOVED_USER_EMAIL_SUFFIX);
}

/** Prisma filter excluding anonymized accounts. */
export const notRemovedUser = {
  NOT: { email: { endsWith: REMOVED_USER_EMAIL_SUFFIX } },
};
