import React, { useState } from 'react';
import { Plus, Edit2, MousePointer2, Scissors, Combine, Undo2, Redo2 } from 'lucide-react';
import { EditorMode } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ToolbarProps {
  mode: EditorMode;
  onToggleMode: (mode: EditorMode) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

function NavButton({ 
  id, 
  onClick, 
  onMouseEnter, 
  onMouseLeave, 
  active, 
  tooltip, 
  icon: Icon, 
  label 
}: { 
  id?: string, 
  onClick: () => void, 
  onMouseEnter: (text: string) => void, 
  onMouseLeave: () => void, 
  active?: boolean, 
  tooltip: string, 
  icon: any, 
  label?: string 
}) {
  return (
    <div className="relative flex flex-col items-center">
      <button
        id={id}
        onClick={onClick}
        onMouseEnter={() => onMouseEnter(tooltip)}
        onMouseLeave={onMouseLeave}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border border-transparent",
          active 
            ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-100" 
            : "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
        )}
      >
        <Icon size={16} />
        {label && <span>{label}</span>}
      </button>
    </div>
  );
}

export function Toolbar({ mode, onToggleMode, onUndo, onRedo, canUndo, canRedo }: ToolbarProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200 shadow-xl z-50">
      <div className="flex items-center gap-1 pr-2 mr-2 border-r border-slate-200">
        <div className="relative flex flex-col items-center">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            onMouseEnter={() => setActiveTooltip("撤销 (Undo)")}
            onMouseLeave={() => setActiveTooltip(null)}
            className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          >
            <Undo2 size={18} />
          </button>
        </div>
        <div className="relative flex flex-col items-center">
          <button
            onClick={onRedo}
            disabled={!canRedo}
            onMouseEnter={() => setActiveTooltip("重做 (Redo)")}
            onMouseLeave={() => setActiveTooltip(null)}
            className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          >
            <Redo2 size={18} />
          </button>
        </div>
      </div>

      <NavButton 
        id="btn-add"
        onClick={() => onToggleMode('add')}
        active={mode === 'add'}
        tooltip="快捷创建矩形"
        onMouseEnter={setActiveTooltip}
        onMouseLeave={() => setActiveTooltip(null)}
        icon={Plus}
        label="增加 (Add)"
      />

      <NavButton 
        id="btn-edit"
        onClick={() => onToggleMode('edit')}
        active={mode === 'edit'}
        tooltip="移动/修改图形"
        onMouseEnter={setActiveTooltip}
        onMouseLeave={() => setActiveTooltip(null)}
        icon={Edit2}
        label="修改 (Edit)"
      />

      <NavButton 
        id="btn-split"
        onClick={() => onToggleMode('split')}
        active={mode === 'split'}
        tooltip="拆分图形"
        onMouseEnter={setActiveTooltip}
        onMouseLeave={() => setActiveTooltip(null)}
        icon={Scissors}
        label="切割 (Split)"
      />

      <NavButton 
        id="btn-merge"
        onClick={() => onToggleMode('merge')}
        active={mode === 'merge'}
        tooltip="合并重叠或相邻图形"
        onMouseEnter={setActiveTooltip}
        onMouseLeave={() => setActiveTooltip(null)}
        icon={Combine}
        label="合并 (Merge)"
      />

      {/* Global Tooltip Portal-like positioned relative to mouse or just logic */}
      <AnimatePresence>
        {activeTooltip && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            className="absolute top-full left-0 right-0 pt-2 pointer-events-none"
          >
            <div className="bg-slate-900 text-white text-xs font-semibold py-2 rounded-xl shadow-xl text-center border border-slate-800">
              {activeTooltip}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
