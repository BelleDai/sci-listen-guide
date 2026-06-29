"use client";

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { auth } from "@/lib/firebase/client";
import {
  GAME_COMPLETIONS_UPDATED_EVENT,
  getCompletedRecords,
  syncUserGameProgress,
  type GameCompletionsUpdatedEvent,
  type GameCompletionRecords,
} from "@/components/games/core/gameProgress";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  progressLoading: boolean;
  completions: GameCompletionRecords;
  signInWithGoogle: (marketingOptIn?: boolean) => Promise<void>;
  signOutUser: () => Promise<void>;
  refreshProgress: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(false);
  const [completions, setCompletions] = useState<GameCompletionRecords>({});

  const refreshProgressForUser = useCallback(async (nextUser: User | null, marketingOptIn?: boolean) => {
    if (!nextUser) {
      setCompletions(getCompletedRecords());
      return;
    }

    setProgressLoading(true);
    try {
      const synced = await syncUserGameProgress(nextUser, marketingOptIn);
      setCompletions(synced);
    } catch (error) {
      console.warn("Unable to sync game progress.", error);
      setCompletions(getCompletedRecords());
    } finally {
      setProgressLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
      void refreshProgressForUser(nextUser);
    });

    return unsubscribe;
  }, [refreshProgressForUser]);

  useEffect(() => {
    const syncLocalCompletions = (event: Event) => {
      const updatedEvent = event as GameCompletionsUpdatedEvent;
      setCompletions(updatedEvent.detail ?? getCompletedRecords());
    };

    window.addEventListener(GAME_COMPLETIONS_UPDATED_EVENT, syncLocalCompletions);

    return () => {
      window.removeEventListener(GAME_COMPLETIONS_UPDATED_EVENT, syncLocalCompletions);
    };
  }, []);

  const signInWithGoogle = useCallback(async (marketingOptIn = false) => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const credential = await signInWithPopup(auth, provider);
    setUser(credential.user);
    await refreshProgressForUser(credential.user, marketingOptIn);
  }, [refreshProgressForUser]);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setCompletions(getCompletedRecords());
  }, []);

  const refreshProgress = useCallback(async () => {
    await refreshProgressForUser(auth.currentUser);
  }, [refreshProgressForUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      progressLoading,
      completions,
      signInWithGoogle,
      signOutUser,
      refreshProgress,
    }),
    [
      user,
      loading,
      progressLoading,
      completions,
      signInWithGoogle,
      signOutUser,
      refreshProgress,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return value;
}
