import type { User } from 'firebase/auth';
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { auth, db } from '@/lib/firebase/client';

export const GAME_COMPLETIONS_STORAGE_KEY = 'sci-listen-guide:completed-episode-games';
export const GAME_COMPLETIONS_UPDATED_EVENT = 'sci-listen-guide:game-completions-updated';

export type GameCompletionRecords = Record<string, number>;

export type GameCompletionsUpdatedEvent = CustomEvent<GameCompletionRecords>;

export type UserGameProgressSyncResult = {
  completions: GameCompletionRecords;
  isNewUserProfile: boolean;
};

function normalizeStars(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const normalized = Math.floor(value);
  if (normalized < 1 || normalized > 3) return null;
  return normalized;
}

function normalizeCompletedRecords(value: unknown): GameCompletionRecords {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const records: GameCompletionRecords = {};
  for (const [episodeId, stars] of Object.entries(value)) {
    const normalizedStars = normalizeStars(stars);
    if (typeof episodeId === 'string' && normalizedStars !== null) {
      records[episodeId] = normalizedStars;
    }
  }
  return records;
}

function readCompletedRecords(): GameCompletionRecords {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(GAME_COMPLETIONS_STORAGE_KEY);
    if (!rawValue) return {};
    
    const parsedValue = JSON.parse(rawValue);
    
    // Migration: If it's an array of strings, convert to object with 3 stars default
    if (Array.isArray(parsedValue)) {
      const migrated: GameCompletionRecords = {};
      for (const id of parsedValue) {
        if (typeof id === 'string') {
          migrated[id] = 3;
        }
      }
      // Save the migrated format back to storage
      window.localStorage.setItem(GAME_COMPLETIONS_STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    
    if (typeof parsedValue === 'object' && parsedValue !== null) {
      return normalizeCompletedRecords(parsedValue);
    }
    return {};
  } catch {
    return {};
  }
}

function writeCompletedRecords(records: GameCompletionRecords) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    GAME_COMPLETIONS_STORAGE_KEY,
    JSON.stringify(records)
  );
  window.dispatchEvent(
    new CustomEvent<GameCompletionRecords>(GAME_COMPLETIONS_UPDATED_EVENT, {
      detail: records,
    })
  );
}

function getUserDocRef(uid: string) {
  return doc(db, 'users', uid);
}

export function getCompletedRecords(): GameCompletionRecords {
  return readCompletedRecords();
}

export function clearCompletedRecords() {
  writeCompletedRecords({});
}

export function getCompletedEpisodeGameIds(): string[] {
  return Object.keys(readCompletedRecords());
}

export function getEpisodeGameStars(episodeId: string): number | null {
  const records = readCompletedRecords();
  return records[episodeId] ?? null;
}

export function isEpisodeGameCompleted(episodeId: string): boolean {
  return episodeId in readCompletedRecords();
}

export async function syncUserGameProgress(
  user: User
): Promise<UserGameProgressSyncResult> {
  const userRef = getUserDocRef(user.uid);
  const snapshot = await getDoc(userRef);
  const now = serverTimestamp();

  if (!snapshot.exists()) {
    const emptyRecords: GameCompletionRecords = {};

    await setDoc(userRef, {
      uid: user.uid,
      email: user.email ?? '',
      displayName: user.displayName ?? '',
      marketingOptIn: false,
      completions: emptyRecords,
      completedCount: 0,
      createdAt: now,
      lastLoginAt: now,
      updatedAt: now,
    });
    writeCompletedRecords(emptyRecords);
    return {
      completions: emptyRecords,
      isNewUserProfile: true,
    };
  }

  const data = snapshot.data();
  const cloudRecords = normalizeCompletedRecords(data.completions);

  await setDoc(
    userRef,
    {
      uid: user.uid,
      email: user.email ?? data.email ?? '',
      displayName: user.displayName ?? data.displayName ?? '',
      marketingOptIn: data.marketingOptIn === true,
      completions: cloudRecords,
      completedCount: Object.keys(cloudRecords).length,
      lastLoginAt: now,
      updatedAt: now,
    },
    { merge: true }
  );

  writeCompletedRecords(cloudRecords);
  return {
    completions: cloudRecords,
    isNewUserProfile: false,
  };
}

export async function updateUserMarketingOptIn(user: User, marketingOptIn: boolean) {
  const userRef = getUserDocRef(user.uid);

  await setDoc(
    userRef,
    {
      marketingOptIn,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

async function syncCompletedGameToCloud(episodeId: string, stars: number) {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = getUserDocRef(user.uid);
  const normalizedStars = normalizeStars(stars);
  if (normalizedStars === null) return;

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(userRef);
    const data = snapshot.exists() ? snapshot.data() : {};
    const existingRecords = normalizeCompletedRecords(data.completions);

    if (existingRecords[episodeId] && existingRecords[episodeId] >= normalizedStars) {
      transaction.set(
        userRef,
        {
          uid: user.uid,
          email: user.email ?? data.email ?? '',
          displayName: user.displayName ?? data.displayName ?? '',
          marketingOptIn: data.marketingOptIn === true,
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      return;
    }

    const nextRecords = {
      ...existingRecords,
      [episodeId]: normalizedStars,
    };

    transaction.set(
      userRef,
      {
        uid: user.uid,
        email: user.email ?? data.email ?? '',
        displayName: user.displayName ?? data.displayName ?? '',
        marketingOptIn: data.marketingOptIn === true,
        completions: nextRecords,
        completedCount: Object.keys(nextRecords).length,
        createdAt: data.createdAt ?? serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
}

export function markEpisodeGameCompleted(episodeId: string, stars: number = 3) {
  if (typeof window === 'undefined') {
    return;
  }

  const normalizedStars = normalizeStars(stars);
  if (normalizedStars === null) {
    return;
  }

  const records = readCompletedRecords();
  // Only update if the new stars are higher than the old stars (or if it doesn't exist)
  if (!(episodeId in records) || normalizedStars > records[episodeId]) {
    records[episodeId] = normalizedStars;
    writeCompletedRecords(records);
  }

  void syncCompletedGameToCloud(episodeId, normalizedStars).catch((error) => {
    console.warn('Unable to sync completed game to Firestore.', error);
  });
}
