/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { MapEditor } from './components/MapEditor';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { FloorSelector, BottomActions, FloatingCompass } from './components/MainOverlay';
import { EditorMode, Shape } from './types';
import { motion, AnimatePresence } from 'motion/react';

const INITIAL_SHAPES: Shape[] = [
  {
    "id": "floor",
    "type": "rect",
    "x": 0,
    "y": 0,
    "width": 2200,
    "height": 1600,
    "rotation": 0,
    "fill": "#ffffff",
    "name": "Floor",
    "label": ""
  },
  {
    "id": "s-l1",
    "type": "polygon",
    "x": 0,
    "y": 0,
    "width": 0,
    "height": 0,
    "rotation": 0,
    "fill": "#e2e8f0",
    "name": "Shop",
    "points": [
      200,
      200,
      480,
      200,
      480,
      450,
      280,
      450,
      200,
      450
    ],
    "label": "空铺"
  },
  {
    "id": "s-l2",
    "type": "polygon",
    "x": 0,
    "y": 0,
    "width": 0,
    "height": 0,
    "rotation": 0,
    "fill": "#a0bfa0",
    "name": "Shop",
    "points": [
      200,
      500,
      480,
      500,
      480,
      950,
      200,
      950
    ],
    "label": "米可"
  },
  {
    "id": "s-l3",
    "type": "polygon",
    "x": 0,
    "y": 0,
    "width": 0,
    "height": 0,
    "rotation": 0,
    "fill": "#7da3da",
    "name": "Shop",
    "points": [
      200,
      1000,
      480,
      1000,
      480,
      1350,
      200,
      1350
    ],
    "label": "萃华珠宝"
  },
  {
    "id": "s-ct1",
    "type": "polygon",
    "x": 0,
    "y": 0,
    "width": 0,
    "height": 0,
    "rotation": 0,
    "fill": "#8eadde",
    "name": "Shop",
    "points": [
      550,
      250,
      800,
      250,
      800,
      400,
      720,
      500,
      550.9919148776077,
      499.07898108118604
    ],
    "label": "TIM 茶"
  },
  {
    "id": "s-ct2",
    "type": "polygon",
    "x": 0,
    "y": 0,
    "width": 0,
    "height": 0,
    "rotation": 0,
    "fill": "#abc2ab",
    "name": "Shop",
    "points": [
      820,
      250,
      1050,
      250,
      1065.3492588702286,
      549.96552353792,
      850,
      550,
      821.3975702858904,
      400.04755382979636
    ],
    "label": "半丘"
  },
  {
    "id": "s-ct3",
    "type": "polygon",
    "x": 0,
    "y": 0,
    "width": 0,
    "height": 0,
    "rotation": 0,
    "fill": "#e9cc95",
    "name": "Shop",
    "points": [
      1089.7425468511453,
      250.02748373771956,
      1350,
      250,
      1346.3651980021666,
      545.9774910549236,
      1106.3411409684168,
      546.9671641437576
    ],
    "label": "君颂"
  },
  {
    "id": "s-core",
    "type": "polygon",
    "x": 0,
    "y": 0,
    "width": 0,
    "height": 0,
    "rotation": 0,
    "fill": "#6293d8",
    "name": "Shop",
    "points": [
      620,
      600,
      1054.2078368532357,
      598.6298288888848,
      1280,
      680,
      1260.0501339845634,
      830.7014470140897,
      1050,
      830,
      1050,
      750,
      620,
      750
    ],
    "label": "优选超市"
  },
  {
    "id": "s-c1",
    "type": "rect",
    "x": 620,
    "y": 850,
    "width": 140,
    "height": 120,
    "rotation": 0,
    "fill": "#e8d4a0",
    "name": "Shop",
    "label": "霸王茶姬"
  },
  {
    "id": "s-c2",
    "type": "rect",
    "x": 780,
    "y": 850,
    "width": 160,
    "height": 120,
    "rotation": 0,
    "fill": "#a6c0e8",
    "name": "Shop",
    "label": "Lady女装"
  },
  {
    "id": "s-r1",
    "type": "polygon",
    "x": 0,
    "y": 0,
    "width": 0,
    "height": 0,
    "rotation": 0,
    "fill": "#7da3da",
    "name": "Shop",
    "points": [
      1475.2335700389092,
      287.52114060672744,
      1678.858244856652,
      284.8775870742075,
      1750,
      450,
      1726.1166733902269,
      653.8884477835585,
      1472.5541674765516,
      597.9088564532108
    ],
    "label": "蔚来汽车"
  },
  {
    "id": "s-r2",
    "type": "polygon",
    "x": 0,
    "y": 0,
    "width": 0,
    "height": 0,
    "rotation": 0,
    "fill": "#8eadde",
    "name": "Shop",
    "points": [
      1453.7717899928343,
      716.7054871088772,
      1708.6088106759883,
      765.9698563271189,
      1657.0415228974691,
      1022.3945489815504,
      1401.6020027813843,
      966.9609616110882
    ],
    "label": "喜茶"
  },
  {
    "id": "s-r3",
    "type": "polygon",
    "x": 0,
    "y": 0,
    "width": 0,
    "height": 0,
    "rotation": 0,
    "fill": "#e8d4a0",
    "name": "Shop",
    "points": [
      1398.1526858731222,
      1002.5914657450523,
      1650,
      1050,
      1600,
      1300,
      1350,
      1250
    ],
    "label": "空铺"
  },
  {
    "id": "s-b1",
    "type": "rect",
    "x": 550,
    "y": 1100,
    "width": 180,
    "height": 250,
    "rotation": 0,
    "fill": "#a0bfa0",
    "name": "Shop",
    "label": "欢聚"
  },
  {
    "id": "s-b2",
    "type": "rect",
    "x": 750,
    "y": 1100,
    "width": 220,
    "height": 250,
    "rotation": 0,
    "fill": "#5584e0",
    "name": "Shop",
    "label": "华为"
  },
  {
    "id": "s-b3",
    "type": "rect",
    "x": 990,
    "y": 1100,
    "width": 200,
    "height": 250,
    "rotation": 0,
    "fill": "#e9cc95",
    "name": "Shop",
    "label": "名媛.棠里"
  },
  {
    "id": "st-1",
    "type": "rect",
    "x": 1357.1913919441165,
    "y": 249.83857172043474,
    "width": 40,
    "height": 100,
    "rotation": 0,
    "fill": "#cbd5e1",
    "name": "Stairs",
    "label": "楼梯"
  },
  {
    "id": "st-2",
    "type": "polygon",
    "x": 579.5437115409053,
    "y": 602.2920624234378,
    "width": 0,
    "height": 0,
    "rotation": 0,
    "fill": "#cbd5e1",
    "name": "Elevator",
    "label": "电梯",
    "points": [
      -23.27565341636887,
      -0.04799308817825931,
      30,
      0,
      30,
      60,
      -22.704013376549256,
      59.381826367469216
    ]
  },
  {
    "id": "st-3",
    "type": "rect",
    "x": 1345.936295559092,
    "y": 1285.5037815121507,
    "width": 60,
    "height": 60,
    "rotation": 0,
    "fill": "#cbd5e1",
    "name": "WC",
    "label": "卫生间"
  },
  {
    "id": "p-h1",
    "type": "path",
    "x": 0,
    "y": 0,
    "width": 0,
    "height": 0,
    "rotation": 0,
    "fill": "none",
    "name": "Path",
    "points": [
      518.3451429800306,
      219.03210901317775,
      1800,
      220
    ]
  },
  {
    "id": "p-h2",
    "type": "path",
    "x": 0,
    "y": 0,
    "width": 0,
    "height": 0,
    "rotation": 0,
    "fill": "none",
    "name": "Path",
    "points": [
      517.4092592589858,
      566.6401333139169,
      1386.571917434938,
      571.3418718348677
    ]
  },
  {
    "id": "p-h3",
    "type": "path",
    "x": 0,
    "y": 0,
    "width": 0,
    "height": 0,
    "rotation": 0,
    "fill": "none",
    "name": "Path",
    "points": [
      518.4623749261665,
      1047.1639643496237,
      1323.3320807999119,
      1044.5307454884323
    ]
  },
  {
    "id": "p-v1",
    "type": "path",
    "x": 0,
    "y": 0,
    "width": 0,
    "height": 0,
    "rotation": 0,
    "fill": "none",
    "name": "Path",
    "points": [
      520,
      150,
      520,
      1400
    ]
  },
  {
    "id": "p-v2",
    "type": "path",
    "x": 0,
    "y": 0,
    "width": 0,
    "height": 0,
    "rotation": 0,
    "fill": "none",
    "name": "Path",
    "points": [
      1435.7597047189165,
      221.18097272170397,
      1277.7832739183382,
      1349.6894725481627
    ]
  },
  {
    "id": "p-v3",
    "type": "path",
    "x": 0,
    "y": 0,
    "width": 0,
    "height": 0,
    "rotation": 0,
    "fill": "none",
    "name": "Path",
    "points": [
      1067.824535616958,
      217.86408643541188,
      1087.5510658223054,
      567.84577228811
    ]
  },
  {
    "id": "path-1779155685850",
    "type": "path",
    "x": 0,
    "y": 0,
    "width": 0,
    "height": 0,
    "rotation": 0,
    "fill": "transparent",
    "points": [
      998.2055331874021,
      1043.7238696240213,
      998.539480694933,
      799.7544668580449,
      519.4649156001699,
      801.6256778418922
    ],
    "name": "Road Network",
    "label": ""
  },
  {
    "id": "path-1779155701984",
    "type": "path",
    "x": 0,
    "y": 0,
    "width": 0,
    "height": 0,
    "rotation": 0,
    "fill": "transparent",
    "points": [
      999.0749262329626,
      881.2040995636205,
      1344.2239653205688,
      879.4659202046857
    ],
    "name": "Road Network",
    "label": ""
  },
  {
    "id": "path-1779155751288",
    "type": "path",
    "x": 0,
    "y": 0,
    "width": 0,
    "height": 0,
    "rotation": 0,
    "fill": "transparent",
    "points": [
      1379.397866302311,
      630.1176621244491,
      1786.9772785374887,
      716.0058566795848
    ],
    "name": "Road Network",
    "label": ""
  },
  {
    "id": "path-1779155786214",
    "type": "path",
    "x": 0,
    "y": 0,
    "width": 0,
    "height": 0,
    "rotation": 0,
    "fill": "transparent",
    "points": [
      1720.5614663134722,
      128.95267705068582,
      1834.3889242861235,
      392.1586592015815,
      1787.3337946685442,
      717.185328154474,
      1661.8219623275024,
      1344.3494820354006
    ],
    "name": "Road Network",
    "label": ""
  }
];

export default function App() {
  const [mode, setMode] = useState<EditorMode>('select');
  const [shapes, setShapes] = useState<Shape[]>(() => {
    const saved = localStorage.getItem('map_editor_shapes');
    return saved ? JSON.parse(saved) : INITIAL_SHAPES;
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [prompt, setPrompt] = useState<string>('Welcome to MAP EDITOR DEMO. Select a tool or an object to begin.');

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

  useEffect(() => {
    localStorage.setItem('map_editor_shapes', JSON.stringify(shapes));
  }, [shapes]);

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
      } else if (newMode === 'path') {
        setPrompt('Path: Click to draw road network segments. Double click to finish.');
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

  const [currentFloor, setCurrentFloor] = useState('L1');
  const [isEditing, setIsEditing] = useState(false);

  const handleExitEdit = () => {
    setIsEditing(false);
    setMode('select');
    
    // Log and Copy to clipboard if possible
    const configString = JSON.stringify(shapes, null, 2);
    console.log('--- EXPORTED MAP CONFIG ---');
    console.log(configString);
    console.log('---------------------------');
    
    try {
      navigator.clipboard.writeText(configString);
      setPrompt('地图配置已复制到剪贴板！请将其发送给 AI 以将其设为永久默认。');
    } catch (err) {
      setPrompt('地图配置已打印到浏览器控制台 (Console)。');
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('确定要恢复到默认底图吗？您当前的所有修改将被清除。')) {
      setShapes(INITIAL_SHAPES);
      localStorage.removeItem('map_editor_shapes');
      setPrompt('已恢复到默认底图。');
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#f1f5f9] text-slate-800 overflow-hidden font-sans">
      <Sidebar />
      
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <TopHeader />
        
        <main className="flex-1 relative overflow-hidden bg-[#f0f7ff]">
          <div className="absolute top-0 left-0 right-0 z-50 p-6 pointer-events-none">
            <div className="pointer-events-auto">
              <Toolbar 
                mode={mode} 
                onToggleMode={toggleMode} 
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={history.past.length > 0}
                canRedo={history.future.length > 0}
                isEditing={isEditing}
                onSave={handleExitEdit}
                onExit={() => {
                  setIsEditing(false);
                  setMode('select');
                }}
              />
            </div>
          </div>

          <FloorSelector currentFloor={currentFloor} onFloorChange={setCurrentFloor} />
          <BottomActions 
            isEditing={isEditing} 
            onMapEdit={() => setIsEditing(!isEditing)} 
            onReset={handleResetToDefault}
          />

          
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
          {isEditing && (
            <div className="absolute bottom-8 right-32 flex items-center gap-6 text-[10px] uppercase tracking-wider text-slate-400 pointer-events-none font-mono">
              <div className="flex gap-2"><span>MODE:</span> <span className="text-blue-500 font-bold">{mode.toUpperCase()}</span></div>
              <div className="flex gap-2"><span>ACTIVE:</span> <span className="text-slate-400">{selectedIds.length} ITEMS</span></div>
            </div>
          )}

          <AnimatePresence>
            {selectedShape && mode === 'select' && (
              <PropertiesPanel 
                selectedShape={selectedShape} 
                onUpdate={handleUpdateShape}
                onClose={() => handleSelect([])}
              />
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
