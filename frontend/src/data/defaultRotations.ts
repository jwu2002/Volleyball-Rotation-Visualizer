export const COLORS = {
  OH: "#FF4D4D",
  MB: "#ec4899",
  RS: "#0042f8ff",
  S: "#4DFF4D",
  L: "#8b5cf6",
};

/** One universal default config per system: id, name, system, and all 6 rotations. */
export type DefaultRotationConfig = {
  id: string;
  name: string;
  system: "5-1" | "6-2";
  rotations: { players: { id: string; x: number; y: number; color: string; label: string; isFrontRow?: boolean }[]; annotations?: never[] }[];
};

export const default51Rotations: DefaultRotationConfig[] = [
  {
    id: "5-1-default",
    name: "5-1 Default",
    system: "5-1",
    rotations: [
      {
        players: [
          { id: "RS1", x: 60, y: 250, color: COLORS.RS, label: "RS1", isFrontRow: true },
          { id: "MB2", x: 150, y: 175, color: COLORS.MB, label: "MB2", isFrontRow: true },
          { id: "OH1", x: 360, y: 400, color: COLORS.OH, label: "OH1", isFrontRow: true },
          { id: "MB1", x: 250, y: 430, color: COLORS.MB, label: "MB1", isFrontRow: false },
          { id: "OH2", x: 100, y: 450, color: COLORS.OH, label: "OH2", isFrontRow: false },
          { id: "S1", x: 430, y: 440, color: COLORS.S, label: "S1", isFrontRow: false },
        ],
      },
      {
        players: [
          { id: "RS1", x: 350, y: 80, color: COLORS.RS, label: "RS1", isFrontRow: true },
          { id: "MB2", x: 420, y: 220, color: COLORS.MB, label: "MB2", isFrontRow: true },
          { id: "S1", x: 280, y: 160, color: COLORS.S, label: "S1", isFrontRow: false },
          { id: "OH1", x: 360, y: 430, color: COLORS.OH, label: "OH1", isFrontRow: false },
          { id: "MB1", x: 250, y: 440, color: COLORS.MB, label: "MB1", isFrontRow: false },
          { id: "OH2", x: 130, y: 430, color: COLORS.OH, label: "OH2", isFrontRow: true },
        ],
      },
      {
        players: [
          { id: "MB1", x: 90, y: 180, color: COLORS.MB, label: "MB1", isFrontRow: true },
          { id: "S1", x: 180, y: 230, color: COLORS.S, label: "S1", isFrontRow: false },
          { id: "RS1", x: 420, y: 170, color: COLORS.RS, label: "RS1", isFrontRow: true },
          { id: "OH1", x: 260, y: 450, color: COLORS.OH, label: "OH1", isFrontRow: false },
          { id: "OH2", x: 130, y: 430, color: COLORS.OH, label: "OH2", isFrontRow: true },
          { id: "MB2", x: 370, y: 450, color: COLORS.MB, label: "MB2", isFrontRow: false },
        ],
      },
      {
        players: [
          { id: "S1", x: 60, y: 130, color: COLORS.S, label: "S1", isFrontRow: true },
          { id: "MB1", x: 100, y: 210, color: COLORS.MB, label: "MB1", isFrontRow: true },
          { id: "RS1", x: 430, y: 500, color: COLORS.RS, label: "RS1", isFrontRow: false },
          { id: "OH1", x: 260, y: 420, color: COLORS.OH, label: "OH1", isFrontRow: false },
          { id: "OH2", x: 130, y: 420, color: COLORS.OH, label: "OH2", isFrontRow: false },
          { id: "MB2", x: 390, y: 420, color: COLORS.MB, label: "MB2", isFrontRow: false },
        ],
      },
      {
        players: [
          { id: "MB1", x: 440, y: 220, color: COLORS.MB, label: "MB1", isFrontRow: true },
          { id: "S1", x: 340, y: 100, color: COLORS.S, label: "S1", isFrontRow: true },
          { id: "OH1", x: 100, y: 430, color: COLORS.OH, label: "OH1", isFrontRow: true },
          { id: "MB2", x: 240, y: 450, color: COLORS.MB, label: "MB2", isFrontRow: false },
          { id: "OH2", x: 400, y: 450, color: COLORS.OH, label: "OH2", isFrontRow: false },
          { id: "RS1", x: 300, y: 550, color: COLORS.RS, label: "RS1", isFrontRow: false },
        ],
      },
      {
        players: [
          { id: "MB2", x: 50, y: 190, color: COLORS.MB, label: "MB2", isFrontRow: true },
          { id: "S1", x: 340, y: 100, color: COLORS.S, label: "S1", isFrontRow: true },
          { id: "OH1", x: 120, y: 430, color: COLORS.OH, label: "OH1", isFrontRow: true },
          { id: "MB1", x: 425, y: 450, color: COLORS.MB, label: "MB1", isFrontRow: false },
          { id: "OH2", x: 280, y: 450, color: COLORS.OH, label: "OH2", isFrontRow: false },
          { id: "RS1", x: 200, y: 550, color: COLORS.RS, label: "RS1", isFrontRow: false },
        ],
      },
    ],
  },
];

export const default62Rotations: DefaultRotationConfig[] = [
  {
    id: "6-2-default",
    name: "6-2 Default",
    system: "6-2",
    rotations: [
      {
        players: [
          { id: "RS1", x: 60, y: 250, color: COLORS.RS, label: "RS1", isFrontRow: true },
          { id: "MB2", x: 150, y: 175, color: COLORS.MB, label: "MB2", isFrontRow: true },
          { id: "OH1", x: 360, y: 400, color: COLORS.OH, label: "OH1", isFrontRow: true },
          { id: "MB1", x: 250, y: 430, color: COLORS.MB, label: "MB1", isFrontRow: false },
          { id: "OH2", x: 100, y: 450, color: COLORS.OH, label: "OH2", isFrontRow: false },
          { id: "S1", x: 430, y: 440, color: COLORS.S, label: "S1", isFrontRow: false },
        ],
      },
      {
        players: [
          { id: "RS1", x: 350, y: 80, color: COLORS.RS, label: "RS1", isFrontRow: true },
          { id: "MB2", x: 420, y: 220, color: COLORS.MB, label: "MB2", isFrontRow: true },
          { id: "S1", x: 280, y: 160, color: COLORS.S, label: "S1", isFrontRow: false },
          { id: "OH1", x: 360, y: 430, color: COLORS.OH, label: "OH1", isFrontRow: false },
          { id: "MB1", x: 250, y: 440, color: COLORS.MB, label: "MB1", isFrontRow: false },
          { id: "OH2", x: 130, y: 430, color: COLORS.OH, label: "OH2", isFrontRow: true },
        ],
      },
      {
        players: [
          { id: "MB1", x: 90, y: 180, color: COLORS.MB, label: "MB1", isFrontRow: true },
          { id: "S1", x: 180, y: 230, color: COLORS.S, label: "S1", isFrontRow: false },
          { id: "RS1", x: 420, y: 170, color: COLORS.RS, label: "RS1", isFrontRow: true },
          { id: "OH1", x: 260, y: 450, color: COLORS.OH, label: "OH1", isFrontRow: false },
          { id: "OH2", x: 130, y: 430, color: COLORS.OH, label: "OH2", isFrontRow: true },
          { id: "MB2", x: 370, y: 450, color: COLORS.MB, label: "MB2", isFrontRow: false },
        ],
      },
      {
        players: [
          { id: "Setter2", x: 430, y: 440, color: COLORS.S, label: "S2", isFrontRow: false },
          { id: "MB1", x: 150, y: 175, color: COLORS.MB, label: "MB1", isFrontRow: true },
          { id: "RS2", x: 60, y: 250, color: COLORS.RS, label: "RS2", isFrontRow: true },
          { id: "OH1", x: 100, y: 450, color: COLORS.OH, label: "OH1", isFrontRow: false },
          { id: "OH2", x: 360, y: 400, color: COLORS.OH, label: "OH2", isFrontRow: true },
          { id: "MB2", x: 250, y: 430, color: COLORS.MB, label: "MB2", isFrontRow: false },
        ],
      },
      {
        players: [
          { id: "OH1", x: 130, y: 430, color: COLORS.OH, label: "OH1", isFrontRow: true },
          { id: "OH2", x: 360, y: 400, color: COLORS.OH, label: "OH2", isFrontRow: false },
          { id: "MB1", x: 420, y: 220, color: COLORS.MB, label: "MB1", isFrontRow: true },
          { id: "MB2", x: 250, y: 440, color: COLORS.MB, label: "MB2", isFrontRow: false },
          { id: "RS2", x: 350, y: 80, color: COLORS.RS, label: "RS2", isFrontRow: true },
          { id: "Setter2", x: 280, y: 160, color: COLORS.S, label: "S2", isFrontRow: false },
        ],
      },
      {
        players: [
          { id: "OH1", x: 130, y: 430, color: COLORS.OH, label: "OH1", isFrontRow: true },
          { id: "OH2", x: 260, y: 450, color: COLORS.OH, label: "OH2", isFrontRow: false },
          { id: "MB1", x: 370, y: 450, color: COLORS.MB, label: "MB1", isFrontRow: false },
          { id: "MB2", x: 90, y: 180, color: COLORS.MB, label: "MB2", isFrontRow: true },
          { id: "RS2", x: 420, y: 170, color: COLORS.RS, label: "RS2", isFrontRow: true },
          { id: "Setter2", x: 180, y: 230, color: COLORS.S, label: "S2", isFrontRow: false },
        ],
      },
    ],
  },
];
