import type { Player } from "../components/Court";


export function generateRotations(base: Player[], count = 6): Player[][] {
  const rotations: Player[][] = [JSON.parse(JSON.stringify(base))];

  for (let i = 1; i < count; i++) {
    const prev = JSON.parse(JSON.stringify(rotations[i - 1]));
    const next = JSON.parse(JSON.stringify(prev));

    const front = prev.filter((p: any) => p.isFrontRow);
    const back = prev.filter((p: any) => !p.isFrontRow);

    const frontSorted = [...front].sort((a, b) => a.x - b.x);
    const backSorted = [...back].sort((a, b) => a.x - b.x);

    const newFront = [...frontSorted.slice(1), frontSorted[0]];
    const newBack = [...backSorted.slice(1), backSorted[0]];

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
