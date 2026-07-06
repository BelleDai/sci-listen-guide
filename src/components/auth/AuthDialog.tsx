"use client";

import { useState } from "react";
import { Copy, ExternalLink, LogIn } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import {
  getBrowserAuthEnvironment,
  type BrowserAuthEnvironment,
} from "@/lib/browserAuthEnvironment";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function getAuthErrorCode(error: unknown) {
  return typeof error === "object" && error && "code" in error
    ? String(error.code)
    : "";
}

function shouldUseRedirectFallback(error: unknown) {
  const code = getAuthErrorCode(error);
  return (
    code === "auth/popup-blocked" ||
    code === "auth/cancelled-popup-request" ||
    code.includes("api-key-not-valid")
  );
}

function getSignInErrorMessage(error: unknown) {
  const code = getAuthErrorCode(error);

  if (code === "auth/popup-closed-by-user") {
    return "登入視窗已關閉，請再試一次。";
  }

  if (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request") {
    return "瀏覽器擋下登入視窗，請允許彈出視窗後再試一次。";
  }

  if (code.includes("api-key-not-valid")) {
    return "登入視窗暫時無法使用，請改用頁面登入。";
  }

  return "無法開啟 Google 登入，請稍後再試。";
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const {
    loading,
    signInWithGoogle,
    setMarketingOptIn: saveMarketingOptIn,
  } = useAuth();
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [savingPreference, setSavingPreference] = useState(false);
  const [showNewUserPreference, setShowNewUserPreference] = useState(false);
  const [showExternalBrowserHelp, setShowExternalBrowserHelp] = useState(false);
  const [browserEnvironment, setBrowserEnvironment] =
    useState<BrowserAuthEnvironment | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const resetDialogState = () => {
    setMarketingOptIn(true);
    setShowNewUserPreference(false);
    setShowExternalBrowserHelp(false);
    setErrorMessage("");
  };

  const startRedirectSignIn = (environment: BrowserAuthEnvironment) => {
    window.location.href = environment.externalGoogleSignInUrl;
  };

  const handleGoogleSignIn = async () => {
    const nextBrowserEnvironment = getBrowserAuthEnvironment();
    setBrowserEnvironment(nextBrowserEnvironment);
    setErrorMessage("");

    if (nextBrowserEnvironment.isEmbeddedBrowser) {
      setShowExternalBrowserHelp(true);
      return;
    }

    setSigningIn(true);
    try {
      const result = await signInWithGoogle();

      if (result.isNewUserProfile) {
        setShowNewUserPreference(true);
      } else {
        onOpenChange(false);
        resetDialogState();
      }
    } catch (error) {
      console.warn("Unable to sign in with Google.", error);

      if (shouldUseRedirectFallback(error)) {
        startRedirectSignIn(nextBrowserEnvironment);
        return;
      }

      setErrorMessage(getSignInErrorMessage(error));
    } finally {
      setSigningIn(false);
    }
  };

  const handleOpenExternalBrowser = () => {
    const nextBrowserEnvironment =
      browserEnvironment ?? getBrowserAuthEnvironment();
    setBrowserEnvironment(nextBrowserEnvironment);

    if (nextBrowserEnvironment.chromeIntentUrl) {
      window.location.href = nextBrowserEnvironment.chromeIntentUrl;
      return;
    }

    void handleCopyLink();
  };

  const handleCopyLink = async () => {
    const nextBrowserEnvironment =
      browserEnvironment ?? getBrowserAuthEnvironment();
    setBrowserEnvironment(nextBrowserEnvironment);

    try {
      await navigator.clipboard.writeText(
        nextBrowserEnvironment.externalGoogleSignInUrl,
      );
      toast({
        title: "連結已複製",
        description: "請貼到 Chrome 或 Safari 開啟後登入。",
      });
    } catch (error) {
      console.warn("Unable to copy page URL.", error);
      toast({
        title: "請手動複製連結",
        description: nextBrowserEnvironment.externalGoogleSignInUrl,
      });
    }
  };

  const handleSavePreference = async () => {
    setSavingPreference(true);
    try {
      await saveMarketingOptIn(marketingOptIn);
      onOpenChange(false);
      resetDialogState();
    } catch (error) {
      console.warn("Unable to save marketing preference.", error);
    } finally {
      setSavingPreference(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          resetDialogState();
        }
      }}
    >
      <DialogContent className="max-w-sm rounded-2xl border-cyan-200/30 bg-card text-white shadow-2xl">
        {showNewUserPreference ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-cyan-50">
                要收到活動通知嗎？
              </DialogTitle>
              <DialogDescription className="text-sm font-bold leading-6 text-white/75">
                第一次登入才會詢問，不勾選也可以玩。
              </DialogDescription>
            </DialogHeader>

            <label className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 p-3 text-left text-sm font-bold leading-6 text-white/85">
              <Checkbox
                checked={marketingOptIn}
                onCheckedChange={(checked) =>
                  setMarketingOptIn(checked === true)
                }
                className="mt-1 border-cyan-100/60 data-[state=checked]:bg-cyan-300 data-[state=checked]:text-slate-950"
              />
              <span>收到活動或電子報通知。</span>
            </label>

            <Button
              type="button"
              onClick={() => void handleSavePreference()}
              disabled={savingPreference}
              className="h-12 w-full rounded-full text-base font-black"
            >
              {savingPreference ? "儲存中..." : "完成"}
            </Button>
          </>
        ) : showExternalBrowserHelp ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-cyan-50">
                請用瀏覽器開啟
              </DialogTitle>
              <DialogDescription className="text-sm font-bold leading-6 text-white/75">
                App 內的瀏覽器不能登入 Google。請改用 Chrome 或 Safari。
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {browserEnvironment?.chromeIntentUrl ? (
                <Button
                  type="button"
                  onClick={handleOpenExternalBrowser}
                  className="h-12 w-full rounded-full text-base font-black"
                >
                  <ExternalLink className="h-5 w-5" />
                  用外部瀏覽器開啟
                </Button>
              ) : null}

              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleCopyLink()}
                className="h-12 w-full rounded-full text-base font-black"
              >
                <Copy className="h-5 w-5" />
                複製連結
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-cyan-50">
                登入後開始玩
              </DialogTitle>
              <DialogDescription className="text-sm font-bold leading-6 text-white/75">
                保存徽章和星星，下次接著玩。
              </DialogDescription>
            </DialogHeader>

            <Button
              type="button"
              onClick={() => void handleGoogleSignIn()}
              disabled={loading || signingIn}
              className="h-12 w-full rounded-full text-base font-black"
            >
              <LogIn className="h-5 w-5" />
              {signingIn ? "登入中..." : "使用 Google 登入"}
            </Button>
            {errorMessage ? (
              <p className="rounded-xl border border-red-300/30 bg-red-500/10 p-3 text-sm font-bold leading-6 text-red-100">
                {errorMessage}
              </p>
            ) : null}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
