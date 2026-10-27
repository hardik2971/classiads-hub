import { AdDetail } from "./view";

// Exported once as `_`; Firebase Hosting rewrites every /ad/* URL to it.
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ slug: "_" }];
}

export default function Page() {
  return <AdDetail />;
}
