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

/** Called when TTS is triggered anywhere (e.g. SpeakLine, GlossaryCard, Auto-speak) */
export const trackTTSPlay = (contentType: string, episodeId: string) =>
  trackEvent("tts_play", {
    content_type: contentType, // Original registered name
    tts_content_type: contentType, // Backup / renamed name
    episode_id: episodeId,
  });
