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
import HeroSection from "@/components/home/HeroSection";
import PodcastSection from "@/components/home/PodcastSection";
import UniverseSection from "@/components/home/UniverseSection";
import { getUniverseGroups, universeLink } from "@/lib/universe";
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
  { label: "宇宙群島", href: "#universe" },
  { label: "實驗室", href: "#explore" },
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
      gameId: getEpisodeGameId(episode.id),
    }))
  );
  return GAME_ORDER.map((gameId) => ({
    gameId,
    stages: stages
      .filter((stage) => stage.gameId === gameId)
      .map(({ id, name, emoji }) => ({ id, name, emoji })),
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
  const heroCards = resolveHeroCards(heroContent, latestPodcastEpisodes);
  const featuredLabs = getFeaturedLabs();
  const solarStar = getSolarStarContent();
  const siteLinks = getSiteLinks();
  const universeGroups = await getUniverseGroups();
  const universeLinks = {
    home: universeLink(),
    isles: Object.fromEntries(universeGroups.flatMap((g) => g.islands.map((isle) => [isle.id, universeLink(isle.id)]))),
  };

  return (
    <>
      <Header episodes={searchIndex} navItems={homeNavItems} />
      <main className="text-foreground min-h-screen">
        {/* 01｜Hero */}
        <HeroSection content={heroContent} cards={heroCards} />

        {/* 02｜Podcast */}
        <PodcastSection
          latestEpisodes={latestPodcastEpisodes}
          guideByGuid={guideByGuid}
          platforms={siteLinks.podcastPlatforms}
        />

        {/* 03｜宇宙群島：用地圖看見所有主題 */}
        <UniverseSection groups={universeGroups} links={universeLinks} />

        {/* 04｜互動實驗室 */}
        <InteractiveLabsSection labs={featuredLabs.items} moreLink={featuredLabs.moreLink} />

        {/* 05｜Solar Star */}
        <SolarStarSection {...solarStar} />

        {/* 06｜更多親子學習資源 */}
        <LearningResourcesSection guides={resourceGuides} gameGroups={getGameGroups()} />

        {/* 07｜品牌形象 */}
        <BrandSection content={getBrandContent()} />
      </main>
      <SiteFooter links={siteLinks} />
    </>
  );
}
