"use client";

export type BrowserAuthEnvironment = {
  isEmbeddedBrowser: boolean;
  chromeIntentUrl: string | null;
  externalGoogleSignInUrl: string;
};

const embeddedBrowserPatterns = [
  /;\s*wv\)/i,
  /Version\/[\d.]+.*Chrome\/[\d.]+.*Mobile Safari/i,
  /WebView/i,
  /FBAN|FBAV|FB_IAB/i,
  /Instagram/i,
  /Line\//i,
  /MicroMessenger/i,
  /TikTok/i,
  /Twitter/i,
  /LinkedInApp/i,
  /Pinterest/i,
  /Snapchat/i,
  /GSA\//i,
];

function createGoogleSignInUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    const continuePath = `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    return `${parsedUrl.origin}/auth/google?continue=${encodeURIComponent(continuePath)}`;
  } catch {
    return "/auth/google";
  }
}

function createExternalBrowserIntentUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    const pathAndQuery = `${parsedUrl.host}${parsedUrl.pathname}${parsedUrl.search}`;
    const fallback = `S.browser_fallback_url=${encodeURIComponent(url)};`;
    return `intent://${pathAndQuery}#Intent;scheme=${parsedUrl.protocol.replace(":", "")};action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;${fallback}end`;
  } catch {
    return null;
  }
}

export function getBrowserAuthEnvironment(): BrowserAuthEnvironment {
  if (typeof window === "undefined") {
    return {
      isEmbeddedBrowser: false,
      chromeIntentUrl: null,
      externalGoogleSignInUrl: "/auth/google",
    };
  }

  const userAgent = window.navigator.userAgent;
  const isAndroid = /Android/i.test(userAgent);
  const isEmbeddedBrowser = embeddedBrowserPatterns.some((pattern) => pattern.test(userAgent));
  const currentUrl = window.location.href;
  const externalGoogleSignInUrl = createGoogleSignInUrl(currentUrl);

  return {
    isEmbeddedBrowser,
    chromeIntentUrl: isAndroid ? createExternalBrowserIntentUrl(externalGoogleSignInUrl) : null,
    externalGoogleSignInUrl,
  };
}
