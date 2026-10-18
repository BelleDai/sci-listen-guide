"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { PLATFORM_STYLES, YouTubeIcon } from "@/components/home/PlatformIcons";
import type { SiteLinks } from "@/lib/home-content";
import { trackOutboundClick } from "@/lib/analytics";

const SOURCE = "home_footer";

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const socialIcons = { facebook: FacebookIcon, youtube: YouTubeIcon, email: Mail };

const linkClass =
  "inline-flex min-h-9 items-center gap-2 rounded text-sm text-white/75 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  if (href.startsWith("https://")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {children}
        <span className="sr-only">（另開新視窗）</span>
      </a>
    );
  }
  return (
    <Link href={href} className={linkClass}>
      {children}
    </Link>
  );
}

export default function SiteFooter({ links }: { links: SiteLinks }) {
  const featuredPlatforms = links.podcastPlatforms.filter((platform) => platform.featured);

  return (
    <footer className="border-t border-white/10 bg-black/25 px-4 pb-10 pt-10 sm:pt-12">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.png" alt="" className="h-10 w-10 rounded-full object-cover" />
            <span className="text-lg font-extrabold text-white">科學好好聽</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-6 text-white/65">
            永遠對世界抱持好奇心。給孩子的原創繁中科學 Podcast、科普伴讀與闖關遊戲。
          </p>
        </div>

        <nav aria-label="網站內容">
          <h2 className="mb-2 text-sm font-bold text-white">探索內容</h2>
          <ul className="space-y-0.5">
            {links.footerLinks.map((link) => (
              <li key={link.href}>
                <FooterLink href={link.href}>{link.label}</FooterLink>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="mb-2 text-sm font-bold text-white">收聽節目</h2>
          <ul className="space-y-0.5">
            {featuredPlatforms.map((platform) => {
              const { Icon } = PLATFORM_STYLES[platform.id];
              return (
                <li key={platform.id}>
                  <a
                    href={platform.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackOutboundClick(platform.id, SOURCE)}
                    className={linkClass}
                  >
                    <Icon className="h-4 w-4" />
                    {platform.label}
                    <span className="sr-only">（另開新視窗）</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-bold text-white">追蹤與聯絡</h2>
          <ul className="space-y-0.5">
            {links.social.map((item) => {
              const Icon = socialIcons[item.id];
              const isMail = item.href.startsWith("mailto:");
              return (
                <li key={item.id}>
                  <a
                    href={item.href}
                    target={isMail ? undefined : "_blank"}
                    rel={isMail ? undefined : "noopener noreferrer"}
                    onClick={() => !isMail && trackOutboundClick(item.id, SOURCE)}
                    className={linkClass}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    {!isMail && <span className="sr-only">（另開新視窗）</span>}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <p className="mx-auto mt-8 w-full max-w-5xl border-t border-white/10 pt-5 text-xs text-white/50">© 科學好好聽</p>
    </footer>
  );
}
