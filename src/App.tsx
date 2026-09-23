import React, { useState, useMemo } from 'react';
import { Person, Relationship, ShortestPath } from './types/network';
import { MOCK_PERSONS, MOCK_RELATIONSHIPS } from './data/mockNetwork';
import { buildAdjacency, calculateDegrees, findShortestPaths } from './utils/graphAlgorithms';
import { Navbar } from './components/Navbar';
import { NetworkGraph } from './components/NetworkGraph';
import { SearchSection } from './components/SearchSection';
import { PathDetailModal } from './components/PathDetailModal';
import { PersonaSwitcher } from './components/PersonaSwitcher';
import { CustomProfileModal } from './components/CustomProfileModal';
import { NodeDetailDrawer } from './components/NodeDetailDrawer';
import { Network, Search, Layers, Sparkles } from 'lucide-react';

export function App() {
  // Graph Network Data State
  const [nodes, setNodes] = useState<Person[]>(MOCK_PERSONS);
  const [edges, setEdges] = useState<Relationship[]>(MOCK_RELATIONSHIPS);

  // Current Perspective Identity (default: p16 張致遠 - AI 醫療新創創辦人)
  const [currentPersona, setCurrentPersona] = useState<Person>(() => {
    return MOCK_PERSONS.find(p => p.id === 'p16') || MOCK_PERSONS[0];
  });

  // Selected Target & Discovered Paths
  const [targetPerson, setTargetPerson] = useState<Person | null>(null);
  const [activePaths, setActivePaths] = useState<ShortestPath[]>([]);
  const [selectedPathIndex, setSelectedPathIndex] = useState<number>(0);

  // Modal & Drawer visibility
  const [isPathModalOpen, setIsPathModalOpen] = useState(false);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [inspectedNode, setInspectedNode] = useState<Person | null>(null);

  // Mobile View Toggle: 'graph' | 'search'
  const [mobileTab, setMobileTab] = useState<'graph' | 'search'>('graph');

  // Adjacency graph representation
  const adj = useMemo(() => buildAdjacency(edges), [edges]);

  // Nodes Map for O(1) lookup
  const nodesMap = useMemo(() => {
    const map = new Map<string, Person>();
    nodes.forEach(n => map.set(n.id, n));
    return map;
  }, [nodes]);

  // Degrees of separation relative to current persona
  const degreesMap = useMemo(() => {
    return calculateDegrees(currentPersona.id, nodes, adj);
  }, [currentPersona.id, nodes, adj]);

  // Handle selecting candidate from natural language search
  const handleSelectCandidate = (candidate: Person, paths: ShortestPath[]) => {
    setTargetPerson(candidate);
    setActivePaths(paths);
    setSelectedPathIndex(0);
    setIsPathModalOpen(true);
    setInspectedNode(null);
  };

  // Handle clicking node in canvas
  const handleSelectNodeFromGraph = (node: Person) => {
    setInspectedNode(node);
  };

  // Find path from inspected node
  const handleFindPathToInspected = (target: Person) => {
    const paths = findShortestPaths(currentPersona.id, target.id, nodesMap, adj, 3);
    setTargetPerson(target);
    setActivePaths(paths);
    setSelectedPathIndex(0);
    setIsPathModalOpen(true);
  };

  // Clear highlighted path
  const handleClearActivePath = () => {
    setTargetPerson(null);
    setActivePaths([]);
  };

  // Save new custom user profile and anchor into graph
  const handleSaveCustomProfile = (newProfile: Person, connectionIds: string[]) => {
    const newEdges: Relationship[] = connectionIds.map((targetId, idx) => ({
      id: `custom-edge-${Date.now()}-${idx}`,
      source: newProfile.id,
      target: targetId,
      type: '合作引薦',
      closeness: 4,
      yearsKnown: 2,
      description: `透過產業聚會認識之專業盟友，互相信任`,
    }));

    setNodes(prev => [newProfile, ...prev]);
    setEdges(prev => [...newEdges, ...prev]);
    setCurrentPersona(newProfile);
    handleClearActivePath();
  };

  // Import whole graph
  const handleImportData = (data: { nodes: Person[]; relationships: Relationship[] }) => {
    setNodes(data.nodes);
    setEdges(data.relationships);
    if (data.nodes.length > 0) {
      setCurrentPersona(data.nodes[0]);
    }
    handleClearActivePath();
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Top Navigation */}
      <Navbar
        currentPersona={currentPersona}
        onOpenPersonaModal={() => setIsPersonaModalOpen(true)}
        onOpenCustomProfileModal={() => setIsCustomModalOpen(true)}
        networkSize={nodes.length}
        totalEdges={edges.length}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
        {/* Left: Canvas Network Visualization */}
        <main
          className={`flex-1 relative h-full ${
            mobileTab === 'search' ? 'hidden md:block' : 'block'
          }`}
        >
          <NetworkGraph
            nodes={nodes}
            edges={edges}
            currentUserId={currentPersona.id}
            targetPersonId={targetPerson?.id}
            activePath={activePaths[selectedPathIndex] || null}
            degreesMap={degreesMap}
            onSelectNode={handleSelectNodeFromGraph}
            onSetAsMe={(p) => {
              setCurrentPersona(p);
              handleClearActivePath();
            }}
          />

          {/* Node Inspect Drawer (Float over canvas) */}
          <NodeDetailDrawer
            node={inspectedNode}
            onClose={() => setInspectedNode(null)}
            currentUserId={currentPersona.id}
            degree={inspectedNode ? degreesMap.get(inspectedNode.id) ?? 999 : 999}
            adj={adj}
            nodesMap={nodesMap}
            onFindPathTo={handleFindPathToInspected}
            onSetAsMe={(p) => {
              setCurrentPersona(p);
              setInspectedNode(null);
              handleClearActivePath();
            }}
            onSelectNode={(neighbor) => setInspectedNode(neighbor)}
          />

          {/* Floating Pathway Indicator when Path is Active */}
          {targetPerson && activePaths.length > 0 && (
            <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-lg shadow-xl text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-slate-300">
                當前導航：<strong className="text-white">{targetPerson.name}</strong> ({activePaths[selectedPathIndex]?.degree}度)
              </span>
              <button
                onClick={() => setIsPathModalOpen(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline ml-2"
              >
                查看完整路徑說帖
              </button>
            </div>
          )}
        </main>

        {/* Right: Natural Language Search & Shortest Path Matches */}
        <aside
          className={`w-full md:w-96 lg:w-[420px] shrink-0 h-full ${
            mobileTab === 'graph' ? 'hidden md:flex' : 'flex'
          }`}
        >
          <SearchSection
            nodes={nodes}
            nodesMap={nodesMap}
            adj={adj}
            currentPersona={currentPersona}
            degreesMap={degreesMap}
            onSelectCandidate={handleSelectCandidate}
            onClearActivePath={handleClearActivePath}
            hasActivePath={!!targetPerson}
            selectedCandidateId={targetPerson?.id}
          />
        </aside>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex border-t border-slate-800 bg-slate-950 h-12 shrink-0 z-20">
        <button
          onClick={() => setMobileTab('graph')}
          className={`flex-1 flex items-center justify-center gap-2 text-xs font-medium transition-colors ${
            mobileTab === 'graph'
              ? 'text-indigo-400 bg-slate-900'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>人脈圖譜 ({nodes.length}人)</span>
        </button>

        <button
          onClick={() => setMobileTab('search')}
          className={`flex-1 flex items-center justify-center gap-2 text-xs font-medium transition-colors ${
            mobileTab === 'search'
              ? 'text-indigo-400 bg-slate-900'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>自然語言尋人</span>
        </button>
      </div>

      {/* Modals */}
      {targetPerson && activePaths.length > 0 && (
        <PathDetailModal
          isOpen={isPathModalOpen}
          onClose={() => setIsPathModalOpen(false)}
          currentUser={currentPersona}
          targetUser={targetPerson}
          paths={activePaths}
          selectedPathIndex={selectedPathIndex}
          onSelectPathIndex={setSelectedPathIndex}
          onSetAsMe={(p) => {
            setCurrentPersona(p);
            handleClearActivePath();
          }}
        />
      )}

      <PersonaSwitcher
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
        nodes={nodes}
        currentPersonaId={currentPersona.id}
        onSelectPersona={(p) => {
          setCurrentPersona(p);
          handleClearActivePath();
        }}
        onOpenCustomModal={() => setIsCustomModalOpen(true)}
      />

      <CustomProfileModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        existingNodes={nodes}
        onSaveCustomProfile={handleSaveCustomProfile}
        onImportData={handleImportData}
        allNodes={nodes}
        allEdges={edges}
      />
    </div>
  );
}

export default App;
