import React from 'react';
import { Shape } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Type, Palette, Shield, Info, Image as ImageIcon } from 'lucide-react';

interface PropertiesPanelProps {
  selectedShape: Shape | null;
  onUpdate: (shape: Shape) => void;
  onClose: () => void;
}

export function PropertiesPanel({ selectedShape, onUpdate, onClose }: PropertiesPanelProps) {
  if (!selectedShape) return null;

  const handleChange = (field: keyof Shape, value: string | number) => {
    onUpdate({
      ...selectedShape,
      [field]: value,
    });
  };

  const calculateArea = (shape: Shape) => {
    if (shape.type === 'rect') {
      return Math.round(shape.width * shape.height);
    }
    if (shape.type === 'polygon' && shape.points) {
      let area = 0;
      const pts = shape.points;
      for (let i = 0; i < pts.length; i += 2) {
        const x1 = pts[i];
        const y1 = pts[i + 1];
        const x2 = pts[(i + 2) % pts.length];
        const y2 = pts[(i + 3) % pts.length];
        area += x1 * y2 - x2 * y1;
      }
      return Math.round(Math.abs(area) / 2);
    }
    return 0;
  };

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="fixed right-6 top-24 bottom-32 w-72 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col"
    >
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Info size={16} />
          </div>
          <h2 className="font-semibold text-slate-800 tracking-tight">属性设置 (Properties)</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-slate-200 rounded-lg transition-colors text-slate-400"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Name / Logo Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <Type size={12} />
            <span>基础信息 (Identity)</span>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">区域名称</label>
              <input
                type="text"
                value={selectedShape.label || ''}
                onChange={(e) => handleChange('label', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                placeholder="例如: A区-01"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500">商家LOGO</label>
              <div className="flex flex-col gap-3">
                {selectedShape.logo && (
                  <div className="w-full h-24 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                    <img 
                      src={selectedShape.logo} 
                      alt="Logo Preview" 
                      className="max-w-full max-h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={selectedShape.logo || ''}
                    onChange={(e) => handleChange('logo', e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                    placeholder="URL: https://..."
                  />
                  <label className="cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            handleChange('logo', reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 group-hover:text-indigo-600 transition-all">
                      <ImageIcon size={16} />
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Layout Stats */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <Shield size={12} />
            <span>坐标与面积 (Layout)</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-slate-400 uppercase">区域面积 (px²)</label>
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-bold font-mono">
                {calculateArea(selectedShape)}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-slate-400 uppercase">坐标 Z</label>
              <input
                type="number"
                value={selectedShape.z || 0}
                onChange={(e) => handleChange('z', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-slate-400 uppercase">坐标 X</label>
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 font-mono">
                {Math.round(selectedShape.x)}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-slate-400 uppercase">坐标 Y</label>
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 font-mono">
                {Math.round(selectedShape.y)}
              </div>
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <Palette size={12} />
            <span>视觉外观 (Appearance)</span>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">填充颜色</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={selectedShape.fill}
                onChange={(e) => handleChange('fill', e.target.value)}
                className="w-10 h-10 rounded-lg border-0 cursor-pointer overflow-hidden p-0"
              />
              <input
                type="text"
                value={selectedShape.fill}
                onChange={(e) => handleChange('fill', e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase"
              />
            </div>
          </div>
        </section>
      </div>

      <div className="p-4 bg-slate-50/50 border-top border-slate-100 italic text-[10px] text-slate-400 text-center">
        Double click or drag to transform on map
      </div>
    </motion.div>
  );
}
