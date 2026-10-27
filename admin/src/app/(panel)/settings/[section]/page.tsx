import { SECTIONS } from "@/lib/settings-config";
import { SettingsSection } from "./section";

export function generateStaticParams() {
  return SECTIONS.map((s) => ({ section: s.slug }));
}

export default async function SettingsSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <SettingsSection slug={section} />;
}
