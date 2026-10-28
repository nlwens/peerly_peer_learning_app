import { useSyncExternalStore } from 'react';
import { load, save } from '@/shared/utils/storage';
import type { User } from '../data/types';

const STORAGE_KEY = 'users';

let users: User[] = [];

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return users;
}

export function useUsers() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export async function initUsers() {
  const stored = await load<User[]>(STORAGE_KEY);

  if (stored) {
    users = stored;
  }

  emit();
}

export async function addUser(user: User) {
  users = [...users, user];
  await save(STORAGE_KEY, users);
  emit();
}

export async function updateUser(id: string, updates: Partial<User>) {
  users = users.map((u) => (u.id === id ? { ...u, ...updates } : u));

  await save(STORAGE_KEY, users);
  emit();
}

export async function deleteUser(id: string) {
  users = users.filter((u) => u.id !== id);

  await save(STORAGE_KEY, users);
  emit();
}

export async function clearUsers() {
  users = [];
  await save(STORAGE_KEY, users);
  emit();
}

export function findUser(id: string) {
  return users.find((u) => u.id === id);
}
