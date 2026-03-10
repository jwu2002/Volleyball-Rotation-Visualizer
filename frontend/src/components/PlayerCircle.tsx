import React from "react";
import { Circle, Text, Group, Rect } from "react-konva";

type Props = {
  id: string;
  x: number;
  y: number;
  color: string;
  label: string;
  isLocked: boolean;
  isFrontRow?: boolean;
  isLibero?: boolean;
  onDragEnd: (id: string, x: number, y: number) => void;
  onColorChange: (id: string, color: string) => void;
};

export const PlayerCircle: React.FC<Props> = ({
  id,
  x,
  y,
  color,
  label,
  isLocked,
  isFrontRow,
  isLibero,
  onDragEnd,
}) => {
  const isHighlighted = !isLibero && label !== "L" && ["OH1", "MB1", "RS2", "Setter2"].includes(id);
  const BASE_RADIUS = 30;
  const OUTLINE_RADIUS = 33;
  const BOX_PADDING = 6;
  const BOX_SIZE = OUTLINE_RADIUS * 2 + BOX_PADDING;

  return (
    <Group
      x={x}
      y={y}
      draggable={!isLocked}
      onDragEnd={(e) => onDragEnd(id, e.target.x(), e.target.y())}
    >
      {isFrontRow && (
        <Rect
          x={-BOX_SIZE / 2}
          y={-BOX_SIZE / 2}
          width={BOX_SIZE}
          height={BOX_SIZE}
          stroke="#FFD700"
          strokeWidth={3}
          cornerRadius={4}
          listening={false}
        />
      )}

      <Circle radius={BASE_RADIUS} fill={color} />

      {isHighlighted && (
        <Circle
          radius={OUTLINE_RADIUS}
          stroke="white"
          strokeWidth={2.5}
          dash={[8, 8]}
          dashOffset={2}
          listening={false}
          perfectDrawEnabled={false}
        />
      )}

      <Text
        text={label}
        fontSize={16}
        fill="#ffffff"
        align="center"
        verticalAlign="middle"
        x={-25}
        y={-8}
        width={50}
      />
    </Group>
  );
};
