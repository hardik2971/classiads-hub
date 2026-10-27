import { EditAdView } from "./view";

// Exported once as `_`; Firebase Hosting rewrites /dashboard/ads/*/edit to it.
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function Page() {
  return <EditAdView />;
}
