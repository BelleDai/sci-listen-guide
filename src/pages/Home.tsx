import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, Crown, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import Header from "@/components/episode/Header";
import Footer from "@/components/episode/Footer";
import FloatingDecor from "@/components/home/FloatingDecor";
import { episodeData } from "@/data/episode";

const planets = [
  { name: "動物世界", emoji: "🦅", desc: "猛禽、雨林、神奇生物", color: "from-[#ff7473] to-[#ffc952]", to: "/episode" },
  { name: "宇宙星河", emoji: "🪐", desc: "黑洞、星系、太空船", color: "from-[#97e5ff] to-[#34314c]", to: "/episode" },
  { name: "海洋探險", emoji: "🐙", desc: "深海、洋流、神秘生物", color: "from-[#47b8e0] to-[#97e5ff]", to: "/episode" },
  { name: "昆蟲奇兵", emoji: "🐝", desc: "蜜蜂、螢火蟲、變態", color: "from-[#ffc952] to-[#ff7473]", to: "/episode" },
  { name: "身體探秘", emoji: "🫀", desc: "心臟、大腦、免疫", color: "from-[#ff7473] to-[#97e5ff]", to: "/episode" },
  { name: "地球科學", emoji: "🌋", desc: "火山、地震、氣候", color: "from-[#ffc952] to-[#34314c]", to: "/episode" },
];

const Home = () => {
  const [q, setQ] = useState("");

  useEffect(() => {
    document.title = "科學好好聽 ｜ 科普伴讀首頁";
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    toast(`正在搜尋「${term}」的科普主題…`, { description: "更多星球即將上線！" });
    setQ("");
  };

  return (
    <>
      <FloatingDecor count={20} />
      <Header showStepper={false} />
      <main className="text-foreground">
        {/* Hero */}
        <section className="max-w-3xl mx-auto px-4 pt-8 pb-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-5xl font-black text-white leading-snug mb-3 text-stroke-dark"
          >
            今天想去哪顆 <span className="text-secondary">星球</span> 探險？
          </motion.h1>
          <p className="text-white/80 mb-6 text-sm sm:text-base">
            點選一顆星球，跟科學隊長一起出發吧！
          </p>

          <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
            <div className="flex items-center gap-2 rounded-full bg-card/80 backdrop-blur border-2 border-accent/50 shadow-[0_0_24px_-4px_hsl(var(--accent)/0.5)] px-5 py-3">
              <Search className="w-5 h-5 text-accent flex-shrink-0" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="輸入主題：宇宙、海洋、昆蟲…"
                className="flex-1 bg-transparent text-white placeholder:text-white/50 focus:outline-none text-base"
              />
              <button
                type="submit"
                className="hidden sm:inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground font-bold px-4 py-1.5 text-sm hover:scale-105 transition-transform"
              >
                出發！
              </button>
            </div>
          </form>
        </section>

        {/* Planet cards */}
        <section className="max-w-3xl mx-auto px-4 pb-12">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-secondary" />
            主題星球
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {planets.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.04, rotate: -1 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  to={p.to}
                  className={`block rounded-3xl p-4 sm:p-5 bg-gradient-to-br ${p.color} shadow-[var(--shadow-card)] border border-white/20 text-left h-full`}
                >
                  <div className="text-4xl sm:text-5xl mb-2 drop-shadow-lg">{p.emoji}</div>
                  <div className="font-black text-white text-base sm:text-lg leading-tight">
                    {p.name}
                  </div>
                  <div className="text-white/85 text-xs sm:text-sm mt-1">{p.desc}</div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Today's episode shortcut */}
        <section className="max-w-3xl mx-auto px-4 pb-12">
          <Link
            to="/episode"
            className="block rounded-3xl overflow-hidden glass-card border-2 border-secondary/40 hover:border-accent/70 transition-colors"
          >
            <div className="flex items-center gap-4 p-4">
              <img
                src={episodeData.Cover}
                alt={episodeData.Title}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-secondary mb-1">🎧 今日精選</div>
                <div className="font-extrabold text-white text-sm sm:text-base leading-snug line-clamp-2">
                  {episodeData.Title}
                </div>
                <div className="text-accent text-xs sm:text-sm mt-1 font-bold">點我開始科普伴讀 →</div>
              </div>
            </div>
          </Link>
        </section>

        {/* VIP & brand story */}
        <section className="max-w-3xl mx-auto px-4 pb-12">
          <div
            className="rounded-3xl p-6 sm:p-8 backdrop-blur-xl border border-white/10 shadow-[var(--shadow-card)]"
            style={{ backgroundColor: "rgba(52, 49, 76, 0.78)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/20 text-accent font-bold text-xs">
                <GraduationCap className="w-4 h-4" />
                理工爸爸 × 科學隊長
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-snug mb-3">
              理工爸爸給台灣孩子的<br className="sm:hidden" />
              <span className="text-secondary">科學禮物</span>
            </h2>
            <p className="text-white/85 leading-relaxed text-sm sm:text-base mb-3">
              主持人擁有 <span className="text-accent font-bold">台大資工博士</span> 背景，每一集內容都經過
              <span className="text-accent font-bold"> 嚴謹邏輯把關 </span>
              ，把艱深的科學知識轉化成孩子聽得懂、聽了還想再聽的故事。
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5 text-white/80 text-sm">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-secondary" /> 科學知識精準把關
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-secondary" /> 親子共學互動設計
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-secondary" /> 在地觀點，繁中原創
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-secondary" /> 持續上新，每週更新
              </li>
            </ul>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() =>
                toast("VIP 訂閱即將開放！", { description: "感謝你支持在地科學教育 🙌" })
              }
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full font-extrabold text-base text-white shadow-[var(--shadow-glow)]"
              style={{ backgroundColor: "#ff7473" }}
            >
              <Crown className="w-5 h-5" />
              👑 成為 VIP，支持在地高品質科學教育
            </motion.button>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
};

export default Home;
