# NexusNet 人脈路徑導航 🌐
### 基於六度分隔理論與 Gemini AI 的智慧人脈網絡圖譜與最短引薦路徑導航系統

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-brightgreen.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Gemini API](https://img.shields.io/badge/Google%20Gemini-3.8%20Flash-orange.svg)](https://ai.google.dev/)

> **「你與世界上的任何人之間，最多只需要透過六個人就能建立聯繫。」**  
> NexusNet 將經典的**六度分隔理論（Six Degrees of Separation）**與現代**小世界網絡（Small-World Network）**模型具象化，結合 **Google Gemini AI 意圖解析**，讓使用者透過日常口語（如：「想找有海外市場落地經驗的生技早期投資人」）即時搜尋對象、自動演算出兩人間的最短轉介路徑，並一鍵生成專屬破冰與引薦說帖。

---

## 📑 目錄

- [✨ 核心亮點功能](#-核心亮點功能)
- [🧠 圖論演算法與小世界模型](#-圖論演算法與小世界模型)
- [🛠️ 技術棧與系統架構](#️-技術棧與系統架構)
- [📁 專案結構圖](#-專案結構圖)
- [🚀 快速上手指南](#-快速上手指南)
  - [環境需求](#環境需求)
  - [安裝步驟](#安裝步驟)
  - [環境變數設定](#環境變數設定)
  - [啟動開發伺服器](#啟動開發伺服器)
  - [生產環境建置](#生產環境建置)
- [🔌 API 規範與端點說明](#-api-規範與端點說明)
- [💡 使用情境範例](#-使用情境範例)
- [🤝 貢獻指南](#-貢獻指南)
- [📄 授權條款](#-授權條款)

---

## ✨ 核心亮點功能

### 1. 2D 動態力導向網絡拓撲畫布 (Interactive Force-Directed Canvas)
- **物理模擬排版**：採用連續微步力導向模擬（排斥力、彈簧張力與重心牽引），讓百人關係網自然聚集為產業生態圈。
- **度數視角高亮**：以當前使用者為原點，即時渲染 `1度好友`（青色）、`2度朋友`（藍色）、`3度人脈` 與 `目標對象`（金黃色發光）。
- **路徑動畫流動**：當選中推薦路徑時，畫布以流動虛線高亮轉介路線，並在中間節點標記傳遞順序（① ➜ ② ➜ ③）。
- **視角操控與篩選**：支援平移、滾輪無段縮放、一鍵重置定錨，並提供按關係度數（1度 / 2度 / 3度+）即時過濾。

### 2. 自然語言語意人脈搜尋 (Natural Language Semantic Search)
- **免去繁瑣表單**：直接用自然口語輸入尋人需求，例如：
  - *「想找大企業或大型醫院的智慧醫療/醫材採購決策者」*
  - *「尋找熟悉 LLM Agent 架構的資深軟體工程師想一起創業」*
  - *「想找懂專利智財與美國 FDA 510(k) 認證法規的合夥律師」*
- **雙層匹配引擎**：
  - **L1 本地即時意圖評分**：極速關鍵字切詞、領域意圖判定與轉介跳數計算，即打即現。
  - **L2 Gemini 3.8 Flash 智慧增強**：自動分析使用者身份背景與目標候選人，產出專屬的「推薦理由」與「破冰協同切入點」。

### 3. 多路徑智慧推導與比較 (Diverse Multi-Path Routing)
- 自動搜尋並提供多條可行的轉介路徑供決策：
  - **最少轉介路徑**：最短跳數（如直連或僅經 1 人）。
  - **高信任熟識路徑**：中間人關係熟稔、相識多年且信任分極高的安全路徑。
  - **替代中間人路徑**：透過不同生活圈的中間橋樑，避免過度依賴單一人脈節點。

### 4. 一鍵生成高回覆率引薦說帖 (AI Intro Pitch Generator)
- 針對中間引薦人（Mutual Friend）或目標對象，客製化生成符合台灣商務與科技新創習慣的引薦訊息。
- 支援三種語氣切換：
  - **商務正式**：禮貌尊重的正式合作拜會信件。
  - **誠懇友好**：溫馨自然、減少中間人心理負擔的請託訊息。
  - **科技新創**：快節奏、高價值對齊的破冰提案。
- 提供 1-Click 複製功能，可直接貼至 Line、Email 或 LinkedIn。

### 5. 探索視角切換與自訂個人資料 (Persona Switcher & Custom Anchoring)
- **認領角色（Role Claiming）**：內建 5 位精選新手角色與 100 位台灣產業真實角色，一鍵切換視角，全網度數與引薦路徑即時動態重算。
- **自訂檔案建立**：輸入自己的真實姓名、職稱、專長，並勾選 1~3 位已知好友作為錨點，即可無縫嵌入既有人脈圖譜。
- **匯入 / 匯出**：支援全圖譜 JSON 資料一鍵下載備份或上傳自訂網絡。

---

## 🧠 圖論演算法與小世界模型

NexusNet 模擬了真實社會網絡的小世界特性（Watts-Strogatz Model）：
1. **高群聚係數（High Clustering Coefficient）**：同一學經歷（台成交清、台積電/聯發科/Google 校友圈）之間具有密集連結。
2. **短平均路徑長度（Short Average Path Length）**：透過「弱連結」（Weak Ties）與跨界社群活躍者（Super Connectors），全域 95% 以上節點相距都在 2~3 度之內。
3. **路徑演算法**：
   - 使用廣度優先搜尋（BFS）探測極值最短距離。
   - 結合邊權重（熟識度 Closeness 1~5 分、相識年數 Years Known）計算綜合信任分。
   - 執行多樣性過濾，篩選出相異中間節點（Disjoint Intermediates）的備用替代路徑。

---

## 🛠️ 技術棧與系統架構

```
┌─────────────────────────────────────────────────────────┐
│                    NexusNet Client                      │
│  React 19 + TypeScript + Tailwind CSS v4 + Canvas API  │
│  (Force Simulation, Degree Calculation, BFS Multi-Path) │
└───────────────────────────┬─────────────────────────────┘
                            │ REST JSON Requests
┌───────────────────────────▼─────────────────────────────┐
│                    Full-Stack Server                    │
│             Node.js + Express + Vite Middleware         │
└───────────────────────────┬─────────────────────────────┘
                            │ Structured Prompts
┌───────────────────────────▼─────────────────────────────┐
│                 Google Gemini 3.8 Flash                 │
│      (Natural Language Matching & Intro Pitch Draft)    │
└─────────────────────────────────────────────────────────┘
```

- **前端視圖層**：React 19、TypeScript、HTML5 Canvas（原生 60FPS 硬體加速渲染，無重型肥大套件依賴）、Lucide Icons、Tailwind CSS v4。
- **後端代理層**：Node.js、Express、TSX、Vite Middleware。
- **AI 驅動層**：官方 `@google/genai` TypeScript SDK，使用 `gemini-3.8-flash` 進行低延遲、結構化 JSON 輸出。

---

## 📁 專案結構圖

```bash
nexusnet/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions 自動化建置與型別檢查
├── public/                      # 靜態資源目錄
├── src/
│   ├── components/
│   │   ├── CustomProfileModal.tsx # 自訂個人資料與 JSON 匯入/匯出彈窗
│   │   ├── Navbar.tsx             # 頂部導航列與全網數據指標
│   │   ├── NetworkGraph.tsx       # 核心 2D 力導向網絡畫布與路徑動畫
│   │   ├── NodeDetailDrawer.tsx   # 節點詳細資訊與直接好友檢視側欄
│   │   ├── PathDetailModal.tsx    # 最短引薦路徑拆解與 AI 說帖生成彈窗
│   │   ├── PersonaSwitcher.tsx    # 角色切換與視角認領面板
│   │   └── SearchSection.tsx      # 自然語言搜尋輸入與推薦候選人卡片
│   ├── data/
│   │   └── mockNetwork.ts         # 100 位台灣產業真實角色與 280+ 條關係資料
│   ├── services/
│   │   └── aiService.ts           # 前端 API 呼叫與優雅降級邏輯
│   ├── types/
│   │   └── network.ts             # 節點、關係、路徑與 AI 回應之 TypeScript 規格
│   ├── utils/
│   │   └── graphAlgorithms.ts     # 圖論鄰接表、度數 BFS、多路徑評估與本地評分
│   ├── App.tsx                    # 應用程式主邏輯與狀態管理
│   ├── index.css                  # Tailwind CSS 與全域字型設定
│   └── main.tsx                   # React 進入點
├── .env.example                 # 環境變數範例檔
├── .gitignore                   # Git 忽略設定
├── index.html                   # HTML 進入點與 Meta / Favicon
├── LICENSE                      # MIT 開源授權條款
├── metadata.json                # 專案中繼資料
├── package.json                 # 專案設定與 NPM 腳本
├── server.ts                    # Express + Gemini API 代理伺服器
├── tsconfig.json                # TypeScript 編譯設定
└── vite.config.ts               # Vite 打包配置
```

---

## 🚀 快速上手指南

### 環境需求
- **Node.js**：`>= 20.0.0`
- **npm**、**pnpm** 或 **bun**

### 安裝步驟

1. **複製專案庫**
   ```bash
   git clone https://github.com/your-username/nexusnet.git
   cd nexusnet
   ```

2. **安裝專案相依套件**
   ```bash
   npm install
   ```

### 環境變數設定

複製 `.env.example` 為 `.env`：
```bash
cp .env.example .env
```

編輯 `.env` 檔案並填入你的 **Google Gemini API 金鑰**：
```env
# Google AI Studio API Key (取得網址: https://aistudio.google.com/)
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"

# 可選設定
PORT=3000
NODE_ENV=development
```
> 💡 *若未設定 `GEMINI_API_KEY`，系統將自動啟動內建的精準本地啟發式演算引擎，依然可完整操作圖譜搜尋、最短路徑計算與基礎引薦信模板！*

### 啟動開發伺服器

執行開發指令（同時啟動 Express API 與 Vite 熱重載）：
```bash
npm run dev
```
瀏覽器開啟 `http://localhost:3000` 即可進入 NexusNet！

### 生產環境建置

```bash
# 1. 執行型別檢查與程式碼檢查
npm run lint

# 2. 建置前端資產
npm run build

# 3. 啟動生產伺服器
npm run start
```

---

## 🔌 API 規範與端點說明

後端提供兩組乾淨的 RESTful 端點：

### 1. `POST /api/ai/match`
分析使用者的自然語言尋人需求，從候選人清單中評選最契合目標。
- **Request Body**：
  ```json
  {
    "query": "想找醫療生技領域的早期投資人",
    "currentPersona": { "id": "p16", "name": "張致遠", ... },
    "candidateSummaries": [ ... ]
  }
  ```
- **Response**：
  ```json
  {
    "interpretedIntent": "尋找具有生醫器材投資背景與海外取證經驗之機構或天使投資人",
    "targetCriteria": {
      "roles": ["合夥人", "投資總監"],
      "industries": ["創投與天使投資"],
      "keySkills": ["生技募資", "FDA 法規"]
    },
    "matches": [
      {
        "id": "p2",
        "score": 96,
        "matchReason": "主導國發基金合作生醫基金，深耕台灣與北美生技聚落",
        "keySynergy": "可評估臨床試驗進度並提供海外取證諮詢"
      }
    ]
  }
  ```

### 2. `POST /api/ai/intro`
根據人脈鏈條與中間人關係，量身生成高回覆率破冰引薦信。
- **Request Body**：
  ```json
  {
    "user": { "id": "p16", "name": "張致遠", ... },
    "target": { "id": "p2", "name": "林書瑋", ... },
    "path": { "degree": 2, "hops": [ ... ] },
    "tone": "friendly"
  }
  ```
- **Response**：
  ```json
  {
    "subject": "請教與引薦詢問：想透過您認識 國發基金合作生醫基金 的 林書瑋",
    "recipientName": "王淳熙",
    "targetName": "林書瑋",
    "message": "淳熙 您好！\n\n好久不見...",
    "talkingPoints": [
      "開頭問候中間人並提及雙方深厚合作關係",
      "具體說明欲引薦之商業目的",
      "提供可直接轉寄的自我介紹，減輕中間人負擔"
    ]
  }
  ```

---

## 💡 使用情境範例

| 情境類別 | 建議搜尋範例 Prompt | 系統演算結果 |
|---|---|---|
| **新創種子募資** | `想找醫療生技領域的早期投資人，最好有海外市場落地經驗` | 導航至生醫創投合夥人（2度關係，透過醫學中心主任引薦） |
| **技術合夥尋覓** | `尋找熟悉 LLM Agent 架構的資深軟體工程師想一起創業` | 導航至前 Google/聯發科架構師（1度或2度交大校友鏈） |
| **B2B 企業客戶開發** | `想找大型金控或連鎖零售的 CIO/CISO 談 PoC` | 導航至金控數位長（透過台灣軟體協會理事長轉介） |
| **海外出海與跨境增長** | `想找有北美出海經驗的跨境品牌行銷總監` | 導航至跨境電商 VP（透過前同事熟識路徑引薦） |

---

## 🤝 貢獻指南

歡迎透過 Issue 與 Pull Request 參與專案！
1. Fork 本專案庫。
2. 建立新分支 (`git checkout -b feature/amazing-feature`)。
3. 提交變更 (`git commit -m 'feat: Add new graph algorithm'`)。
4. 確保通過 Lint 與 Build (`npm run lint && npm run build`)。
5. 推送至分支 (`git push origin feature/amazing-feature`)。
6. 開啟 Pull Request。

---

## 📄 授權條款

本專案採用 [MIT License](LICENSE) 開源授權，可自由商業使用、修改與散布。
