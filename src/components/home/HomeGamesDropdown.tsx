"use client";

import Link from "next/link";
import { ChevronDown, Gamepad2, Shovel, ShoppingCart, Balloon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const games = [
  {
    href: "/games/colorful-balloons",
    label: "七彩氣球",
    description: "點破正確答案",
    icon: Balloon,
  },
  {
    href: "/games/golden-coins",
    label: "知識接接樂",
    description: "接住正確知識",
    icon: ShoppingCart,
  },
  {
    href: "/games/treasure-hunter",
    label: "寶藏獵人",
    description: "依序找出目標",
    icon: Shovel,
  },
];

export default function HomeGamesDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          className="h-12 rounded-full bg-card/90 px-5 font-extrabold text-white border border-accent/30 shadow-[var(--shadow-card)] hover:bg-accent/30 hover:text-white"
        >
          <Gamepad2 className="h-5 w-5 text-secondary" />
          試玩小遊戲
          <ChevronDown className="h-4 w-4 text-white/80" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        className="w-64 rounded-2xl border-accent/30 bg-card/95 p-2 text-white shadow-2xl backdrop-blur-md"
      >
        <DropdownMenuLabel className="px-3 py-2 text-xs font-black text-accent">
          遊戲測試入口
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        {games.map((game) => {
          const Icon = game.icon;

          return (
            <DropdownMenuItem key={game.href} asChild>
              <Link
                href={game.href}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-white focus:bg-accent/25 focus:text-white"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-sm">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-extrabold leading-tight">{game.label}</span>
                  <span className="block text-xs leading-snug text-white/70">{game.description}</span>
                </span>
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
