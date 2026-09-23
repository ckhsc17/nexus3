import { Person, ShortestPath, AIAnalysisResult, IntroDraftResponse } from '../types/network';

export async function requestAIMatch(
  query: string,
  currentPersona: Person,
  candidateSummaries: { id: string; name: string; role: string; company: string; skills: string[]; openTo: string }[]
): Promise<AIAnalysisResult | null> {
  try {
    const res = await fetch('/api/ai/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        currentPersona,
        candidateSummaries: candidateSummaries.slice(0, 30) // send top relevant for prompt efficiency
      })
    });

    if (!res.ok) {
      console.warn('AI Match endpoint responded with error, falling back to local matcher');
      return null;
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Failed to call /api/ai/match:', err);
    return null;
  }
}

export async function requestAIIntroDraft(
  user: Person,
  target: Person,
  path: ShortestPath,
  tone: 'business' | 'friendly' | 'startup'
): Promise<IntroDraftResponse> {
  try {
    const res = await fetch('/api/ai/intro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user,
        target,
        path,
        tone
      })
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Failed to call /api/ai/intro, falling back to local generator:', err);
  }

  // Graceful smart local generator if server is unavailable
  const isDirect = path.degree === 1;
  const intermediate = path.nodes.length > 2 ? path.nodes[1] : null;

  if (isDirect) {
    return {
      subject: `引薦交流請求：${user.name} (${user.company}) - 探討業務合作可能`,
      recipientName: target.name,
      targetName: target.name,
      message: `${target.name} 您好，\n\n我是 ${user.company} 的 ${user.name}。我們在人脈網絡中有直接交集。\n\n關注您在「${target.company}」擔任 ${target.role} 的豐碩成果，尤其是您在 ${target.skills.slice(0, 2).join('、')} 領域的專業見解。\n\n目前我們正在推進 ${user.bio}，得知您平時也開放「${target.openTo}」，希望能約 15 分鐘線上咖啡聊聊，探討潛在的合作與交流切入點。\n\n祝好，\n${user.name}\n${user.role} | ${user.company}`,
      talkingPoints: [
        `提及雙方在專業領域的交集`,
        `點出對方的專長：${target.skills.slice(0, 2).join('、')}`,
        `說明自己能為對方帶來的價值或目前合作場景`
      ]
    };
  }

  const mutualFriend = intermediate || path.nodes[1];
  const hop1Desc = path.hops[0]?.edge.description || '熟識好友';
  const hop2Desc = path.hops[1]?.edge.description || '合作夥伴';

  return {
    subject: `請教與引薦詢問：想透過您認識 ${target.company} 的 ${target.name}`,
    recipientName: mutualFriend.name,
    targetName: target.name,
    message: `${mutualFriend.name} 您好！\n\n好久不見，希望您最近在 ${mutualFriend.company} 一切順利！\n\n冒昧打擾，是因為我們最近在 ${user.bio.slice(0, 50)}... 階段，特別想請教或認識 ${target.company} 的 ${target.name} (${target.role})。\n\n看到您與 ${target.name} 關係深厚（${hop2Desc}），而我們一直非常信任您（${hop1Desc}），不知道方便的話，是否能由您在 Line / Email 協助拉一個 3 人的簡短介紹群？\n\n我也附上了一段可以直接轉貼的自我介紹，絕不會造成您的困擾。非常感謝您的引薦與幫忙！\n\n祝好，\n${user.name} 敬上`,
    talkingPoints: [
      `開頭溫馨問候中間人：${mutualFriend.name}，提及雙方關係 (${hop1Desc})`,
      `說明清晰的引薦目的：想認識 ${target.name} (${target.role}) 探討具體合作`,
      `減輕中間人負擔：提供現成轉發說帖，讓中間人能輕鬆 1-click 轉發`
    ]
  };
}
