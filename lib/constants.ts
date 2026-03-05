import { Meter } from "@/be/db/enums";

export const METER_OPTIONS: { value: Meter; label: string }[] = [
  { value: Meter.m_4_4, label: "4/4" },
  { value: Meter.m_3_4, label: "3/4" },
  { value: Meter.m_2_4, label: "2/4" },
  { value: Meter.m_6_8, label: "6/8" },
  { value: Meter.m_3_8, label: "3/8" },
  { value: Meter.m_2_2, label: "2/2" },
];
