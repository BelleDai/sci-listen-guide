import { Headphones } from "lucide-react";
import PodcastBrowser from "@/components/home/PodcastBrowser";
import PodcastPlatformBar from "@/components/home/PodcastPlatformBar";
import type { PodcastPlatform } from "@/lib/home-content";
import type { PodcastListItem } from "@/types/podcast-list";

interface Props {
  latestEpisodes: PodcastListItem[];
  guideByGuid: Record<string, string>;
  platforms: PodcastPlatform[];
}

export default function PodcastSection({ latestEpisodes, guideByGuid, platforms }: Props) {
  return (
    <section
      id="podcast"
      aria-labelledby="podcast-heading"
      className="scroll-mt-28 md:scroll-mt-20 bg-black/10 px-4 py-10 shadow-[inset_0_4px_24px_rgba(0,0,0,0.4)] sm:py-14"
    >
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6 max-w-2xl sm:mb-7">
          <p className="mb-2 text-xs font-bold tracking-[0.18em] text-accent/80">PODCAST</p>
          <h2 id="podcast-heading" className="flex items-center gap-2 text-2xl font-extrabold text-white sm:text-3xl">
            <Headphones className="h-6 w-6 text-secondary" aria-hidden="true" />
            耳朵打開，科學來了！
          </h2>
          <p className="mt-3 text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
            從最新故事開始，也能搜尋孩子感興趣的科學主題。
          </p>
        </div>

        <PodcastBrowser latestEpisodes={latestEpisodes} guideByGuid={guideByGuid} />

        <div className="mt-8">
          <PodcastPlatformBar platforms={platforms} />
        </div>
      </div>
    </section>
  );
}
