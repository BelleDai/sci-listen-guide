import { Award, GraduationCap, ShieldCheck, ThumbsUp } from "lucide-react";
import HighlightText from "@/components/home/HighlightText";
import type { BrandContent } from "@/lib/home-content";

const credentialIcons = { graduation: GraduationCap, award: Award };

export default function BrandSection({ content }: { content: BrandContent }) {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="section-band section-band-teal scroll-mt-28 md:scroll-mt-20 px-4 py-10 sm:py-14"
    >
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
        <div className="relative mx-auto flex w-full max-w-md justify-center lg:max-w-none">
          <div className="absolute inset-6 rounded-full bg-accent/15 blur-3xl" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={content.image}
            alt={content.imageAlt}
            loading="lazy"
            decoding="async"
            className="relative max-h-[360px] w-auto max-w-full object-contain sm:max-h-[480px]"
          />
        </div>

        <div className="min-w-0">
          {content.eyebrow && (
            <p className="mb-2 text-xs font-bold tracking-[0.18em] text-accent/80">{content.eyebrow}</p>
          )}
          <h2 id="about-heading" className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">
            <HighlightText text={content.title} highlight={content.titleHighlight} />
          </h2>

          {content.credentials.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {content.credentials.map((credential) => {
                const Icon = credentialIcons[credential.icon];
                return (
                  <li
                    key={credential.text}
                    className="inline-flex items-center gap-1.5 rounded-full border border-secondary/35 bg-secondary/10 px-3 py-1.5 text-sm font-semibold text-secondary"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {credential.text}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-5 space-y-3 text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
            {content.story.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          {content.values.length > 0 && (
            <ul className="mt-5 grid grid-cols-1 gap-2.5 text-base text-white/80 sm:grid-cols-2">
              {content.values.map((value) => (
                <li key={value} className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 flex-shrink-0 text-accent" aria-hidden="true" />
                  {value}
                </li>
              ))}
            </ul>
          )}

          {content.cta && (
            <a
              href={content.cta.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1877F2] px-6 py-3 text-base font-semibold text-white transition hover:bg-[#2b85f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:w-auto"
            >
              <ThumbsUp className="h-5 w-5" aria-hidden="true" />
              {content.cta.label}
              <span className="sr-only">（另開新視窗）</span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
