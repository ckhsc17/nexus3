import { Person, Relationship, ShortestPath, PathHop } from '../types/network';

export interface GraphAdjacency {
  [nodeId: string]: {
    neighborId: string;
    edge: Relationship;
  }[];
}

export function buildAdjacency(edges: Relationship[]): GraphAdjacency {
  const adj: GraphAdjacency = {};
  for (const edge of edges) {
    if (!adj[edge.source]) adj[edge.source] = [];
    if (!adj[edge.target]) adj[edge.target] = [];

    adj[edge.source].push({ neighborId: edge.target, edge });
    adj[edge.target].push({ neighborId: edge.source, edge });
  }
  return adj;
}

export function calculateDegrees(
  userId: string,
  nodes: Person[],
  adj: GraphAdjacency
): Map<string, number> {
  const degrees = new Map<string, number>();
  nodes.forEach(n => degrees.set(n.id, 999));
  degrees.set(userId, 0);

  const queue: [string, number][] = [[userId, 0]];
  const visited = new Set<string>([userId]);

  while (queue.length > 0) {
    const [currentId, depth] = queue.shift()!;
    const neighbors = adj[currentId] || [];

    for (const { neighborId } of neighbors) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        degrees.set(neighborId, depth + 1);
        queue.push([neighborId, depth + 1]);
      }
    }
  }

  return degrees;
}

// Find multiple diverse shortest paths from source to target
export function findShortestPaths(
  sourceId: string,
  targetId: string,
  nodesMap: Map<string, Person>,
  adj: GraphAdjacency,
  maxPaths = 3
): ShortestPath[] {
  if (sourceId === targetId) return [];

  const foundPaths: ShortestPath[] = [];

  // 1. Standard BFS to find shortest hop length
  interface QueueItem {
    path: string[];
    edges: Relationship[];
  }

  const queue: QueueItem[] = [{ path: [sourceId], edges: [] }];
  const visitedAtDepth = new Map<string, number>();
  visitedAtDepth.set(sourceId, 0);

  let shortestHopLength = Infinity;
  const rawPaths: { path: string[]; edges: Relationship[] }[] = [];

  while (queue.length > 0) {
    const { path, edges } = queue.shift()!;
    const current = path[path.length - 1];
    const currentDepth = path.length - 1;

    if (currentDepth > shortestHopLength + 1) break; // Don't search too deep beyond shortest

    if (current === targetId) {
      if (currentDepth < shortestHopLength) {
        shortestHopLength = currentDepth;
      }
      rawPaths.push({ path, edges });
      if (rawPaths.length >= 8) break;
      continue;
    }

    const neighbors = adj[current] || [];
    for (const { neighborId, edge } of neighbors) {
      if (!path.includes(neighborId)) {
        const recordedDepth = visitedAtDepth.get(neighborId);
        if (recordedDepth === undefined || recordedDepth >= currentDepth + 1) {
          visitedAtDepth.set(neighborId, currentDepth + 1);
          queue.push({
            path: [...path, neighborId],
            edges: [...edges, edge]
          });
        }
      }
    }
  }

  if (rawPaths.length === 0) return [];

  // Sort and select up to maxPaths diverse routes
  // (e.g. rank by highest closeness, different intermediate bridges)
  const evaluated: ShortestPath[] = rawPaths.map((rp, idx) => {
    const pathNodes = rp.path.map(id => nodesMap.get(id)!).filter(Boolean);
    const hops: PathHop[] = [];
    let totalCloseness = 0;

    for (let i = 0; i < rp.edges.length; i++) {
      const fromNode = pathNodes[i];
      const toNode = pathNodes[i + 1];
      const edge = rp.edges[i];
      hops.push({ from: fromNode, to: toNode, edge });
      totalCloseness += edge.closeness;
    }

    const avgCloseness = (totalCloseness / Math.max(1, rp.edges.length));
    const degree = rp.edges.length;

    let type: ShortestPath['type'] = 'alternative';
    let label = `替代路徑 (${degree}度)`;

    if (idx === 0) {
      type = 'shortest';
      label = `最少轉介 (${degree}度人脈)`;
    }

    return {
      id: `path-${idx}-${degree}hop`,
      nodes: pathNodes,
      hops,
      degree,
      totalCloseness,
      avgCloseness,
      label,
      type
    };
  });

  // Pick the best shortest hop, plus the highest trust path if distinct
  evaluated.sort((a, b) => {
    if (a.degree !== b.degree) return a.degree - b.degree;
    return b.avgCloseness - a.avgCloseness;
  });

  const selected: ShortestPath[] = [];
  const usedIntermediates = new Set<string>();

  for (let i = 0; i < evaluated.length; i++) {
    const item = evaluated[i];
    // Check if intermediate is diverse
    const intermediateKey = item.nodes.slice(1, -1).map(n => n.id).join('-');
    if (selected.length === 0) {
      item.label = `最直接推薦 (${item.degree}度關係)`;
      item.type = 'shortest';
      selected.push(item);
      usedIntermediates.add(intermediateKey);
    } else if (!usedIntermediates.has(intermediateKey)) {
      if (item.avgCloseness >= 4 && item.degree === selected[0].degree) {
        item.label = `高信任熟識路徑 (${item.degree}度)`;
        item.type = 'trusted';
      } else {
        item.label = `不同中間人 (${item.degree}度)`;
        item.type = 'alternative';
      }
      selected.push(item);
      usedIntermediates.add(intermediateKey);
      if (selected.length >= maxPaths) break;
    }
  }

  return selected.length > 0 ? selected : evaluated.slice(0, maxPaths);
}

// Fast instant client-side keyword & semantic scoring
export function searchCandidatesLocal(
  query: string,
  nodes: Person[],
  currentUserId: string,
  degreesMap: Map<string, number>
): { person: Person; matchScore: number; matchReason: string; keySynergy: string; degree: number }[] {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return [];

  // Keywords tokenization
  const tokens = cleanQuery
    .replace(/[，、。！？,.!?]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);

  // Intent patterns
  const isVCIntent = /投資|創投|天使|vc|資金|融資|fund|種子輪|領投/.test(cleanQuery);
  const isMedicalIntent = /醫療|生技|醫生|院長|採購|醫院|醫材|臨床|fda|藥局|健保/.test(cleanQuery);
  const isAIIntent = /ai|人工智慧|軟體|工程師|架構師|agent|llm|模型|演算法|cto/.test(cleanQuery);
  const isEnterpriseIntent = /企業|客戶|採購|b2b|saas|主管|副總|cio|ciso|總經理/.test(cleanQuery);
  const isHardwareIntent = /半導體|硬體|晶片|ic|供應鏈|代工|製造|台積電|聯發科/.test(cleanQuery);
  const isMarketingIntent = /行銷|品牌|出海|海外|增長|growth|cmo|公關|網紅|跨境/.test(cleanQuery);
  const isLegalIntent = /律師|法律|專利|智財|合約|法務|合夥人|會計師/.test(cleanQuery);

  const results: {
    person: Person;
    matchScore: number;
    matchReason: string;
    keySynergy: string;
    degree: number;
  }[] = [];

  for (const node of nodes) {
    if (node.id === currentUserId) continue;

    let score = 0;
    const reasons: string[] = [];
    const synergies: string[] = [];

    const searchableText = `${node.name} ${node.englishName || ''} ${node.role} ${node.company} ${node.industry} ${node.location} ${node.bio} ${node.skills.join(' ')} ${node.interests.join(' ')} ${node.openTo}`.toLowerCase();

    // 1. Direct token matches
    for (const token of tokens) {
      if (searchableText.includes(token)) {
        score += 20;
      }
      if (node.role.toLowerCase().includes(token) || node.company.toLowerCase().includes(token)) {
        score += 25;
        reasons.push(`職銜/機構符合「${token}」`);
      }
      if (node.skills.some(s => s.toLowerCase().includes(token))) {
        score += 20;
        reasons.push(`專長包含「${token}」`);
      }
      if (node.openTo.toLowerCase().includes(token)) {
        score += 25;
        reasons.push(`目前正尋求「${token}」`);
      }
    }

    // 2. Domain intent alignments
    if (isVCIntent && (node.industry.includes('創投') || node.role.includes('投資') || node.role.includes('天使') || node.role.includes('合夥人'))) {
      score += 35;
      reasons.push('具備專業創投/天使投資決策背景');
      synergies.push('可尋求種子輪募資、Pitch 諮詢或共投引薦');
    }
    if (isMedicalIntent && (node.industry.includes('醫療') || node.role.includes('臨床') || node.role.includes('採購') || node.bio.includes('醫'))) {
      score += 35;
      reasons.push('擁有台灣醫學中心與生技法規認證網絡');
      synergies.push('可引薦醫院臨床測試、採購流程對焦');
    }
    if (isAIIntent && (node.industry.includes('軟體') || node.skills.some(s => /ai|llm|架構|機器學習/i.test(s)))) {
      score += 35;
      reasons.push('具備深厚 AI 演算法與高併發系統架構實戰');
      synergies.push('可擔任技術合夥人、架構評審或共同創業');
    }
    if (isEnterpriseIntent && (node.industry.includes('企業') || /cio|ciso|處長|副總|採購/i.test(node.role))) {
      score += 30;
      reasons.push('掌握大型集團之軟體與設備採購決策權');
      synergies.push('可探索企業 PoC 專案或導入合約簽訂');
    }
    if (isHardwareIntent && (node.industry.includes('半導體') || /ic|晶片|供應鏈|硬體/i.test(node.role + node.skills.join(' ')))) {
      score += 35;
      reasons.push('深耕新竹與台灣半導體硬體供應鏈');
      synergies.push('可協助開模打樣、晶片系統整合或供應鏈排單');
    }
    if (isMarketingIntent && (node.industry.includes('行銷') || /cmo|出海|增長|公關|品牌/i.test(node.role))) {
      score += 30;
      reasons.push('擅長跨境用戶增長、全球品牌定位與大媒體操盤');
      synergies.push('可協助品牌海外出海、爆款行銷策略規劃');
    }
    if (isLegalIntent && (node.industry.includes('法律') || /律師|專利|會計|法務/i.test(node.role))) {
      score += 35;
      reasons.push('專精跨國股權、智財專利護城河與法規合規');
      synergies.push('可協助新創合約健檢、海外取證或上市輔導');
    }

    if (score > 15) {
      const finalScore = Math.min(98, Math.max(45, score));
      const degree = degreesMap.get(node.id) ?? 999;
      results.push({
        person: node,
        matchScore: finalScore,
        matchReason: reasons.slice(0, 2).join('；') || `${node.company} ${node.role}，專精於 ${node.skills.slice(0, 2).join('、')}`,
        keySynergy: synergies[0] || `針對你的需求，${node.name} 能提供關鍵專業資源與決策建議。`,
        degree
      });
    }
  }

  // Sort by highest score, then closest degree
  results.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return a.degree - b.degree;
  });

  return results.slice(0, 12);
}
