import type { Metadata } from "next";

import { SightReading } from "@/app/components/sight-reading/sight-reading";

export const metadata: Metadata = {
  title: "Sight Reading • Tremolo",
  description: "Read an endless strip of notes scrolling past at your tempo.",
};

export default function SightReadingPage(): React.JSX.Element {
  return <SightReading />;
}
