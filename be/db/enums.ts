export const Meter = {
    m_4_4: "m_4_4",
    m_3_4: "m_3_4",
    m_2_4: "m_2_4",
    m_6_8: "m_6_8",
    m_3_8: "m_3_8",
    m_2_2: "m_2_2"
} as const;
export type Meter = (typeof Meter)[keyof typeof Meter];
export const Scale = {
    C: "C",
    G: "G",
    D: "D",
    A: "A",
    E: "E",
    B: "B",
    Fs: "Fs",
    Cs: "Cs",
    F: "F",
    Bb: "Bb",
    Eb: "Eb",
    Ab: "Ab",
    Db: "Db",
    Gb: "Gb",
    Cb: "Cb",
    Am: "Am",
    Em: "Em",
    Bm: "Bm",
    Fsm: "Fsm",
    Csm: "Csm",
    Gsm: "Gsm",
    Dsm: "Dsm",
    Asm: "Asm",
    Dm: "Dm",
    Gm: "Gm",
    Cm: "Cm",
    Fm: "Fm",
    Bbm: "Bbm",
    Ebm: "Ebm",
    Abm: "Abm"
} as const;
export type Scale = (typeof Scale)[keyof typeof Scale];
