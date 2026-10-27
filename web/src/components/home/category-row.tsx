import Link from "next/link";

import type { Category } from "@/lib/types";
import { categoryEmoji } from "@/components/category-icon";
import { Container } from "@/components/ui/misc";

export function CategoryRow({ categories }: { categories: Category[] }) {
  return (
    <section className="py-6">
      <Container>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold sm:text-xl">Popular Categories</h2>
          <div className="hidden gap-2 md:flex">
            <CircleArrow direction="left" />
            <CircleArrow direction="right" />
          </div>
        </div>
        <div className="-mx-1 grid grid-flow-col auto-cols-[minmax(110px,1fr)] gap-3 overflow-x-auto px-1 pb-1 sm:auto-cols-[minmax(0,1fr)] sm:grid-cols-5 sm:grid-flow-row lg:grid-cols-9">
          {categories.slice(0, 9).map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="flex flex-col items-center gap-2 rounded-2xl p-2 text-center transition-colors hover:bg-card"
            >
              <span className="grid h-16 w-16 place-items-center rounded-full bg-card text-3xl shadow-sm ring-1 ring-border">
                {categoryEmoji(c.slug)}
              </span>
              <span className="line-clamp-2 text-xs font-medium leading-tight">{c.name}</span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

function CircleArrow({ direction }: { direction: "left" | "right" }) {
  return (
    <button
      type="button"
      aria-label={direction === "left" ? "Scroll left" : "Scroll right"}
      className="grid h-8 w-8 place-items-center rounded-full bg-card text-brand shadow-sm ring-1 ring-border transition-colors hover:bg-brand hover:text-white"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
        {direction === "left" ? (
          <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" />
        ) : (
          <path d="M8.59 7.41L13.17 12l-4.58 4.59L10 18l6-6-6-6z" />
        )}
      </svg>
    </button>
  );
}
