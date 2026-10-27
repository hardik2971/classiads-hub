import type { Metadata } from "next";
import { JobsList } from "./list";

export const metadata: Metadata = {
  title: "Jobs",
  description: "Find your next job on ClassiAds_Hub.",
};

export default function Page() {
  return <JobsList />;
}
