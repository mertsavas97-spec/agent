/**
 * Auth MVP: anonymous sign-in (fast onboarding) + optional email/password later.
 * Firebase Web SDK — verify API via official docs / Context7 when available.
 */
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';

import { getFirebase } from './firebase';

export type AuthMode = 'anonymous' | 'email';

export async function ensureSignedIn(): Promise<User> {
  const { auth } = getFirebase();
  if (auth.currentUser) return auth.currentUser;
  const cred = await signInAnonymously(auth);
  return cred.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const { auth } = getFirebase();
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function registerWithEmail(email: string, password: string): Promise<User> {
  const { auth } = getFirebase();
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function signOutUser(): Promise<void> {
  const { auth } = getFirebase();
  await signOut(auth);
}

export function subscribeAuth(listener: (user: User | null) => void): () => void {
  const { auth } = getFirebase();
  return onAuthStateChanged(auth, listener);
}

export function getCurrentUid(): string | null {
  return getFirebase().auth.currentUser?.uid ?? null;
}
