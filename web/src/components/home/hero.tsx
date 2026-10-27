"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface HeroSlide {
  src: string;
  alt: string;
  href: string;
}

const SLIDES: HeroSlide[] = [
  { src: "/banner1.png", alt: "ClassiAds_Hub — promo banner 1", href: "/search" },
  { src: "/banner2.png", alt: "ClassiAds_Hub — promo banner 2", href: "/search" },
];

const ROTATE_MS = 6000; // slow rotation — full slide visible 6 s before fading to the next
const FADE_MS = 800;    // crossfade duration

export function Hero() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setIdx((i) => (i + 1) % SLIDES.length), []);
  const prev = useCallback(() => setIdx((i) => (i - 1 + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, ROTATE_MS);
    return () => clearInterval(t);
  }, [next, paused]);

  return (
    <section className="bg-background py-6">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div
          className="relative aspect-[16/7] w-full overflow-hidden rounded-3xl shadow-sm"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {SLIDES.map((s, i) => (
            <Link
              key={s.src}
              href={s.href}
              aria-label={s.alt}
              aria-hidden={i !== idx}
              tabIndex={i === idx ? 0 : -1}
              className="absolute inset-0 transition-opacity ease-in-out"
              style={{
                opacity: i === idx ? 1 : 0,
                transitionDuration: `${FADE_MS}ms`,
                pointerEvents: i === idx ? "auto" : "none",
              }}
            >
              <Image
                src={s.src}
                alt={s.alt}
                fill
                priority={i === 0}
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-cover"
              />
            </Link>
          ))}

          <ArrowButton side="left" onClick={prev} />
          <ArrowButton side="right" onClick={next} />

          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIdx(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === idx ? "w-7 bg-white" : "w-2 bg-white/60 hover:bg-white/90"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ArrowButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous slide" : "Next slide"}
      className={`absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand shadow-md transition-colors hover:bg-white md:flex ${
        side === "left" ? "left-4" : "right-4"
      }`}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        {side === "left" ? (
          <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" />
        ) : (
          <path d="M8.59 7.41L13.17 12l-4.58 4.59L10 18l6-6-6-6z" />
        )}
      </svg>
    </button>
  );
}
