/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { MapEditor } from './components/MapEditor';
import { PromptBar } from './components/PromptBar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { EditorMode, Shape } from './types';
import { motion, AnimatePresence } from 'motion/react';

const INITIAL_SHAPES: Shape[] = [
  // --- Floor / Corridor Base (The off-white paths) ---
  { id: 'floor', type: 'rect', x: 20, y: 20, width: 1300, height: 1300, rotation: 0, fill: '#fdfaf4', name: 'Floor', label: '' },

  // --- External Grey Anchors ---
  { id: 'ext-g1', type: 'polygon', x: 0, y: 0, width: 0, height: 0, rotation: 0, fill: '#d1d5db', name: 'Base', points: [700, 50, 1000, 50, 1000, 600, 850, 500, 750, 400] },
  { id: 'ext-g2', type: 'polygon', x: 0, y: 0, width: 0, height: 0, rotation: 0, fill: '#d1d5db', name: 'Base', points: [100, 850, 450, 850, 450, 1150, 100, 1150] },

  // --- Shops Top ---
  { id: 's-mk', type: 'rect', x: 490, y: 205, width: 100, height: 40, rotation: 0, fill: '#fff200', name: 'Shop', label: 'MICHAEL KORS' },
  { id: 's-pau', type: 'polygon', x: 0, y: 0, width: 0, height: 0, rotation: 0, fill: '#67c1cf', name: 'Shop', points: [580, 160, 750, 160, 750, 240, 595, 240], label: 'PINKO' },
  { id: 's-purp1', type: 'rect', x: 520, y: 140, width: 60, height: 60, rotation: 0, fill: '#7d3f98', name: 'Shop' },

  // --- Left High Cluster ---
  { id: 's-pan', type: 'rect', x: 280, y: 310, width: 100, height: 70, rotation: 0, fill: '#67c1cf', name: 'Shop', label: 'PANDORA' },
  { id: 's-swa-bg', type: 'polygon', x: 0, y: 0, width: 0, height: 0, rotation: 0, fill: '#f9a799', name: 'Shop', points: [385, 305, 480, 305, 480, 380, 400, 380], label: 'SWAROVSKI' },
  { id: 's-te1', type: 'rect', x: 280, y: 390, width: 100, height: 80, rotation: 0, fill: '#67c1cf', name: 'Shop' },

  // --- Central Island Area ---
  { id: 's-aig', type: 'rect', x: 515, y: 440, width: 90, height: 60, rotation: 0, fill: '#fff200', name: 'Shop', label: 'AIGLE' },
  { id: 's-wt', type: 'polygon', x: 0, y: 0, width: 0, height: 0, rotation: 0, fill: '#67c1cf', name: 'Shop', points: [430, 420, 510, 420, 510, 580, 450, 580, 400, 500], label: 'WOLF TOTEM' },
  { id: 's-md', type: 'rect', x: 400, y: 620, width: 200, height: 40, rotation: 0, fill: '#f9a799', name: 'Shop', label: 'MARIE DALGAR' },

  // --- Right Side ---
  { id: 's-ini', type: 'rect', x: 650, y: 320, width: 100, height: 80, rotation: 0, fill: '#67c1cf', name: 'Shop', label: 'initial' },
  { id: 's-nike', type: 'polygon', x: 0, y: 0, width: 0, height: 0, rotation: 0, fill: '#67c1cf', name: 'Shop', points: [650, 430, 800, 430, 800, 550, 650, 550], label: 'NIKE KICKS LOUNGE' },
  { id: 's-hey', type: 'rect', x: 615, y: 615, width: 220, height: 50, rotation: 0, fill: '#7d3f98', name: 'Shop', label: '喜茶', logo: 'https://avatars.githubusercontent.com/u/45314051?s=280&v=4' },

  // --- Bottom Line ---
  { id: 's-sb', type: 'rect', x: 195, y: 800, width: 120, height: 60, rotation: 0, fill: '#7d3f98', name: 'Shop', label: '星巴克' },
  { id: 's-dys1', type: 'rect', x: 320, y: 800, width: 130, height: 50, rotation: 0, fill: '#fff200', name: 'Shop', label: '戴森' },
  { id: 's-dys2', type: 'rect', x: 455, y: 800, width: 130, height: 35, rotation: 0, fill: '#67c1cf', name: 'Shop' },
  { id: 's-pm', type: 'rect', x: 635, y: 800, width: 60, height: 50, rotation: 0, fill: '#f47920', name: 'Shop', label: 'POP MART' },
  { id: 's-cas', type: 'rect', x: 635, y: 670, width: 80, height: 110, rotation: 0, fill: '#67c1cf', name: 'Shop', label: 'Cassile' },
];

export default function App() {
  const [mode, setMode] = useState<EditorMode>('select');
  const [shapes, setShapes] = useState<Shape[]>(INITIAL_SHAPES);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [prompt, setPrompt] = useState<string>('Welcome to Indoor Map Editor. Select a tool or an object to begin.');

  // History state
  const [history, setHistory] = useState<{ 
    past: { shapes: Shape[]; selectedIds: string[] }[]; 
    future: { shapes: Shape[]; selectedIds: string[] }[] 
  }>({
    past: [],
    future: [],
  });

  const saveToHistory = useCallback((currentShapes: Shape[], currentSelectedIds: string[]) => {
    setHistory((prev) => {
      const newPast = [...prev.past, { shapes: currentShapes, selectedIds: currentSelectedIds }];
      if (newPast.length > 10) {
        newPast.shift();
      }
      return {
        past: newPast,
        future: [],
      };
    });
  }, []);

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;

      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, prev.past.length - 1);

      const currentState = { shapes, selectedIds };
      setShapes(previous.shapes);
      setSelectedIds(previous.selectedIds);

      return {
        past: newPast,
        future: [currentState, ...prev.future].slice(0, 10),
      };
    });
    setPrompt('Undo successful');
  }, [shapes, selectedIds]);

  const handleRedo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;

      const next = prev.future[0];
      const newFuture = prev.future.slice(1);

      const currentState = { shapes, selectedIds };
      setShapes(next.shapes);
      setSelectedIds(next.selectedIds);

      return {
        past: [...prev.past, currentState].slice(-10),
        future: newFuture,
      };
    });
    setPrompt('Redo successful');
  }, [shapes, selectedIds]);

  const handleSelect = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  const handleAddShape = useCallback((newShape: Shape) => {
    setShapes((prev) => [...prev, newShape]);
  }, []);

  const handleUpdateShape = useCallback((updatedShape: Shape) => {
    setShapes((prev) => prev.map((s) => (s.id === updatedShape.id ? updatedShape : s)));
  }, []);

  const handleDeleteShapes = useCallback((ids: string[]) => {
    setShapes((prev) => prev.filter((s) => !ids.includes(s.id)));
    setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
  }, []);

  const selectedShape = selectedIds.length === 1 ? shapes.find(s => s.id === selectedIds[0]) || null : null;

  const toggleMode = (newMode: EditorMode) => {
    if (mode === newMode) {
      setMode('select');
      setPrompt('Selection mode active.');
    } else {
      setMode(newMode);
      if (newMode === 'add') {
        setPrompt('Drawing: Click to set the starting point.');
      } else if (newMode === 'edit') {
        setPrompt('Editing: Drag handles to resize or reposition selected shapes.');
      } else if (newMode === 'merge') {
        setPrompt('Merge: Select 2 or more overlapping shapes to merge them.');
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo/Redo shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        e.preventDefault();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        handleRedo();
        e.preventDefault();
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        // Don't delete if we are in an input field
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
          return;
        }
        
        // Filter out floor from being deleted
        const idsToDelete = selectedIds.filter(id => id !== 'floor');
        if (idsToDelete.length > 0) {
          saveToHistory(shapes, selectedIds);
          handleDeleteShapes(idsToDelete);
          setPrompt(`Deleted ${idsToDelete.length} shape${idsToDelete.length > 1 ? 's' : ''}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, handleUndo, handleRedo, handleDeleteShapes]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#f1f5f9] text-slate-800 overflow-hidden font-sans relative">
      {/* Grid Background Layer */}
      <div className="absolute inset-0 opacity-20 grid-bg pointer-events-none" />

      <Toolbar 
        mode={mode} 
        onToggleMode={toggleMode} 
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
      />
      
      <main className="flex-1 relative overflow-hidden">
        <MapEditor
          mode={mode}
          shapes={shapes}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onAdd={handleAddShape}
          onUpdate={handleUpdateShape}
          onDelete={handleDeleteShapes}
          onSaveHistory={() => saveToHistory(shapes, selectedIds)}
          setPrompt={setPrompt}
        />
        
        {/* Viewport Info Overlay (matches design stats) */}
        <div className="absolute bottom-8 left-8 flex items-center gap-6 text-[10px] uppercase tracking-wider text-slate-500 pointer-events-none font-mono">
          <div className="flex gap-2"><span>MODE:</span> <span className="text-indigo-400 font-bold">{mode.toUpperCase()}</span></div>
          <div className="flex gap-2"><span>ACTIVE:</span> <span className="text-slate-300">{selectedIds.length} ITEMS</span></div>
        </div>

        <AnimatePresence>
          <PromptBar text={prompt} />
        </AnimatePresence>

        <AnimatePresence>
          {selectedShape && (
            <PropertiesPanel 
              selectedShape={selectedShape} 
              onUpdate={handleUpdateShape}
              onClose={() => handleSelect([])}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
