import { SellerView } from "./view";

// Exported once as `_`; Firebase Hosting rewrites every /seller/* URL to it.
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function Page() {
  return <SellerView />;
}
