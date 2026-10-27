import Image from "next/image";
import Link from "next/link";

import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { Container } from "@/components/ui/misc";

export function Footer() {
  return (
    <footer className="mt-12 bg-brand text-white">
      <Container className="grid gap-10 py-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <Image
            src="/main-logo-webiste-footer.png"
            alt={APP_NAME}
            width={1073}
            height={278}
            className="h-10 w-auto"
          />
          <p className="mt-4 max-w-md text-sm text-white/75">
            {APP_TAGLINE} — Unleash the power of your passion. Share your unique creations, spark
            conversations, and find like-minded individuals. ClassiAds_Hub is more than just a
            marketplace.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <SocialIcon label="Facebook" path="M22 12a10 10 0 1 0-11.6 9.87v-6.98H7.9V12h2.5V9.8c0-2.47 1.47-3.83 3.72-3.83 1.08 0 2.21.19 2.21.19v2.43h-1.24c-1.22 0-1.6.76-1.6 1.54V12h2.72l-.43 2.89H13.5v6.98A10 10 0 0 0 22 12z" />
            <SocialIcon label="Instagram" path="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38a3.7 3.7 0 0 1 1.38-.9c.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 5.84a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 6.6a2.6 2.6 0 1 1 0-5.2 2.6 2.6 0 0 1 0 5.2zm5.13-6.78a.94.94 0 1 1-1.88 0 .94.94 0 0 1 1.88 0z" />
            <SocialIcon label="X" path="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.81l-5.32-6.97L4.2 22H.95l8.04-9.18L1.5 2h6.97l4.81 6.36L18.244 2zm-1.19 18h1.86L6.99 4H5l12.054 16z" />
            <SocialIcon label="LinkedIn" path="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8.34 18.34H5.67V9.67h2.67v8.67zM7 8.5a1.55 1.55 0 1 1 .002-3.1A1.55 1.55 0 0 1 7 8.5zm11.34 9.84h-2.67v-4.5c0-1.07-.02-2.45-1.5-2.45-1.5 0-1.74 1.17-1.74 2.37v4.58h-2.67V9.67h2.56v1.18h.04c.36-.68 1.24-1.4 2.55-1.4 2.72 0 3.23 1.79 3.23 4.12v4.77z" />
            <SocialIcon label="Pinterest" path="M12 0a12 12 0 0 0-4.37 23.17c-.1-.93-.2-2.36.04-3.38.22-.92 1.4-5.85 1.4-5.85s-.36-.72-.36-1.78c0-1.66.96-2.91 2.16-2.91 1.02 0 1.51.76 1.51 1.68 0 1.02-.65 2.56-.99 3.98-.28 1.19.6 2.16 1.77 2.16 2.13 0 3.76-2.25 3.76-5.49 0-2.87-2.06-4.88-5-4.88-3.41 0-5.41 2.56-5.41 5.2 0 1.03.4 2.13.89 2.73.1.12.11.22.08.34l-.33 1.36c-.05.22-.17.27-.4.16-1.5-.7-2.43-2.88-2.43-4.64 0-3.78 2.75-7.25 7.92-7.25 4.16 0 7.39 2.96 7.39 6.92 0 4.13-2.6 7.46-6.22 7.46-1.22 0-2.36-.63-2.75-1.38l-.75 2.85c-.27 1.04-1 2.35-1.5 3.14A12 12 0 1 0 12 0z" />
          </div>
        </div>

        <FooterCol
          className="md:col-span-3"
          title="Quick Links"
          links={[
            ["About Us", "/page/about"],
            ["Contact Us", "/page/contact"],
            ["Subscription", "/dashboard/subscriptions"],
            ["Our Blog", "/blog"],
            ["FAQs", "/page/faq"],
          ]}
        />

        <div className="md:col-span-4">
          <h4 className="mb-3 text-sm font-bold">Get in touch</h4>
          <ul className="space-y-2 text-sm text-white/75">
            <li className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" /></svg>
              </span>
              writeame@gmail.com
            </li>
            <li className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5"><path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1 1 0 0 0-1.02.24l-2.2 2.2a15.05 15.05 0 0 1-6.59-6.59l2.2-2.21a1 1 0 0 0 .25-1A11.36 11.36 0 0 1 8.5 4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1c0 9.39 7.61 17 17 17a1 1 0 0 0 1-1v-3.5a1 1 0 0 0-1-1z" /></svg>
              </span>
              +1 (555) 123-4567
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-3 py-4 text-xs text-white/70 sm:flex-row">
          <span>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/page/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/page/terms" className="hover:text-white">Terms &amp; Conditions</Link>
          </div>
        </Container>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
  className,
}: {
  title: string;
  links: [string, string][];
  className?: string;
}) {
  return (
    <div className={className}>
      <h4 className="mb-3 text-sm font-bold">{title}</h4>
      <ul className="space-y-2">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="text-sm text-white/75 hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialIcon({ label, path }: { label: string; path: string }) {
  return (
    <a
      href="#"
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d={path} />
      </svg>
    </a>
  );
}
