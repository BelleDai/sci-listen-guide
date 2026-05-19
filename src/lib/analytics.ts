/* ----------------------------------------------------------------
 * analytics.ts  –  GA4 event tracking helper
 * All trackEvent() calls are no-ops if gtag is not loaded yet
 * (e.g. during SSR or if the user has an ad-blocker).
 * ---------------------------------------------------------------- */

type GTagEvent = {
  [key: string]: string | number | boolean | undefined;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export const trackEvent = (
  eventName: string,
  params?: GTagEvent
): void => {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", eventName, params);
};

// ── Convenience wrappers ───────────────────────────────────────────

/** Called when user lands on the Episode page */
export const trackEpisodeLanded = (episodeId: string, episodeTitle: string, source?: string) =>
  trackEvent("episode_landed", {
    episode_id: episodeId,
    episode_title: episodeTitle,
    entry_source: source || "search", // e.g. "podcast" | "fb" | "search" (default)
  });

/** Called whenever the user clicks "下一步" and reaches a new Section */
export const trackEpisodeStep = (step: number, episodeId: string, episodeTitle: string) =>
  trackEvent("episode_step_reached", {
    step_number: step,
    episode_id: episodeId,
    episode_title: episodeTitle,
  });

/** Called when user clicks the final CTA "任務達成" button */
export const trackEpisodeCompleted = (episodeId: string, episodeTitle: string) =>
  trackEvent("episode_completed", {
    episode_id: episodeId,
    episode_title: episodeTitle,
  });

/** Called when a Collapsible answer section is opened */
export const trackAnswerOpened = (sectionId: string, episodeId: string) =>
  trackEvent("answer_opened", {
    section_id: sectionId,
    episode_id: episodeId,
  });

/** Called when user clicks a platform link (Apple, Spotify, YouTube, KKBOX) */
export const trackOutboundClick = (platform: string, source: string) =>
  trackEvent("outbound_click", {
    outbound_platform: platform,
    outbound_source: source, // e.g. "player_launch" | "home" | "footer"
  });

/** Called when TTS is triggered anywhere (e.g. SpeakLine) */
export const trackTTSPlay = (contentType: string, episodeId: string) =>
  trackEvent("tts_play", {
    content_type: contentType,
    episode_id: episodeId,
  });
