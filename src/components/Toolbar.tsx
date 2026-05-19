import React, { useState } from 'react';
import { Plus, Edit2, MousePointer2, Scissors, Combine, Undo2, Redo2, Waypoints, RotateCcw, Upload, MoreVertical, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, ChevronDown, Check, X } from 'lucide-react';
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
  isEditing: boolean;
  onSave: () => void;
  onExit: () => void;
}

function ModeButton({ 
  onClick, 
  active, 
  label,
  icon: Icon,
  className
}: { 
  onClick: () => void, 
  active?: boolean, 
  label: string,
  icon?: React.ElementType,
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 h-9 flex items-center justify-center gap-1.5 rounded-lg border transition-all duration-200 font-medium text-sm whitespace-nowrap",
        active 
          ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm" 
          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
        className
      )}
    >
      {Icon && <Icon size={16} className={cn(active ? "text-blue-600" : "text-slate-400")} />}
      <span>{label}</span>
    </button>
  );
}

export function Toolbar({ mode, onToggleMode, onUndo, onRedo, canUndo, canRedo, isEditing, onSave, onExit }: ToolbarProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [viewOption, setViewOption] = useState('显示全图');
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);

  return (
    <div className={cn(
      "h-[60px] px-4 py-2 bg-white rounded-xl shadow-xl border border-slate-200/50 flex flex-nowrap items-center transition-all duration-300 pointer-events-auto",
      isEditing ? "w-full gap-2" : "w-fit gap-4"
    )}>
      {/* Left Area: Project Name */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-3 px-3 h-9 border border-blue-500 rounded-lg bg-white min-w-[180px]">
          <span className="text-sm font-bold text-slate-800 whitespace-nowrap">龙湖里</span>
          <div className="flex items-center gap-3 text-slate-400 ml-auto pl-3 border-l border-slate-100">
            <RotateCcw size={18} className="cursor-pointer hover:text-blue-500" />
            <Upload size={18} className="cursor-pointer hover:text-blue-500" />
            <MoreVertical size={18} className="cursor-pointer hover:text-blue-500" />
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center bg-white h-9 px-1 rounded-lg border border-slate-200">
          <button className="p-1.5 text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center">
            <ZoomIn size={16} />
          </button>
          <button className="p-1.5 text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center">
            <ZoomOut size={16} />
          </button>
          <div className="h-4 w-[1px] bg-slate-200 mx-1.5" />
          <div className="relative">
            <button 
              onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
              className="flex items-center gap-2 px-2 h-7 rounded text-sm font-medium text-slate-700 min-w-[80px] whitespace-nowrap hover:bg-slate-800/5 transition-colors"
            >
              <span>{viewOption}</span>
              <ChevronDown 
                size={14} 
                className={cn("text-slate-400 transition-transform duration-200", isViewDropdownOpen && "rotate-180")} 
              />
            </button>

            <AnimatePresence>
              {isViewDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsViewDropdownOpen(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden"
                  >
                    {['显示全图', '适合页面'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setViewOption(opt);
                          setIsViewDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full px-3 py-2 text-left text-sm hover:bg-blue-50 transition-colors",
                          viewOption === opt ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-600"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {isEditing && (
        <>
          <div className="w-[1px] h-8 bg-slate-100 mx-2 shrink-0" />

          {/* Middle Area: Tools */}
          <div className="flex items-center gap-2 shrink-0">
            <ModeButton 
              onClick={() => onToggleMode('add')} 
              active={mode === 'add'} 
              label="增加" 
              icon={Plus}
            />
            <ModeButton 
              onClick={() => onToggleMode('edit')} 
              active={mode === 'edit'} 
              label="编辑" 
              icon={Edit2}
            />
            <ModeButton 
              onClick={() => onToggleMode('split')} 
              active={mode === 'split'} 
              label="拆分" 
              icon={Scissors}
            />
            <ModeButton 
              onClick={() => onToggleMode('merge')} 
              active={mode === 'merge'} 
              label="合并" 
              icon={Combine}
            />
            <ModeButton 
              onClick={() => onToggleMode('path')} 
              active={mode === 'path'} 
              label="路网" 
              icon={Waypoints}
            />
          </div>

          <div className="w-[1px] h-8 bg-slate-100 mx-2 shrink-0" />

          {/* Right Area: History & Actions */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <div className="flex items-center gap-1 mr-1">
              <button 
                onClick={onUndo} 
                disabled={!canUndo}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-800 disabled:opacity-20 hover:bg-slate-50 transition-all"
              >
                <ChevronLeft size={20} className="stroke-[3px]" />
              </button>
              <button 
                onClick={onRedo} 
                disabled={!canRedo}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-800 disabled:opacity-20 hover:bg-slate-50 transition-all"
              >
                <ChevronRight size={20} className="stroke-[3px]" />
              </button>
            </div>

            <div className="w-[1px] h-6 bg-slate-100 mx-1 shrink-0" />

            <button 
              onClick={onExit}
              className="px-4 h-9 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all whitespace-nowrap"
            >
              取消
            </button>
            <button 
              onClick={onSave}
              className="px-4 h-9 rounded-lg border border-blue-500 bg-white text-blue-600 text-sm font-bold shadow-sm hover:bg-blue-50 transition-all whitespace-nowrap"
            >
              保存
            </button>
          </div>
        </>
      )}
    </div>

  );
}
