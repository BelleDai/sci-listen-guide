"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithRedirect,
} from "firebase/auth";
import { LoaderCircle, LogIn } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase/client";

function getSafeContinuePath(value: string | null) {
  if (!value || !value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  return value;
}

function GoogleAuthStarter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const continuePath = useMemo(
    () => getSafeContinuePath(searchParams.get("continue")),
    [searchParams],
  );

  const finishSignIn = useCallback(() => {
    router.replace(continuePath);
  }, [continuePath, router]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    let fallbackTimer: number | undefined;

    async function checkRedirectResult() {
      setCheckingAuth(true);

      try {
        await getRedirectResult(auth);
      } catch (error) {
        console.warn("Unable to complete Google redirect sign in.", error);
        if (!cancelled) {
          setErrorMessage("登入結果讀取失敗，請再按一次下方按鈕。");
        }
      }

      if (cancelled) return;

      if (auth.currentUser) {
        finishSignIn();
        return;
      }

      unsubscribe = onAuthStateChanged(auth, (user) => {
        if (cancelled) return;

        if (user) {
          unsubscribe?.();
          finishSignIn();
          return;
        }

        setCheckingAuth(false);
      });

      fallbackTimer = window.setTimeout(() => {
        if (!cancelled && !auth.currentUser) {
          setCheckingAuth(false);
        }
      }, 2500);
    }

    void checkRedirectResult();

    return () => {
      cancelled = true;
      unsubscribe?.();
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
    };
  }, [finishSignIn]);

  const handleGoogleSignIn = async () => {
    setErrorMessage("");
    setSigningIn(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.warn("Unable to start Google redirect sign in.", error);
      setSigningIn(false);
      setErrorMessage("無法開啟 Google 登入，請確認目前是在 Chrome 或 Safari。");
    }
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 text-white">
      <section className="w-full max-w-sm rounded-2xl border border-cyan-200/30 bg-card p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100/15 text-cyan-50">
          {checkingAuth ? (
            <LoaderCircle className="h-6 w-6 animate-spin" />
          ) : (
            <LogIn className="h-6 w-6" />
          )}
        </div>
        <h1 className="text-xl font-black text-cyan-50">繼續 Google 登入</h1>
        <p className="mt-3 text-sm font-bold leading-6 text-white/75">
          請在外部瀏覽器完成登入，完成後會回到剛剛的頁面。
        </p>
        <Button
          type="button"
          onClick={() => void handleGoogleSignIn()}
          disabled={checkingAuth || signingIn}
          className="mt-5 h-12 w-full rounded-full text-base font-black"
        >
          {signingIn ? (
            <LoaderCircle className="h-5 w-5 animate-spin" />
          ) : (
            <LogIn className="h-5 w-5" />
          )}
          {signingIn ? "正在開啟..." : "繼續 Google 登入"}
        </Button>
        {errorMessage ? (
          <p className="mt-4 rounded-xl border border-red-300/30 bg-red-500/10 p-3 text-sm font-bold leading-6 text-red-100">
            {errorMessage}
          </p>
        ) : null}
      </section>
    </main>
  );
}

function GoogleAuthFallback() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 text-white">
      <section className="w-full max-w-sm rounded-2xl border border-cyan-200/30 bg-card p-6 text-center shadow-2xl">
        <LoaderCircle className="mx-auto mb-4 h-8 w-8 animate-spin text-cyan-100" />
        <h1 className="text-xl font-black text-cyan-50">準備 Google 登入</h1>
      </section>
    </main>
  );
}

export default function GoogleAuthPage() {
  return (
    <Suspense fallback={<GoogleAuthFallback />}>
      <GoogleAuthStarter />
    </Suspense>
  );
}
