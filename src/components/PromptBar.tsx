import React from 'react';
import { motion } from 'motion/react';
import { Info } from 'lucide-react';

interface PromptBarProps {
  text: string;
}

export function PromptBar({ text }: PromptBarProps) {
  return (
    <motion.div
      id="prompt-bar"
      initial={{ opacity: 0, y: 20, x: 20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: 20, x: 20 }}
      className="absolute bottom-8 right-8 z-50 pointer-events-none"
    >
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-4 min-w-[320px]">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
          <Info size={18} />
        </div>
        <div className="flex flex-col">
          <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-600/80 font-bold mb-1">System Feedback</p>
          <p className="text-sm text-slate-700 font-medium leading-relaxed tracking-tight">{text}</p>
        </div>
      </div>
    </motion.div>
  );
}
