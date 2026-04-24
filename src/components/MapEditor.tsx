import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Stage, Layer, Rect, Image, Transformer, Group, Line, Text, Line as KonvaLine, Circle, Path, Label, Tag } from 'react-konva';
import useImage from 'use-image';
import { Shape, Point, EditorMode, DrawingStep } from '../types';
import Konva from 'konva';
import PolyBool from 'polybooljs';

interface MapEditorProps {
  mode: EditorMode;
  shapes: Shape[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onAdd: (shape: Shape) => void;
  onUpdate: (shape: Shape) => void;
  onDelete: (ids: string[]) => void;
  onSaveHistory: () => void;
  setPrompt: (text: string) => void;
}

export function MapEditor({
  mode,
  shapes,
  selectedIds,
  onSelect,
  onAdd,
  onUpdate,
  onDelete,
  onSaveHistory,
  setPrompt,
}: MapEditorProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update scale and pos when they change
  useEffect(() => {
    const stage = stageRef.current;
    if (stage) {
      stage.scale({ x: scale, y: scale });
      stage.position(pos);
      stage.batchDraw();
    }
  }, [scale, pos]);

  const handleDragStage = (e: any) => {
    if (e.target !== stageRef.current) return;
    setPos({ x: e.target.x(), y: e.target.y() });
  };
  
  // Drawing state
  const [drawingStep, setDrawingStep] = useState<DrawingStep>(0);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [secondPoint, setSecondPoint] = useState<Point | null>(null);
  const [mousePos, setMousePos] = useState<Point | null>(null);
  const [snappedPoint, setSnappedPoint] = useState<{ x: number, y: number, type: 'vertex' | 'edge' } | null>(null);

  // Split state
  const [splitPath, setSplitPath] = useState<Point[]>([]); // Points in local space of target shape
  const [splittingShapeId, setSplittingShapeId] = useState<string | null>(null);
  const [hoveredSplitEdge, setHoveredSplitEdge] = useState<{ index: number, x: number, y: number, shapeId: string, isVertex?: boolean } | null>(null);
  // Center alert state
  const [centerAlert, setCenterAlert] = useState<string | null>(null);

  useEffect(() => {
    if (centerAlert) {
      const timer = setTimeout(() => setCenterAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [centerAlert]);

  // Background map image
  const [bgImage] = useImage('https://images.unsplash.com/photo-1555633514-abcee6ad93e1?auto=format&fit=crop&w=1200&q=80');

  // Handle Zoom
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const scaleBy = 1.15;
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const constrainedScale = Math.min(Math.max(newScale, 0.1), 10);

    setScale(constrainedScale);
    setPos({
      x: pointer.x - mousePointTo.x * constrainedScale,
      y: pointer.y - mousePointTo.y * constrainedScale,
    });
  };

  // Helper to get relative coordinates
  const getRelativePointerPosition = () => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pointer = stage.getPointerPosition();
    if (!pointer) return { x: 0, y: 0 };
    return {
      x: (pointer.x - stage.x()) / stage.scaleX(),
      y: (pointer.y - stage.y()) / stage.scaleY(),
    };
  };

  // Click handlers
  const [hoveredEdge, setHoveredEdge] = useState<{ index: number, x: number, y: number } | null>(null);
  const [hoveredVertex, setHoveredVertex] = useState<{ shapeId: string, index: number } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && hoveredVertex) {
        handleDeleteVertex(hoveredVertex.shapeId, hoveredVertex.index);
        setHoveredVertex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hoveredVertex, shapes]);

  const getShapePoints = (shape: Shape): number[] => {
    if (shape.type === 'polygon' && shape.points) return shape.points;
    // For rect, return [x1, y1, x2, y2, x3, y3, x4, y4] relative to 0,0
    return [
      0, 0,
      shape.width, 0,
      shape.width, shape.height,
      0, shape.height
    ];
  };

  const handleVertexDrag = (id: string, index: number, newX: number, newY: number) => {
    const shape = shapes.find(s => s.id === id);
    if (!shape) return;

    let updatedShape = { ...shape };
    let points = getShapePoints(shape);
    
    // Always create a new points array to avoid direct mutation
    const newPoints = [...points];
    
    if (shape.type === 'rect') {
      updatedShape.type = 'polygon';
      delete (updatedShape as any).width;
      delete (updatedShape as any).height;
    }

    newPoints[index * 2] = newX;
    newPoints[index * 2 + 1] = newY;
    updatedShape.points = newPoints;
    onUpdate(updatedShape);
  };

  const handleAddVertex = (id: string, index: number, x: number, y: number) => {
    const shape = shapes.find(s => s.id === id);
    if (!shape) return;

    onSaveHistory();
    let updatedShape = { ...shape };
    let points = getShapePoints(shape);

    if (shape.type === 'rect') {
      updatedShape.type = 'polygon';
      delete (updatedShape as any).width;
      delete (updatedShape as any).height;
    }

    const newPoints = [...points];
    newPoints.splice((index + 1) * 2, 0, x, y);
    updatedShape.points = newPoints;
    onUpdate(updatedShape);
    setHoveredEdge(null);
  };

  const handleDeleteVertex = (id: string, index: number) => {
    const shape = shapes.find(s => s.id === id);
    if (!shape || shape.type !== 'polygon' || !shape.points) return;
    
    if (shape.points.length <= 6) { // Need at least 3 points (6 elements)
      setPrompt('Cannot delete more vertices. Polygon needs at least 3 points.');
      return;
    }

    onSaveHistory();
    const newPoints = [...shape.points];
    newPoints.splice(index * 2, 2);
    onUpdate({ ...shape, points: newPoints });
  };

  const getLocalMousePos = (shape: Shape, globalMouse: Point) => {
    const rad = (shape.rotation * Math.PI) / 180;
    const localX = (globalMouse.x - shape.x) * Math.cos(-rad) - (globalMouse.y - shape.y) * Math.sin(-rad);
    const localY = (globalMouse.x - shape.x) * Math.sin(-rad) + (globalMouse.y - shape.y) * Math.cos(-rad);
    return { x: localX, y: localY };
  };

  const isPointInPolygon = (poly: number[], x: number, y: number) => {
    let inside = false;
    for (let i = 0, j = poly.length / 2 - 1; i < poly.length / 2; j = i++) {
      const xi = poly[i * 2], yi = poly[i * 2 + 1];
      const xj = poly[j * 2], yj = poly[j * 2 + 1];
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const isPointInShape = (shape: Shape, x: number, y: number) => {
    if (shape.type === 'rect') {
      return x >= 0 && x <= shape.width && y >= 0 && y <= shape.height;
    }
    if (shape.type === 'polygon' && shape.points) {
      return isPointInPolygon(shape.points, x, y);
    }
    return false;
  };

  const ShapeLabelGroup = ({ 
    logoUrl, 
    label, 
    x: containerX, 
    y: containerY, 
    width: containerWidth, 
    height: containerHeight 
  }: { 
    logoUrl?: string, 
    label: string, 
    x: number, 
    y: number, 
    width: number, 
    height: number 
  }) => {
    const [img] = useImage(logoUrl || '', 'anonymous');
    const fontSize = logoUrl ? 9 : 10;
    
    if (!logoUrl || !img) {
      return (
        <Text
          text={label}
          x={containerX}
          y={containerY}
          width={containerWidth}
          height={containerHeight}
          fontSize={fontSize}
          fontFamily="Inter"
          fill="#FFFFFF"
          align="center"
          verticalAlign="middle"
          listening={false}
          fontStyle="bold"
          opacity={1}
          shadowColor="rgba(0,0,0,0.5)"
          shadowBlur={4}
          shadowOffset={{ x: 1, y: 1 }}
          shadowOpacity={0.8}
        />
      );
    }

    // Calculate logo size
    const maxLogoWidth = containerWidth * 0.35;
    const maxLogoHeight = containerHeight * 0.7;
    let logoWidth = img.width;
    let logoHeight = img.height;
    const ratio = logoWidth / logoHeight;

    if (logoWidth > maxLogoWidth) {
      logoWidth = maxLogoWidth;
      logoHeight = maxLogoWidth / ratio;
    }
    if (logoHeight > maxLogoHeight) {
      logoHeight = maxLogoHeight;
      logoWidth = maxLogoHeight * ratio;
    }

    const gap = 4;
    // Estimate text width: average character width is roughly 60% of font size
    const estimatedTextWidth = Math.min(containerWidth * 0.6, label.length * (fontSize * 0.65));
    const totalContentWidth = logoWidth + gap + estimatedTextWidth;
    
    const startX = containerX + (containerWidth - totalContentWidth) / 2;
    const logoY = containerY + (containerHeight - logoHeight) / 2;

    return (
      <Group listening={false}>
        {/* Logo background */}
        <Rect
          x={startX - 2}
          y={logoY - 2}
          width={logoWidth + 4}
          height={logoHeight + 4}
          fill="white"
          cornerRadius={4}
          shadowBlur={2}
          shadowOpacity={0.1}
          listening={false}
        />
        <Image 
          image={img}
          x={startX}
          y={logoY}
          width={logoWidth}
          height={logoHeight}
          opacity={1}
          listening={false}
        />
        <Text
          text={label}
          x={startX + logoWidth + gap + 4}
          y={containerY}
          width={estimatedTextWidth}
          height={containerHeight}
          fontSize={fontSize}
          fontFamily="Inter"
          fill="#FFFFFF"
          align="left"
          verticalAlign="middle"
          listening={false}
          fontStyle="bold"
          opacity={1}
          shadowColor="rgba(0,0,0,0.5)"
          shadowBlur={4}
          shadowOffset={{ x: 1, y: 1 }}
          shadowOpacity={0.8}
        />
      </Group>
    );
  };

  const getSnappedPoint = (mouse: Point) => {
    let closestSnap = { x: mouse.x, y: mouse.y, dist: Infinity, type: null as 'vertex' | 'edge' | null };
    const snapThreshold = 15;

    shapes.forEach(shape => {
      if (shape.id === 'floor') return;
      
      const localMouse = getLocalMousePos(shape, mouse);
      const points = getShapePoints(shape);
      const rad = (shape.rotation * Math.PI) / 180;

      // Check Vertices
      for (let i = 0; i < points.length / 2; i++) {
        const lx = points[i * 2];
        const ly = points[i * 2 + 1];
        
        const gx = shape.x + lx * Math.cos(rad) - ly * Math.sin(rad);
        const gy = shape.y + lx * Math.sin(rad) + ly * Math.cos(rad);
        
        const d = Math.sqrt(Math.pow(mouse.x - gx, 2) + Math.pow(mouse.y - gy, 2));
        if (d < 10 && d < closestSnap.dist) {
          closestSnap = { x: gx, y: gy, dist: d, type: 'vertex' };
        }
      }

      // Check Edges
      if (closestSnap.dist > 15 || closestSnap.type !== 'vertex') {
        const res = findEdgeIntersection(shape, localMouse);
        if (res) {
          const gx = shape.x + res.x * Math.cos(rad) - res.y * Math.sin(rad);
          const gy = shape.y + res.x * Math.sin(rad) + res.y * Math.cos(rad);
          const d = Math.sqrt(Math.pow(mouse.x - gx, 2) + Math.pow(mouse.y - gy, 2));
          
          if (d < snapThreshold && d < closestSnap.dist) {
            closestSnap = { x: gx, y: gy, dist: d, type: res.isVertex ? 'vertex' : 'edge' };
          }
        }
      }
    });

    return closestSnap.type ? { x: closestSnap.x, y: closestSnap.y, type: closestSnap.type } : null;
  };

  const findEdgeIntersection = (shape: Shape, localPoint: Point) => {
    const points = getShapePoints(shape);
    const n = points.length / 2;
    let closest = null;
    let minDist = Infinity;

    for (let i = 0; i < n; i++) {
      const x1 = points[i * 2];
      const y1 = points[i * 2 + 1];
      const x2 = points[((i + 1) * 2) % points.length];
      const y2 = points[((i + 1) * 2 + 1) % points.length];

      const dx = x2 - x1;
      const dy = y2 - y1;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) continue;

      let t = ((localPoint.x - x1) * dx + (localPoint.y - y1) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));

      const px = x1 + t * dx;
      const py = y1 + t * dy;
      const dist = Math.sqrt(Math.pow(localPoint.x - px, 2) + Math.pow(localPoint.y - py, 2));

      if (dist < 15) { // Snapping tolerance
        const d1 = Math.sqrt(Math.pow(localPoint.x - x1, 2) + Math.pow(localPoint.y - y1, 2));
        const d2 = Math.sqrt(Math.pow(localPoint.x - x2, 2) + Math.pow(localPoint.y - y2, 2));
        
        let resX, resY, isVertex;
        if (d1 < 10) {
          resX = x1; resY = y1; isVertex = true;
        } else if (d2 < 10) {
          resX = x2; resY = y2; isVertex = true;
        } else {
          resX = px; resY = py; isVertex = false;
        }

        if (dist < minDist) {
          minDist = dist;
          closest = { index: i, x: resX, y: resY, isVertex, dist };
        }
      }
    }
    return closest;
  };

  const executeSplit = (shapeId: string, path: Point[]) => {
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape || path.length < 2) return;

    onSaveHistory();
    const originalPoints = getShapePoints(shape);
    const n = originalPoints.length / 2;
    
    // Start and end are on edges
    const startRes = findEdgeIntersection(shape, path[0]);
    const endRes = findEdgeIntersection(shape, path[path.length - 1]);
    
    if (!startRes || !endRes) {
      setPrompt('Split failed: Path must start and end on the boundary.');
      return;
    }

    if (startRes.index === endRes.index) {
      // Check if they are far enough apart or handle simple case
      // For now, allow it but ensure logic holds
    }

    const startIndex = startRes.index;
    const endIndex = endRes.index;

    const interiorPath = path.slice(1, -1);
    
    // Traversal functions
    const getBoundaryPoints = (from: number, to: number) => {
      const res: number[] = [];
      // If the split starts and ends on the same edge, 
      // one side has all vertices, the other has none.
      // But which side? The one that goes "around" the polygon.
      // The edge itself is from index to index+1.
      // startIndex = i means points[i] to points[i+1].
      
      // We want to go from (from + 1) % n to to (inclusive)
      let curr = (from + 1) % n;
      const steps = (to - from + n) % n;
      
      // If steps is 0 (startIndex == endIndex), it means the "short" side has no intermediate vertices.
      // The "long" side has n-1 intermediate vertices? No, n vertices.
      
      // Actually, if we want to go from startRes to endRes via original vertices:
      // Side A traversal: (startIndex + 1) % n  --> endIndex
      // Side B traversal: (endIndex + 1) % n    --> startIndex
      return { curr, steps };
    };

    // Polygon A: startIndex+1 -> endIndex, then reversed path
    const polyAPoints: number[] = [];
    polyAPoints.push(endRes.x, endRes.y);
    for (let k = interiorPath.length - 1; k >= 0; k--) {
      polyAPoints.push(interiorPath[k].x, interiorPath[k].y);
    }
    polyAPoints.push(startRes.x, startRes.y);
    
    let { curr: i, steps: stepsA } = getBoundaryPoints(startIndex, endIndex);
    if (startIndex !== endIndex || true) { // If they are different, or even if same, we need to decide which side gets the vertices
       // Wait, if startIndex == endIndex, one side should get all vertices, one should get none.
       // Let's define: polyA always goes the "long" way around if same edge? 
       // Or just follow the natural from -> to logic.
       if (startIndex === endIndex) {
          // polyB will be the "short" one (no original vertices)
          // polyA will be the "long" one (all original vertices)
          for (let k = 0; k < n; k++) {
            const idx = (startIndex + 1 + k) % n;
            polyAPoints.push(originalPoints[idx * 2], originalPoints[idx * 2 + 1]);
          }
       } else {
          let count = 0;
          while (count <= stepsA) {
            polyAPoints.push(originalPoints[i * 2], originalPoints[i * 2 + 1]);
            if (i === endIndex) break;
            i = (i + 1) % n;
            count++;
          }
       }
    }

    // Polygon B: endIndex+1 -> startIndex, then forward path
    const polyBPoints: number[] = [];
    polyBPoints.push(startRes.x, startRes.y);
    for (let k = 0; k < interiorPath.length; k++) {
      polyBPoints.push(interiorPath[k].x, interiorPath[k].y);
    }
    polyBPoints.push(endRes.x, endRes.y);

    if (startIndex !== endIndex) {
      let { curr: j, steps: stepsB } = getBoundaryPoints(endIndex, startIndex);
      let count = 0;
      while (count <= stepsB) {
        polyBPoints.push(originalPoints[j * 2], originalPoints[j * 2 + 1]);
        if (j === startIndex) break;
        j = (j + 1) % n;
        count++;
      }
    }
    // If startIndex === endIndex, polyB gets NO original vertices (it just closes with the edge segment)

    const newShapeA: Shape = {
      ...shape,
      type: 'polygon',
      points: polyAPoints,
      name: `${shape.name} (A)`,
      label: `${shape.label} (A)`
    };
    delete (newShapeA as any).width;
    delete (newShapeA as any).height;

    const newShapeB: Shape = {
      ...shape,
      id: `shape-${Date.now()}-B`,
      type: 'polygon',
      points: polyBPoints,
      fill: `hsla(${Math.random() * 360}, 70%, 50%, 0.4)`,
      name: `${shape.name} (B)`,
      label: `${shape.label} (B)`
    };
    delete (newShapeB as any).width;
    delete (newShapeB as any).height;

    onUpdate(newShapeA);
    onAdd(newShapeB);
    
    setPrompt('Shape split successful.');
  };

  const executeMerge = () => {
    if (selectedIds.length < 2) {
      setPrompt('Please select at least 2 shapes to merge.');
      return;
    }

    const eligibleShapes = shapes.filter(s => selectedIds.includes(s.id) && s.id !== 'floor');
    if (eligibleShapes.length < 2) {
      setPrompt('Floor cannot be merged. Select at least 2 other shapes.');
      return;
    }

    try {
      // Helper to convert shape to polybool polygon format
      const toPoly = (s: Shape) => {
        const points = getShapePoints(s);
        const rad = (s.rotation * Math.PI) / 180;
        const outer: [number, number][] = [];
        for (let i = 0; i < points.length; i += 2) {
          const lx = points[i];
          const ly = points[i + 1];
          const gx = s.x + lx * Math.cos(rad) - ly * Math.sin(rad);
          const gy = s.y + lx * Math.sin(rad) + ly * Math.cos(rad);
          outer.push([gx, gy]);
        }
        return { regions: [outer], inverted: false };
      };

      // Find connected components
      const n = eligibleShapes.length;
      const adjacency: boolean[][] = Array(n).fill(null).map(() => Array(n).fill(false));
      
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const p1 = toPoly(eligibleShapes[i]);
          const p2 = toPoly(eligibleShapes[j]);
          try {
            const union = PolyBool.union(p1, p2);
            // If they are connected (overlapping or touching), the number of regions will be less than the sum
            // region count: p1 has 1, p2 has 1. If union has 1, they are connected.
            if (union.regions.length < 2) {
              adjacency[i][j] = true;
              adjacency[j][i] = true;
            }
          } catch (e) {
            // If PolyBool fails, assume no intersection
          }
        }
      }

      const visited = new Array(n).fill(false);
      const groups: number[][] = [];

      for (let i = 0; i < n; i++) {
        if (!visited[i]) {
          const group: number[] = [];
          const queue = [i];
          visited[i] = true;
          while (queue.length > 0) {
            const u = queue.shift()!;
            group.push(u);
            for (let v = 0; v < n; v++) {
              if (adjacency[u][v] && !visited[v]) {
                visited[v] = true;
                queue.push(v);
              }
            }
          }
          groups.push(group);
        }
      }

      const groupsToMerge = groups.filter(g => g.length > 1);
      if (groupsToMerge.length === 0) {
        setCenterAlert('当前没有可合并的图形 (No overlapping or adjacent shapes to merge)');
        return;
      }

      onSaveHistory();
      const idsToDelete: string[] = [];
      const newShapes: Shape[] = [];

      for (const groupIndices of groupsToMerge) {
        const groupShapes = groupIndices.map(idx => eligibleShapes[idx]);
        idsToDelete.push(...groupShapes.map(s => s.id));

        let groupResultPoly = toPoly(groupShapes[0]);
        for (let i = 1; i < groupShapes.length; i++) {
          groupResultPoly = PolyBool.union(groupResultPoly, toPoly(groupShapes[i]));
        }

        // Each group could potentially result in multiple regions if something went wrong, 
        // but by our adjacency check they should be one. 
        // We'll create a shape for each region just in case.
        groupResultPoly.regions.forEach((region, rIdx) => {
          const points: number[] = [];
          region.forEach((p: number[]) => points.push(p[0], p[1]));
          
          newShapes.push({
            id: `merged-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type: 'polygon',
            x: 0,
            y: 0,
            rotation: 0,
            points,
            fill: groupShapes[0].fill,
            name: groupShapes[0].name.includes('Merged') ? groupShapes[0].name : `Merged Zone`,
            label: groupShapes[0].label.includes('Merged') ? groupShapes[0].label : `Merged Zone`,
            width: 0,
            height: 0
          });
        });
      }

      onDelete(idsToDelete);
      newShapes.forEach(s => onAdd(s));
      
      // Update selection: merged shapes + any single eligible shapes that were selected but NOT merged
      const singleGroupIds = groups.filter(g => g.length === 1).map(g => eligibleShapes[g[0]].id);
      onSelect([...newShapes.map(s => s.id), ...singleGroupIds]);
      
      setPrompt('图形合并成功 (Shapes merged successfully)');

    } catch (err) {
      console.error(err);
      setPrompt('Merge failed. Ensure shapes are simple polygons.');
    }
  };

  const handleStageMouseMove = (e: any) => {
    const stage = stageRef.current;
    if (!stage) return;

    const mouse = getRelativePointerPosition();
    setMousePos(mouse);

    if (drawingStep > 0) {
      if (mode === 'add') {
        const snapped = getSnappedPoint(mouse);
        setSnappedPoint(snapped);
      }
      return;
    }

    // Edge hover logic for addition
    if (mode === 'edit' && selectedIds.length === 1) {
      const id = selectedIds[0];
      const shape = shapes.find(s => s.id === id);
      if (shape && id !== 'floor') {
        // Transform mouse to local space
        const rad = (shape.rotation * Math.PI) / 180;
        const localX = (mouse.x - shape.x) * Math.cos(-rad) - (mouse.y - shape.y) * Math.sin(-rad);
        const localY = (mouse.x - shape.x) * Math.sin(-rad) + (mouse.y - shape.y) * Math.cos(-rad);

        const points = getShapePoints(shape);
        let foundEdge = null;
        for (let i = 0; i < points.length / 2; i++) {
          const x1 = points[i * 2];
          const y1 = points[i * 2 + 1];
          const x2 = points[((i + 1) * 2) % points.length];
          const y2 = points[((i + 1) * 2 + 1) % points.length];

          // Distance point to line segment
          const dx = x2 - x1;
          const dy = y2 - y1;
          const t = ((localX - x1) * dx + (localY - y1) * dy) / (dx * dx + dy * dy);
          if (t >= 0.1 && t <= 0.9) {
            const px = x1 + t * dx;
            const py = y1 + t * dy;
            const dist = Math.sqrt(Math.pow(localX - px, 2) + Math.pow(localY - py, 2));
            if (dist < 10) {
              foundEdge = { index: i, x: px, y: py };
              break;
            }
          }
        }
        setHoveredEdge(foundEdge);
      }
    } else {
      setHoveredEdge(null);
    }

    // Split snapping logic
    if (mode === 'split' && selectedIds.length > 0) {
      let bestMatch: any = null;
      let minGlobalDist = Infinity;

      for (const id of selectedIds) {
        if (id === 'floor') continue;
        const shape = shapes.find(s => s.id === id);
        if (!shape) continue;
        if (splittingShapeId && shape.id !== splittingShapeId) continue;
        
        const localMouse = getLocalMousePos(shape, mouse);
        const res = findEdgeIntersection(shape, localMouse);
        if (res) {
          const rad = (shape.rotation * Math.PI) / 180;
          const gx = shape.x + res.x * Math.cos(rad) - res.y * Math.sin(rad);
          const gy = shape.y + res.x * Math.sin(rad) + res.y * Math.cos(rad);
          const d = Math.sqrt(Math.pow(mouse.x - gx, 2) + Math.pow(mouse.y - gy, 2));
          
          if (d < minGlobalDist) {
            minGlobalDist = d;
            bestMatch = { ...res, shapeId: shape.id };
          }
        }
      }
      setHoveredSplitEdge(bestMatch);
    } else {
      setHoveredSplitEdge(null);
    }

    // Add mode snapping
    if (mode === 'add') {
      const snapped = getSnappedPoint(mouse);
      setSnappedPoint(snapped);
    } else {
      setSnappedPoint(null);
    }
  };

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, shapeId: string, index: number } | null>(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleMoveHandleDragMove = (e: any, shapeId: string) => {
    e.cancelBubble = true;
    const node = e.target;
    const group = node.getParent();
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape || !group) return;

    const dx = node.x() - (node.attrs.lastX || 0);
    const dy = node.y() - (node.attrs.lastY || 0);

    group.x(group.x() + dx);
    group.y(group.y() + dy);

    node.x(node.attrs.lastX || 0);
    node.y(node.attrs.lastY || 0);
  };

  const handleMoveHandleDragEnd = (e: any, shapeId: string) => {
    e.cancelBubble = true;
    const group = e.target.getParent();
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape || !group) return;

    onUpdate({
      ...shape,
      x: group.x(),
      y: group.y()
    });
  };

  const handleStageClick = (e: any) => {
    setContextMenu(null);
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background';
    const isRightClick = e.evt.button === 2;

    if (isRightClick) {
      if (mode === 'add' && drawingStep > 0) {
        setDrawingStep(0);
        setStartPoint(null);
        setSecondPoint(null);
        setPrompt('Drawing cancelled.');
      }
      if (mode === 'split') {
        setSplittingShapeId(null);
        setSplitPath([]);
        setPrompt('Split cancelled.');
      }
      return;
    }

    if (mode === 'split') {
      const mouse = getRelativePointerPosition();
      
      if (!splittingShapeId) {
        // Find if we clicked on an edge of a selected shape
        let currentEdge = hoveredSplitEdge;
        if (!currentEdge) {
          // Robust check on click to find the best matching edge
          let minGlobalDist = Infinity;
          for (const id of selectedIds) {
            const shape = shapes.find(s => s.id === id);
            if (shape && id !== 'floor') {
              const localMouse = getLocalMousePos(shape, mouse);
              const res = findEdgeIntersection(shape, localMouse);
              if (res) {
                const rad = (shape.rotation * Math.PI) / 180;
                const gx = shape.x + res.x * Math.cos(rad) - res.y * Math.sin(rad);
                const gy = shape.y + res.x * Math.sin(rad) + res.y * Math.cos(rad);
                const d = Math.sqrt(Math.pow(mouse.x - gx, 2) + Math.pow(mouse.y - gy, 2));
                
                if (d < minGlobalDist) {
                  minGlobalDist = d;
                  currentEdge = { ...res, shapeId: id };
                }
              }
            }
          }
        }

        if (currentEdge && selectedIds.includes(currentEdge.shapeId)) {
          setSplittingShapeId(currentEdge.shapeId);
          setSplitPath([{ x: currentEdge.x, y: currentEdge.y }]);
          setPrompt('Boundary point set. Click more points inside the shape. Final point must be on a boundary.');
          return;
        }

        // Second priority: Select a different shape if we clicked on one
        // If mode is split, we don't allow selecting other shapes when click happens outside or on a different shape unless explicitly requested
        // BUT the user specifically asked: "不能选中别的图形" (cannot select other shapes)
        // So we should return early if we're not clicking on the boundary of the selected shape
        
        if (selectedIds.length === 0) {
          setPrompt('Select a shape first.');
          const node = e.target;
          const potentialShapeName = node.name() || node.getParent()?.name();
          if (potentialShapeName?.startsWith('shape-')) {
            const id = potentialShapeName.split('shape-')[1];
            if (id !== 'floor') {
              onSelect([id]);
              setPrompt('Shape selected. Click on its boundary to start splitting.');
              return;
            }
          }
        } else if (!currentEdge) {
          // If we are in split mode and have selected shapes, but didn't click an edge
          // we should not select other shapes.
          setPrompt('Click the boundary of the selected shape to start splitting.');
        }
        return; // Prevent fallthrough to regular selection logic
      } else {
        // Continue splitting
        const targetShape = shapes.find(s => s.id === splittingShapeId);
        if (targetShape) {
          const localMouse = getLocalMousePos(targetShape, mouse);
          const edgePointRes = findEdgeIntersection(targetShape, localMouse);
          
          if (edgePointRes && splitPath.length >= 1) {
            // Distance check to avoid ending split immediately on the start point
            const dist = Math.sqrt(
              Math.pow(localMouse.x - splitPath[splitPath.length-1].x, 2) + 
              Math.pow(localMouse.y - splitPath[splitPath.length-1].y, 2)
            );

            if (dist > 10 || splitPath.length > 1) {
              // End split
              const finalPath = [...splitPath, { x: edgePointRes.x, y: edgePointRes.y }];
              executeSplit(splittingShapeId, finalPath);
              setSplittingShapeId(null);
              setSplitPath([]);
              return;
            }
          }
          
          if (!isPointInShape(targetShape, localMouse.x, localMouse.y)) {
            setPrompt('点位于图形外，拆分点必须在图形内部或边界上 (Point outside shape. Split points must be inside or on the boundary).');
            return;
          }

          setSplitPath([...splitPath, localMouse]);
          setPrompt('下一步：绘制图形内部点或点击边界结束拆分 (Next point: interior or boundary).');
        }
      }
      return;
    }

    if (mode === 'add') {
      const mouse = getRelativePointerPosition();
      // Recalculate snap during click to ensure accuracy
      const currentSnap = getSnappedPoint(mouse);
      const point = currentSnap ? { x: currentSnap.x, y: currentSnap.y } : mouse;
      
      if (drawingStep === 0) {
        setStartPoint(point);
        setDrawingStep(1);
        setPrompt('Step 2: Confirm direction.');
      } else if (drawingStep === 1) {
        setSecondPoint(point);
        setDrawingStep(2);
        setPrompt('Step 3: Confirm width.');
      } else if (drawingStep === 2) {
        const finalShape = calculatePreviewRect(startPoint!, secondPoint!, point);
        if (finalShape) {
          onSaveHistory();
          onAdd({
            ...finalShape,
            id: `shape-${Date.now()}`,
            type: 'rect',
            fill: `hsla(${Math.random() * 360}, 70%, 50%, 0.4)`,
            name: `New Zone`,
            label: `New Zone`
          });
        }
        setDrawingStep(0);
        setStartPoint(null);
        setSecondPoint(null);
        setPrompt('Zone added.');
      }
      return;
    }

    if (clickedOnEmpty) {
      onSelect([]);
    }
  };

  const handleShapeClick = (e: any, id: string) => {
    if (mode === 'add' || id === 'floor') return;
    
    if (mode === 'split') {
      // If a split is already in progress, or if a shape is already selected, ignore clicks on other shapes
      if (splittingShapeId || (selectedIds.length > 0 && !selectedIds.includes(id))) {
        return;
      }
    }

    // In split mode, don't cancel bubble so handleStageClick can handle splitting logic
    if (mode !== 'split') {
      e.cancelBubble = true;
    }

    const isCtrl = e.evt.ctrlKey || e.evt.metaKey;
    const isMergeMode = mode === 'merge';

    if (isMergeMode || isCtrl) {
      if (selectedIds.includes(id)) {
        onSelect(selectedIds.filter(idx => idx !== id));
      } else {
        onSelect([...selectedIds, id]);
      }
    } else {
      onSelect([id]);
    }
  };

  const handleDragEnd = (e: any, id: string) => {
    const shape = shapes.find(s => s.id === id);
    if (shape) {
      onUpdate({
        ...shape,
        x: e.target.x(),
        y: e.target.y(),
      });
    }
  };

  const handleTransformEnd = (e: any, id: string) => {
    const node = e.target;
    const shape = shapes.find(s => s.id === id);
    if (shape) {
      onUpdate({
        ...shape,
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * node.scaleX()),
        height: Math.max(5, node.height() * node.scaleY()),
        rotation: node.rotation(),
      });
      node.scaleX(1);
      node.scaleY(1);
    }
  };

  const calculatePreviewRect = (p1: Point, p2: Point, p3: Point) => {
    const angleRad = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const rotation = (angleRad * 180) / Math.PI;
    const width = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return null;
    const nx = -dy / len;
    const ny = dx / len;
    const height = (p3.x - p1.x) * nx + (p3.y - p1.y) * ny;
    return { x: p1.x, y: p1.y, width, height, rotation };
  };

  useEffect(() => {
    if (transformerRef.current) {
      const stage = transformerRef.current.getStage();
      if (!stage) return;
      const selectedNodes = selectedIds.map(id => stage.findOne(`.shape-${id}`)).filter(Boolean);
      transformerRef.current.nodes(selectedNodes as Konva.Node[]);
    }
  }, [selectedIds, mode, shapes]);

  const getStepInstruction = () => {
    switch (mode) {
      case 'select':
        return '点击图形查看或修改属性';
      case 'add':
        if (drawingStep === 0) return '点击画布设置起点';
        if (drawingStep === 1) return '拖动设置边长，点击确认';
        if (drawingStep === 2) return '拖动设置边长，点击完成';
        break;
      case 'edit':
        if (selectedIds.length === 0) return '点击图形进行编辑';
        return '拖动顶点改变形状，点击边线增加顶点，点击右键可选删除顶点';
      case 'split':
        if (!splittingShapeId) return '点击图形边界开始拆分';
        if (splitPath.length === 1) return '点击内部绘制路径，或点击边界结束';
        return '继续点击内部点，或点击边界完成拆分';
      case 'merge':
        if (selectedIds.length < 2) return '选择多个重叠图形进行合并';
        return '点击上方“合并”按钮开始';
    }
    return '';
  };

  return (
    <div className="w-full h-full">
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex gap-2">
        {mode === 'merge' && (
          <button
            onClick={executeMerge}
            disabled={selectedIds.length < 2}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 disabled:opacity-50 disabled:grayscale transition-all font-medium text-sm border border-indigo-500 flex items-center gap-2 pointer-events-auto"
          >
            确认合并 (Confirm Merge)
          </button>
        )}
      </div>

      <Stage
        ref={stageRef}
        width={windowSize.width}
        height={windowSize.height}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onContextMenu={(e) => e.evt.preventDefault()}
        onMouseMove={handleStageMouseMove}
        onDragEnd={handleDragStage}
        draggable={(mode === 'select' || mode === 'edit') && drawingStep === 0}
      >
        <Layer>
          {/* Background area for click detection */}
          <Rect 
            x={-5000} y={-5000} width={10000} height={10000} 
            fill="transparent"
            name="background"
          />

          <Group name="grid">
             {Array.from({ length: 50 }).map((_, i) => (
               <Line key={`v-${i}`} points={[i * 40, 0, i * 40, 2000]} stroke="#ffffff" opacity={0.03} />
             ))}
             {Array.from({ length: 50 }).map((_, i) => (
               <Line key={`h-${i}`} points={[0, i * 40, 2000, i * 40]} stroke="#ffffff" opacity={0.03} />
             ))}
          </Group>

          {shapes.map((shape) => (
            <Group 
              key={shape.id} 
              x={shape.x} y={shape.y} rotation={shape.rotation}
              draggable={false}
              onDragEnd={(e) => handleDragEnd(e, shape.id)}
              name={`shape-${shape.id}`}
              listening={shape.id !== 'floor'}
            >
              {shape.type === 'rect' ? (
                <Rect
                  width={shape.width}
                  height={shape.height}
                  fill={shape.fill}
                  opacity={shape.fill === '#fdfaf4' ? 1 : 0.9}
                  stroke={selectedIds.includes(shape.id) ? '#6366f1' : 'rgba(0,0,0,0.1)'}
                  strokeWidth={selectedIds.includes(shape.id) ? 2 : 0.4}
                  onClick={(e) => handleShapeClick(e, shape.id)}
                  onTransformEnd={(e) => handleTransformEnd(e, shape.id)}
                  cornerRadius={shape.name === 'Kiosk' ? 100 : 0}
                />
              ) : (
                <Line
                  points={shape.points || []}
                  fill={shape.fill}
                  opacity={0.9}
                  closed={true}
                  stroke={selectedIds.includes(shape.id) ? '#6366f1' : 'rgba(0,0,0,0.1)'}
                  strokeWidth={selectedIds.includes(shape.id) ? 2 : 0.4}
                  onClick={(e) => handleShapeClick(e, shape.id)}
                  lineJoin="round"
                />
              )}
              {shape.label && (() => {
                let textX = 0;
                let textY = 0;
                let textWidth = 0;
                let textHeight = 0;

                if (shape.type === 'rect') {
                  textX = 0;
                  textY = 0;
                  textWidth = shape.width;
                  textHeight = shape.height;
                } else if (shape.type === 'polygon' && shape.points) {
                  // Find bounding box center for polygon
                  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                  for (let i = 0; i < shape.points.length; i += 2) {
                    minX = Math.min(minX, shape.points[i]);
                    minY = Math.min(minY, shape.points[i+1]);
                    maxX = Math.max(maxX, shape.points[i]);
                    maxY = Math.max(maxY, shape.points[i+1]);
                  }
                  textX = minX;
                  textY = minY;
                  textWidth = maxX - minX;
                  textHeight = maxY - minY;
                }

                return (
                  <ShapeLabelGroup 
                    logoUrl={shape.logo}
                    label={shape.label}
                    x={textX}
                    y={textY}
                    width={textWidth}
                    height={textHeight}
                  />
                );
              })()}
              {/* Vertex Handles & Other Select Overlays */}
              {mode === 'edit' && selectedIds.includes(shape.id) && shape.id !== 'floor' && (() => {
                const points = getShapePoints(shape);
                const handles = [];
                
                // 0. Move handle in the center of bounding box
                let minHBX = Infinity, minHBY = Infinity, maxHBX = -Infinity, maxHBY = -Infinity;
                for (let i = 0; i < points.length; i += 2) {
                  minHBX = Math.min(minHBX, points[i]);
                  minHBY = Math.min(minHBY, points[i+1]);
                  maxHBX = Math.max(maxHBX, points[i]);
                  maxHBY = Math.max(maxHBY, points[i+1]);
                }
                const centerX = minHBX + (maxHBX - minHBX) / 2;
                const centerY = minHBY + (maxHBY - minHBY) / 2;

                handles.push(
                  <Group
                    key="move-handle"
                    x={centerX}
                    y={centerY}
                    draggable
                    onDragMove={(e) => handleMoveHandleDragMove(e, shape.id)}
                    onDragEnd={(e) => handleMoveHandleDragEnd(e, shape.id)}
                    lastX={centerX}
                    lastY={centerY}
                    onDragStart={(e) => { 
                      e.cancelBubble = true;
                      onSaveHistory();
                    }}
                    onMouseEnter={(e: any) => {
                      const container = e.target.getStage().container();
                      container.style.cursor = 'move';
                    }}
                    onMouseLeave={(e: any) => {
                      const container = e.target.getStage().container();
                      container.style.cursor = 'default';
                    }}
                  >
                    <Circle radius={18} fill="white" stroke="#6366f1" strokeWidth={2} shadowColor="rgba(0,0,0,0.2)" shadowBlur={5} />
                    <Path 
                      data="M 0,-8 L 0,8 M -8,0 L 8,0 M -4,-4 L 0,-8 L 4,-4 M 4,4 L 0,8 L -4,4 M -4,4 L -8,0 L -4,-4 M 4,-4 L 8,0 L 4,4"
                      stroke="#6366f1"
                      strokeWidth={1.5}
                      listening={false}
                    />
                  </Group>
                );

                // 1. Vertex points
                for (let i = 0; i < points.length / 2; i++) {
                  handles.push(
                    <Group key={`vertex-${i}`} x={points[i*2]} y={points[i*2+1]}>
                      <Circle
                        radius={6}
                        fill="white"
                        stroke="#6366f1"
                        strokeWidth={1}
                        draggable
                        onDragStart={(e) => { 
                          e.cancelBubble = true;
                          onSaveHistory();
                        }}
                        onDragMove={(e) => {
                          e.cancelBubble = true;
                          const mouse = getRelativePointerPosition();
                          // Transform global mouse to local space relative to shape group
                          const rad = (shape.rotation * Math.PI) / 180;
                          const localX = (mouse.x - shape.x) * Math.cos(-rad) - (mouse.y - shape.y) * Math.sin(-rad);
                          const localY = (mouse.x - shape.x) * Math.sin(-rad) + (mouse.y - shape.y) * Math.cos(-rad);
                          
                          handleVertexDrag(shape.id, i, localX, localY);
                          e.target.position({ x: 0, y: 0 }); // Reset handle visual pos to group center (state updates points)
                        }}
                        onDragEnd={(e) => { 
                          e.cancelBubble = true;
                          const mouse = getRelativePointerPosition();
                          const rad = (shape.rotation * Math.PI) / 180;
                          const localX = (mouse.x - shape.x) * Math.cos(-rad) - (mouse.y - shape.y) * Math.sin(-rad);
                          const localY = (mouse.x - shape.x) * Math.sin(-rad) + (mouse.y - shape.y) * Math.cos(-rad);
                          handleVertexDrag(shape.id, i, localX, localY);
                        }}
                        onMouseEnter={() => setHoveredVertex({ shapeId: shape.id, index: i })}
                        onMouseLeave={() => setHoveredVertex(null)}
                        onContextMenu={(e) => {
                          e.evt.preventDefault();
                          const stage = e.target.getStage();
                          const pointer = stage?.getPointerPosition();
                          if (pointer) {
                            setContextMenu({
                              x: pointer.x,
                              y: pointer.y,
                              shapeId: shape.id,
                              index: i
                            });
                          }
                        }}
                      />
                    </Group>
                  );
                }

                // 3. Hovered Edge "+" Add Handle
                if (hoveredEdge) {
                  handles.push(
                    <Group key="add-vertex-handle" x={hoveredEdge.x} y={hoveredEdge.y} onClick={() => handleAddVertex(shape.id, hoveredEdge.index, hoveredEdge.x, hoveredEdge.y)}>
                      <Circle radius={7} fill="white" stroke="#22c55e" strokeWidth={1.5} />
                      <Text text="+" x={-3.5} y={-5} fontSize={12} fill="#22c55e" fontStyle="bold" />
                    </Group>
                  );
                }

                return handles;
              })()}
            </Group>
          ))}

          {mode === 'add' && startPoint && (
            <Group>
              {(() => {
                const currentPoint = snappedPoint || mousePos || { x: 0, y: 0 };
                if (drawingStep === 1) {
                  return <Line points={[startPoint.x, startPoint.y, currentPoint.x, currentPoint.y]} stroke="#6366f1" strokeWidth={2} dash={[5, 5]} />;
                } else if (drawingStep === 2 && secondPoint) {
                  const preview = calculatePreviewRect(startPoint, secondPoint, currentPoint);
                  if (preview) {
                    return (
                      <Rect 
                        x={preview.x} y={preview.y} 
                        width={preview.width} height={preview.height} 
                        rotation={preview.rotation}
                        fill="rgba(99, 102, 241, 0.2)"
                        stroke="#6366f1"
                        strokeWidth={1}
                      />
                    );
                  }
                }
                return null;
              })()}
            </Group>
          )}

          {snappedPoint && (
            <Circle 
              x={snappedPoint.x} 
              y={snappedPoint.y} 
              radius={snappedPoint.type === 'vertex' ? 8 : 6} 
              fill={snappedPoint.type === 'vertex' ? '#6366f1' : '#10b981'} 
              stroke="white" 
              strokeWidth={2}
              shadowBlur={5}
              shadowColor="rgba(0,0,0,0.2)"
              listening={false}
            />
          )}

          {mode === 'split' && (
            <Group listening={false}>
              {hoveredSplitEdge && (
                <Circle 
                  x={(() => {
                    const s = shapes.find(s => s.id === hoveredSplitEdge.shapeId);
                    if (!s) return 0;
                    const rad = (s.rotation * Math.PI) / 180;
                    return s.x + hoveredSplitEdge.x * Math.cos(rad) - hoveredSplitEdge.y * Math.sin(rad);
                  })()}
                  y={(() => {
                    const s = shapes.find(s => s.id === hoveredSplitEdge.shapeId);
                    if (!s) return 0;
                    const rad = (s.rotation * Math.PI) / 180;
                    return s.y + hoveredSplitEdge.x * Math.sin(rad) + hoveredSplitEdge.y * Math.cos(rad);
                  })()}
                  radius={hoveredSplitEdge.isVertex ? 8 : 6}
                  fill={hoveredSplitEdge.isVertex ? '#6366f1' : '#f43f5e'}
                  stroke="white"
                  strokeWidth={2}
                />
              )}
              {splittingShapeId && (() => {
                const shape = shapes.find(s => s.id === splittingShapeId);
                if (!shape) return null;
                const rad = (shape.rotation * Math.PI) / 180;
                
                const globalPoints: number[] = [];
                splitPath.forEach(lp => {
                  globalPoints.push(
                    shape.x + lp.x * Math.cos(rad) - lp.y * Math.sin(rad),
                    shape.y + lp.x * Math.sin(rad) + lp.y * Math.cos(rad)
                  );
                });
                
                // Add current mouse pos
                if (mousePos) {
                  globalPoints.push(mousePos.x, mousePos.y);
                }

                return (
                  <Line 
                    points={globalPoints}
                    stroke="#f43f5e"
                    strokeWidth={2}
                    dash={[5, 5]}
                  />
                );
              })()}
            </Group>
          )}

          {mode === 'edit' && selectedIds.length > 0 && selectedIds[0] === 'floor' && (
            <Transformer 
              ref={transformerRef} 
              anchorFill="#fff" anchorStroke="#6366f1" borderStroke="#fff" anchorSize={8} 
              onTransformStart={onSaveHistory}
            />
          )}

          {mousePos && getStepInstruction() && (
            <Label 
              x={mousePos.x + 15 / scale} 
              y={mousePos.y + 15 / scale} 
              scaleX={1/scale} 
              scaleY={1/scale}
              listening={false}
            >
              <Tag fill="rgba(0,0,0,0.7)" cornerRadius={4} padding={6} pointerDirection="top" pointerWidth={10} pointerHeight={10} lineJoin="round" />
              <Text text={getStepInstruction()} fill="white" fontSize={12} fontFamily="Inter" />
            </Label>
          )}
        </Layer>
      </Stage>

      {contextMenu && (
        <div 
          className="fixed bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-[1000] min-w-[120px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
            onClick={() => {
              handleDeleteVertex(contextMenu.shapeId, contextMenu.index);
              setContextMenu(null);
            }}
          >
            删除顶点
          </button>
        </div>
      )}

      <AnimatePresence>
        {centerAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-[2000] pointer-events-none"
          >
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700 px-8 py-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 max-w-md mx-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 border border-amber-500/30">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-[0.2em] text-amber-500 font-bold mb-1">Attention</p>
                <p className="text-lg text-white font-semibold tracking-tight">{centerAlert}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
