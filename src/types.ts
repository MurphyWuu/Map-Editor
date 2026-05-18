export type Point = {
  x: number;
  y: number;
};

export type Shape = {
  id: string;
  type: 'rect' | 'polygon' | 'path';
  x: number;
  y: number;
  z?: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  name: string;
  label?: string;
  logo?: string;
  points?: number[];
};

export type EditorMode = 'select' | 'add' | 'edit' | 'split' | 'merge' | 'path';

export type DrawingStep = 0 | 1 | 2; // 0: Idle, 1: First point clicked, 2: Second point clicked (fixing length/rotation)
