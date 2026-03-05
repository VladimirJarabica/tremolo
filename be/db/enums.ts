export const Meter = {
    m_4_4: "m_4_4",
    m_3_4: "m_3_4",
    m_2_4: "m_2_4",
    m_6_8: "m_6_8",
    m_3_8: "m_3_8",
    m_2_2: "m_2_2"
} as const;
export type Meter = (typeof Meter)[keyof typeof Meter];
