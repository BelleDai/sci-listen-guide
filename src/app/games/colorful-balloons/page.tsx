import type { Metadata } from "next";

import ColorfulBalloonsGame from "@/components/games/ColorfulBalloonsGame";
import GamePageShell from "@/components/games/GamePageShell";

export const metadata: Metadata = {
  title: "遊戲時間｜科學好好聽",
  description: "在科學好好聽的小遊戲中挑戰七彩氣球。",
};

export default function ColorfulBalloonsPage() {
  return (
    <GamePageShell title="水滴變身旅行記">
      <ColorfulBalloonsGame />
    </GamePageShell>
  );
}
