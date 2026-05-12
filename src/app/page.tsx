import Header from "@/components/episode/Header";
import Footer from "@/components/episode/Footer";
import { getAllPublishedEpisodes } from "@/lib/episodes";
import { BookOpen, Headphones, Info, Globe } from "lucide-react";
import SectionShell from "@/components/episode/SectionShell";
import ClientHeroButton from "@/components/episode/ClientHeroButton";

export default async function Home() {
  const episodes = await getAllPublishedEpisodes();
  const searchIndex = episodes.map((ep) => ({ id: ep.id, title: ep.Title }));

  return (
    <>
      <Header episodes={searchIndex} />
      <main className="text-foreground min-h-screen">
        {/* Hero Section */}
        <section className="relative px-4 py-16 sm:py-24 text-center overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-full max-h-[500px] bg-accent/20 blur-[120px] rounded-full pointer-events-none -z-10" />

          <div className="max-w-3xl mx-auto z-10 relative">
            <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight mb-6 drop-shadow-lg">
              聽科學，探索世界！
              <span className="block text-accent mt-2">科學好好聽</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/90 mb-10 leading-relaxed max-w-2xl mx-auto">
              給孩子最棒的科學啟蒙！結合嚴謹的知識邏輯與生動的 AI 語音，
              陪著大小朋友一起在故事中解開大自然的奧秘。
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <ClientHeroButton />
            </div>
          </div>
        </section>

        {/* Listen Platforms Section */}
        <SectionShell id="listen" show={true} className="mb-12">
          <div className="text-center">
            <h2 id="listen-title" className="text-2xl sm:text-3xl font-extrabold text-white mb-8 flex items-center justify-center gap-3">
              <Headphones className="w-7 h-7 text-accent" />
              在你喜歡的平台收聽
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <a href="https://podcasts.apple.com/tw/podcast/%E7%A7%91%E5%AD%B8%E5%A5%BD%E5%A5%BD%E8%81%BD/id1812447277" target="_blank" rel="noopener noreferrer" className="glass-card hover:border-accent hover:-translate-y-1 transition-all rounded-2xl p-6 flex flex-col items-center gap-3 group">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <svg className="w-6 h-6 text-white group-hover:text-[#B1B1B1] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.641-.026 2.669-1.48 3.666-2.934 1.154-1.686 1.63-3.324 1.654-3.411-.035-.018-3.197-1.226-3.223-4.872-.023-3.051 2.493-4.512 2.607-4.58-1.424-2.083-3.633-2.365-4.417-2.42-1.802-.178-3.626 1.153-4.562 1.153zm-.304-6.315c.844-.993 1.41-2.378 1.258-3.778-1.218.048-2.656.79-3.528 1.808-.78.892-1.442 2.308-1.262 3.678 1.36.096 2.688-.714 3.532-1.708z" />
                  </svg>
                </div>
                <span className="font-bold text-sm">Apple Podcasts</span>
              </a>

              <a href="https://open.spotify.com/show/1eyISRdcgDTwZqIqrP1qKv" target="_blank" rel="noopener noreferrer" className="glass-card hover:border-[#1DB954] hover:-translate-y-1 transition-all rounded-2xl p-6 flex flex-col items-center gap-3 group">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#1DB954]/20 transition-colors">
                  <svg className="w-6 h-6 text-white group-hover:text-[#1DB954] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.001 10.5 18.661 12.78c.418.24.539.84.3 1.26zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.239.54-.959.72-1.559.3z" />
                  </svg>
                </div>
                <span className="font-bold text-sm">Spotify</span>
              </a>

              <a href="https://www.youtube.com/playlist?list=PLLMTd7kOjc2Xb4GtG8oRF9amKathXcnEK" target="_blank" rel="noopener noreferrer" className="glass-card hover:border-[#FF0000] hover:-translate-y-1 transition-all rounded-2xl p-6 flex flex-col items-center gap-3 group">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#FF0000]/20 transition-colors">
                  <svg className="w-6 h-6 text-white group-hover:text-[#FF0000] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>
                <span className="font-bold text-sm">YouTube</span>
              </a>

              <a href="https://podcast.kkbox.com/tw/channel/KkRvjF8kret9SG5Nbf" target="_blank" rel="noopener noreferrer" className="glass-card hover:border-[#00EBEB] hover:-translate-y-1 transition-all rounded-2xl p-6 flex flex-col items-center gap-3 group">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#00EBEB]/20 transition-colors">
                  <Headphones className="w-6 h-6 text-white group-hover:text-[#00EBEB] transition-colors" />
                </div>
                <span className="font-bold text-sm">KKBOX</span>
              </a>
            </div>
          </div>
        </SectionShell>

        {/* About Section */}
        <SectionShell id="about" show={true} className="mb-24">
          <div className="max-w-3xl mx-auto glass-card rounded-3xl p-8 sm:p-10 border-accent/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/20 blur-3xl -mr-10 -mt-10 pointer-events-none" />

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-6 flex items-center gap-3 relative z-10">
              <Info className="w-7 h-7 text-secondary" />
              關於節目
            </h2>

            <div className="space-y-5 text-white/90 text-base sm:text-lg leading-relaxed relative z-10">
              <p>
                <strong className="text-secondary text-xl">🌟【全新推出：科學好好聽 VIP 訂閱服務！】🌟</strong><br />
                為了讓孩子們的好奇心獲得更多養分，我們正式推出了 VIP 訂閱方案！👑 成為 VIP 不僅能解鎖更多專屬的特別企劃與深度科學故事，您的一臂之力，更是我們持續優化內容、製作高品質台灣在地兒童科學節目的最大動力！💪
              </p>

              <div className="h-px w-full bg-border/40 my-6" />

              <p>
                創立這個頻道的起點，其實是一個爸爸的小小煩惱：家裡有個熱愛科學、卻總是靜不下來看書的兒子。👦🧪
              </p>
              <p>
                我想給他最棒的科學啟蒙，但市面上的有聲教材，不是良莠不齊，就是充滿了我們不習慣的口音。我常想：「難道不能有一個真正屬於台灣孩子、在地口吻，且內容經得起推敲的科學頻道嗎？」🇹🇼
              </p>
              <p>
                身為忙碌的工程師，我採用最先進的 AI 技術成為我的神隊友，來解決錄製的時間壓力。但在效率背後，我最在乎的始終是「內容的品質」。
              </p>
              <p>
                或許是以前在台大資工攻讀博士時養成的「職業病」，對於知識的邏輯與教材的篩選，我有著不肯妥協的執著。 🧐 每一個選題、每一份素材，都經過我嚴謹的審閱與把關；雖然語音產出交給了 AI，但每一集內容都必須先過了我這關，確認知識含金量足夠且生動有趣，才敢放給孩子們聽。📚✨
              </p>
              <p>
                儘管 AI 偶有小瑕疵，但我相信瑕不掩瑜。這是一份結合了理工人的嚴謹與爸爸的愛的禮物，希望能用穩定豐富的內容，在孩子心中種下對世界好奇的種子。🌱🚀
              </p>

              <div className="mt-8 p-6 bg-card/60 rounded-2xl border border-white/5">
                <p className="font-bold mb-2">謝謝所有喜歡這裡的大小朋友，讓我們繼續一起聽科學、探索世界！</p>
                <ul className="text-sm space-y-2 text-white/80">
                  <li className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-accent" />
                    官方網站：<a href="https://科學好好聽.app" className="text-accent hover:underline">科學好好聽.app</a>
                  </li>
                  <li className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-accent" />
                    建議回饋：<a href="mailto:taro.tw+kidsci@gmail.com" className="text-accent hover:underline">taro.tw+kidsci@gmail.com</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </SectionShell>

        <Footer />
      </main>
    </>
  );
}
