"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LogIn, OctagonX } from "lucide-react";

import { AuthDialog } from "@/components/auth/AuthDialog";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface GamePageShellProps {
  title: string;
  children: ReactNode;
}

export default function GamePageShell({ title, children }: GamePageShellProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [running, setRunning] = useState(true);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const stopAndGoBack = () => {
    setRunning(false);
    setConfirmOpen(false);

    window.setTimeout(() => {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/");
      }
    }, 0);
  };

  return (
    <div className="min-h-svh bg-background [--game-header-height:65px]">
      {/* 浮動的返回按鈕 (僅在手機版全螢幕時顯示) */}
      <div className="fixed top-3 left-3 z-[60] sm:hidden">
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="h-10 w-10 rounded-full shadow-lg opacity-70 hover:opacity-100 active:scale-95 transition-all"
          onClick={() => setConfirmOpen(true)}
        >
          <OctagonX className="h-5 w-5" />
        </Button>
      </div>

      <header className="hidden sm:block fixed inset-x-0 top-0 z-50 h-[var(--game-header-height)] w-full border-b border-border/60 bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-4xl items-center justify-between gap-3 px-4">
          <button
            type="button"
            onClick={() => router.push("/games")}
            aria-label="回遊戲基地"
            className="flex min-w-0 flex-shrink-0 items-center gap-2 transition-transform hover:scale-[1.02]"
          >
            <img
              src="/icon.png"
              alt="科學好好聽"
              className="h-9 w-9 rounded-full object-cover"
            />
            <span className="flex min-w-0 items-baseline gap-1.5">
              <span className="truncate text-base font-extrabold leading-none text-white">
                科學好好聽
              </span>
              <span className="hidden text-base font-extrabold leading-none text-accent sm:inline">
                遊戲基地
              </span>
            </span>
          </button>

          <Button
            type="button"
            variant="destructive"
            className="h-10 shrink-0 rounded-full px-3 font-extrabold shadow-[var(--shadow-card)] sm:px-4"
            onClick={() => setConfirmOpen(true)}
          >
            <OctagonX className="h-5 w-5" />
            <span className="hidden sm:inline">結束遊戲</span>
            <span className="sm:hidden">結束</span>
          </Button>
        </div>
      </header>

      <main className="flex min-h-svh pt-0 sm:pt-[var(--game-header-height)] text-foreground">
        <section className="mx-auto flex h-[100svh] sm:h-[calc(100svh-var(--game-header-height))] w-full max-w-2xl sm:px-4">
          {authLoading ? (
            <div className="flex min-h-full w-full items-center justify-center p-6 text-center">
              <div className="rounded-2xl border border-white/15 bg-card/85 px-6 py-5 text-sm font-bold text-white shadow-2xl">
                檢查登入狀態中...
              </div>
            </div>
          ) : user ? (
            running ? children : null
          ) : (
            <div className="flex min-h-full w-full items-center justify-center p-6 text-center">
              <div className="w-full max-w-sm rounded-[28px] border border-cyan-200/30 bg-card/90 p-7 text-white shadow-2xl">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-cyan-200/15 text-cyan-50">
                  <LogIn className="h-8 w-8" />
                </div>
                <h1 className="mb-3 text-2xl font-black text-cyan-50">
                  先登入，才能開始玩遊戲
                </h1>
                <p className="mb-6 text-sm font-bold leading-6 text-white/80">
                  登入後，我們會幫你保存徽章和星星。下次回來，也能繼續看見自己的紀錄。
                </p>
                <Button
                  type="button"
                  onClick={() => setAuthDialogOpen(true)}
                  className="h-12 w-full rounded-full text-base font-black"
                >
                  <LogIn className="h-5 w-5" />
                  登入
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push("/games")}
                  className="mt-3 h-10 w-full rounded-full text-white/75 hover:bg-white/10 hover:text-white"
                >
                  回遊戲列表
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-2xl border-accent/30 bg-card text-white shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black">
              要結束遊戲嗎？
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
              繼續玩
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={stopAndGoBack}
            >
              確定
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </div>
  );
}
