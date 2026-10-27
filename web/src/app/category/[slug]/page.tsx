import { Suspense } from "react";
import { CategoryView } from "./view";

// Exported once as `_`; Firebase Hosting rewrites every /category/* URL to it.
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ slug: "_" }];
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CategoryView />
    </Suspense>
  );
}
