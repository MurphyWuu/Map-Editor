import React from 'react';
import { 
  Building2, 
  Store, 
  Handshake, 
  KeyRound, 
  Zap, 
  Banknote, 
  Settings, 
  ChevronDown,
  Cloud
} from 'lucide-react';
import { cn } from '../lib/utils';

const MENU_ITEMS = [
  { id: 'campus', icon: Building2, label: '园区管理', active: true },
  { id: 'shops', icon: Store, label: '商户管理' },
  { id: 'lease', icon: Handshake, label: '租赁区域' },
  { id: 'access', icon: KeyRound, label: '门禁管理' },
  { id: 'power', icon: Zap, label: '用电管理', hasSub: true },
  { id: 'finance', icon: Banknote, label: '财务', hasSub: true },
  { id: 'settings', icon: Settings, label: '设置', hasSub: true },
];

export function Sidebar() {
  return (
    <aside className="w-[240px] h-screen bg-[#eff6ff] border-r border-slate-100 flex flex-col z-30 shadow-sm font-sans">
      {/* Header Section */}
      <div className="pt-4 pb-6 flex flex-col items-center relative overflow-hidden">
        {/* Badge in top right corner */}
        <div className="absolute top-2 right-4 px-2 py-1 bg-[#1d82f5] text-white text-[11px] font-bold rounded-lg leading-none">
          物业端
        </div>

        {/* Logo and Company Name Area */}
        <div className="mb-6 flex flex-col items-center">
          <div className="relative mb-2 mt-2">
            <div className="w-16 h-10 flex items-center justify-center">
              <svg viewBox="0 0 100 60" className="w-20 h-10">
                <path 
                  d="M30,40 C15,40 10,30 15,20 C18,12 28,10 35,15 C40,5 55,5 60,15 C70,10 85,15 85,30 C85,45 75,50 60,50 L30,50" 
                  fill="none" 
                  stroke="#64748b" 
                  strokeWidth="2"
                />
                <circle cx="45" cy="20" r="3" fill="#ef4444" />
                <line x1="45" y1="23" x2="45" y2="45" stroke="#64748b" strokeWidth="2" />
                <circle cx="45" cy="45" r="4" fill="none" stroke="#64748b" strokeWidth="2" />
                <circle cx="45" cy="45" r="1.5" fill="#1e293b" />
              </svg>
            </div>
          </div>
          <div className="text-center">
            <h1 className="font-bold text-slate-700 text-lg tracking-wider leading-tight">CLOUD DATA</h1>
            <p className="text-[10px] text-slate-400 font-medium">Cloud-Data technology company</p>
          </div>
        </div>

        {/* Project Name Dropdown */}
        <div className="flex items-center gap-2 px-3 py-1 text-slate-600 font-bold text-base cursor-pointer hover:text-slate-800 transition-colors">
          <span>物业0219</span>
          <ChevronDown size={18} className="text-slate-500" />
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="px-5 py-2 flex-1 overflow-y-auto mt-1">
        <nav className="space-y-1">
          {MENU_ITEMS.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center justify-between px-5 py-2 rounded-[30px] cursor-pointer transition-all duration-300",
                item.active 
                  ? "bg-white text-[#1d82f5] font-bold shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-50" 
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <div className="flex items-center gap-4">
                <item.icon 
                  size={20} 
                  className={cn(
                    "transition-colors",
                    item.active ? "text-[#1d82f5]" : "text-[#64748b]"
                  )} 
                />
                <span className="text-[13px]">{item.label}</span>
              </div>
              {item.hasSub && (
                <ChevronDown 
                  size={16} 
                  className={cn(
                    "transition-colors",
                    item.active ? "text-[#1d82f5]" : "text-slate-400"
                  )} 
                />
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
