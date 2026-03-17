import { Meter, Scale, type Scale as ScaleType } from "@/be/db/enums";

export const METER_OPTIONS: { value: Meter; label: string }[] = [
  { value: Meter.m_4_4, label: "4/4" },
  { value: Meter.m_3_4, label: "3/4" },
  { value: Meter.m_2_4, label: "2/4" },
  { value: Meter.m_6_8, label: "6/8" },
  { value: Meter.m_3_8, label: "3/8" },
  { value: Meter.m_2_2, label: "2/2" },
];

export const SCALE_OPTIONS: { value: ScaleType; label: string }[] = [
  // Major - sharps
  { value: Scale.C, label: "C major" },
  { value: Scale.G, label: "G major" },
  { value: Scale.D, label: "D major" },
  { value: Scale.A, label: "A major" },
  { value: Scale.E, label: "E major" },
  { value: Scale.B, label: "B major" },
  { value: Scale.Fs, label: "F# major" },
  { value: Scale.Cs, label: "C# major" },
  // Major - flats
  { value: Scale.F, label: "F major" },
  { value: Scale.Bb, label: "Bb major" },
  { value: Scale.Eb, label: "Eb major" },
  { value: Scale.Ab, label: "Ab major" },
  { value: Scale.Db, label: "Db major" },
  { value: Scale.Gb, label: "Gb major" },
  { value: Scale.Cb, label: "Cb major" },
  // Minor - sharps
  { value: Scale.Am, label: "A minor" },
  { value: Scale.Em, label: "E minor" },
  { value: Scale.Bm, label: "B minor" },
  { value: Scale.Fsm, label: "F# minor" },
  { value: Scale.Csm, label: "C# minor" },
  { value: Scale.Gsm, label: "G# minor" },
  { value: Scale.Dsm, label: "D# minor" },
  { value: Scale.Asm, label: "A# minor" },
  // Minor - flats
  { value: Scale.Dm, label: "D minor" },
  { value: Scale.Gm, label: "G minor" },
  { value: Scale.Cm, label: "C minor" },
  { value: Scale.Fm, label: "F minor" },
  { value: Scale.Bbm, label: "Bb minor" },
  { value: Scale.Ebm, label: "Eb minor" },
  { value: Scale.Abm, label: "Ab minor" },
];

export const TIMES_IN_SECONDS = {
  HOUR: 60 * 60,
  MINUTE: 60,
  WEEK: 60 * 60 * 24 * 7,
};
