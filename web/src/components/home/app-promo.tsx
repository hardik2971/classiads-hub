import Image from "next/image";

import { Container } from "@/components/ui/misc";

export function AppPromoBanner() {
  return (
    <section className="py-10">
      <Container>
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-accent px-6 py-8 text-accent-foreground sm:flex-row sm:px-12">
          <h3 className="max-w-md text-center text-xl font-extrabold sm:text-left sm:text-2xl">
            Experience the Magic of the ClassiAds_Hub App
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <StoreBadge href="#" src="/Google-play-store.png" alt="Get it on Google Play" />
            <StoreBadge href="#" src="/app-store.png" alt="Download on the App Store" />
          </div>
        </div>
      </Container>
    </section>
  );
}

function StoreBadge({ href, src, alt }: { href: string; src: string; alt: string }) {
  return (
    <a
      href={href}
      aria-label={alt}
      className="inline-block transition-transform hover:scale-[1.04]"
    >
      <Image
        src={src}
        alt={alt}
        width={267}
        height={117}
        className="h-14 w-auto sm:h-16"
      />
    </a>
  );
}
