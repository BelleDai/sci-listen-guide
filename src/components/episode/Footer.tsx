"use client";

const links = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61577975781160",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "Apple Podcasts",
    href: "https://podcasts.apple.com/tw/podcast/id1812447277",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.641-.026 2.669-1.48 3.666-2.934 1.154-1.686 1.63-3.324 1.654-3.411-.035-.018-3.197-1.226-3.223-4.872-.023-3.051 2.493-4.512 2.607-4.58-1.424-2.083-3.633-2.365-4.417-2.42-1.802-.178-3.626 1.153-4.562 1.153zm-.304-6.315c.844-.993 1.41-2.378 1.258-3.778-1.218.048-2.656.79-3.528 1.808-.78.892-1.442 2.308-1.262 3.678 1.36.096 2.688-.714 3.532-1.708z" />
      </svg>
    ),
  },
  {
    label: "科學好好聽.app",
    href: "https://科學好好聽.app",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    label: "建議回饋",
    href: "mailto:taro.tw+kidsci@gmail.com",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
];

const Footer = () => (
  <footer className="w-full mt-10 px-4 pb-10">
    <div className="max-w-2xl mx-auto rounded-3xl bg-card/70 border border-white/10 backdrop-blur-md px-6 py-7 text-center text-white">
      <p className="text-base sm:text-lg font-bold leading-relaxed">
        下一次，我們又會發現什麼新奇的科學呢？
      </p>

      <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
        {links.map(({ label, href, svg }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith("mailto") ? undefined : "_blank"}
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            className="inline-flex flex-col items-center gap-1.5 group"
            onClick={() => {
              if (!href.startsWith("mailto")) {
                import("@/lib/analytics").then(({ trackOutboundClick }) =>
                  trackOutboundClick(label.toLowerCase().replace(/\s+/g, "_"), "footer")
                );
              }
            }}
          >
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-accent/40 transition-colors group-hover:-translate-y-1 group-hover:scale-110 transition-transform">
              {svg}
            </span>
            <span className="text-[10px] text-white/50 group-hover:text-white/80 transition-colors">{label}</span>
          </a>
        ))}
      </div>

      <p className="text-xs text-white/50 mt-5">© 科學好好聽</p>
    </div>
  </footer>
);

export default Footer;
