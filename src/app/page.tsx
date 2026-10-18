import Header, { type HeaderNavItem } from "@/components/episode/Header";
import { getEpisodeGameId, type EpisodeQuizGameId, type StageCategory } from "@/components/games/core/episodeQuizzes";
import { getAllPublishedEpisodes } from "@/lib/episodes";
import {
  getBrandContent,
  getFeaturedLabs,
  getHeroContent,
  getSiteLinks,
  getSolarStarContent,
  resolveHeroCards,
} from "@/lib/home-content";
import { sortPodcastEpisodesByDate } from "@/lib/podcast";
import type { PodcastListItem } from "@/types/podcast-list";
import FloatingDecor from "@/components/home/FloatingDecor";
import HeroSection from "@/components/home/HeroSection";
import PodcastSection from "@/components/home/PodcastSection";
import InteractiveLabsSection from "@/components/home/InteractiveLabsSection";
import SolarStarSection from "@/components/home/SolarStarSection";
import LearningResourcesSection, {
  type ResourceGameGroup,
  type ResourceGuide,
} from "@/components/home/LearningResourcesSection";
import BrandSection from "@/components/home/BrandSection";
import SiteFooter from "@/components/home/SiteFooter";
import podcastList from "../../public/podcast-list.json";
import stageCategories from "../../public/stage_1_categories.json";

const LATEST_PODCAST_COUNT = 5;

const GAME_ORDER: EpisodeQuizGameId[] = ["colorful-balloons", "golden-coins", "treasure-hunter"];

const homeNavItems: HeaderNavItem[] = [
  { label: "Podcast", href: "#podcast" },
  { label: "探索館", href: "#explore" },
  { label: "Solar Star", href: "#solar" },
  { label: "學習資源", href: "#resources" },
  { label: "關於", href: "#about" },
];

/** 依遊戲類型分組關卡，供「三種遊戲各一關」每日挑選 */
function getGameGroups(): ResourceGameGroup[] {
  const stages = (stageCategories as StageCategory[]).flatMap((category) =>
    category.episode.map((episode) => ({
      id: episode.id,
      name: episode.name,
      emoji: episode.emoji,
      category: category.category_name,
      gameId: getEpisodeGameId(episode.id),
    }))
  );
  return GAME_ORDER.map((gameId) => ({
    gameId,
    stages: stages
      .filter((stage) => stage.gameId === gameId)
      .map(({ id, name, emoji, category }) => ({ id, name, emoji, category })),
  })).filter((group) => group.stages.length > 0);
}

export default async function Home() {
  const episodes = await getAllPublishedEpisodes();
  const searchIndex = episodes.map((ep) => ({
    id: ep.id,
    title: ep.Title,
    tags: ep.Tags || [],
    firstoryGuid: typeof ep.firstoryGuid === "string" ? ep.firstoryGuid : undefined,
  }));
  // 只傳每日挑選需要的欄位到 client；依 id 排序讓每日隨機結果穩定
  const resourceGuides: ResourceGuide[] = episodes
    .filter((ep) => ep.Title && ep.Cover)
    .map((ep) => ({ id: ep.id, title: ep.Title, cover: ep.Cover }))
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  const latestPodcastEpisodes = sortPodcastEpisodesByDate(podcastList.episodes as PodcastListItem[]).slice(
    0,
    LATEST_PODCAST_COUNT
  );
  const guideByGuid = Object.fromEntries(
    searchIndex.flatMap((ep) => (ep.firstoryGuid ? [[ep.firstoryGuid, ep.id]] : []))
  );

  const heroContent = getHeroContent();
  const heroCards = resolveHeroCards(heroContent, latestPodcastEpisodes[0]);
  const featuredLabs = getFeaturedLabs();
  const solarStar = getSolarStarContent();
  const siteLinks = getSiteLinks();

  return (
    <>
      <Header episodes={searchIndex} navItems={homeNavItems} />
      <FloatingDecor count={20} />
      <main className="text-foreground min-h-screen">
        {/* 01｜Hero */}
        <HeroSection content={heroContent} cards={heroCards} />

        {/* 02｜Podcast */}
        <PodcastSection
          latestEpisodes={latestPodcastEpisodes}
          guideByGuid={guideByGuid}
          platforms={siteLinks.podcastPlatforms}
        />

        {/* 03｜互動科學探索館 */}
        <InteractiveLabsSection labs={featuredLabs.items} moreLink={featuredLabs.moreLink} />

        {/* 04｜Solar Star */}
        <SolarStarSection {...solarStar} />

        {/* 05｜更多親子學習資源 */}
        <LearningResourcesSection guides={resourceGuides} gameGroups={getGameGroups()} />

        {/* 06｜品牌形象 */}
        <BrandSection content={getBrandContent()} />
      </main>
      <SiteFooter links={siteLinks} />
    </>
  );
}
