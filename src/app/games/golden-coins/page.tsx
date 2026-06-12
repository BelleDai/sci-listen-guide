import type { Metadata } from "next";

import GamePageShell from "@/components/games/GamePageShell";
import GoldenCoinsGame from "@/components/games/GoldenCoinsGame";

export const metadata: Metadata = {
  title: "知識接接樂｜科學好好聽",
  description: "在科學好好聽的小遊戲中挑戰知識接接樂關卡。",
};

export default function GoldenCoinsPage() {
  return (
    <GamePageShell title="水滴變身旅行記">
      <GoldenCoinsGame />
    </GamePageShell>
  );
}
