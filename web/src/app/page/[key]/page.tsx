import { CmsPageView } from "./view";

// Exported once as `_`; Firebase Hosting rewrites every /page/* URL to it.
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ key: "_" }];
}

export default function Page() {
  return <CmsPageView />;
}
