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
      className="section-band section-band-purple scroll-mt-28 md:scroll-mt-20 px-4 py-10 sm:py-14"
    >
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6 max-w-2xl sm:mb-7">
          <p className="mb-2 text-xs font-bold tracking-[0.18em] text-accent/80">PODCAST</p>
          <h2 id="podcast-heading" className="flex items-center gap-2 text-2xl font-extrabold text-white sm:text-3xl">
            <Headphones className="h-6 w-6 text-secondary" aria-hidden="true" />
            全系列 200+ 集故事聽翻天
          </h2>
        </div>

        <PodcastBrowser latestEpisodes={latestEpisodes} guideByGuid={guideByGuid} />

        <div className="mt-8">
          <PodcastPlatformBar platforms={platforms} />
        </div>
      </div>
    </section>
  );
}
