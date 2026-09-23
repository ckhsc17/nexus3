import React, { useState } from 'react';
import { Person, ShortestPath, IntroDraftResponse } from '../types/network';
import { X, Compass, Copy, Check, Sparkles, MessageSquare, ShieldCheck, ArrowRight, User } from 'lucide-react';
import { requestAIIntroDraft } from '../services/aiService';

interface PathDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Person;
  targetUser: Person;
  paths: ShortestPath[];
  selectedPathIndex: number;
  onSelectPathIndex: (index: number) => void;
  onSetAsMe: (person: Person) => void;
}

export const PathDetailModal: React.FC<PathDetailModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  targetUser,
  paths,
  selectedPathIndex,
  onSelectPathIndex,
  onSetAsMe,
}) => {
  if (!isOpen) return null;

  const currentPath = paths[selectedPathIndex] || paths[0];

  const [tone, setTone] = useState<'business' | 'friendly' | 'startup'>('business');
  const [isGenerating, setIsGenerating] = useState(false);
  const [draft, setDraft] = useState<IntroDraftResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Generate or regenerate draft
  const handleGenerateDraft = async () => {
    if (!currentPath) return;
    setIsGenerating(true);
    try {
      const res = await requestAIIntroDraft(currentUser, targetUser, currentPath, tone);
      setDraft(res);
    } catch (err) {
      console.error('Error generating intro draft:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!draft) return;
    const fullText = `主旨：${draft.subject}\n\n${draft.message}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <span>引薦路徑導航：</span>
                <span className="text-indigo-400">{currentUser.name}</span>
                <span className="text-slate-500">➜</span>
                <span className="text-amber-400">{targetUser.name}</span>
              </h3>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{targetUser.company} · {targetUser.role}</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400">{currentPath?.degree} 度人脈連結</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Path Options Selector Tabs */}
          {paths.length > 1 && (
            <div>
              <span className="text-xs font-medium text-slate-400 block mb-2">
                發現 {paths.length} 條不同推薦路徑：
              </span>
              <div className="flex flex-wrap gap-2">
                {paths.map((p, idx) => {
                  const isSelected = idx === selectedPathIndex;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSelectPathIndex(idx);
                        setDraft(null); // Reset draft for new path
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      <span>{p.label}</span>
                      <span className="ml-1.5 text-[10px] opacity-80">
                        ({p.degree} 步 · 信任分 {p.totalCloseness} / {p.hops.length * 5})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Visual Step-by-Step Chain */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 sm:p-5">
            <span className="text-xs font-medium text-slate-400 block mb-3">
              逐層關係鏈解構（點擊可查看對方）：
            </span>

            <div className="space-y-4">
              {currentPath?.hops.map((hop, hopIdx) => {
                const isFirst = hopIdx === 0;
                const isLast = hopIdx === currentPath.hops.length - 1;

                return (
                  <div key={hop.edge.id} className="relative">
                    {/* Node From */}
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs text-white shadow-sm"
                          style={{ backgroundColor: hop.from.avatarColor }}
                        >
                          {hop.from.name.slice(0, 1)}
                        </div>
                        {/* Connecting Line */}
                        <div className="w-0.5 h-16 bg-gradient-to-b from-indigo-500 to-indigo-600/30 my-1" />
                      </div>

                      <div className="flex-1 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-100">
                            {hop.from.name}
                            {isFirst && <span className="text-xs text-indigo-400 ml-1.5">(起點 · 你)</span>}
                          </span>
                          <span className="text-xs text-slate-400">{hop.from.role}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{hop.from.company}</div>

                        {/* Edge Card describing relationship */}
                        <div className="my-2.5 p-3 rounded-lg bg-slate-900 border border-slate-800/90 text-xs">
                          <div className="flex items-center justify-between text-indigo-300 font-medium mb-1">
                            <span className="flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                              <span>第 {hopIdx + 1} 度連結：{hop.edge.type}</span>
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              熟識度 {hop.edge.closeness}/5 · 相識 {hop.edge.yearsKnown} 年
                            </span>
                          </div>
                          <p className="text-slate-300 leading-relaxed text-[11px]">
                            {hop.edge.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Final Node on last hop */}
                    {isLast && (
                      <div className="flex items-start gap-3 mt-1">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs text-white ring-2 ring-amber-500/50 shadow-sm"
                          style={{ backgroundColor: hop.to.avatarColor }}
                        >
                          {hop.to.name.slice(0, 1)}
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-amber-300">
                              {hop.to.name}
                              <span className="text-xs text-amber-400/90 ml-1.5">(目標對象)</span>
                            </span>
                            <span className="text-xs text-slate-400">{hop.to.role}</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">{hop.to.company}</div>
                          <div className="text-xs text-emerald-400 mt-1">
                            目前開放：{hop.to.openTo}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Intro Message Generator Section */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-semibold text-slate-100">
                  一鍵生成引薦說帖 (Introduction Pitch)
                </h4>
              </div>

              {/* Tone Selector */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs">
                {(['business', 'friendly', 'startup'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                      tone === t ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t === 'business' ? '商務正式' : t === 'friendly' ? '誠懇友好' : '科技新創'}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              根據你們之間的共同朋友（{currentPath.nodes[1]?.name || '目標對象'}）與雙方背景，量身定制高回覆率的暖引薦訊息：
            </p>

            {!draft ? (
              <button
                onClick={handleGenerateDraft}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium transition-colors shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGenerating ? 'AI 正在撰寫專屬引薦信...' : '生成引薦訊息與破冰重點'}</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 text-xs">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] mb-2 border-b border-slate-800 pb-2">
                    <span>發送對象：{draft.recipientName}</span>
                    <button
                      onClick={handleGenerateDraft}
                      className="text-indigo-400 hover:text-indigo-300 underline"
                    >
                      重新生成
                    </button>
                  </div>

                  <div className="text-slate-200 font-medium mb-1.5">
                    主旨：{draft.subject}
                  </div>

                  <div className="text-slate-300 leading-relaxed whitespace-pre-line text-xs font-sans">
                    {draft.message}
                  </div>
                </div>

                {/* Key Talking Points */}
                {draft.talkingPoints && draft.talkingPoints.length > 0 && (
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 text-xs">
                    <span className="font-medium text-slate-300 text-[11px] block mb-1">
                      引薦溝通策略要點：
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                      {draft.talkingPoints.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action: Copy */}
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>已複製到剪貼簿！可直接貼在 Line / Email</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>複製引薦信草稿</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/70 text-xs">
          <button
            onClick={() => {
              onSetAsMe(targetUser);
              onClose();
            }}
            className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-300 transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            <span>切換由此角色視角看世界</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            關閉視窗
          </button>
        </div>
      </div>
    </div>
  );
};
