import React, { useState } from 'react';
import { RotateCcw, Eye, Radio, MapPin, Compass, Map } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface FloorSelectorProps {
  currentFloor: string;
  onFloorChange: (floor: string) => void;
}

export function FloorSelector({ currentFloor, onFloorChange }: FloorSelectorProps) {
  const floors = ['L4', 'L3', 'L2', 'L1', 'B1', 'B2', 'B3'];
  
  return (
    <div className="absolute left-6 top-28 z-10 flex flex-col gap-4 pointer-events-none">
      {/* Floor List */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-100 py-0.5 w-[40px] flex flex-col overflow-hidden pointer-events-auto">
        {floors.map((floor) => (
          <button
            key={floor}
            onClick={() => onFloorChange(floor)}
            className={cn(
              "h-[32px] flex items-center justify-center text-[10px] font-bold transition-all",
              currentFloor === floor 
                ? "bg-blue-600 text-white z-10" 
                : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
            )}
          >
            {floor}
          </button>
        ))}
      </div>
    </div>
  );
}

interface BottomActionsProps {
  onMapEdit?: () => void;
  onReset?: () => void;
  isEditing?: boolean;
}

export function BottomActions({ onMapEdit, onReset, isEditing }: BottomActionsProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const buttons = [
    { icon: RotateCcw, label: '重置底图', onClick: onReset },
    { icon: Eye, label: '默认视角' },
    { icon: Radio, label: '信标管理' },
    { icon: MapPin, label: '室外坐标' },
    { icon: Map, label: '地图编辑', onClick: onMapEdit, isActive: isEditing, hasTooltip: true },
  ];

  return (
    <div className="absolute bottom-6 left-6 z-10 flex gap-3">
      {buttons.map((btn, idx) => (
        <div key={idx} className="relative">
          <AnimatePresence>
            {btn.hasTooltip && showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 10, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: 10, x: '-50%' }}
                className="absolute bottom-full left-1/2 mb-4 px-4 py-3 bg-[#222] text-white text-[13px] leading-relaxed rounded-lg shadow-2xl whitespace-nowrap z-20 min-w-[180px]"
              >
                进入地图编辑模式，修改图形或路网
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#222] rotate-45" />
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={btn.onClick}
            onMouseEnter={() => btn.hasTooltip && setShowTooltip(true)}
            onMouseLeave={() => btn.hasTooltip && setShowTooltip(false)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl shadow-lg border transition-all hover:-translate-y-0.5 group min-w-[64px]",
              btn.isActive 
                ? "bg-blue-50 border-blue-200" 
                : "bg-white border-slate-100 hover:bg-slate-50"
            )}
          >
            <btn.icon size={18} className={cn("text-blue-600", btn.isActive && "stroke-[3px]")} />
            <span className={cn(
              "text-[10px] font-bold",
              btn.isActive ? "text-blue-600" : "text-slate-700"
            )}>{btn.label}</span>
          </button>
        </div>
      ))}
    </div>
  );
}

export function FloatingCompass() {
  return (
    <div className="absolute bottom-6 right-6 z-10 p-3 bg-white rounded-full shadow-xl border border-slate-100 text-blue-600 hover:scale-110 transition-all cursor-pointer">
       <Compass size={24} />
    </div>
  );
}
