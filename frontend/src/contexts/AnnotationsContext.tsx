import React, { createContext, useContext } from "react";
import type { Annotation } from "../components/Court";

export type AnnotationsContextValue = {
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
  annotations: Annotation[];
  setAnnotations: React.Dispatch<React.SetStateAction<Annotation[]>>;
  translateAnnotation: (ann: Annotation, dx: number, dy: number) => Annotation;
  undoStackRef: React.MutableRefObject<Annotation[][]>;
  redoStackRef: React.MutableRefObject<Annotation[][]>;
  undoStackLength: number;
  redoStackLength: number;
  setUndoStackLength: (n: number) => void;
  setRedoStackLength: (n: number) => void;
};

const AnnotationsContext = createContext<AnnotationsContextValue | null>(null);

export function useAnnotationsContext(): AnnotationsContextValue {
  const value = useContext(AnnotationsContext);
  if (!value) throw new Error("useAnnotationsContext must be used within VisualizerProvider");
  return value;
}

export { AnnotationsContext };
