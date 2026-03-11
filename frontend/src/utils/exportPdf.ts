import { PDFDocument, StandardFonts, grayscale } from "pdf-lib";
import type { PDFPage, PDFFont } from "pdf-lib";
import type { Lineup, LineupPositionId, LineupEntry } from "../components/StartingLineup";
import { getRoleDisplayName, normalizePlayerId } from "./visualizerRotations";
import { getRotationTableLabel } from "./lineupHelpers";
import { COURT_WIDTH, COURT_HEIGHT } from "../constants";

export type SavedAnnotation = {
  type: "path" | "arrow";
  points: number[];
  stroke?: string;
  pointerAtBeginning?: boolean;
  pointerAtEnding?: boolean;
  tension?: number;
};

export type RotationDataItem = {
  players: { id: string; x: number; y: number; isFrontRow?: boolean }[];
  annotations?: SavedAnnotation[];
};

export async function buildRotationTablePdf(params: {
  configName: string;
  rotationData: RotationDataItem[];
  lineup: Lineup;
  applyLineup: boolean;
  rotations: number[];
}): Promise<Uint8Array> {
  const { configName, rotationData, lineup, applyLineup, rotations } = params;
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([612, 792]);
  const PAGE_W = 612;
  const PAGE_H = 792;
  const M = 28;
  const TITLE_SPACE = 24;
  const CENTER_GAP = 6;
  const POSITION_GROUPS_GAP = 8;
  const blocksStartX = M;
  const blocksAreaW = PAGE_W - 2 * M;
  const COLS = 2;
  const BLOCK_W = blocksAreaW / COLS;
  const LIBS_RESERVED = 24;
  const tableWidthPerBlock = BLOCK_W - LIBS_RESERVED;
  const cellW = Math.floor(tableWidthPerBlock / 3);
  const BLOCK_CONTENT_H = 56;
  const BLOCK_H = BLOCK_CONTENT_H;

  const cellH = 18;
  const labelSize = 8;
  const headerSize = 10;
  const libsLabelSize = 7;

  const liberoNum = applyLineup ? (lineup["L"]?.number?.trim() || "None") : "";

  page.setFont(font);
  page.setFontSize(16);
  page.drawText(configName || "Rotation sheet", { x: M, y: PAGE_H - M - 22 });

  const posGroupsHeight = applyLineup
    ? Math.max(
        ...POSITION_GROUPS.map(
          (g) =>
            POSITION_GROUP_TITLE_H +
            POSITION_GROUP_HEADER_H +
            Math.max(1, g.positions.length) * POSITION_GROUP_ROW_H
        )
      )
    : 0;
  if (applyLineup) {
    const posGroupsY = PAGE_H - M - TITLE_SPACE - posGroupsHeight;
    drawPositionGroupsRow(page, font, lineup, {
      x: M,
      y: posGroupsY,
      totalWidth: blocksAreaW,
      gap: POSITION_GROUPS_GAP,
      fontSize: 7,
    });
  }
  const posGroupsGap = applyLineup ? 12 : 0;
  const topRowBottom =
    PAGE_H - M - TITLE_SPACE - posGroupsHeight - posGroupsGap - BLOCK_H;

  rotations.forEach((rotNum, idx) => {
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const baseX = blocksStartX + col * BLOCK_W;
    const baseY = topRowBottom - row * (CENTER_GAP + BLOCK_H);
    const blockTop = baseY + BLOCK_H - 8;

    page.setFontSize(headerSize);
    page.drawText(`Rotation ${rotNum}`, { x: baseX, y: blockTop });

    const snap = rotationData[rotNum - 1];
    if (!snap?.players?.length) return;

    const ordered = playersInCourtOrder(snap.players);
    const labels = ordered.map((p) => {
      const roleLabel = getRoleDisplayName(normalizePlayerId(p.id));
      return applyLineup ? getRotationTableLabel(p.id, lineup, roleLabel) : roleLabel;
    });

    const tableY = blockTop - 10 - cellH * 2;
    drawTable(page, font, { x: baseX, y: tableY, cellW, cellH, labels, fontSize: labelSize });

    if (applyLineup) {
      const libsX = baseX + cellW * 3 + 6;
      page.setFontSize(libsLabelSize);
      page.drawText("Libs", { x: libsX, y: tableY + cellH * 2 - 2, size: libsLabelSize });
      page.drawText(liberoNum, { x: libsX, y: tableY + cellH - 2, size: libsLabelSize });
    }
  });

  const courtsGap = 10;
  const courtBlockW = blocksAreaW / 3;
  const courtLabelSize = 7;
  const tableBottomY = topRowBottom - 2 * (CENTER_GAP + BLOCK_H) + BLOCK_H - 8 - 10 - cellH * 2;
  const gapBelowTables = 14;
  const courtLabelHeight = courtLabelSize + 2;
  const courtsSectionTop = tableBottomY - gapBelowTables;
  const courtYTopRow = courtsSectionTop - COURT_PDF_H - courtLabelHeight;
  const courtYBottomRow = courtYTopRow - (COURT_ROW_H + courtsGap);
  rotations.forEach((rotNum, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const courtX = blocksStartX + col * courtBlockW + (courtBlockW - COURT_PDF_W) / 2;
    const courtY = row === 0 ? courtYTopRow : courtYBottomRow;
    const snap = rotationData[rotNum - 1];
    page.setFontSize(courtLabelSize);
    page.drawText(`Rotation ${rotNum}`, { x: courtX, y: courtY + COURT_PDF_H + 2, size: courtLabelSize });
    if (snap?.players?.length) {
      drawSmallCourt(page, font, {
        x: courtX,
        y: courtY,
        players: snap.players,
        lineup,
        applyLineup,
        annotations: snap.annotations ?? [],
        labelFontSize: 6,
      });
    }
  });

  return pdfDoc.save();
}

// --- internal constants and helpers ---

const TABLE_BORDER = grayscale(0.35);
const LINE_THICKNESS = 0.5;

const COURT_PDF_W = 170;
const COURT_PDF_H = 200;
const COURT_LABEL_H = 8;
const COURT_ROW_H = COURT_PDF_H + COURT_LABEL_H + 6;
const ATTACK_LINE_Y_APP = 200;

const POSITION_GROUP_ROW_H = 12;
const POSITION_GROUP_HEADER_H = 10;
const POSITION_GROUP_TITLE_H = 10;

const POSITION_GROUPS: { title: string; positions: LineupPositionId[] }[] = [
  { title: "Setters", positions: ["S1", "S2"] },
  { title: "Liberos", positions: ["L"] },
  { title: "Middles", positions: ["MB1", "MB2"] },
  { title: "Outsides", positions: ["OH1", "OH2"] },
  { title: "Opposites", positions: ["RS1", "RS2"] },
];

function playersInCourtOrder<T extends { x: number; isFrontRow?: boolean }>(players: T[]): T[] {
  return [...players].sort((a, b) => {
    const aFront = a.isFrontRow ?? false;
    const bFront = b.isFrontRow ?? false;
    if (aFront !== bFront) return aFront ? -1 : 1;
    return a.x - b.x;
  });
}

function getPositionGroupRow(entry: LineupEntry | undefined): { number: string; name: string } {
  if (!entry) return { number: "None", name: "None" };
  const num = entry.number?.trim() || "None";
  const name = [entry.firstName?.trim(), entry.lastName?.trim()].filter(Boolean).join(" ").trim() || "None";
  return { number: num, name };
}

function drawPositionGroupTable(
  page: PDFPage,
  font: PDFFont,
  lineup: Lineup,
  group: { title: string; positions: LineupPositionId[] },
  opts: { x: number; y: number; width: number; fontSize: number }
) {
  const { x, y, width, fontSize } = opts;
  const col1W = width * 0.5;
  const rowCount = Math.max(1, group.positions.length);
  const tableH = POSITION_GROUP_TITLE_H + POSITION_GROUP_HEADER_H + rowCount * POSITION_GROUP_ROW_H;
  const w = width;
  page.setFont(font);
  page.drawRectangle({
    x,
    y,
    width: w,
    height: tableH,
    borderWidth: LINE_THICKNESS,
    borderColor: TABLE_BORDER,
  });
  page.drawLine({
    start: { x, y: y + tableH - POSITION_GROUP_TITLE_H },
    end: { x: x + w, y: y + tableH - POSITION_GROUP_TITLE_H },
    thickness: LINE_THICKNESS,
    color: TABLE_BORDER,
  });
  page.drawLine({
    start: { x, y: y + tableH - POSITION_GROUP_TITLE_H - POSITION_GROUP_HEADER_H },
    end: { x: x + w, y: y + tableH - POSITION_GROUP_TITLE_H - POSITION_GROUP_HEADER_H },
    thickness: LINE_THICKNESS,
    color: TABLE_BORDER,
  });
  page.drawLine({
    start: { x: x + col1W, y },
    end: { x: x + col1W, y: y + tableH },
    thickness: LINE_THICKNESS,
    color: TABLE_BORDER,
  });
  const pad = 3;
  page.setFontSize(fontSize + 1);
  page.drawText(group.title, { x: x + pad, y: y + tableH - POSITION_GROUP_TITLE_H + pad, size: fontSize + 1 });
  page.setFontSize(fontSize);
  page.drawText("Player Number", { x: x + pad, y: y + tableH - POSITION_GROUP_TITLE_H - POSITION_GROUP_HEADER_H + pad, size: fontSize });
  page.drawText("Player Name", { x: x + col1W + pad, y: y + tableH - POSITION_GROUP_TITLE_H - POSITION_GROUP_HEADER_H + pad, size: fontSize });
  group.positions.forEach((posId, i) => {
    const entry = lineup[posId];
    const { number, name } = getPositionGroupRow(entry);
    const rowY = y + tableH - POSITION_GROUP_TITLE_H - POSITION_GROUP_HEADER_H - (i + 1) * POSITION_GROUP_ROW_H + pad;
    page.drawText(number, { x: x + pad, y: rowY, size: fontSize });
    page.drawText(name, { x: x + col1W + pad, y: rowY, size: fontSize });
  });
}

function drawPositionGroupsRow(
  page: PDFPage,
  font: PDFFont,
  lineup: Lineup,
  opts: { x: number; y: number; totalWidth: number; gap: number; fontSize: number }
): number {
  const { x, y, totalWidth, gap, fontSize } = opts;
  const n = POSITION_GROUPS.length;
  const tableW = (totalWidth - (n - 1) * gap) / n;
  let maxH = 0;
  POSITION_GROUPS.forEach((group, i) => {
    const gx = x + i * (tableW + gap);
    const rowCount = Math.max(1, group.positions.length);
    const h = POSITION_GROUP_TITLE_H + POSITION_GROUP_HEADER_H + rowCount * POSITION_GROUP_ROW_H;
    if (h > maxH) maxH = h;
    drawPositionGroupTable(page, font, lineup, group, { x: gx, y, width: tableW, fontSize });
  });
  return maxH;
}

function drawTable(
  page: PDFPage,
  font: PDFFont,
  opts: {
    x: number;
    y: number;
    cellW: number;
    cellH: number;
    labels: string[];
    fontSize: number;
  }
) {
  const { x, y, cellW, cellH, labels, fontSize } = opts;
  const w = cellW * 3;
  const h = cellH * 2;
  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    borderWidth: LINE_THICKNESS,
    borderColor: TABLE_BORDER,
  });
  page.drawLine({
    start: { x, y: y + cellH },
    end: { x: x + w, y: y + cellH },
    thickness: LINE_THICKNESS,
    color: TABLE_BORDER,
  });
  page.drawLine({
    start: { x: x + cellW, y },
    end: { x: x + cellW, y: y + h },
    thickness: LINE_THICKNESS,
    color: TABLE_BORDER,
  });
  page.drawLine({
    start: { x: x + cellW * 2, y },
    end: { x: x + cellW * 2, y: y + h },
    thickness: LINE_THICKNESS,
    color: TABLE_BORDER,
  });
  page.setFont(font);
  page.setFontSize(fontSize);
  const padH = 5;
  const padV = 4;
  const textY0 = y + cellH + padV;
  const textY1 = y + padV;
  for (let c = 0; c < 3; c++) {
    const cx = x + c * cellW + padH;
    if (labels[c]) page.drawText(labels[c], { x: cx, y: textY0, size: fontSize });
    if (labels[3 + c]) page.drawText(labels[3 + c], { x: cx, y: textY1, size: fontSize });
  }
}

function scaleToCourt(px: number, py: number, courtX: number, courtY: number): { x: number; y: number } {
  const x = courtX + (px / COURT_WIDTH) * COURT_PDF_W;
  const y = courtY + COURT_PDF_H - (py / COURT_HEIGHT) * COURT_PDF_H;
  return { x, y };
}

function drawSmallCourt(
  page: PDFPage,
  font: PDFFont,
  opts: {
    x: number;
    y: number;
    players: { id: string; x: number; y: number }[];
    lineup: Lineup;
    applyLineup: boolean;
    annotations: SavedAnnotation[];
    labelFontSize: number;
  }
) {
  const { x, y, players, lineup, applyLineup, annotations, labelFontSize } = opts;
  page.drawRectangle({
    x,
    y,
    width: COURT_PDF_W,
    height: COURT_PDF_H,
    borderWidth: LINE_THICKNESS,
    borderColor: TABLE_BORDER,
  });
  const attackY = y + COURT_PDF_H - (ATTACK_LINE_Y_APP / COURT_HEIGHT) * COURT_PDF_H;
  page.drawLine({
    start: { x, y: attackY },
    end: { x: x + COURT_PDF_W, y: attackY },
    thickness: LINE_THICKNESS,
    color: grayscale(0.5),
  });
  const strokeColor = grayscale(0.25);
  annotations.forEach((ann) => {
    if (!ann.points || ann.points.length < 4) return;
    for (let i = 0; i < ann.points.length - 2; i += 2) {
      const a = scaleToCourt(ann.points[i], ann.points[i + 1], x, y);
      const b = scaleToCourt(ann.points[i + 2], ann.points[i + 3], x, y);
      page.drawLine({ start: a, end: b, thickness: 0.8, color: strokeColor });
    }
    if (ann.type === "arrow" && ann.points.length >= 4) {
      const n = ann.points.length;
      const end = scaleToCourt(ann.points[n - 2], ann.points[n - 1], x, y);
      const prev = scaleToCourt(ann.points[n - 4], ann.points[n - 3], x, y);
      const dx = end.x - prev.x;
      const dy = end.y - prev.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const ah = 4;
      page.drawLine({ start: end, end: { x: end.x - ux * ah - uy * ah, y: end.y - uy * ah + ux * ah }, thickness: 0.8, color: strokeColor });
      page.drawLine({ start: end, end: { x: end.x - ux * ah + uy * ah, y: end.y - uy * ah - ux * ah }, thickness: 0.8, color: strokeColor });
    }
  });
  const r = 11;
  page.setFont(font);
  page.setFontSize(labelFontSize);
  players.forEach((p) => {
    const cx = x + (p.x / COURT_WIDTH) * COURT_PDF_W;
    const cy = y + COURT_PDF_H - (p.y / COURT_HEIGHT) * COURT_PDF_H;
    page.drawEllipse({
      x: cx,
      y: cy,
      xScale: r,
      yScale: r,
      borderWidth: 0.5,
      borderColor: TABLE_BORDER,
    });
    const roleLabel = getRoleDisplayName(normalizePlayerId(p.id));
    const label = applyLineup ? getRotationTableLabel(p.id, lineup, roleLabel) : roleLabel;
    const tw = label.length * labelFontSize * 0.5;
    page.drawText(label, { x: cx - tw / 2, y: cy - labelFontSize / 2, size: labelFontSize });
  });
}
