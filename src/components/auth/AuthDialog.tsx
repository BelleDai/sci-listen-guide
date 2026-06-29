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
  const { loading, signInWithGoogle } = useAuth();
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle(marketingOptIn);
      onOpenChange(false);
    } catch (error) {
      console.warn("Unable to sign in with Google.", error);
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl border-cyan-200/30 bg-card text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-cyan-50">
            登入後開始玩
          </DialogTitle>
          <DialogDescription className="text-sm font-bold leading-6 text-white/75">
            登入後，我們會幫你保存徽章和星星。下次回來時，可以接著玩。
          </DialogDescription>
        </DialogHeader>

        <label className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 p-3 text-left text-sm font-bold leading-6 text-white/85">
          <Checkbox
            checked={marketingOptIn}
            onCheckedChange={(checked) => setMarketingOptIn(checked === true)}
            className="mt-1 border-cyan-100/60 data-[state=checked]:bg-cyan-300 data-[state=checked]:text-slate-950"
          />
          <span>
            我願意收到未來活動或電子報通知。這不是玩遊戲的必要條件，可以不勾選。
          </span>
        </label>

        <Button
          type="button"
          onClick={() => void handleGoogleSignIn()}
          disabled={loading || signingIn}
          className="h-12 w-full rounded-full text-base font-black"
        >
          <LogIn className="h-5 w-5" />
          {signingIn ? "登入中..." : "使用 Google 登入"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
