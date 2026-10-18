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
  // Use transport: "beacon" to ensure event data is sent successfully even when page unloads/navigates away!
  window.gtag("event", eventName, {
    ...params,
    transport: "beacon",
  });
};

// ── Convenience wrappers ───────────────────────────────────────────

/** Called when user lands on the Episode page */
export const trackEpisodeLanded = (episodeId: string, episodeTitle: string, source?: string) =>
  trackEvent("episode_landed", {
    episode_id: episodeId,
    episode_title: episodeTitle,
    entry_source: source || "search", // Original registered name
    episode_entry_source: source || "search", // Backup / renamed name
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

/** Called when user reveals an answer (via spin or direct show) */
export const trackAnswerOpened = (sectionId: string, episodeId: string, isSpin: boolean) =>
  trackEvent("answer_opened", {
    section_id: sectionId, // "audio_question" or "family_discussion"
    section: sectionId, // Backup parameter name
    episode_id: episodeId,
    is_spin: isSpin ? "yes" : "no", // "yes" or "no" to record whether there was a spin
  });

/** Called when user clicks a platform link (Apple, Spotify, YouTube, KKBOX, Facebook) */
export const trackOutboundClick = (platform: string, source: string) =>
  trackEvent("outbound_click", {
    outbound_platform: platform,
    click_platform: platform, // Backup parameter name
    outbound_source: source, // e.g. "player_launch" | "home" | "footer"
  });

/**
 * Called when user clicks a listen link of a specific episode on the home page.
 * Note: an outbound click is NOT a confirmed listen / follow.
 */
export const trackPodcastEpisodeClick = (params: {
  episodeId: string;
  episodeTitle: string;
  platform: string;
  source: string; // "home_latest" | "home_search"
}) =>
  trackEvent("podcast_episode_click", {
    podcast_episode_id: params.episodeId,
    podcast_episode_title: params.episodeTitle,
    podcast_platform: params.platform,
    click_source: params.source,
  });

/** Called when user clicks a show-level follow link (Apple Podcasts, Spotify, YouTube, KKBOX) */
export const trackPodcastPlatformClick = (platform: string, source: string) =>
  trackEvent("podcast_platform_click", {
    podcast_platform: platform,
    click_source: source, // "home_podcast_section"
  });

/** Called when user clicks a hero featured card on the home page */
export const trackHeroCardClick = (cardId: string, position: number) =>
  trackEvent("hero_card_click", {
    hero_card_id: cardId,
    hero_card_position: position,
  });

/** Called when user opens an interactive lab from the home page */
export const trackInteractiveLabClick = (labId: string, labTitle: string, position: number) =>
  trackEvent("interactive_lab_click", {
    lab_id: labId,
    lab_title: labTitle,
    lab_position: position,
  });

/** Called when user starts a Solar Star video (the YouTube player loads only after this click) */
export const trackSolarVideoPlay = (youtubeId: string, videoTitle: string, position: number) =>
  trackEvent("solar_video_play", {
    video_id: youtubeId,
    video_title: videoTitle,
    video_position: position,
  });

/** Called when user opens a daily guide or game stage from the home learning-resources section */
export const trackLearningResourceClick = (resourceType: "guide" | "game", resourceId: string, position: number) =>
  trackEvent("learning_resource_click", {
    resource_type: resourceType,
    resource_id: resourceId,
    resource_position: position,
  });

/** Called when TTS is triggered anywhere (e.g. SpeakLine, GlossaryCard, Auto-speak) */
export const trackTTSPlay = (contentType: string, episodeId: string) =>
  trackEvent("tts_play", {
    content_type: contentType, // Original registered name
    tts_content_type: contentType, // Backup / renamed name
    episode_id: episodeId,
  });
