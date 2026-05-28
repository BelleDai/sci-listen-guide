"use client";

export default function HomeListenPlatforms() {
  return (
    <div className="space-y-4">
      <p className="text-white/85 text-base leading-relaxed">
        <span className="text-accent font-bold">四大平台</span>任你收聽
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Apple Podcasts */}
        <a
          href="https://podcasts.apple.com/tw/podcast/%E7%A7%91%E5%AD%B8%E5%A5%BD%E5%A5%BD%E8%81%BD/id1812447277"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            import("@/lib/analytics").then(({ trackOutboundClick }) =>
              trackOutboundClick("apple_podcasts", "home")
            );
          }}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl p-4 border border-white/15 backdrop-blur-md hover:-translate-y-1 hover:scale-[1.03] transition-all"
          style={{ backgroundColor: "#7224d822", boxShadow: "0 6px 24px -10px #7224d8" }}
        >
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-full" style={{ backgroundColor: "#7224d8" }}>
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.641-.026 2.669-1.48 3.666-2.934 1.154-1.686 1.63-3.324 1.654-3.411-.035-.018-3.197-1.226-3.223-4.872-.023-3.051 2.493-4.512 2.607-4.58-1.424-2.083-3.633-2.365-4.417-2.42-1.802-.178-3.626 1.153-4.562 1.153zm-.304-6.315c.844-.993 1.41-2.378 1.258-3.778-1.218.048-2.656.79-3.528 1.808-.78.892-1.442 2.308-1.262 3.678 1.36.096 2.688-.714 3.532-1.708z" />
            </svg>
          </span>
          <span className="text-white font-bold text-sm">Apple Podcasts</span>
        </a>

        {/* Spotify */}
        <a
          href="https://open.spotify.com/show/1eyISRdcgDTwZqIqrP1qKv"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            import("@/lib/analytics").then(({ trackOutboundClick }) =>
              trackOutboundClick("spotify", "home")
            );
          }}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl p-4 border border-white/15 backdrop-blur-md hover:-translate-y-1 hover:scale-[1.03] transition-all"
          style={{ backgroundColor: "#1DB95422", boxShadow: "0 6px 24px -10px #1DB954" }}
        >
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-full" style={{ backgroundColor: "#1DB954" }}>
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.001 10.5 18.661 12.78c.418.24.539.84.3 1.26zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.239.54-.959.72-1.559.3z" />
            </svg>
          </span>
          <span className="text-white font-bold text-sm">Spotify</span>
        </a>

        {/* YouTube */}
        <a
          href="https://www.youtube.com/playlist?list=PLLMTd7kOjc2Xb4GtG8oRF9amKathXcnEK"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            import("@/lib/analytics").then(({ trackOutboundClick }) =>
              trackOutboundClick("youtube", "home")
            );
          }}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl p-4 border border-white/15 backdrop-blur-md hover:-translate-y-1 hover:scale-[1.03] transition-all"
          style={{ backgroundColor: "#FF000022", boxShadow: "0 6px 24px -10px #FF0000" }}
        >
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-full" style={{ backgroundColor: "#FF0000" }}>
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </span>
          <span className="text-white font-bold text-sm">YouTube</span>
        </a>

        {/* KKBOX */}
        <a
          href="https://podcast.kkbox.com/tw/channel/KkRvjF8kret9SG5Nbf"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            import("@/lib/analytics").then(({ trackOutboundClick }) =>
              trackOutboundClick("kkbox", "home")
            );
          }}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl p-4 border border-white/15 backdrop-blur-md hover:-translate-y-1 hover:scale-[1.03] transition-all"
          style={{ backgroundColor: "#00EBEB22", boxShadow: "0 6px 24px -10px #00EBEB" }}
        >
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-full" style={{ backgroundColor: "#00EBEB" }}>
            <svg className="w-6 h-6 text-white" viewBox="0 0 512 512" fill="currentColor">
              <path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256 256-114.6 256-256S397.4 0 256 0zm0 464c-114.7 0-208-93.3-208-208S141.3 48 256 48s208 93.3 208 208-93.3 208-208 208zm-48-296v176l144-88-144-88z" />
            </svg>
          </span>
          <span className="text-white font-bold text-sm">KKBOX</span>
        </a>
      </div>
    </div>
  );
}
