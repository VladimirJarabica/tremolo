import type { Metadata } from "next";
import { PitchTrainer } from "@/app/components/pitch-trainer/pitch-trainer";

export const metadata: Metadata = {
  title: "Pitch Trainer • Tremolo",
  description: "Train your ear: listen to a note and guess which one it was.",
};

export default function TrainerPage(): React.JSX.Element {
  return <PitchTrainer />;
}
