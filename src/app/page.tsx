import Link from "next/link";
import Header from "@/components/episode/Header";
import Footer from "@/components/episode/Footer";
import { getAllPublishedEpisodes, getLatestPublishedEpisode } from "@/lib/episodes";
import { ThumbsUp, GraduationCap, Headphones, ShieldCheck, Sparkles } from "lucide-react";
import ClientHeroButton from "@/components/episode/ClientHeroButton";
import FloatingDecor from "@/components/home/FloatingDecor";

// ---------------------------------------------------------------------------
// Planet data – cards are visual-only for now (tags search coming soon)
// ---------------------------------------------------------------------------
// const planets = [
//   { name: "動物世界", emoji: "🦅", desc: "猛禽、雨林、神奇生物", color: "from-[#ff7473] to-[#ffc952]" },
//   { name: "宇宙星河", emoji: "🪐", desc: "黑洞、星系、太空船", color: "from-[#97e5ff] to-[#34314c]" },
//   { name: "海洋探險", emoji: "🐙", desc: "深海、洋流、神秘生物", color: "from-[#47b8e0] to-[#97e5ff]" },
//   { name: "昆蟲奇兵", emoji: "🐝", desc: "蜜蜂、螢火蟲、變態", color: "from-[#ffc952] to-[#34314c]" },
//   { name: "數位魔法師", emoji: "💻", desc: "電腦、AI、程式邏輯", color: "from-[#7224d8] to-[#97e5ff]" },
//   { name: "地球科學", emoji: "🌋", desc: "火山、地震、氣候", color: "from-[#ffc952] to-[#ff7473]" },
// ];

export default async function Home() {
  const [episodes, latestEpisode] = await Promise.all([
    getAllPublishedEpisodes(),
    getLatestPublishedEpisode(),
  ]);
  const searchIndex = episodes.map((ep) => ({ id: ep.id, title: ep.Title }));

  return (
    <>
      <Header episodes={searchIndex} />
      <FloatingDecor count={20} />
      <main className="text-foreground min-h-screen">
        {/* =========================================
            Group 1: Hero, Planets, Shortcut
        ========================================= */}
        <div className="py-8 sm:py-10 flex flex-col gap-8 sm:gap-10">
          {/* ── Hero ── */}
          <section className="max-w-2xl mx-auto px-4 text-center">
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4 text-stroke-dark animate-in fade-in slide-in-from-top-4 duration-500">
              聽科學，<span className="text-secondary">探索世界！</span>
            </h1>
            <p className="text-white/90 mb-7 text-base sm:text-lg leading-relaxed animate-in fade-in duration-700 delay-150">
              200+ 集精彩科普故事，搭配 50+ 集精選<span className="font-bold">『伴讀單元』</span>
              <br />
              給孩子最棒的<span className="text-accent font-bold">科學啟蒙</span>！
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in duration-700 delay-300">
              <ClientHeroButton />
            </div>
          </section>

          {/* ── 主題星球探索 ── */}
          <section id="topic-planets" className="scroll-mt-20">
            <div className="max-w-2xl mx-auto px-4 mb-5">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-secondary" />
                微觀世界到浩瀚星空
              </h2>
              <p className="text-white/90 text-base leading-relaxed">
                每一集都是一場<span className="text-accent font-bold">知識的深度旅行</span>
              </p>
            </div>

            {/* Full-width static hero image */}
            <div className="max-w-2xl mx-auto px-4 mb-5">
              <img
                src="/hero-collage.png"
                alt="科學百科主題拼貼：火山、地球、顯微鏡、海洋生物、昆蟲、太空"
                className="w-full h-auto block"
              />
            </div>
          </section>

          {/* ── Today's episode shortcut ── */}
          {latestEpisode && (
            <section className="max-w-2xl w-full mx-auto px-4 -mt-5">
              <Link
                href={`/guide/${latestEpisode.id}`}
                className="block rounded-3xl overflow-hidden glass-card border-2 border-secondary/40 hover:border-accent/70 transition-colors group"
              >
                <div className="flex items-center gap-4 p-4 sm:p-5">
                  <img
                    src={latestEpisode.Cover}
                    alt={latestEpisode.Title}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-secondary mb-1">🎧 最新精選</div>
                    <div className="font-extrabold text-white text-sm sm:text-base leading-snug line-clamp-2">
                      {latestEpisode.Title}
                    </div>
                    <div className="text-accent text-xs sm:text-sm mt-2 font-bold group-hover:translate-x-1 transition-transform">
                      點我開始探索 →
                    </div>
                  </div>
                </div>
              </Link>
            </section>
          )}
        </div>

        {/* =========================================
            Group 2: Listen Platforms & Brand Story
        ========================================= */}
        <div className="bg-black/10 py-10 sm:py-12 flex flex-col gap-10 sm:gap-12 border-t border-white/10 shadow-[inset_0_4px_24px_rgba(0,0,0,0.4)]">

          {/* ── Listen Platforms ── */}
          <section id="listen-platforms" className="max-w-2xl w-full mx-auto px-4 scroll-mt-20">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-1 flex items-center gap-2">
              <Headphones className="w-5 h-5 text-accent" />
              全系列 200+ 集故事聽翻天
            </h2>
            <p className="text-white/90 text-base mb-5">隨時隨地，跟著科學隊長一起<span className="text-accent font-bold">探索世界</span>！</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Apple Podcasts */}
              <a
                href="https://podcasts.apple.com/tw/podcast/%E7%A7%91%E5%AD%B8%E5%A5%BD%E5%A5%BD%E8%81%BD/id1812447277"
                target="_blank" rel="noopener noreferrer"
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
                target="_blank" rel="noopener noreferrer"
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
                target="_blank" rel="noopener noreferrer"
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
                target="_blank" rel="noopener noreferrer"
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
          </section>

          {/* ── Brand Story / VIP ── */}
          <section className="max-w-2xl w-full mx-auto px-4">
            <div
              className="rounded-3xl p-6 sm:p-8 backdrop-blur-xl border border-white/10 shadow-[var(--shadow-card)] relative overflow-hidden"
              style={{ backgroundColor: "rgba(52, 49, 76, 0.82)" }}
            >
              {/* Decorative glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-secondary/20 blur-3xl -mr-10 -mt-10 pointer-events-none" />

              <div className="flex items-center gap-2 mb-3 relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/25 text-accent font-bold text-xs">
                  <GraduationCap className="w-4 h-4" />
                  理工爸爸 × 好奇博士
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white leading-snug mb-3 relative z-10">
                理工爸爸給台灣孩子的<br className="sm:hidden" />
                <span className="text-secondary">科學禮物</span>
              </h2>

              <p className="text-white/90 leading-relaxed text-sm sm:text-base mb-4 relative z-10">
                主持人擁有 <span className="text-accent font-bold">台大資工博士</span> 背景，每一集都經過
                <span className="text-accent font-bold"> 嚴謹邏輯把關 </span>
                ，把艱深的科學知識變成孩子聽得懂、聽了還想再聽的故事。
              </p>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5 text-white/90 text-sm relative z-10">
                <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-secondary" /> 科學知識精準把關</li>
                <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-secondary" /> 親子共學互動設計</li>
                <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-secondary" /> 在地觀點，繁中原創</li>
                <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-secondary" /> 持續上新，每週更新</li>
              </ul>

              <div className="h-px w-full bg-border/30 my-5 relative z-10" />

              <div className="space-y-3 text-white/90 text-sm sm:text-base leading-relaxed relative z-10">
                <p>創立這個頻道的起點，其實是一個爸爸的小小煩惱：家裡有個熱愛科學、卻總是靜不下來看書的兒子。👦🧪</p>
                <p>我想給他最棒的科學啟蒙，但市面上的有聲教材，不是良莠不齊，就是充滿了不習慣的口音。身為忙碌的工程師，我採用 AI 技術來解決錄製的時間壓力，但最在乎的始終是「內容的品質」。</p>
                <p className="font-bold text-white">謝謝所有喜歡這裡的大小朋友，讓我們繼續一起聽科學、探索世界！</p>
              </div>

              <div className="mt-6 relative z-10">
                <a
                  href="https://www.facebook.com/profile.php?id=61577975781160"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full font-bold text-base text-white shadow-[var(--shadow-glow)] hover:scale-[1.03] transition-transform"
                  style={{ backgroundColor: "#1877F2" }}
                >
                  <ThumbsUp className="w-5 h-5" />
                  前往 Facebook 粉絲頁按讚
                </a>
              </div>
            </div>
          </section>
        </div>

        <Footer />
      </main>
    </>
  );
}
