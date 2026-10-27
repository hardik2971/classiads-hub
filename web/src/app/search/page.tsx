import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchView } from "./view";

export const metadata: Metadata = {
  title: "Search Listings",
  description: "Find anything for sale near you — search by category, price and location.",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SearchView />
    </Suspense>
  );
}
