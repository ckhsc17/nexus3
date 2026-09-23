import React from 'react';
import { Person } from '../types/network';
import { UserCheck, Sparkles, Plus, Share2 } from 'lucide-react';

interface NavbarProps {
  currentPersona: Person;
  onOpenPersonaModal: () => void;
  onOpenCustomProfileModal: () => void;
  networkSize: number;
  totalEdges: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPersona,
  onOpenPersonaModal,
  onOpenCustomProfileModal,
  networkSize,
  totalEdges,
}) => {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-30">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <a href="/" className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <span>NexusNet 人脈導航</span>
        </a>
        <span className="hidden sm:inline-block text-xs text-slate-500 border-l border-slate-800 pl-3">
          六度理論 · 智慧最短路徑
        </span>
      </div>

      {/* Zone 2: Clean unboxed stats with typographic separators */}
      <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
        <span>全網 {networkSize} 位專業者</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span>{totalEdges} 條實名關係連結</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span className="text-emerald-400">平均 2.4 度人際互通</span>
      </div>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Current Identity Chip */}
        <button
          onClick={onOpenPersonaModal}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 transition-colors text-left"
          title="點擊切換視角或認領其他角色"
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
            style={{ backgroundColor: currentPersona.avatarColor }}
          >
            {currentPersona.name.slice(0, 1)}
          </div>
          <div className="text-xs">
            <span className="text-slate-400 text-[10px] block leading-none">以視角探索</span>
            <span className="font-medium text-slate-200 truncate max-w-[110px] inline-block mt-0.5">
              {currentPersona.name}
            </span>
          </div>
          <span className="text-[10px] text-indigo-400 bg-indigo-950/70 border border-indigo-800/50 px-1.5 py-0.5 rounded ml-1 hidden md:inline">
            切換
          </span>
        </button>

        {/* Custom Profile Action */}
        <button
          onClick={onOpenCustomProfileModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-indigo-900/30"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>自訂我的資料</span>
        </button>
      </div>
    </header>
  );
};
