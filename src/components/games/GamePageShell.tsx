"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { StopCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [running, setRunning] = useState(true);

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
      <header className="fixed inset-x-0 top-0 z-50 h-[var(--game-header-height)] w-full border-b border-border/60 bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-4xl items-center justify-between gap-3 px-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            aria-label="回到首頁"
            className="flex min-w-0 flex-shrink-0 items-center gap-2 transition-transform hover:scale-[1.02]"
          >
            <img
              src="https://files.soundon.fm/1758618850575-3b62b9ae-8417-4916-a6dc-b25e0b872fba.jpeg"
              alt="科學好好聽"
              className="h-9 w-9 rounded-md object-cover"
            />
            <span className="flex min-w-0 items-baseline gap-1.5">
              <span className="truncate text-base font-extrabold leading-none text-white">
                科學好好聽
              </span>
              <span className="hidden text-base font-extrabold leading-none text-accent sm:inline">
                {title}
              </span>
            </span>
          </button>

          <Button
            type="button"
            variant="destructive"
            className="h-10 shrink-0 rounded-full px-3 font-extrabold shadow-[var(--shadow-card)] sm:px-4"
            onClick={() => setConfirmOpen(true)}
          >
            <StopCircle className="h-5 w-5" />
            <span className="hidden sm:inline">結束遊戲</span>
            <span className="sm:hidden">結束</span>
          </Button>
        </div>
      </header>

      <main className="flex min-h-svh pt-[var(--game-header-height)] text-foreground">
        <section className="mx-auto flex h-[calc(100svh-var(--game-header-height))] w-full max-w-2xl px-2 sm:px-4">
          {running ? children : null}
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
    </div>
  );
}
