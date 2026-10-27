import type { Metadata } from "next";
import { BlogList } from "./list";

export const metadata: Metadata = {
  title: "Blog",
  description: "News, tips and updates from ClassiAds_Hub.",
};

export default function Page() {
  return <BlogList />;
}
