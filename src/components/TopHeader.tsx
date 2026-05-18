import React from 'react';
import { Menu, LayoutDashboard, ChevronDown } from 'lucide-react';

export function TopHeader() {
  return (
    <header className="h-[48px] bg-[#f0f7ff] flex items-center justify-between px-6 z-20">
      <div className="flex items-center gap-6">
        <button className="p-2 hover:bg-white/50 rounded-lg transition-colors text-slate-600">
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2 text-sm">
          <LayoutDashboard size={16} className="text-slate-500" />
          <span className="text-slate-600 font-medium">园区管理</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm min-w-[120px] cursor-pointer">
          <span>龙湖里</span>
          <ChevronDown size={14} className="ml-auto text-slate-400" />
        </div>

        <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs ring-2 ring-white overflow-hidden shadow-sm">
             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User Avatar" />
          </div>
          <span className="text-sm font-medium text-slate-700">薛嘉</span>
          <ChevronDown size={14} className="text-slate-400 cursor-pointer" />
        </div>
      </div>
    </header>
  );
}
