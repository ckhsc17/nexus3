import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Person, Relationship, ShortestPath } from '../types/network';
import { ZoomIn, ZoomOut, Maximize2, LocateFixed, Eye, Filter } from 'lucide-react';

interface NetworkGraphProps {
  nodes: Person[];
  edges: Relationship[];
  currentUserId: string;
  targetPersonId?: string | null;
  activePath?: ShortestPath | null;
  degreesMap: Map<string, number>;
  onSelectNode: (node: Person) => void;
  onSetAsMe: (node: Person) => void;
}

export type SimNode = Person & { x: number; y: number; vx: number; vy: number };

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  nodes,
  edges,
  currentUserId,
  targetPersonId,
  activePath,
  degreesMap,
  onSelectNode,
  onSetAsMe,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Transform states
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<SimNode | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [degreeFilter, setDegreeFilter] = useState<number | 'all'>('all');

  // Animation frame ref
  const animFrameRef = useRef<number | null>(null);
  const flowOffsetRef = useRef<number>(0);

  // Dragging states
  const isDraggingCanvasRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef<SimNode | null>(null);

  // Physics simulation data
  const simNodesRef = useRef<SimNode[]>([]);
  const simEdgesRef = useRef<Relationship[]>([]);

  // Initialize node positions in a circular or force layout
  useEffect(() => {
    const width = 1200;
    const height = 900;

    // Preserve existing coordinates if available
    const existingPos = new Map<string, { x: number; y: number }>();
    simNodesRef.current.forEach(n => existingPos.set(n.id, { x: n.x, y: n.y }));

    simNodesRef.current = nodes.map((node, i) => {
      const prev = existingPos.get(node.id);
      if (prev) {
        return { ...node, x: prev.x, y: prev.y, vx: 0, vy: 0 };
      }

      // Group slightly by industry in rings
      const angle = (i / nodes.length) * 2 * Math.PI;
      const radius = 260 + (i % 5) * 80;
      return {
        ...node,
        x: width / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 50,
        y: height / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 50,
        vx: 0,
        vy: 0,
      };
    });

    simEdgesRef.current = edges;
  }, [nodes, edges]);

  // Center on current user on load or when identity changes
  useEffect(() => {
    const userNode = simNodesRef.current.find(n => n.id === currentUserId);
    if (userNode && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setPan({
        x: rect.width / 2 - userNode.x * zoom,
        y: rect.height / 2 - userNode.y * zoom,
      });
    }
  }, [currentUserId]);

  // If activePath changes, center between source and target
  useEffect(() => {
    if (activePath && activePath.nodes.length > 0 && canvasRef.current) {
      const first = simNodesRef.current.find(n => n.id === activePath.nodes[0].id);
      const last = simNodesRef.current.find(n => n.id === activePath.nodes[activePath.nodes.length - 1].id);
      if (first && last) {
        const midX = (first.x + last.x) / 2;
        const midY = (first.y + last.y) / 2;
        const rect = canvasRef.current.getBoundingClientRect();
        setPan({
          x: rect.width / 2 - midX * zoom,
          y: rect.height / 2 - midY * zoom,
        });
      }
    }
  }, [activePath]);

  // Physics simulation step
  const stepPhysics = useCallback(() => {
    const simNodes = simNodesRef.current;
    if (simNodes.length === 0) return;

    const nodeMap = new Map<string, typeof simNodes[0]>();
    simNodes.forEach(n => nodeMap.set(n.id, n));

    const centerX = 600;
    const centerY = 450;
    const friction = 0.88;
    const repulsion = 1200;

    // 1. Center gravity & repulsion
    for (let i = 0; i < simNodes.length; i++) {
      const n1 = simNodes[i];
      if (draggedNodeRef.current?.id === n1.id) continue;

      // Gentle centering force
      n1.vx += (centerX - n1.x) * 0.0006;
      n1.vy += (centerY - n1.y) * 0.0006;

      // Node-node repulsion
      for (let j = i + 1; j < simNodes.length; j++) {
        const n2 = simNodes[j];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const distSq = dx * dx + dy * dy + 1;
        if (distSq < 160000) {
          const dist = Math.sqrt(distSq);
          const force = repulsion / distSq;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          n1.vx -= fx;
          n1.vy -= fy;
          n2.vx += fx;
          n2.vy += fy;
        }
      }
    }

    // 2. Spring attraction along edges
    for (const edge of simEdgesRef.current) {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (!source || !target) continue;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const targetDist = 90 + (6 - edge.closeness) * 20; // tighter for close friends
      const force = (dist - targetDist) * 0.0035;

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (draggedNodeRef.current?.id !== source.id) {
        source.vx += fx;
        source.vy += fy;
      }
      if (draggedNodeRef.current?.id !== target.id) {
        target.vx -= fx;
        target.vy -= fy;
      }
    }

    // 3. Apply velocity
    for (const n of simNodes) {
      if (draggedNodeRef.current?.id === n.id) continue;
      n.vx *= friction;
      n.vy *= friction;
      n.x += n.vx;
      n.y += n.vy;
    }
  }, []);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      // Handle retina resolution
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }

      stepPhysics();
      flowOffsetRef.current = (flowOffsetRef.current + 0.4) % 24;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Background subtle grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      const gridSize = 40 * zoom;
      const offsetX = pan.x % gridSize;
      const offsetY = pan.y % gridSize;
      for (let x = offsetX; x < rect.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, rect.height);
        ctx.stroke();
      }
      for (let y = offsetY; y < rect.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(rect.width, y);
        ctx.stroke();
      }

      // World coordinate transform
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      const simNodes = simNodesRef.current;
      const nodeMap = new Map<string, typeof simNodes[0]>();
      simNodes.forEach(n => nodeMap.set(n.id, n));

      // Sets for path & highlight
      const activePathNodeIds = new Set<string>(activePath ? activePath.nodes.map(n => n.id) : []);
      const activePathEdgeKeys = new Set<string>();
      if (activePath && activePath.hops) {
        activePath.hops.forEach(hop => {
          activePathEdgeKeys.add(`${hop.from.id}-${hop.to.id}`);
          activePathEdgeKeys.add(`${hop.to.id}-${hop.from.id}`);
        });
      }

      const hasActivePath = activePathNodeIds.size > 0;

      // 1. Draw Edges
      for (const edge of simEdgesRef.current) {
        const source = nodeMap.get(edge.source);
        const target = nodeMap.get(edge.target);
        if (!source || !target) continue;

        const isPathEdge = activePathEdgeKeys.has(`${edge.source}-${edge.target}`);
        const isHoverEdge = hoveredNode && (edge.source === hoveredNode.id || edge.target === hoveredNode.id);

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);

        if (isPathEdge) {
          // Flowing animated path edge
          ctx.strokeStyle = '#6366f1'; // Indigo-500
          ctx.lineWidth = 3.5;
          ctx.setLineDash([8, 4]);
          ctx.lineDashOffset = -flowOffsetRef.current;
          ctx.stroke();

          // Outer halo
          ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
          ctx.lineWidth = 8;
          ctx.setLineDash([]);
          ctx.stroke();
        } else if (isHoverEdge) {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          ctx.stroke();
        } else {
          // Normal background edges
          const alpha = hasActivePath ? 0.04 : 0.12;
          ctx.strokeStyle = `rgba(148, 163, 184, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.setLineDash([]);
          ctx.stroke();
        }
      }

      ctx.setLineDash([]);

      // 2. Draw Nodes
      for (const node of simNodes) {
        const isUser = node.id === currentUserId;
        const isTarget = node.id === targetPersonId;
        const isPathNode = activePathNodeIds.has(node.id);
        const isHovered = hoveredNode?.id === node.id;
        const degree = degreesMap.get(node.id) ?? 999;

        // Filtering visibility
        const isIndustryMatch = selectedIndustry === 'all' || node.industry === selectedIndustry;
        const isDegreeMatch = degreeFilter === 'all' || (degreeFilter === 3 ? degree >= 3 : degree === degreeFilter);

        let opacity = 1;
        if (!isIndustryMatch || !isDegreeMatch) {
          opacity = 0.15;
        } else if (hasActivePath && !isPathNode && !isUser && !isTarget) {
          opacity = 0.22;
        }

        ctx.save();
        ctx.globalAlpha = opacity;

        // Base node radius
        let radius = isUser ? 18 : isTarget ? 17 : isPathNode ? 14 : 11;
        if (isHovered) radius += 2;

        // Node Glow halos for special nodes
        if (isUser) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 7, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 3, 0, Math.PI * 2);
          ctx.strokeStyle = '#818cf8';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (isTarget) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 3, 0, Math.PI * 2);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (isPathNode) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
          ctx.fill();
        }

        // Main Node Body Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);

        // Fill Color Strategy based on identity or degree
        if (isUser) {
          ctx.fillStyle = '#6366f1'; // Radiant Indigo
        } else if (isTarget) {
          ctx.fillStyle = '#f59e0b'; // Amber Gold Target
        } else if (degree === 1) {
          ctx.fillStyle = '#06b6d4'; // Cyan for 1st degree
        } else if (degree === 2) {
          ctx.fillStyle = '#3b82f6'; // Blue for 2nd degree
        } else {
          ctx.fillStyle = node.avatarColor || '#64748b'; // Industry color / Muted slate
        }
        ctx.fill();

        // Node border
        ctx.strokeStyle = isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = isHovered ? 2.5 : 1.5;
        ctx.stroke();

        // Inner Avatar Initial Letter
        ctx.fillStyle = '#ffffff';
        ctx.font = `600 ${isUser || isTarget ? '11px' : '9px'} sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.name.slice(0, 1), node.x, node.y + 0.5);

        // Path step badge (e.g. ① ➜ ② ➜ ③)
        if (isPathNode && activePath) {
          const stepIndex = activePath.nodes.findIndex(n => n.id === node.id);
          if (stepIndex >= 0) {
            const badgeRadius = 7.5;
            const badgeX = node.x + radius * 0.7;
            const badgeY = node.y - radius * 0.7;

            ctx.beginPath();
            ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#0f172a';
            ctx.fill();
            ctx.strokeStyle = '#818cf8';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = '#818cf8';
            ctx.font = '700 8.5px sans-serif';
            ctx.fillText(String(stepIndex + 1), badgeX, badgeY + 0.5);
          }
        }

        // Node Label (Always show for User, Target, Path nodes, or Hovered, or when zoomed in)
        const showLabel = isUser || isTarget || isPathNode || isHovered || zoom > 0.95;
        if (showLabel && opacity > 0.3) {
          ctx.font = isUser || isTarget ? '600 12px sans-serif' : '500 10.5px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';

          // Text halo
          ctx.strokeStyle = '#020617';
          ctx.lineWidth = 3;
          ctx.strokeText(isUser ? `${node.name} (你)` : node.name, node.x, node.y + radius + 4);

          ctx.fillStyle = isUser ? '#a5b4fc' : isTarget ? '#fcd34d' : '#f1f5f9';
          ctx.fillText(isUser ? `${node.name} (你)` : node.name, node.x, node.y + radius + 4);

          // Subtitle (Role / Company)
          if (isUser || isTarget || isHovered || isPathNode) {
            ctx.font = '400 9px sans-serif';
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 2.5;
            ctx.strokeText(node.role, node.x, node.y + radius + 18);

            ctx.fillStyle = '#94a3b8';
            ctx.fillText(node.role, node.x, node.y + radius + 18);
          }
        }

        ctx.restore();
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [zoom, pan, currentUserId, targetPersonId, activePath, hoveredNode, selectedIndustry, degreeFilter, degreesMap, stepPhysics]);

  // Mouse / Pointer Event Handlers
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    return {
      x: (mouseX - pan.x) / zoom,
      y: (mouseY - pan.y) / zoom,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    // Check if clicked a node
    const clickedNode = simNodesRef.current.find(n => {
      const dx = n.x - coords.x;
      const dy = n.y - coords.y;
      return dx * dx + dy * dy < 400; // 20px radius
    });

    if (clickedNode) {
      draggedNodeRef.current = clickedNode;
    } else {
      isDraggingCanvasRef.current = true;
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingCanvasRef.current) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
      return;
    }

    if (draggedNodeRef.current) {
      const coords = getCanvasCoords(e);
      draggedNodeRef.current.x = coords.x;
      draggedNodeRef.current.y = coords.y;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
      return;
    }

    // Hover detection
    const coords = getCanvasCoords(e);
    const hovered = simNodesRef.current.find(n => {
      const dx = n.x - coords.x;
      const dy = n.y - coords.y;
      return dx * dx + dy * dy < 400;
    });

    setHoveredNode(hovered || null);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedNodeRef.current) {
      // If minimal drag, treat as click
      const coords = getCanvasCoords(e);
      const dx = draggedNodeRef.current.x - coords.x;
      const dy = draggedNodeRef.current.y - coords.y;
      if (dx * dx + dy * dy < 25) {
        onSelectNode(draggedNodeRef.current);
      }
      draggedNodeRef.current = null;
    }
    isDraggingCanvasRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(2.5, Math.max(0.3, zoom * zoomFactor));

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setPan({
      x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
      y: mouseY - (mouseY - pan.y) * (newZoom / zoom),
    });
    setZoom(newZoom);
  };

  // Zoom control buttons
  const zoomIn = () => setZoom(z => Math.min(2.5, z * 1.2));
  const zoomOut = () => setZoom(z => Math.max(0.3, z * 0.8));
  const resetView = () => {
    setZoom(0.85);
    const userNode = simNodesRef.current.find(n => n.id === currentUserId);
    if (userNode && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setPan({
        x: rect.width / 2 - userNode.x * 0.85,
        y: rect.height / 2 - userNode.y * 0.85,
      });
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 select-none">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          isDraggingCanvasRef.current = false;
          draggedNodeRef.current = null;
          setHoveredNode(null);
        }}
        onWheel={handleWheel}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
      />

      {/* Floating Viewport Controls */}
      <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1 rounded-lg shadow-lg">
          <button
            onClick={zoomIn}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="放大 (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={zoomOut}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="縮小 (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="重置視角"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-800 mx-0.5" />
          <button
            onClick={resetView}
            className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded transition-colors"
            title="聚焦我的位置"
          >
            <LocateFixed className="w-3.5 h-3.5" />
            <span>定位自己</span>
          </button>
        </div>

        {/* Degree Segmented Filter Control */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1 rounded-lg text-xs shadow-lg">
          <span className="text-[10px] text-slate-500 px-1.5">關係度數:</span>
          {(['all', 1, 2, 3] as const).map(deg => {
            const isActive = degreeFilter === deg;
            const label = deg === 'all' ? '全部' : `${deg}度`;
            return (
              <button
                key={String(deg)}
                onClick={() => setDegreeFilter(deg)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Legend / Quick Guide */}
      <div className="absolute bottom-4 left-4 hidden sm:flex items-center gap-3 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 px-3 py-1.5 rounded-lg text-[11px] text-slate-400 z-10">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-indigo-400/40" />
          <span>你 (核心)</span>
        </div>
        <span aria-hidden="true" className="text-slate-700">·</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-500" />
          <span>1度直接好友</span>
        </div>
        <span aria-hidden="true" className="text-slate-700">·</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>2度朋友的朋友</span>
        </div>
        <span aria-hidden="true" className="text-slate-700">·</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>目標人選</span>
        </div>
      </div>

      {/* Hover Node Tooltip Card */}
      {hoveredNode && (
        <div
          className="absolute pointer-events-none z-20 bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-xl backdrop-blur-md max-w-xs text-xs"
          style={{
            left: Math.min(window.innerWidth - 300, (hoveredNode.x * zoom + pan.x) + 16),
            top: Math.max(16, (hoveredNode.y * zoom + pan.y) - 30),
          }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-1.5">
            <div>
              <span className="font-semibold text-slate-100 text-sm">{hoveredNode.name}</span>
              {hoveredNode.englishName && (
                <span className="text-[11px] text-slate-400 ml-1.5">{hoveredNode.englishName}</span>
              )}
            </div>
            <span className="text-[10px] text-indigo-400 bg-indigo-950/80 border border-indigo-800/40 px-1.5 py-0.5 rounded">
              {hoveredNode.id === currentUserId
                ? '你自己'
                : `${degreesMap.get(hoveredNode.id) ?? '?'} 度人脈`}
            </span>
          </div>

          <div className="text-slate-300 font-medium mb-1">
            {hoveredNode.company} · {hoveredNode.role}
          </div>
          <div className="text-slate-400 line-clamp-2 leading-relaxed mb-2">
            {hoveredNode.bio}
          </div>

          <div className="flex flex-wrap gap-1 text-[10px] text-slate-400">
            <span>專長：{hoveredNode.skills.slice(0, 3).join(' · ')}</span>
          </div>
          <div className="mt-1 text-[10px] text-emerald-400">
            開放：{hoveredNode.openTo}
          </div>
        </div>
      )}
    </div>
  );
};
