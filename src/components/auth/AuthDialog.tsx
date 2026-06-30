"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

  const resetDialogState = () => {
    setMarketingOptIn(false);
    setShowNewUserPreference(false);
  };

  const handleGoogleSignIn = async () => {
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
    } finally {
      setSigningIn(false);
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
                這個選項只會在第一次登入時詢問。不勾選也可以玩遊戲。
              </DialogDescription>
            </DialogHeader>

            <label className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 p-3 text-left text-sm font-bold leading-6 text-white/85">
              <Checkbox
                checked={marketingOptIn}
                onCheckedChange={(checked) => setMarketingOptIn(checked === true)}
                className="mt-1 border-cyan-100/60 data-[state=checked]:bg-cyan-300 data-[state=checked]:text-slate-950"
              />
              <span>我願意收到未來活動或電子報通知。</span>
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
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-cyan-50">
                登入後開始玩
              </DialogTitle>
              <DialogDescription className="text-sm font-bold leading-6 text-white/75">
                登入後，我們會幫你保存徽章和星星。下次回來時，可以接著玩。
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
