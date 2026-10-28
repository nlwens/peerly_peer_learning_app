import type { User } from '../data/types';

let prefill: User | null = null;

/** Call before `router.push('/profile/edit')` so the edit screen can skip refetching. */
export function setEditProfilePrefill(user: User) {
  prefill = user;
}

/** One-shot read for the edit screen; clears the buffer. */
export function consumeEditProfilePrefill(): User | null {
  const u = prefill;
  prefill = null;
  return u;
}
