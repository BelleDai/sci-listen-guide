import type { Metadata } from "next";

import GamePageShell from "@/components/games/GamePageShell";
import TreasureHunterGame from "@/components/games/TreasureHunterGame";

export const metadata: Metadata = {
  title: "尋寶獵人｜科學好好聽",
  description: "在科學好好聽的小遊戲中挑戰尋寶獵人關卡。",
};

export default function TreasureHunterPage() {
  return (
    <GamePageShell title="水滴變身旅行記">
      <TreasureHunterGame />
    </GamePageShell>
  );
}
