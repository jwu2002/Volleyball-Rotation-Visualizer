import { useState, useRef, useEffect, useCallback } from "react";
import type { Annotation } from "../components/Court";

export function useAnnotationsState(
  annotations: Annotation[],
  setAnnotations: React.Dispatch<React.SetStateAction<Annotation[]>>
) {
  const [drawMode, setDrawMode] = useState(false);
  const [drawPopoverOpen, setDrawPopoverOpen] = useState(false);
  const [drawTool, setDrawTool] = useState<"select" | "pencil" | "arrow" | "eraser">("select");
  const [pencilColor, setPencilColor] = useState("#1a1a1a");
  const [arrowColor, setArrowColor] = useState("#1a1a1a");
  const [arrowCurved, setArrowCurved] = useState(false);
  const [pencilMenuOpen, setPencilMenuOpen] = useState(false);
  const [arrowMenuOpen, setArrowMenuOpen] = useState(false);
  const [selectedAnnotationIndices, setSelectedAnnotationIndices] = useState<number[]>([]);
  const [undoStackLength, setUndoStackLength] = useState(0);
  const [redoStackLength, setRedoStackLength] = useState(0);

  const undoStackRef = useRef<Annotation[][]>([]);
  const redoStackRef = useRef<Annotation[][]>([]);
  const annotationsRef = useRef<Annotation[]>(annotations);

  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);

  const pushUndo = useCallback(() => {
    redoStackRef.current = [];
    setRedoStackLength(0);
    undoStackRef.current.push(JSON.parse(JSON.stringify(annotationsRef.current)));
    setUndoStackLength(undoStackRef.current.length);
  }, []);

  const translateAnnotation = useCallback((ann: Annotation, dx: number, dy: number): Annotation => {
    const points = [...ann.points];
    for (let i = 0; i < points.length; i += 2) {
      points[i] += dx;
      points[i + 1] += dy;
    }
    return { ...ann, points };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        if (undoStackRef.current.length > 0) {
          redoStackRef.current.push(JSON.parse(JSON.stringify(annotations)));
          setRedoStackLength(redoStackRef.current.length);
          setAnnotations(undoStackRef.current.pop()!);
          setUndoStackLength(undoStackRef.current.length);
          setSelectedAnnotationIndices([]);
        }
        return;
      }
      if ((mod && e.key.toLowerCase() === "y") || (mod && e.shiftKey && e.key.toLowerCase() === "z")) {
        e.preventDefault();
        if (redoStackRef.current.length > 0) {
          undoStackRef.current.push(JSON.parse(JSON.stringify(annotations)));
          setUndoStackLength(undoStackRef.current.length);
          setAnnotations(redoStackRef.current.pop()!);
          setRedoStackLength(redoStackRef.current.length);
          setSelectedAnnotationIndices([]);
        }
        return;
      }
      if (!drawMode) return;
      if (e.key === "Backspace" && selectedAnnotationIndices.length > 0) {
        e.preventDefault();
        pushUndo();
        setAnnotations((prev) => prev.filter((_, i) => !selectedAnnotationIndices.includes(i)));
        setSelectedAnnotationIndices([]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawMode, selectedAnnotationIndices, annotations, pushUndo, setAnnotations]);

  return {
    drawMode,
    setDrawMode,
    drawPopoverOpen,
    setDrawPopoverOpen,
    drawTool,
    setDrawTool,
    pencilColor,
    setPencilColor,
    pencilMenuOpen,
    setPencilMenuOpen,
    arrowColor,
    setArrowColor,
    arrowMenuOpen,
    setArrowMenuOpen,
    arrowCurved,
    setArrowCurved,
    selectedAnnotationIndices,
    setSelectedAnnotationIndices,
    pushUndo,
    undoStackRef,
    redoStackRef,
    undoStackLength,
    redoStackLength,
    setUndoStackLength,
    setRedoStackLength,
    translateAnnotation,
  };
}
