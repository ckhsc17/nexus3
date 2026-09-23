import React from 'react';
import { Person, Relationship } from '../types/network';
import { X, User, Compass, ExternalLink, ShieldCheck, MapPin, Briefcase } from 'lucide-react';
import { GraphAdjacency } from '../utils/graphAlgorithms';

interface NodeDetailDrawerProps {
  node: Person | null;
  onClose: () => void;
  currentUserId: string;
  degree: number;
  adj: GraphAdjacency;
  nodesMap: Map<string, Person>;
  onFindPathTo: (target: Person) => void;
  onSetAsMe: (person: Person) => void;
  onSelectNode: (node: Person) => void;
}

export const NodeDetailDrawer: React.FC<NodeDetailDrawerProps> = ({
  node,
  onClose,
  currentUserId,
  degree,
  adj,
  nodesMap,
  onFindPathTo,
  onSetAsMe,
  onSelectNode,
}) => {
  if (!node) return null;

  const isMe = node.id === currentUserId;
  const directConnections = adj[node.id] || [];

  return (
    <div className="absolute top-4 right-4 z-20 w-80 max-h-[85vh] flex flex-col bg-slate-900/95 backdrop-blur-md border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/70">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs text-white shrink-0"
            style={{ backgroundColor: node.avatarColor }}
          >
            {node.name.slice(0, 1)}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              <span>{node.name}</span>
              {node.englishName && (
                <span className="text-xs text-slate-400 font-normal">{node.englishName}</span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {/* Role & Company */}
        <div>
          <div className="text-slate-200 font-medium">
            {node.role}
          </div>
          <div className="text-slate-400 mt-0.5">
            {node.company} · {node.industry}
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{node.location}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className={isMe ? 'text-indigo-400 font-medium' : 'text-emerald-400'}>
              {isMe ? '當前探索視角 (你自己)' : `與你相距 ${degree} 度人脈`}
            </span>
          </div>
        </div>

        {/* Bio */}
        <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80 leading-relaxed text-slate-300">
          {node.bio}
        </div>

        {/* Skills */}
        <div>
          <span className="text-slate-500 text-[10px] block mb-1">核心專業與資源：</span>
          <div className="text-slate-300">
            {node.skills.join(' · ')}
          </div>
        </div>

        {/* Open To */}
        <div>
          <span className="text-slate-500 text-[10px] block mb-0.5">目前開放尋求 (Open To)：</span>
          <div className="text-emerald-400 font-medium">
            {node.openTo}
          </div>
        </div>

        {/* Direct Connections Count */}
        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 font-medium">
              此人的直接好友 ({directConnections.length} 人)
            </span>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {directConnections.map(({ neighborId, edge }) => {
              const neighbor = nodesMap.get(neighborId);
              if (!neighbor) return null;

              return (
                <button
                  key={neighbor.id}
                  onClick={() => onSelectNode(neighbor)}
                  className="w-full flex items-center justify-between p-1.5 rounded bg-slate-950/40 hover:bg-slate-800/70 border border-slate-800/60 text-left transition-colors"
                >
                  <div className="truncate pr-2">
                    <span className="text-slate-200 font-medium">{neighbor.name}</span>
                    <span className="text-[10px] text-slate-500 ml-1.5 truncate">
                      {neighbor.company}
                    </span>
                  </div>
                  <span className="text-[10px] text-indigo-400 shrink-0">
                    {edge.type}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/70 space-y-1.5">
        {!isMe ? (
          <>
            <button
              onClick={() => onFindPathTo(node)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>推導我與此人的最短路徑</span>
            </button>

            <button
              onClick={() => onSetAsMe(node)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span>切換以此角色視角探索</span>
            </button>
          </>
        ) : (
          <div className="text-center text-[11px] text-slate-400 py-1">
            你正以此身分觀察整個六度網絡
          </div>
        )}
      </div>
    </div>
  );
};
