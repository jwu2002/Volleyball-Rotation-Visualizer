// src/utils/generateRotations.ts
import type { Player } from "../components/Court";

/**
 * Generate the 6 court rotations by simulating clockwise movement
 * of front and back rows. This preserves each player's front-row
 * status (`isFrontRow`).
 */
export function generateRotations(base: Player[], count = 6): Player[][] {
  const rotations: Player[][] = [JSON.parse(JSON.stringify(base))];

  for (let i = 1; i < count; i++) {
    const prev = JSON.parse(JSON.stringify(rotations[i - 1]));
    const next = JSON.parse(JSON.stringify(prev));

    // Split into front & back rows based on isFrontRow flag
    const front = prev.filter((p: any) => p.isFrontRow);
    const back = prev.filter((p: any) => !p.isFrontRow);

    // Sort by x (left to right)
    const frontSorted = [...front].sort((a, b) => a.x - b.x);
    const backSorted = [...back].sort((a, b) => a.x - b.x);

    // Rotate positions clockwise
    const newFront = [...frontSorted.slice(1), frontSorted[0]];
    const newBack = [...backSorted.slice(1), backSorted[0]];

    // Apply updated coordinates while preserving isFrontRow
    for (let j = 0; j < newFront.length; j++) {
      next.find((p: any) => p.id === frontSorted[j].id)!.x = newFront[j].x;
      next.find((p: any) => p.id === frontSorted[j].id)!.y = newFront[j].y;
    }
    for (let j = 0; j < newBack.length; j++) {
      next.find((p: any) => p.id === backSorted[j].id)!.x = newBack[j].x;
      next.find((p: any) => p.id === backSorted[j].id)!.y = newBack[j].y;
    }

    rotations.push(next);
  }

  return rotations;
}
