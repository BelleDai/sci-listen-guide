"use client";

import {
  getAdditionalUserInfo,
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
import { getBrowserAuthEnvironment } from "@/lib/browserAuthEnvironment";
import {
  clearCompletedRecords,
  GAME_COMPLETIONS_UPDATED_EVENT,
  getCompletedRecords,
  syncUserGameProgress,
  updateUserMarketingOptIn,
  type GameCompletionsUpdatedEvent,
  type GameCompletionRecords,
} from "@/components/games/core/gameProgress";

type SignInResult = {
  isNewUserProfile: boolean;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  progressLoading: boolean;
  completions: GameCompletionRecords;
  signInWithGoogle: () => Promise<SignInResult>;
  signOutUser: () => Promise<void>;
  setMarketingOptIn: (marketingOptIn: boolean) => Promise<void>;
  refreshProgress: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(false);
  const [completions, setCompletions] = useState<GameCompletionRecords>({});

  const refreshProgressForUser = useCallback(async (nextUser: User | null): Promise<SignInResult> => {
    if (!nextUser) {
      clearCompletedRecords();
      setCompletions({});
      return { isNewUserProfile: false };
    }

    setProgressLoading(true);
    try {
      const synced = await syncUserGameProgress(nextUser);
      setCompletions(synced.completions);
      return { isNewUserProfile: synced.isNewUserProfile };
    } catch (error) {
      console.warn("Unable to sync game progress.", error);
      setCompletions(getCompletedRecords());
      return { isNewUserProfile: false };
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

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    const browserEnvironment = getBrowserAuthEnvironment();
    if (browserEnvironment.isEmbeddedBrowser) {
      throw new Error("Google sign-in is blocked in embedded browsers.");
    }

    const credential = await signInWithPopup(auth, provider);
    const additionalUserInfo = getAdditionalUserInfo(credential);
    setUser(credential.user);
    const syncResult = await refreshProgressForUser(credential.user);
    return {
      isNewUserProfile: syncResult.isNewUserProfile || additionalUserInfo?.isNewUser === true,
    };
  }, [refreshProgressForUser]);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    clearCompletedRecords();
    setCompletions({});
  }, []);

  const refreshProgress = useCallback(async () => {
    await refreshProgressForUser(auth.currentUser);
  }, [refreshProgressForUser]);

  const setMarketingOptIn = useCallback(async (marketingOptIn: boolean) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    await updateUserMarketingOptIn(currentUser, marketingOptIn);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      progressLoading,
      completions,
      signInWithGoogle,
      signOutUser,
      setMarketingOptIn,
      refreshProgress,
    }),
    [
      user,
      loading,
      progressLoading,
      completions,
      signInWithGoogle,
      signOutUser,
      setMarketingOptIn,
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
