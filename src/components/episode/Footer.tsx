import { Facebook, Headphones, Music2 } from "lucide-react";

const links = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61577975781160",
    Icon: Facebook,
  },
  {
    label: "Apple Podcast",
    href: "https://podcasts.apple.com/tw/podcast/id1812447277",
    Icon: Headphones,
  },
  {
    label: "Spotify",
    href: "https://open.spotify.com/show/1eyISRdcgDTwZqIqrP1qKv",
    Icon: Music2,
  },
];

const Footer = () => (
  <footer className="w-full mt-10 px-4 pb-10">
    <div className="max-w-2xl mx-auto rounded-3xl bg-card/70 border border-white/10 backdrop-blur-md px-6 py-7 text-center text-white">
      <p className="text-base sm:text-lg font-bold leading-relaxed">
        保持好奇心，世界就是你的實驗室！
      </p>
      <p className="text-sm sm:text-base text-white/80 mt-1">
        科學的探險永不停止，讓我們下次見。
      </p>
      <div className="flex items-center justify-center gap-4 mt-5">
        {links.map(({ label, href, Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-accent/40 transition-colors"
          >
            <Icon className="w-5 h-5 text-white" />
          </a>
        ))}
      </div>
      <p className="text-xs text-white/50 mt-5">© 科學好好聽 ｜ 科普伴讀</p>
    </div>
  </footer>
);

export default Footer;
