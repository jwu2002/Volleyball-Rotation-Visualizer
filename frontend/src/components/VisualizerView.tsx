import React, { useState, useRef, useCallback } from "react";
import type { RefObject } from "react";
import { PDFDocument, StandardFonts, grayscale } from "pdf-lib";
import "../styles/VisualizerView.css";
import "../styles/StartingLineup.css";
import { Court, type CourtRef, type Annotation } from "./Court";
import { type Lineup, type LineupPositionId, type LineupEntry } from "./StartingLineup";
import { LineupTable } from "./LineupTable";
import { ExportModal, type ExportOptions } from "./Modals";
import { default51Rotations, default62Rotations } from "../data/defaultRotations";
import type { SavedVisualizerConfig, RotationSnapshot } from "../types/savedConfig";
import { getRoleColorFromId, getRoleDisplayName, normalizePlayerId } from "../utils/visualizerRotations";
import { getRotationTableLabel } from "../utils/lineupHelpers";
import { COURT_WIDTH, COURT_HEIGHT, COURT_TOOLBAR_HEIGHT } from "../constants";
import { auth } from "../firebaseConfig";

export type VisualizerPlayer = {
  id: string;
  x: number;
  y: number;
  color: string;
  label: string;
  isFrontRow?: boolean;
  isLibero?: boolean;
};

export type VisualizerViewContext = {
  mainContentRef: RefObject<HTMLDivElement | null>;
  courtContainerRef: RefObject<HTMLDivElement | null>;
  courtScale: number;
  courtContainerReady: boolean;
  serveReceive: boolean;
  setServeReceive: (v: boolean) => void;
  rotation: number;
  rotationData: RotationSnapshot[];
  system: "5-1" | "6-2";
  customConfigKey: string;
  currentConfigDisplayName: string;
  updatePlayers: (sys: "5-1" | "6-2", rot: number, receive: boolean) => void;
  handleServeReceiveChange: (useReceive: boolean) => void;
  handleRotationChange: (r: number) => void;
  handleSystemChange: (sys: "5-1" | "6-2") => void;
  players: VisualizerPlayer[];
  currentLibero: VisualizerPlayer | undefined;
  setPlayers: React.Dispatch<React.SetStateAction<VisualizerPlayer[]>>;
  showLiberoModal: boolean;
  liberoTargetId: string | null;
  setLiberoTargetId: (id: string | null) => void;
  setShowLiberoModal: (v: boolean) => void;
  handleConfirmLiberoSwitch: () => void;
  lineup: Lineup;
  handleLineupChange: (position: LineupPositionId, entry: LineupEntry) => void;
  lineupShowNumber: boolean;
  lineupShowName: boolean;
  setLineupShowNumber: (v: boolean) => void;
  setLineupShowName: (v: boolean) => void;
  savedLineups: { id: string; name: string; lineup: Lineup; showNumber: boolean; showName: boolean }[];
  selectedLineupId: string | null;
  handleSelectLineup: (id: string | null) => void;
  handleSaveLineupAsClick: () => void;
  handleSaveLineupClick: () => void;
  handleDeleteLineup: (id: string) => void;
  handleDeleteConfig: (id: string) => void;
  user: { isAnonymous?: boolean; email?: string | null } | null;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  fileMenuOpen: boolean;
  setFileMenuOpen: (v: boolean | ((o: boolean) => boolean)) => void;
  activeView: "court" | "planAhead";
  customConfigs: SavedVisualizerConfig[];
  handleCustomConfigChange: (value: string) => void;
  setNewSystem: (v: "5-1" | "6-2") => void;
  setNewRotation: (v: number) => void;
  showSaveModal: boolean;
  newName: string;
  newSystem: "5-1" | "6-2";
  newRotation: number;
  saveConfigMode: "one" | "multi";
  saveRotationOne: number;
  saveRotationsMulti: boolean[];
  setNewName: (v: string) => void;
  setShowSaveModal: (v: boolean) => void;
  setSaveConfigMode: (v: "one" | "multi") => void;
  setSaveRotationOne: (v: number) => void;
  setSaveRotationsMulti: React.Dispatch<React.SetStateAction<boolean[]>>;
  handleSaveNewConfig: () => void;
  handleOverwriteCurrentConfig: () => void;
  showSaveLineupModal: boolean;
  saveLineupName: string;
  setSaveLineupName: (v: string) => void;
  setShowSaveLineupModal: (v: boolean) => void;
  handleSaveLineupSubmit: () => void;
  showSavePlanModal: boolean;
  savePlanName: string;
  setSavePlanName: (v: string) => void;
  setShowSavePlanModal: (v: boolean) => void;
  lineupExplorerOpen: boolean;
  setLineupExplorerOpen: (v: boolean) => void;
  showExportModal: boolean;
  setShowExportModal: (v: boolean) => void;
  exportRotations: boolean[];
  setExportRotations: React.Dispatch<React.SetStateAction<boolean[]>>;
  exportLineupId: string | null;
  setExportLineupId: (v: string | null) => void;
  exportConfigId: string | null;
  setExportConfigId: (v: string | null) => void;
  exporting: boolean;
  setExporting: (v: boolean) => void;
  previewPdfUrl: string | null;
  setPreviewPdfUrl: (v: string | null) => void;
  drawMode: boolean;
  setDrawMode: (v: boolean) => void;
  drawPopoverOpen: boolean;
  setDrawPopoverOpen: (v: boolean) => void;
  drawTool: "select" | "pencil" | "arrow" | "eraser";
  setDrawTool: (v: "select" | "pencil" | "arrow" | "eraser") => void;
  pencilColor: string;
  setPencilColor: (v: string) => void;
  pencilMenuOpen: boolean;
  setPencilMenuOpen: (v: boolean | ((o: boolean) => boolean)) => void;
  arrowColor: string;
  setArrowColor: (v: string) => void;
  arrowMenuOpen: boolean;
  setArrowMenuOpen: (v: boolean | ((o: boolean) => boolean)) => void;
  arrowCurved: boolean;
  setArrowCurved: (v: boolean) => void;
  selectedAnnotationIndices: number[];
  setSelectedAnnotationIndices: React.Dispatch<React.SetStateAction<number[]>>;
  pushUndo: () => void;
  setAnnotations: React.Dispatch<React.SetStateAction<Annotation[]>>;
  annotations: Annotation[];
  translateAnnotation: (ann: Annotation, dx: number, dy: number) => Annotation;
  isLocked: boolean;
  setIsLocked: (v: boolean) => void;
  handleReset: () => void;
  undoStackRef: React.MutableRefObject<Annotation[][]>;
  redoStackRef: React.MutableRefObject<Annotation[][]>;
  undoStackLength: number;
  redoStackLength: number;
  setUndoStackLength: (n: number) => void;
  setRedoStackLength: (n: number) => void;
  displayPlayers: VisualizerPlayer[];
  handleDragEnd: (id: string, x: number, y: number) => void;
  revertKey: number;
  showOutOfRotation: boolean;
  outOfRotationMessage: string;
  handleRevertOutOfRotation: () => void;
};

const DRAW_COLORS = ["#1a1a1a", "#e11d48", "#2563eb", "#16a34a"];

function undoClick(ctx: VisualizerViewContext) {
  if (ctx.undoStackRef.current.length) {
    ctx.redoStackRef.current.push(JSON.parse(JSON.stringify(ctx.annotations)));
    ctx.setRedoStackLength(ctx.redoStackRef.current.length);
    ctx.setAnnotations(ctx.undoStackRef.current.pop()!);
    ctx.setUndoStackLength(ctx.undoStackRef.current.length);
    ctx.setSelectedAnnotationIndices([]);
  }
}

function redoClick(ctx: VisualizerViewContext) {
  if (ctx.redoStackRef.current.length) {
    ctx.undoStackRef.current.push(JSON.parse(JSON.stringify(ctx.annotations)));
    ctx.setUndoStackLength(ctx.undoStackRef.current.length);
    ctx.setAnnotations(ctx.redoStackRef.current.pop()!);
    ctx.setRedoStackLength(ctx.redoStackRef.current.length);
    ctx.setSelectedAnnotationIndices([]);
  }
}

type Props = { ctx: VisualizerViewContext };

/** Sort 6 players into court order: front row (isFrontRow) left to right, then back row left to right. */
function playersInCourtOrder<T extends { x: number; isFrontRow?: boolean }>(players: T[]): T[] {
  return [...players].sort((a, b) => {
    const aFront = a.isFrontRow ?? false;
    const bFront = b.isFrontRow ?? false;
    if (aFront !== bFront) return aFront ? -1 : 1;
    return a.x - b.x;
  });
}

const TABLE_BORDER = grayscale(0.35);
const LINE_THICKNESS = 0.5;

const POSITION_GROUPS: { title: string; positions: LineupPositionId[] }[] = [
  { title: "Setters", positions: ["S1", "S2"] },
  { title: "Liberos", positions: ["L"] },
  { title: "Middles", positions: ["MB1", "MB2"] },
  { title: "Outsides", positions: ["OH1", "OH2"] },
  { title: "Opposites", positions: ["RS1", "RS2"] },
];

function getPositionGroupRow(entry: LineupEntry | undefined): { number: string; name: string } {
  if (!entry) return { number: "None", name: "None" };
  const num = entry.number?.trim() || "None";
  const name = [entry.firstName?.trim(), entry.lastName?.trim()].filter(Boolean).join(" ").trim() || "None";
  return { number: num, name };
}

const POSITION_GROUP_ROW_H = 12;
const POSITION_GROUP_HEADER_H = 10;
const POSITION_GROUP_TITLE_H = 10;

/** Draw one position group as a bordered table. (x, y) = bottom-left of table. */
function drawPositionGroupTable(
  page: import("pdf-lib").PDFPage,
  font: import("pdf-lib").PDFFont,
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

/** Draw all position group tables in a horizontal row. (x, y) = bottom-left of the row. Returns height used. */
function drawPositionGroupsRow(
  page: import("pdf-lib").PDFPage,
  font: import("pdf-lib").PDFFont,
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

/** Draw a 2x3 table with borders and optional cell labels. (x,y) = bottom-left of table. */
function drawTable(
  page: import("pdf-lib").PDFPage,
  font: import("pdf-lib").PDFFont,
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
  // Outer border
  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    borderWidth: LINE_THICKNESS,
    borderColor: TABLE_BORDER,
  });
  // Inner horizontal line
  page.drawLine({
    start: { x, y: y + cellH },
    end: { x: x + w, y: y + cellH },
    thickness: LINE_THICKNESS,
    color: TABLE_BORDER,
  });
  // Inner vertical lines
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
  // Cell text with padding so it doesn't touch borders (y = bottom of table)
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

const COURT_PDF_W = 170;
const COURT_PDF_H = 200;
const COURT_LABEL_H = 8;
const COURT_ROW_H = COURT_PDF_H + COURT_LABEL_H + 6;
const ATTACK_LINE_Y_APP = 200;

type SavedAnnotation = { type: "path" | "arrow"; points: number[]; stroke?: string; pointerAtBeginning?: boolean; pointerAtEnding?: boolean; tension?: number };

function scaleToCourt(px: number, py: number, courtX: number, courtY: number): { x: number; y: number } {
  const x = courtX + (px / COURT_WIDTH) * COURT_PDF_W;
  const y = courtY + COURT_PDF_H - (py / COURT_HEIGHT) * COURT_PDF_H;
  return { x, y };
}

/** Draw one small court: outline, attack line, annotations, player circles with labels. */
function drawSmallCourt(
  page: import("pdf-lib").PDFPage,
  font: import("pdf-lib").PDFFont,
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

/** Build rotation table PDF (one page: title + 6 rotations, one table per rotation; optional position groups + Libs when lineup applied; 6 courts at bottom). */
async function buildRotationTablePdf(params: {
  configName: string;
  rotationData: { players: { id: string; x: number; y: number; isFrontRow?: boolean }[]; annotations?: SavedAnnotation[] }[];
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
  const tableBottomY = topRowBottom - 2 * (CENTER_GAP + BLOCK_H) + BLOCK_H - 8 - 10 - cellH * 2; // bottom y of lowest rotation table
  const gapBelowTables = 14;
  const courtLabelHeight = courtLabelSize + 2;
  const courtsSectionTop = tableBottomY - gapBelowTables;
  const courtYTopRow = courtsSectionTop - COURT_PDF_H - courtLabelHeight;
  const courtYBottomRow = courtYTopRow - (COURT_ROW_H + courtsGap);
  [1, 2, 3, 4, 5, 6].forEach((rotNum, idx) => {
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

export function VisualizerView({ ctx }: Props) {
  const c = ctx;
  const courtRef = useRef<CourtRef>(null);
  const [signInTooltip, setSignInTooltip] = useState<"lineup" | "saveAs" | null>(null);
  const [lineupMenuOpen, setLineupMenuOpen] = useState(false);
  const needSignIn = !c.user || c.user.isAnonymous;
  const selectedLineupName = c.selectedLineupId ? c.savedLineups.find((l) => l.id === c.selectedLineupId)?.name ?? "" : "";

  const handleExportRequest = useCallback(
    async (opts: ExportOptions) => {
      const { applyLineup, lineupId, configId, rotations } = opts;
      if (rotations.length === 0) return;
      const rotationBefore = c.rotation;
      const lineup =
        applyLineup && lineupId
          ? (c.savedLineups.find((l) => l.id === lineupId)?.lineup as Lineup) ?? {}
          : c.lineup;
      const config = configId ? c.customConfigs.find((cf) => cf.id === configId) : null;
      const rotationData = config?.rotations ?? c.rotationData;
      const configName = config?.name ?? (c.currentConfigDisplayName || `Default (${c.system} R${c.rotation})`);
      c.setExporting(true);
      try {
        const pdfBytes = await buildRotationTablePdf({
          configName,
          rotationData,
          lineup,
          applyLineup,
          rotations: rotations.sort((a, b) => a - b),
        });
        const blob = new Blob([pdfBytes.slice(0)], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        c.setPreviewPdfUrl(url);
        c.setShowExportModal(false);
        c.showToast("PDF ready. Preview below, then Save or Don't save.", "info");
      } catch (e) {
        console.error(e);
        c.showToast(e instanceof Error ? e.message : "Export failed.", "error");
      } finally {
        c.setExporting(false);
        c.handleRotationChange(rotationBefore);
      }
    },
    [c]
  );

  const handlePreviewSave = useCallback(() => {
    if (!c.previewPdfUrl) return;
    const a = document.createElement("a");
    a.href = c.previewPdfUrl;
    a.download = "volleyball-rotations.pdf";
    a.click();
    URL.revokeObjectURL(c.previewPdfUrl);
    c.setPreviewPdfUrl(null);
    c.showToast("PDF saved.", "success");
  }, [c]);

  const handlePreviewClose = useCallback(() => {
    if (c.previewPdfUrl) {
      URL.revokeObjectURL(c.previewPdfUrl);
      c.setPreviewPdfUrl(null);
    }
  }, [c]);

  return (
    <>
      <div className="controls">
        <div className="control-group">
          <label className="control-check">
            <input
              type="checkbox"
              checked={!c.serveReceive}
              onChange={() => { c.setServeReceive(false); c.handleServeReceiveChange(false); }}
            />
            Serve
          </label>
          <label className="control-check">
            <input
              type="checkbox"
              checked={c.serveReceive}
              onChange={() => { c.setServeReceive(true); c.handleServeReceiveChange(true); }}
            />
            Receive
          </label>
        </div>
        <span className="control-divider" />
        <div className="control-group">
          <span className="control-label">Rotation</span>
          {[1, 2, 3, 4, 5, 6].map((r) => (
            <button
              key={r}
              type="button"
              className={`btn-rotation ${c.rotation === r ? "active" : ""}`}
              onClick={() => c.handleRotationChange(r)}
            >
              {r}
            </button>
          ))}
        </div>
        <span className="control-divider" />
        <div className="control-group">
          <label className="control-check">
            <input
              type="checkbox"
              checked={c.system === "5-1"}
              onChange={() => c.handleSystemChange("5-1")}
            />
            5-1
          </label>
          <label className="control-check">
            <input
              type="checkbox"
              checked={c.system === "6-2"}
              onChange={() => c.handleSystemChange("6-2")}
            />
            6-2
          </label>
        </div>
        <span className="control-divider" />
        <div className="control-group">
          <label className="control-check">
            <input
              type="checkbox"
              checked={!!c.currentLibero}
              onChange={() => {
                if (c.currentLibero) {
                  c.setPlayers((prev) =>
                    prev.map((p) =>
                      p.id !== c.currentLibero!.id
                        ? p
                        : { ...p, label: p.id, color: getRoleColorFromId(p.id), isLibero: false }
                    )
                  );
                } else {
                  const backRow = c.players.filter((p) => !p.isFrontRow);
                  c.setLiberoTargetId(backRow[0]?.id ?? null);
                  c.setShowLiberoModal(true);
                }
              }}
            />
            Libero
          </label>
        </div>
      </div>

      <div ref={c.mainContentRef} className="main-content">
        <div className="lineup-card">
          <div className="lineup-title">Lineup</div>
          <div className="lineup-saved-row">
            <select
              className="lineup-select lineup-select-ellipsis"
              value={c.selectedLineupId ?? ""}
              onChange={(e) => c.handleSelectLineup(e.target.value || null)}
              disabled={!c.user || (c.user?.isAnonymous === true) || c.savedLineups.length === 0}
              aria-label="Saved lineups"
              title={selectedLineupName}
            >
              <option value="">{!c.user || c.user?.isAnonymous || c.savedLineups.length === 0 ? "No lineup created" : "No lineup selected"}</option>
              {c.savedLineups.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <div className="lineup-actions-dropdown-wrap">
              <button
                type="button"
                className="court-toolbar-btn lineup-actions-btn"
                onClick={() => setLineupMenuOpen((o) => !o)}
                aria-expanded={lineupMenuOpen}
                aria-haspopup="true"
                title="Lineup actions"
              >
                ▼
              </button>
              {lineupMenuOpen && (
                <>
                  <div className="court-toolbar-dropdown-backdrop" onClick={() => setLineupMenuOpen(false)} aria-hidden />
                  <div className="court-toolbar-dropdown lineup-actions-dropdown" role="menu">
                    <span
                      className="court-toolbar-dropdown-item-wrap"
                      onMouseEnter={() => needSignIn && setSignInTooltip("lineup")}
                      onMouseLeave={() => setSignInTooltip(null)}
                    >
                      {needSignIn && <span className="court-toolbar-dropdown-item-overlay" aria-hidden />}
                      <button
                        type="button"
                        className="court-toolbar-dropdown-item"
                        role="menuitem"
                        disabled={!c.user || c.user.isAnonymous === true}
                        onClick={() => { c.handleSaveLineupAsClick(); setLineupMenuOpen(false); }}
                      >
                        Save as…
                      </button>
                      {needSignIn && signInTooltip === "lineup" && (
                        <span className="signin-tooltip signin-tooltip-lineup" role="tooltip">Sign in to save lineup</span>
                      )}
                    </span>
                    <button
                      type="button"
                      className="court-toolbar-dropdown-item"
                      role="menuitem"
                      disabled={!c.user || c.user.isAnonymous === true || !c.selectedLineupId}
                      onClick={() => { c.handleSaveLineupClick(); setLineupMenuOpen(false); }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="court-toolbar-dropdown-item"
                      role="menuitem"
                      disabled={!c.user || !c.selectedLineupId}
                      onClick={() => {
                        if (c.selectedLineupId) c.handleDeleteLineup(c.selectedLineupId);
                        setLineupMenuOpen(false);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <LineupTable
            title="Lineup"
            lineup={c.lineup}
            onLineupChange={c.handleLineupChange}
            showNumber={c.lineupShowNumber}
            showName={c.lineupShowName}
            onShowNumberChange={c.setLineupShowNumber}
            onShowNameChange={c.setLineupShowName}
          />
        </div>
        <div className="court-column">
          <div className="court-toolbar-wrap">
            <div className="court-toolbar court-toolbar-bar" role="toolbar" aria-label="Court and drawing tools">
              <div className="court-toolbar-group court-toolbar-file">
                <div className="court-toolbar-dropdown-wrap">
                  <button
                    type="button"
                    className="court-toolbar-btn"
                    onClick={() => c.setFileMenuOpen((o) => !o)}
                    aria-expanded={c.fileMenuOpen}
                    aria-haspopup="true"
                  >
                    File
                  </button>
                  {c.fileMenuOpen && (
                    <>
                      <div className="court-toolbar-dropdown-backdrop" onClick={() => c.setFileMenuOpen(false)} aria-hidden />
                      <div className="court-toolbar-dropdown" role="menu">
                        {c.activeView === "court" && (
                          <>
                            <span
                              className="court-toolbar-dropdown-item-wrap"
                              onMouseEnter={() => needSignIn && setSignInTooltip("saveAs")}
                              onMouseLeave={() => setSignInTooltip(null)}
                            >
                              {needSignIn && <span className="court-toolbar-dropdown-item-overlay" aria-hidden />}
                              <button
                                type="button"
                                className="court-toolbar-dropdown-item"
                                role="menuitem"
                                disabled={!c.user || c.user.isAnonymous === true}
                                onClick={() => {
                                c.setFileMenuOpen(false);
                                const currentUser = auth.currentUser;
                                if (!currentUser || currentUser.isAnonymous) {
                                  c.showToast("Sign in to save configurations.", "info");
                                  return;
                                }
                                const allDefaults = [...default51Rotations, ...default62Rotations];
                                let sys: "5-1" | "6-2" = c.system;
                                let rot = c.rotation;
                                if (c.customConfigKey.includes("-default")) {
                                  const def = allDefaults.find((d) => d.id === c.customConfigKey);
                                  if (def) {
                                    sys = def.system as "5-1" | "6-2";
                                    rot = def.rotation;
                                  }
                                } else if (c.customConfigKey.startsWith("custom:")) {
                                  const cfg = c.customConfigs.find((cf) => cf.id === c.customConfigKey.split("custom:")[1]);
                                  if (cfg) {
                                    sys = (cfg as SavedVisualizerConfig).system ?? "5-1";
                                    rot = 1;
                                  }
                                }
                                c.setNewSystem(sys);
                                c.setNewRotation(rot);
                                c.setSaveConfigMode("one");
                                c.setSaveRotationOne(c.rotation);
                                c.setSaveRotationsMulti([false, false, false, false, false, false]);
                                c.setShowSaveModal(true);
                              }}
                              >
                                Save as…
                              </button>
                              {needSignIn && signInTooltip === "saveAs" && (
                                <span className="signin-tooltip signin-tooltip-saveas" role="tooltip">Sign in to save configurations</span>
                              )}
                            </span>
                            <button
                              type="button"
                              className="court-toolbar-dropdown-item"
                              role="menuitem"
                              disabled={!c.user || !c.customConfigKey.startsWith("custom:")}
                              onClick={() => { c.setFileMenuOpen(false); c.handleOverwriteCurrentConfig(); }}
                            >
                              Save
                            </button>
                          </>
                        )}
                        {c.activeView === "planAhead" && (
                          <button
                            type="button"
                            className="court-toolbar-dropdown-item"
                            role="menuitem"
                            onClick={() => {
                              c.setFileMenuOpen(false);
                              if (!c.user) {
                                c.showToast("Sign in to save plans.", "info");
                                return;
                              }
                              c.setSavePlanName("");
                              c.setShowSavePlanModal(true);
                            }}
                          >
                            Save plan…
                          </button>
                        )}
                        <button
                          type="button"
                          className="court-toolbar-dropdown-item"
                          role="menuitem"
                          onClick={() => { c.setFileMenuOpen(false); c.setLineupExplorerOpen(true); }}
                        >
                          Custom config…
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <span className="court-toolbar-sep" aria-hidden />
              <div className="court-toolbar-group">
                <button
                  type="button"
                  className={`court-toolbar-btn court-toolbar-draw-toggle ${c.drawPopoverOpen ? "draw-toggle-open" : ""}`}
                  onClick={() => {
                    if (c.drawMode && c.drawPopoverOpen) {
                      c.setDrawPopoverOpen(false);
                      c.setDrawMode(false);
                      c.setSelectedAnnotationIndices([]);
                    } else if (!c.drawMode) {
                      c.setDrawPopoverOpen(true);
                      c.setDrawMode(true);
                    } else {
                      c.setDrawPopoverOpen(true);
                    }
                  }}
                >
                  Draw
                </button>
              </div>
              <span className="court-toolbar-sep court-toolbar-sep-main" aria-hidden />
              <div className="court-toolbar-group">
                <button
                  type="button"
                  className={`court-toolbar-btn ${c.isLocked ? "active" : ""}`}
                  onClick={() => c.setIsLocked(!c.isLocked)}
                >
                  {c.isLocked ? "Unlock" : "Lock"}
                </button>
                <button type="button" className="court-toolbar-btn" onClick={c.handleReset}>
                  Reset
                </button>
              </div>
              <span className="court-toolbar-sep" aria-hidden />
              <div className="court-toolbar-group">
                <button
                  type="button"
                  className="court-toolbar-btn"
                  onClick={() => undoClick(c)}
                  disabled={c.undoStackLength === 0}
                  title="Undo (Ctrl+Z)"
                >
                  Undo
                </button>
                <button
                  type="button"
                  className="court-toolbar-btn"
                  onClick={() => redoClick(c)}
                  disabled={c.redoStackLength === 0}
                  title="Redo (Ctrl+Y)"
                >
                  Redo
                </button>
                <button type="button" className="court-toolbar-btn" onClick={() => { c.pushUndo(); c.setAnnotations([]); }} title="Clear all annotations">
                  Clear
                </button>
                <button
                  type="button"
                  className="court-toolbar-btn"
                  onClick={() => {
                    c.setExportLineupId(c.selectedLineupId);
                    c.setShowExportModal(true);
                  }}
                  title="Export as PDF"
                >
                  Export
                </button>
              </div>
            </div>
            {c.drawMode && c.drawPopoverOpen && (
              <div className="draw-toolbar-popover" role="toolbar" aria-label="Drawing tools">
                <div className="draw-toolbar-row">
                  <button
                    type="button"
                    className={`court-toolbar-btn court-toolbar-btn-icon ${c.drawTool === "select" ? "active-subtle" : ""}`}
                    onClick={() => { c.setDrawTool("select"); c.setSelectedAnnotationIndices([]); c.setPencilMenuOpen(false); c.setArrowMenuOpen(false); }}
                    title="Select"
                    aria-label="Select"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 2"><rect x="3" y="3" width="18" height="18" rx="1" /></svg>
                  </button>
                  <div className="draw-toolbar-icon-wrap">
                    <button
                      type="button"
                      className={`court-toolbar-btn court-toolbar-btn-icon ${c.drawTool === "pencil" ? "active" : ""}`}
                      onClick={() => { c.setDrawTool("pencil"); c.setArrowMenuOpen(false); c.setPencilMenuOpen((o) => !o); }}
                      title="Pencil"
                      aria-label="Pencil"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill={c.pencilColor} stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 15.5L13 18l5-5z" /><path d="M2 2l7.5 7.5" /></svg>
                    </button>
                    {c.pencilMenuOpen && (
                      <div className="draw-toolbar-icon-menu" role="menu">
                        {DRAW_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`draw-color-swatch ${c.pencilColor === color ? "active" : ""}`}
                            style={{ background: color }}
                            onClick={() => { c.setPencilColor(color); c.setPencilMenuOpen(false); }}
                            title={color}
                            aria-label={`Color ${color}`}
                            role="menuitem"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="draw-toolbar-icon-wrap">
                    <button
                      type="button"
                      className={`court-toolbar-btn court-toolbar-btn-icon ${c.drawTool === "arrow" ? "active" : ""}`}
                      onClick={() => { c.setDrawTool("arrow"); c.setPencilMenuOpen(false); c.setArrowMenuOpen((o) => !o); }}
                      title="Arrow"
                      aria-label="Arrow"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill={c.arrowColor} stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
                    </button>
                    {c.arrowMenuOpen && (
                      <div className="draw-toolbar-icon-menu" role="menu">
                        <div className="draw-toolbar-icon-menu-colors">
                          {DRAW_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={`draw-color-swatch ${c.arrowColor === color ? "active" : ""}`}
                              style={{ background: color }}
                              onClick={() => c.setArrowColor(color)}
                              title={color}
                              aria-label={`Arrow color ${color}`}
                              role="menuitem"
                            />
                          ))}
                        </div>
                        <label className="court-toolbar-check draw-toolbar-icon-menu-curved">
                          <input type="checkbox" checked={c.arrowCurved} onChange={(e) => c.setArrowCurved(e.target.checked)} />
                          Curved
                        </label>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className={`court-toolbar-btn court-toolbar-btn-icon ${c.drawTool === "eraser" ? "active-subtle" : ""}`}
                    onClick={() => { c.setDrawTool("eraser"); c.setPencilMenuOpen(false); c.setArrowMenuOpen(false); }}
                    title="Eraser"
                    aria-label="Eraser"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20H7L3 16l10-10 7 7-7 7z" /><path d="M13 7l7 7" /></svg>
                  </button>
                </div>
                {c.drawTool === "select" && c.selectedAnnotationIndices.length > 0 && (
                  <div className="draw-toolbar-row draw-toolbar-options draw-toolbar-colors">
                    <span className="draw-toolbar-label">Color</span>
                    {DRAW_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className="draw-color-swatch"
                        style={{ background: color }}
                        onClick={() => {
                          c.pushUndo();
                          c.setAnnotations((prev) =>
                            prev.map((ann, i) =>
                              c.selectedAnnotationIndices.includes(i) ? { ...ann, stroke: color } : ann
                            )
                          );
                        }}
                        title={color}
                        aria-label={`Change color to ${color}`}
                      />
                    ))}
                  </div>
                )}
                <div className="draw-toolbar-row draw-toolbar-actions">
                  {c.selectedAnnotationIndices.length > 0 && (
                    <button
                      type="button"
                      className="court-toolbar-btn"
                      onClick={() => {
                        c.pushUndo();
                        c.setAnnotations((prev) => prev.filter((_, i) => !c.selectedAnnotationIndices.includes(i)));
                        c.setSelectedAnnotationIndices([]);
                      }}
                    >
                      Delete selected
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="current-config-label-wrap" aria-live="polite">
            Current configuration: {c.currentConfigDisplayName || `Default (${c.system} R${c.rotation})`}
          </div>
          <div className="court-scaled-wrap" ref={c.courtContainerRef}>
            <div
              className="court-scaled-inner"
              style={{
                width: COURT_WIDTH * c.courtScale,
                height: COURT_HEIGHT * c.courtScale,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: COURT_WIDTH,
                  height: COURT_HEIGHT,
                  minWidth: COURT_WIDTH,
                  minHeight: COURT_HEIGHT,
                  transform: `scale(${c.courtScale})`,
                  transformOrigin: "top left",
                }}
              >
                {c.courtContainerReady && (
                  <Court
                    ref={courtRef}
                    players={c.displayPlayers}
                    isLocked={c.isLocked || c.drawMode}
                    onDragEnd={c.handleDragEnd}
                    onColorChange={() => {}}
                    revertKey={c.revertKey}
                    annotations={c.annotations}
                    drawMode={c.drawMode}
                    drawTool={c.drawTool}
                    pencilColor={c.pencilColor}
                    arrowColor={c.arrowColor}
                    arrowTension={c.arrowCurved ? 1 : 0}
                    selectedAnnotationIndices={c.selectedAnnotationIndices}
                    onAnnotationAdd={(ann) => c.setAnnotations((prev) => { c.pushUndo(); return [...prev, ann]; })}
                    onAnnotationsClear={() => { c.pushUndo(); c.setAnnotations([]); }}
                    onAnnotationRemove={(i) => c.setAnnotations((prev) => { c.pushUndo(); return prev.filter((_, idx) => idx !== i); })}
                    onSelectionChange={c.setSelectedAnnotationIndices}
                    onDrawActionStart={() => { c.setDrawPopoverOpen(false); c.setPencilMenuOpen(false); c.setArrowMenuOpen(false); }}
                    onSelectionDragStart={c.pushUndo}
                    onSelectedAnnotationsMove={(dx, dy) => c.setAnnotations((prev) => prev.map((ann, i) => c.selectedAnnotationIndices.includes(i) ? c.translateAnnotation(ann, dx, dy) : ann))}
                    onAnnotationUpdate={(i, ann) => c.setAnnotations((prev) => prev.map((a, idx) => (idx === i ? ann : a)))}
                    onClearSelection={() => c.setSelectedAnnotationIndices([])}
                  />
                )}
              </div>
            </div>
          </div>
          <ExportModal
            open={c.showExportModal}
            onClose={() => c.setShowExportModal(false)}
            savedLineups={c.savedLineups}
            exportLineupId={c.exportLineupId}
            onExportLineupIdChange={c.setExportLineupId}
            customConfigs={c.customConfigs.filter((cf) => cf.id).map((cf) => ({ id: cf.id!, name: cf.name }))}
            exportConfigId={c.exportConfigId}
            onExportConfigIdChange={c.setExportConfigId}
            rotations={c.exportRotations}
            onRotationsChange={(i, v) => c.setExportRotations((prev) => prev.map((x, j) => (j === i ? v : x)))}
            onExport={handleExportRequest}
            exporting={c.exporting}
          />
          {c.previewPdfUrl && (
            <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="export-preview-title">
              <div className="modal-panel export-preview-modal">
                <h2 id="export-preview-title" className="modal-title">PDF Preview</h2>
                <div className="export-preview-iframe-wrap">
                  <iframe title="PDF preview" src={c.previewPdfUrl} />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-success" onClick={handlePreviewSave}>
                    Save PDF
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handlePreviewClose}>
                    Don&apos;t save
                  </button>
                </div>
              </div>
            </div>
          )}
          {c.showOutOfRotation && (
            <div
              className="out-of-rotation-overlay"
              style={{ top: COURT_TOOLBAR_HEIGHT }}
              role="alert"
            >
              <div className="out-of-rotation-card">
                <p className="out-of-rotation-message">{c.outOfRotationMessage || "Out of rotation"}</p>
                <button
                  type="button"
                  className="out-of-rotation-revert-btn"
                  onClick={c.handleRevertOutOfRotation}
                >
                  Ok
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
