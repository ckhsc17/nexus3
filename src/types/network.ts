export interface Person {
  id: string;
  name: string;
  englishName?: string;
  role: string;
  company: string;
  industry: string;
  location: string;
  bio: string;
  skills: string[];
  interests: string[];
  openTo: string;
  avatarColor: string;
  isCustom?: boolean;
  degreeFromUser?: number; // 0 = self, 1 = direct, 2 = 2nd degree, etc.
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface Relationship {
  id: string;
  source: string;
  target: string;
  type: string;
  description: string;
  closeness: 1 | 2 | 3 | 4 | 5; // 5 = 核心熟識, 4 = 緊密夥伴, 3 = 穩定聯繫, 2 = 普通相識, 1 = 點頭之交
  yearsKnown: number;
}

export interface PathHop {
  from: Person;
  to: Person;
  edge: Relationship;
}

export interface ShortestPath {
  id: string;
  nodes: Person[];
  hops: PathHop[];
  degree: number; // number of hops (1 = direct, 2 = via 1 friend)
  totalCloseness: number;
  avgCloseness: number;
  label: string; // e.g. "最短路徑 (2度)" or "最高信任度路徑"
  type: 'shortest' | 'trusted' | 'alternative';
}

export interface SearchMatch {
  person: Person;
  matchScore: number; // 0 - 100
  matchReason: string;
  keySynergy: string;
  degree: number;
  shortestPaths: ShortestPath[];
}

export interface AIAnalysisResult {
  interpretedIntent: string;
  targetCriteria: {
    roles: string[];
    industries: string[];
    keySkills: string[];
  };
  matches: {
    id: string;
    score: number;
    matchReason: string;
    keySynergy: string;
  }[];
}

export interface IntroDraftRequest {
  targetPersonId: string;
  pathId: string;
  tone: 'business' | 'friendly' | 'startup';
}

export interface IntroDraftResponse {
  subject: string;
  recipientName: string; // The mutual friend
  targetName: string;
  message: string;
  talkingPoints: string[];
}
