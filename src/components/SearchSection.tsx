import React, { useState, useEffect } from 'react';
import { Person, SearchMatch, ShortestPath, AIAnalysisResult } from '../types/network';
import { Search, Sparkles, ArrowRight, Compass, CheckCircle2, UserCheck, RefreshCw } from 'lucide-react';
import { searchCandidatesLocal, findShortestPaths, GraphAdjacency } from '../utils/graphAlgorithms';
import { requestAIMatch } from '../services/aiService';

interface SearchSectionProps {
  nodes: Person[];
  nodesMap: Map<string, Person>;
  adj: GraphAdjacency;
  currentPersona: Person;
  degreesMap: Map<string, number>;
  onSelectCandidate: (candidate: Person, paths: ShortestPath[]) => void;
  onClearActivePath: () => void;
  hasActivePath: boolean;
  selectedCandidateId?: string | null;
}

const PRESET_PROMPTS = [
  '想找醫療生技領域的早期投資人，最好有海外市場落地經驗',
  '想找大企業或公立私立醫院的智慧醫療/醫材採購決策者',
  '尋找熟悉 LLM Agent 架構的資深軟體工程師想一起創業',
  '想找懂專利智財與美國 FDA 510(k) 認證法規的合夥律師',
  '想找大型金控或連鎖零售 (如全聯、富邦) 的 CIO/CISO 談 PoC',
  '想找有東南亞或北美出海經驗的跨境品牌行銷總監',
];

export const SearchSection: React.FC<SearchSectionProps> = ({
  nodes,
  nodesMap,
  adj,
  currentPersona,
  degreesMap,
  onSelectCandidate,
  onClearActivePath,
  hasActivePath,
  selectedCandidateId,
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [results, setResults] = useState<SearchMatch[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Perform search (Local instant matcher + optional Gemini server enhancement)
  const handleSearch = async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) return;

    setIsSearching(true);
    setHasSearched(true);

    // 1. Instant client-side matches first
    const localMatches = searchCandidatesLocal(q, nodes, currentPersona.id, degreesMap);
    const enrichedLocal: SearchMatch[] = localMatches.map(m => {
      const paths = findShortestPaths(currentPersona.id, m.person.id, nodesMap, adj, 3);
      return {
        ...m,
        shortestPaths: paths,
      };
    });

    setResults(enrichedLocal);

    // 2. Try Gemini server-side analysis
    try {
      const summaries = nodes
        .filter(n => n.id !== currentPersona.id)
        .map(n => ({
          id: n.id,
          name: n.name,
          role: n.role,
          company: n.company,
          skills: n.skills,
          openTo: n.openTo,
        }));

      const aiRes = await requestAIMatch(q, currentPersona, summaries);
      if (aiRes && aiRes.matches && aiRes.matches.length > 0) {
        setAiAnalysis(aiRes);
        // Merge AI scores and reasons with graph paths
        const aiMatchedList: SearchMatch[] = [];
        for (const m of aiRes.matches) {
          const person = nodesMap.get(m.id);
          if (person) {
            const paths = findShortestPaths(currentPersona.id, person.id, nodesMap, adj, 3);
            aiMatchedList.push({
              person,
              matchScore: m.score,
              matchReason: m.matchReason,
              keySynergy: m.keySynergy,
              degree: degreesMap.get(person.id) ?? 999,
              shortestPaths: paths,
            });
          }
        }

        // Fill remaining with local if AI returned few
        const existingIds = new Set(aiMatchedList.map(item => item.person.id));
        enrichedLocal.forEach(item => {
          if (!existingIds.has(item.person.id) && aiMatchedList.length < 8) {
            aiMatchedList.push(item);
          }
        });

        aiMatchedList.sort((a, b) => b.matchScore - a.matchScore);
        setResults(aiMatchedList);
      }
    } catch (err) {
      console.warn('AI enhancement fallback to local:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleSelectPreset = (preset: string) => {
    setQuery(preset);
    handleSearch(preset);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border-l border-slate-800/80">
      {/* Search Header and Input Form */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="prompt-search" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>自然語言人脈搜尋</span>
          </label>
          {hasActivePath && (
            <button
              onClick={onClearActivePath}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline decoration-slate-600 transition-colors"
            >
              清除高亮路徑
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <textarea
            id="prompt-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="描述你想找的人...例如：想找醫療生技早期投資人、醫院採購高管、AI 架構師、或出海行銷總監"
            rows={3}
            className="w-full bg-slate-950 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-500 resize-none outline-none leading-relaxed transition-colors"
          />

          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-slate-500">
              支援六度路徑推導 · Enter 發送
            </span>
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors shadow-sm"
            >
              {isSearching ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>分析網絡中...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>找尋最契合人脈</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Suggested Quick Prompts */}
        <div className="mt-3">
          <span className="text-[10px] font-medium text-slate-500 block mb-1.5">
            常見尋人情境直接試：
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectPreset(p)}
                className="text-[11px] text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 px-2 py-1 rounded transition-colors text-left truncate max-w-full"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Intent Summary (if available) */}
      {aiAnalysis && (
        <div className="px-4 py-2.5 bg-indigo-950/20 border-b border-indigo-900/30 text-xs">
          <div className="flex items-center gap-1.5 text-indigo-300 font-medium mb-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>AI 意圖解析</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {aiAnalysis.interpretedIntent}
          </p>
          {aiAnalysis.targetCriteria && (
            <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 mt-1">
              <span>目標領域: {aiAnalysis.targetCriteria.industries?.join(', ')}</span>
              <span aria-hidden="true">·</span>
              <span>關鍵專長: {aiAnalysis.targetCriteria.keySkills?.slice(0, 3).join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Search Results List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {results.length > 0 ? (
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5">
              <span>找到 {results.length} 位推薦目標</span>
              <span>依匹配度與引薦捷徑排序</span>
            </div>

            <div className="space-y-3">
              {results.map((match) => {
                const isSelected = selectedCandidateId === match.person.id;
                const bestPath = match.shortestPaths[0];

                return (
                  <div
                    key={match.person.id}
                    className={`p-3.5 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-slate-850 border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Header: Name, Role, Match Score */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                          style={{ backgroundColor: match.person.avatarColor }}
                        >
                          {match.person.name.slice(0, 1)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-100 text-sm">
                              {match.person.name}
                            </span>
                            {match.person.englishName && (
                              <span className="text-[11px] text-slate-400">
                                {match.person.englishName}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {match.person.company} · {match.person.role}
                          </div>
                        </div>
                      </div>

                      {/* Match Score & Degree */}
                      <div className="text-right shrink-0">
                        <div className="text-xs font-semibold text-indigo-400 tabular-nums">
                          {match.matchScore}% 契合
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {match.degree === 1
                            ? '1度好友'
                            : match.degree === 2
                            ? '2度朋友'
                            : `${match.degree}度人脈`}
                        </div>
                      </div>
                    </div>

                    {/* Match Reason Prose (No pills) */}
                    <p className="text-xs text-slate-300 leading-relaxed mb-2 bg-slate-950/40 p-2 rounded border border-slate-800/40">
                      <span className="text-indigo-400 font-medium mr-1">推薦理由:</span>
                      {match.matchReason}
                    </p>

                    {/* Shortest Path Summary Bar */}
                    {bestPath && (
                      <div className="flex items-center justify-between py-1.5 px-2 bg-slate-950/70 border border-slate-800 rounded text-[11px] text-slate-400 mb-2.5">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <Compass className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="truncate">
                            最短路徑：
                            {bestPath.nodes.map((n, i) => (
                              <React.Fragment key={n.id}>
                                {i > 0 && <span className="text-slate-600 mx-1">➜</span>}
                                <span className={i === 0 ? 'text-indigo-300' : i === bestPath.nodes.length - 1 ? 'text-amber-300' : 'text-slate-300'}>
                                  {n.name}
                                </span>
                              </React.Fragment>
                            ))}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                          {bestPath.hops.length} 轉介步數
                        </span>
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      onClick={() => onSelectCandidate(match.person, match.shortestPaths)}
                      className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/80 hover:border-slate-600'
                      }`}
                    >
                      <span>檢視最短引薦路徑與破冰話術</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : hasSearched && !isSearching ? (
          <div className="text-center py-12 text-slate-400">
            <Compass className="w-8 h-8 mx-auto mb-2 text-slate-600 stroke-[1.5]" />
            <p className="text-xs font-medium text-slate-300 mb-1">未找到高度契合的候選人</p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              試著放寬條件，例如只搜尋產業名稱（如「生技」、「半導體」、「SaaS」）或關鍵職稱。
            </p>
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400">
            <div className="w-10 h-10 rounded-full bg-indigo-950/60 border border-indigo-900/50 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <h4 className="text-sm font-semibold text-slate-200 mb-1">
              以自然語言探索人際六度網絡
            </h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed mb-4">
              在上方輸入你現在想認識的人、想尋求的投資人、客戶或技術夥伴，系統將自動演算最短轉介路徑。
            </p>
            <div className="text-left text-xs bg-slate-950/50 border border-slate-800/80 rounded-lg p-3 text-slate-400">
              <div className="font-medium text-slate-300 mb-1.5">六度理論小知識：</div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                在台灣緊密的產業與校友生態圈（台大/交大/成大/竹科/創投圈），你與 95% 以上的專業人士都在 2 到 3 度關係以內。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
