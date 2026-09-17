import { ThreatDetailClient } from "./ThreatDetailClient";
import { THREATS } from "@/lib/mock/data";

// Static export: every detail page is pre-rendered for the fixture hashes.
export const dynamicParams = false;
export function generateStaticParams() {
  return THREATS.map((t) => ({ hash: t.rowHash }));
}

interface Props {
  params: Promise<{ hash: string }>;
}

export default async function ThreatDetailPage({ params }: Props) {
  const { hash } = await params;
  return <ThreatDetailClient hash={hash} />;
}
