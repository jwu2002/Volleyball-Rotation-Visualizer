import React from "react";
import { Stage, Layer, Rect, Line } from "react-konva";
import { PlayerCircle } from "./PlayerCircle";

const HALF_WIDTH = 500;
const HALF_HEIGHT = 600;
const TOTAL_HEIGHT = 1200;
const CENTER_LINE_Y = HALF_HEIGHT;
const DIST_10FT_FROM_CENTER = 200;
const TOP_ATTACK_Y = CENTER_LINE_Y - DIST_10FT_FROM_CENTER;
const BOTTOM_ATTACK_Y = CENTER_LINE_Y + DIST_10FT_FROM_CENTER;

const COURT_FILL = "#d48e43";

const TEAM_A_CIRCLE_COLOR = "#dc2626";
const TEAM_B_CIRCLE_COLOR = "#2563eb";

const BOTTOM_COURT_UP_OFFSET = 45;

const DEFAULT_COURT_SCALE = 0.72;

export type PlanAheadPlayer = {
  id: string;
  x: number;
  y: number;
  color: string;
  label: string;
  isFrontRow?: boolean;
  isLibero?: boolean;
};

type Props = {
  playersA: PlanAheadPlayer[];
  playersB: PlanAheadPlayer[];
  isLocked?: boolean;
  onDragEndA?: (id: string, x: number, y: number) => void;
  onDragEndB?: (id: string, x: number, y: number) => void;
  displayScale?: number;
  rotationLabel?: string;
};

export const PlanAheadCourt: React.FC<Props> = ({
  playersA,
  playersB,
  isLocked = true,
  onDragEndA,
  onDragEndB,
  displayScale = DEFAULT_COURT_SCALE,
  rotationLabel,
}) => {
  const handleDragEndTop = (id: string, stageX: number, stageY: number) => {
    onDragEndB?.(id, HALF_WIDTH - stageX, CENTER_LINE_Y - stageY);
  };
  const handleDragEndBottom = (id: string, x: number, stageY: number) => {
    onDragEndA?.(id, x, stageY - CENTER_LINE_Y + BOTTOM_COURT_UP_OFFSET);
  };

  const displayWidth = HALF_WIDTH * displayScale;
  const displayHeight = TOTAL_HEIGHT * displayScale;

  return (
    <div className="plan-ahead-court-cell">
      {rotationLabel != null && (
        <div className="plan-ahead-court-label">{rotationLabel}</div>
      )}
      <div
        className="plan-ahead-court-scaled"
        style={{
          width: displayWidth,
          height: displayHeight,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          className="plan-ahead-court-wrap"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: HALF_WIDTH,
            height: TOTAL_HEIGHT,
            transform: `scale(${displayScale})`,
            transformOrigin: "0 0",
          }}
        >
        <Stage width={HALF_WIDTH} height={TOTAL_HEIGHT}>
        <Layer>
          <Rect x={0} y={0} width={HALF_WIDTH} height={HALF_HEIGHT} fill={COURT_FILL} />
          <Line
            points={[0, TOP_ATTACK_Y, HALF_WIDTH, TOP_ATTACK_Y]}
            stroke="white"
            strokeWidth={4}
          />
          <Line
            points={[0, CENTER_LINE_Y, HALF_WIDTH, CENTER_LINE_Y]}
            stroke="white"
            strokeWidth={10}
          />
          <Rect x={0} y={HALF_HEIGHT} width={HALF_WIDTH} height={HALF_HEIGHT} fill={COURT_FILL} />
          <Line
            points={[0, BOTTOM_ATTACK_Y, HALF_WIDTH, BOTTOM_ATTACK_Y]}
            stroke="white"
            strokeWidth={4}
          />
        </Layer>
        <Layer>
          {playersB.map((p) => (
            <PlayerCircle
              key={`B-${p.id}`}
              id={p.id}
              x={HALF_WIDTH - p.x}
              y={CENTER_LINE_Y - p.y}
              color={TEAM_B_CIRCLE_COLOR}
              label={p.label}
              isLocked={isLocked}
              onDragEnd={handleDragEndTop}
              onColorChange={() => {}}
              isFrontRow={p.isFrontRow}
              isLibero={p.isLibero}
            />
          ))}
          {playersA.map((p) => (
            <PlayerCircle
              key={`A-${p.id}`}
              id={p.id}
              x={p.x}
              y={CENTER_LINE_Y + p.y - BOTTOM_COURT_UP_OFFSET}
              color={TEAM_A_CIRCLE_COLOR}
              label={p.label}
              isLocked={isLocked}
              onDragEnd={handleDragEndBottom}
              onColorChange={() => {}}
              isFrontRow={p.isFrontRow}
              isLibero={p.isLibero}
            />
          ))}
        </Layer>
      </Stage>
        </div>
      </div>
    </div>
  );
};
