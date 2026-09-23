import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

// Initialize GoogleGenAI client
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// POST /api/ai/match: Natural Language Candidate Matching
app.post('/api/ai/match', async (req, res) => {
  const { query, currentPersona, candidateSummaries } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Query is required' });
  }

  if (!ai) {
    return res.status(503).json({ error: 'Gemini API is not configured on server' });
  }

  try {
    const prompt = `你是一個專業的人脈網絡顧問與六度分隔推薦專家。
使用者當前身份：
- 姓名：${currentPersona?.name || '使用者'}
- 職銜：${currentPersona?.role || ''} (${currentPersona?.company || ''})
- 領域：${currentPersona?.industry || ''}
- 簡介與目標：${currentPersona?.bio || ''}

使用者的自然語言搜尋需求：
「${query}」

候選人資料摘要清單：
${JSON.stringify(candidateSummaries || [], null, 2)}

請分析使用者的搜尋意圖，並從上述清單中挑選出最契合的目標人脈（最多 6 位），針對每位評估符合度與具體引薦切入點。

請嚴格以 JSON 格式回應，包含以下結構：
{
  "interpretedIntent": "簡短一句話總結使用者的核心需求與搜尋目標",
  "targetCriteria": {
    "roles": ["適合的職稱1", "適合的職稱2"],
    "industries": ["目標產業領域"],
    "keySkills": ["關鍵專業技術或資源"]
  },
  "matches": [
    {
      "id": "候選人ID (例如 p1)",
      "score": 95, // 0-100 符合度分數
      "matchReason": "為何這位人脈符合需求，他擁有哪些背景、資源或權限",
      "keySynergy": "雙方合作或引薦的最佳切入點/破冰主題"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating AI match with Gemini:', error);
    return res.status(500).json({
      error: 'Failed to process matching',
      details: error?.message || String(error)
    });
  }
});

// POST /api/ai/intro: Context-aware Introduction Message
app.post('/api/ai/intro', async (req, res) => {
  const { user, target, path, tone } = req.body;

  if (!user || !target || !path) {
    return res.status(400).json({ error: 'User, target, and path are required' });
  }

  if (!ai) {
    return res.status(503).json({ error: 'Gemini API is not configured on server' });
  }

  try {
    const isDirect = path.degree === 1;
    const mutualFriend = path.nodes && path.nodes.length > 2 ? path.nodes[1] : null;

    const prompt = `你是一位高情商的商業人脈顧問。請根據以下人脈鏈條，撰寫一封得體、高回覆率的引薦或破冰訊息。
邀請人（我）：${user.name} (${user.company}, ${user.role}) - ${user.bio}
目標人（想認識）：${target.name} (${target.company}, ${target.role}) - ${target.bio}，其開放尋找：${target.openTo}
路徑類型：${isDirect ? '直接認識 (1度關係)' : `透過中間人 ${mutualFriend?.name} 引薦 (${path.degree}度關係)`}
路徑詳細關係：${path.hops?.map((h: any, i: number) => `第${i + 1}步: ${h.from.name} ➜ ${h.to.name} (關係: ${h.edge.type}，${h.edge.description})`).join('； ')}
語氣偏好：${tone === 'friendly' ? '誠懇友好、輕鬆交流' : tone === 'startup' ? '科技新創、高效快節奏' : '專業商務、禮貌尊重'}

請嚴格輸出 JSON 格式：
{
  "subject": "訊息標題 (如 Email 或 Line 主旨)",
  "recipientName": "${isDirect ? target.name : mutualFriend?.name}",
  "targetName": "${target.name}",
  "message": "完整訊息草稿內文 (可直接複製轉傳)",
  "talkingPoints": [
    "破冰要點 1",
    "破冰要點 2",
    "破冰要點 3"
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating AI intro with Gemini:', error);
    return res.status(500).json({
      error: 'Failed to generate intro',
      details: error?.message || String(error)
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`NexusNet server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
