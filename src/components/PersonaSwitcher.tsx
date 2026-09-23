import React, { useState } from 'react';
import { Person } from '../types/network';
import { FEATURED_STARTER_PERSONAS } from '../data/mockNetwork';
import { X, Search, Check, UserCheck, Sparkles } from 'lucide-react';

interface PersonaSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Person[];
  currentPersonaId: string;
  onSelectPersona: (persona: Person) => void;
  onOpenCustomModal: () => void;
}

export const PersonaSwitcher: React.FC<PersonaSwitcherProps> = ({
  isOpen,
  onClose,
  nodes,
  currentPersonaId,
  onSelectPersona,
  onOpenCustomModal,
}) => {
  if (!isOpen) return null;

  const [filterText, setFilterText] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');

  const filteredNodes = nodes.filter(n => {
    const matchesText =
      n.name.toLowerCase().includes(filterText.toLowerCase()) ||
      (n.englishName && n.englishName.toLowerCase().includes(filterText.toLowerCase())) ||
      n.company.toLowerCase().includes(filterText.toLowerCase()) ||
      n.role.toLowerCase().includes(filterText.toLowerCase()) ||
      n.skills.some(s => s.toLowerCase().includes(filterText.toLowerCase()));

    const matchesIndustry = selectedIndustry === 'all' || n.industry === selectedIndustry;

    return matchesText && matchesIndustry;
  });

  const industries = Array.from(new Set(nodes.map(n => n.industry)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                切換探索視角（認領角色）
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                切換後將以該角色的 1 度、2 度、3 度人脈關係重新計算所有最短路徑
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Featured Quick Starter Personas */}
          <div>
            <span className="text-xs font-semibold text-slate-300 block mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>精選推薦視角（一鍵認領體驗）：</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {FEATURED_STARTER_PERSONAS.map(featured => {
                const node = nodes.find(n => n.id === featured.id);
                if (!node) return null;
                const isCurrent = node.id === currentPersonaId;

                return (
                  <button
                    key={featured.id}
                    onClick={() => {
                      onSelectPersona(node);
                      onClose();
                    }}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isCurrent
                        ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-100">
                        {featured.title}
                      </span>
                      {isCurrent ? (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                          <Check className="w-3 h-3" />
                          <span>當前</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-indigo-400 bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-800/40">
                          {featured.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {featured.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-full h-px bg-slate-800/80 my-2" />

          {/* Search among all 100 people */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">
                或從全網 100 位成員中挑選：
              </span>
              <button
                onClick={() => {
                  onClose();
                  onOpenCustomModal();
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline"
              >
                + 自訂建立我的專屬角色
              </button>
            </div>

            {/* Filter Input */}
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="搜尋姓名、職銜、公司或專長..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none"
                />
              </div>

              {/* Industry Dropdown */}
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none"
              >
                <option value="all">所有產業領域</option>
                {industries.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            {/* Candidate List */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {filteredNodes.map(node => {
                const isCurrent = node.id === currentPersonaId;

                return (
                  <button
                    key={node.id}
                    onClick={() => {
                      onSelectPersona(node);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-colors ${
                      isCurrent
                        ? 'bg-indigo-950/40 border-indigo-500/80 text-slate-100'
                        : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs text-white shrink-0"
                        style={{ backgroundColor: node.avatarColor }}
                      >
                        {node.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-100">
                          {node.name}
                          {node.englishName && (
                            <span className="text-[11px] text-slate-400 ml-1.5 font-normal">
                              {node.englishName}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {node.company} · {node.role}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {isCurrent ? (
                        <span className="text-xs text-indigo-400 font-medium">當前角色</span>
                      ) : (
                        <span className="text-[11px] text-slate-400">{node.industry}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-800 bg-slate-950/70">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
