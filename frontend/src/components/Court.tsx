import React, { useRef, useCallback, useImperativeHandle, forwardRef } from "react";
import { Stage, Layer, Rect, Line, Arrow, Circle } from "react-konva";
import { PlayerCircle } from "./PlayerCircle";
export type Annotation = {
  type: "path" | "arrow";
  points: number[];
  stroke?: string;
  pointerAtBeginning?: boolean;
  pointerAtEnding?: boolean;
  tension?: number;
};

export type Player = {
  id: string;
  x: number;
  y: number;
  color: string;
  label: string;
  isFrontRow?: boolean;
  isLibero?: boolean;
};

type Props = {
  players: Player[];
  isLocked: boolean;
  onDragEnd: (id: string, x: number, y: number) => void;
  onColorChange: (id: string, color: string) => void;
  revertKey?: number;
  annotations?: Annotation[];
  drawMode?: boolean;
  drawTool?: "select" | "pencil" | "arrow" | "eraser";
  pencilColor?: string;
  arrowColor?: string;
  arrowTension?: number;
  selectedAnnotationIndices?: number[];
  onAnnotationAdd?: (annotation: Annotation) => void;
  onAnnotationsClear?: () => void;
  onAnnotationRemove?: (index: number) => void;
  onSelectionChange?: (indices: number[]) => void;
  onDrawActionStart?: () => void;
  onSelectionDragStart?: () => void;
  onSelectedAnnotationsMove?: (dx: number, dy: number) => void;
  onAnnotationUpdate?: (index: number, annotation: Annotation) => void;
  onClearSelection?: () => void;
};

const width = 500;
const height = 600;
const ANNOTATION_STROKE = "#1a1a1a";
const ANNOTATION_STROKE_WIDTH = 3;

function getAnnotationBoundingBox(ann: Annotation): { x: number; y: number; w: number; h: number } | null {
  if (!ann.points.length) return null;
  let minX = ann.points[0];
  let minY = ann.points[1];
  let maxX = minX;
  let maxY = minY;
  for (let i = 2; i < ann.points.length; i += 2) {
    const x = ann.points[i];
    const y = ann.points[i + 1];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function mergeBoundingBoxes(
  boxes: { x: number; y: number; w: number; h: number }[]
): { x: number; y: number; w: number; h: number } | null {
  if (boxes.length === 0) return null;
  let minX = boxes[0].x;
  let minY = boxes[0].y;
  let maxX = boxes[0].x + boxes[0].w;
  let maxY = boxes[0].y + boxes[0].h;
  for (let i = 1; i < boxes.length; i++) {
    const b = boxes[i];
    if (b.x < minX) minX = b.x;
    if (b.y < minY) minY = b.y;
    if (b.x + b.w > maxX) maxX = b.x + b.w;
    if (b.y + b.h > maxY) maxY = b.y + b.h;
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export type CourtRef = { getDataURL: (options?: { pixelRatio?: number }) => string | undefined };

export const Court = forwardRef<CourtRef, Props>(function Court(
  {
    players,
    isLocked,
    onDragEnd,
    onColorChange,
    revertKey = 0,
    annotations = [],
    drawMode = false,
    drawTool = "select",
    pencilColor = ANNOTATION_STROKE,
    arrowColor = ANNOTATION_STROKE,
    arrowTension = 0,
    selectedAnnotationIndices = [],
    onAnnotationAdd,
    onAnnotationsClear: _onAnnotationsClear,
    onAnnotationRemove,
    onSelectionChange,
    onDrawActionStart,
    onSelectionDragStart,
    onSelectedAnnotationsMove,
    onAnnotationUpdate,
    onClearSelection,
  },
  ref
) {
  const stageRef = useRef<{ toDataURL: (opts?: { pixelRatio?: number }) => string } | null>(null);
  useImperativeHandle(ref, () => ({
    getDataURL: (options) => stageRef.current?.toDataURL(options),
  }));

  const isDrawingRef = useRef(false);
  const currentPathRef = useRef<number[]>([]);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);
  const selectionDraggingRef = useRef(false);
  const selectionDragStartRef = useRef<{ x: number; y: number } | null>(null);
  const arrowStartRef = useRef<[number, number] | null>(null);
  const eraserMouseDownRef = useRef(false);
  const eraserClearedSelectionRef = useRef(false);
  const lastErasedAtRef = useRef(0);
  const ERASER_THROTTLE_MS = 80;
  const [drawingPreview, setDrawingPreview] = React.useState<number[] | null>(null);
  const [selectionBox, setSelectionBox] = React.useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [arrowPreview, setArrowPreview] = React.useState<{ start: [number, number]; end: [number, number] } | null>(null);

  const selectionBounds = React.useMemo(() => {
    if (selectedAnnotationIndices.length === 0) return null;
    const boxes = selectedAnnotationIndices
      .map((i) => annotations[i])
      .filter(Boolean)
      .map((ann) => getAnnotationBoundingBox(ann))
      .filter((b): b is { x: number; y: number; w: number; h: number } => b != null);
    return mergeBoundingBoxes(boxes);
  }, [annotations, selectedAnnotationIndices]);

  const getStagePoint = useCallback(
    (e: { target: { getStage: () => { getPointerPosition: () => { x: number; y: number } | null } } }) => {
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      return pos ? [pos.x, pos.y] as const : null;
    },
    []
  );

  const handleStageMouseDown = useCallback(
    (e: { target: { getStage: () => { getPointerPosition: () => { x: number; y: number } | null } } }) => {
      if (!drawMode) return;
      if (drawTool === "eraser") {
        eraserMouseDownRef.current = true;
        return;
      }
      const point = getStagePoint(e);
      if (!point) return;
      const [x, y] = point;
      if (drawTool === "select") {
        onDrawActionStart?.();
        const inSelectionBox = selectionBounds && selectedAnnotationIndices.length > 0 &&
          x >= selectionBounds.x && x <= selectionBounds.x + selectionBounds.w &&
          y >= selectionBounds.y && y <= selectionBounds.y + selectionBounds.h;
        if (inSelectionBox) {
          selectionDragStartRef.current = { x, y };
          selectionDraggingRef.current = true;
          onSelectionDragStart?.();
        } else {
          selectionStartRef.current = { x, y };
          setSelectionBox({ x, y, w: 0, h: 0 });
        }
      } else if (drawTool === "pencil" && onAnnotationAdd) {
        onClearSelection?.();
        onDrawActionStart?.();
        isDrawingRef.current = true;
        currentPathRef.current = [x, y];
      } else if (drawTool === "arrow") {
        if (onAnnotationAdd) {
          onClearSelection?.();
          onDrawActionStart?.();
          isDrawingRef.current = true;
          arrowStartRef.current = [x, y];
          setArrowPreview({ start: [x, y], end: [x, y] });
        }
      }
    },
    [drawMode, drawTool, selectionBounds, selectedAnnotationIndices, onAnnotationAdd, onDrawActionStart, onSelectionDragStart, onClearSelection, getStagePoint]
  );

  const handleStageMouseMove = useCallback(
    (e: { target: { getStage: () => { getPointerPosition: () => { x: number; y: number } | null } } }) => {
      if (!drawMode) return;
      const point = getStagePoint(e);
      if (!point) return;
      const [x, y] = point;
      if (drawTool === "select" && selectionDraggingRef.current && selectionDragStartRef.current && onSelectedAnnotationsMove) {
        const [sx, sy] = [selectionDragStartRef.current.x, selectionDragStartRef.current.y];
        onSelectedAnnotationsMove(x - sx, y - sy);
        selectionDragStartRef.current = { x, y };
        return;
      }
      if (drawTool === "select" && selectionStartRef.current) {
        const sx = selectionStartRef.current.x;
        const sy = selectionStartRef.current.y;
        setSelectionBox({
          x: Math.min(sx, x),
          y: Math.min(sy, y),
          w: Math.abs(x - sx),
          h: Math.abs(y - sy),
        });
      } else if (drawTool === "pencil" && isDrawingRef.current) {
        currentPathRef.current.push(x, y);
        setDrawingPreview([...currentPathRef.current]);
      } else if (drawTool === "arrow" && arrowStartRef.current) {
        const start = arrowStartRef.current;
        setArrowPreview({ start, end: [x, y] });
      }
    },
    [drawMode, drawTool, onSelectedAnnotationsMove, getStagePoint]
  );

  const handleStageMouseUp = useCallback(
    (e: { target: { getStage: () => { getPointerPosition: () => { x: number; y: number } | null } } }) => {
      if (!drawMode) return;
      if (drawTool === "eraser") {
        eraserMouseDownRef.current = false;
        eraserClearedSelectionRef.current = false;
        return;
      }
      if (drawTool === "select" && selectionDraggingRef.current) {
        selectionDraggingRef.current = false;
        selectionDragStartRef.current = null;
        return;
      }
      const point = getStagePoint(e);
      if (drawTool === "select") {
        const start = selectionStartRef.current;
        selectionStartRef.current = null;
        setSelectionBox(null);
        if (start && point && onSelectionChange) {
          const [ex, ey] = point;
          const sx = start.x;
          const sy = start.y;
          const selRect = { x: Math.min(sx, ex), y: Math.min(sy, ey), w: Math.abs(ex - sx), h: Math.abs(ey - sy) };
          const indices: number[] = [];
          annotations.forEach((ann, i) => {
            const box = getAnnotationBoundingBox(ann);
            if (box && (selRect.w > 2 || selRect.h > 2) && rectsOverlap(selRect, box)) indices.push(i);
          });
          onSelectionChange(indices);
        }
      } else if (drawTool === "pencil" && isDrawingRef.current) {
        if (point) currentPathRef.current.push(point[0], point[1]);
        if (currentPathRef.current.length >= 4) {
          onAnnotationAdd?.({ type: "path", points: [...currentPathRef.current], stroke: pencilColor });
        }
        isDrawingRef.current = false;
        currentPathRef.current = [];
        setDrawingPreview(null);
      } else if (drawTool === "arrow" && arrowStartRef.current) {
        const [x0, y0] = arrowStartRef.current;
        const [x, y] = point ?? arrowPreview?.end ?? [x0, y0];
        if (Math.abs(x - x0) > 2 || Math.abs(y - y0) > 2) {
          let points: number[];
          if (arrowTension > 0) {
            const mx = (x0 + x) / 2;
            const my = (y0 + y) / 2;
            const dx = x - x0;
            const dy = y - y0;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const offset = len * 0.25;
            const cx = mx + (-dy / len) * offset;
            const cy = my + (dx / len) * offset;
            points = [x0, y0, cx, cy, x, y];
          } else {
            points = [x0, y0, x, y];
          }
          onAnnotationAdd?.({
            type: "arrow",
            points,
            stroke: arrowColor,
            pointerAtBeginning: false,
            pointerAtEnding: true,
            tension: arrowTension > 0 ? 0.5 : 0,
          });
        }
        arrowStartRef.current = null;
        isDrawingRef.current = false;
        setArrowPreview(null);
      }
    },
    [
      drawMode,
      drawTool,
      arrowColor,
      arrowTension,
      annotations,
      onAnnotationAdd,
      onSelectionChange,
      getStagePoint,
    ]
  );

  const handleStageMouseLeave = useCallback(() => {
    if (drawTool === "eraser") {
      eraserMouseDownRef.current = false;
      eraserClearedSelectionRef.current = false;
    } else if (drawTool === "select" && selectionDraggingRef.current) {
      selectionDraggingRef.current = false;
      selectionDragStartRef.current = null;
    } else if (drawTool === "arrow" && arrowStartRef.current) {
      arrowStartRef.current = null;
      setArrowPreview(null);
      isDrawingRef.current = false;
    } else if (drawTool === "select") {
      selectionStartRef.current = null;
      setSelectionBox(null);
    }
  }, [drawTool]);

  const drawCursor = !drawMode
    ? "default"
    : drawTool === "pencil"
      ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23111' d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z'/%3E%3C/svg%3E\") 4 20, crosshair"
      : drawTool === "select"
        ? "text"
        : drawTool === "eraser"
          ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23111' stroke-width='2'%3E%3Cpath d='M20 20H7L3 16l10-10 7 7-7 7z'/%3E%3Cpath d='M13 7l7 7'/%3E%3C/svg%3E\") 0 24, auto"
          : "crosshair";

  const attackLineY = 200;
  const annotationsLayerListening = drawMode && (drawTool === "eraser" || drawTool === "select");

  return (
    <div className="court-wrap">
      <Stage
        ref={stageRef as React.RefObject<React.ComponentRef<typeof Stage>>}
        width={width}
        height={height}
        onMouseDown={handleStageMouseDown as (e: unknown) => void}
        onMouseMove={handleStageMouseMove as (e: unknown) => void}
        onMouseUp={handleStageMouseUp as (e: unknown) => void}
        onMouseLeave={handleStageMouseLeave}
        style={{ cursor: drawCursor }}
      >
        <Layer>
          <Rect x={0} y={0} width={width} height={height} fill="#d48e43" />
          <Line
            points={[0, attackLineY, width, attackLineY]}
            stroke="white"
            strokeWidth={4}
          />
          {players.map((p) => (
            <PlayerCircle
              key={`${p.id}-${revertKey}`}
              id={p.id}
              x={p.x}
              y={p.y}
              color={p.color}
              label={p.label}
              isLocked={isLocked}
              onDragEnd={onDragEnd}
              onColorChange={onColorChange}
              isFrontRow={p.isFrontRow}
              isLibero={p.isLibero}
            />
          ))}
        </Layer>
        <Layer listening={annotationsLayerListening}>
          {annotations.map((ann, i) => {
            const stroke = ann.stroke ?? ANNOTATION_STROKE;
            const selected = selectedAnnotationIndices.includes(i);
            const tension = ann.tension ?? 0;
            const common = {
              key: i,
              listening: drawTool === "eraser" || drawTool === "select",
              hitStrokeWidth: drawTool === "eraser" ? 32 : drawTool === "select" ? 16 : 0,
              onMouseDown: drawTool === "eraser" && onAnnotationRemove ? () => {
                lastErasedAtRef.current = 0;
                if (!eraserClearedSelectionRef.current) { onClearSelection?.(); eraserClearedSelectionRef.current = true; }
                onDrawActionStart?.();
                onAnnotationRemove(i);
              } : undefined,
              onMouseMove: drawTool === "eraser" && onAnnotationRemove ? () => {
                if (!eraserMouseDownRef.current) return;
                const now = Date.now();
                if (now - lastErasedAtRef.current < ERASER_THROTTLE_MS) return;
                lastErasedAtRef.current = now;
                if (!eraserClearedSelectionRef.current) { onClearSelection?.(); eraserClearedSelectionRef.current = true; }
                onDrawActionStart?.();
                onAnnotationRemove(i);
              } : undefined,
              onMouseUp: drawTool === "eraser" ? () => { eraserMouseDownRef.current = false; eraserClearedSelectionRef.current = false; } : undefined,
              opacity: selected ? 0.6 : 1,
            };
            if (drawTool === "select") {
              (common as Record<string, unknown>).onMouseDown = (ev: { target: { getStage: () => { getPointerPosition: () => { x: number; y: number } | null } } }) => {
                const pos = ev.target.getStage()?.getPointerPosition();
                if (!pos) return;
                if (selected) {
                  selectionDragStartRef.current = { x: pos.x, y: pos.y };
                  selectionDraggingRef.current = true;
                  onSelectionDragStart?.();
                } else {
                  onSelectionChange?.([i]);
                }
              };
              (common as Record<string, unknown>).onMouseMove = (ev: { target: { getStage: () => { getPointerPosition: () => { x: number; y: number } | null } } }) => {
                if (!selectionDraggingRef.current || !selectionDragStartRef.current || !onSelectedAnnotationsMove) return;
                const pos = ev.target.getStage()?.getPointerPosition();
                if (!pos) return;
                const dx = pos.x - selectionDragStartRef.current.x;
                const dy = pos.y - selectionDragStartRef.current.y;
                onSelectedAnnotationsMove(dx, dy);
                selectionDragStartRef.current = { x: pos.x, y: pos.y };
              };
              (common as Record<string, unknown>).onMouseUp = () => {
                if (selectionDraggingRef.current) {
                  selectionDraggingRef.current = false;
                  selectionDragStartRef.current = null;
                }
              };
            }
            return ann.type === "arrow" && ann.points.length >= 4 ? (
              <Arrow
                {...common}
                points={ann.points}
                stroke={stroke}
                strokeWidth={ANNOTATION_STROKE_WIDTH}
                pointerLength={12}
                pointerWidth={12}
                fill={stroke}
                tension={tension}
                pointerAtBeginning={ann.pointerAtBeginning ?? false}
                pointerAtEnding={ann.pointerAtEnding ?? true}
              />
            ) : ann.type === "path" && ann.points.length >= 4 ? (
              <Line
                {...common}
                points={ann.points}
                stroke={stroke}
                strokeWidth={ANNOTATION_STROKE_WIDTH}
                lineCap="round"
                lineJoin="round"
              />
            ) : null;
          })}
          {drawingPreview && drawingPreview.length >= 4 && (
            <Line
              points={drawingPreview}
              stroke={pencilColor}
              strokeWidth={ANNOTATION_STROKE_WIDTH}
              lineCap="round"
              lineJoin="round"
              listening={false}
            />
          )}
          {arrowPreview && (() => {
            const [x0, y0] = arrowPreview.start;
            const [x, y] = arrowPreview.end;
            const useCurve = (arrowTension ?? 0) > 0;
            const points = useCurve
              ? (() => {
                  const mx = (x0 + x) / 2, my = (y0 + y) / 2;
                  const dx = x - x0, dy = y - y0;
                  const len = Math.sqrt(dx * dx + dy * dy) || 1;
                  const offset = len * 0.25;
                  const cx = mx + (-dy / len) * offset, cy = my + (dx / len) * offset;
                  return [x0, y0, cx, cy, x, y];
                })()
              : [...arrowPreview.start, ...arrowPreview.end];
            return (
              <Arrow
                points={points}
                stroke={pencilColor}
                strokeWidth={ANNOTATION_STROKE_WIDTH}
                pointerLength={12}
                pointerWidth={12}
                fill={pencilColor}
                tension={useCurve ? 0.5 : 0}
                pointerAtBeginning={false}
                pointerAtEnding={true}
                listening={false}
              />
            );
          })()}
          {selectionBox && selectionBox.w > 0 && selectionBox.h > 0 && (
            <Rect
              x={selectionBox.x}
              y={selectionBox.y}
              width={selectionBox.w}
              height={selectionBox.h}
              stroke="#333"
              strokeWidth={2}
              dash={[6, 4]}
              listening={false}
            />
          )}
          {selectionBounds && !selectionBox && (
            <Rect
              x={selectionBounds.x - 4}
              y={selectionBounds.y - 4}
              width={selectionBounds.w + 8}
              height={selectionBounds.h + 8}
              stroke="#1967d2"
              strokeWidth={2}
              dash={[6, 4]}
              listening={false}
            />
          )}
        </Layer>
        {drawMode && drawTool === "select" && onAnnotationUpdate && (
          <Layer listening={true}>
            {annotations.map((ann, i) => {
              if (ann.type !== "arrow" || ann.points.length !== 6) return null;
              if (!selectedAnnotationIndices.includes(i)) return null;
              const cx = ann.points[2];
              const cy = ann.points[3];
              return (
                <Circle
                  key={`control-${i}`}
                  x={cx}
                  y={cy}
                  radius={8}
                  fill="white"
                  stroke="#1967d2"
                  strokeWidth={2}
                  draggable
                  onDragStart={() => onSelectionDragStart?.()}
                  onDragMove={(e) => {
                    const node = e.target;
                    const pts = [...ann.points];
                    pts[2] = node.x();
                    pts[3] = node.y();
                    onAnnotationUpdate(i, { ...ann, points: pts });
                  }}
                  onDragEnd={(e) => {
                    const node = e.target;
                    const newCx = node.x();
                    const newCy = node.y();
                    const pts = [...ann.points];
                    pts[2] = newCx;
                    pts[3] = newCy;
                    onAnnotationUpdate(i, { ...ann, points: pts });
                  }}
                />
              );
            })}
          </Layer>
        )}
      </Stage>
    </div>
  );
});
