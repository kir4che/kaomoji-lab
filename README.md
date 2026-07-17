<div align="center">

# Kaomoji Lab 顏文字實驗室

探索、複製、發現 7,000+ 顏文字

[功能特色](#功能特色) • [快速開始](#快速開始) • [專案結構](#專案結構) • [管理員設定](#管理員設定) • [指令腳本](#指令腳本) • [使用技術](#使用技術)

</div>

Kaomoji Lab 是一個網頁應用程式，讓你探索、複製與發現顏文字 — 日式文字表情符號如 (｡◕‿◕｡)。收錄 7,000+ 顏文字，按分類與標籤整理，具備簡潔響應式介面、雙語支援與 AI 產生器。

## 功能特色

- **7,000+ 顏文字** — 橫跨 20 種心情與主題分類的精心收藏
- **依分類瀏覽** — 開心、難過、生氣、愛情、動物、動作⋯⋯
- **依標籤搜尋** — 透過風格、情緒或主題尋找顏文字（100+ 標籤）
- **一鍵複製** — 點擊任何顏文字即可複製到剪貼簿
- **AI 產生器** — 輸入文字描述，透過 Google Gemini 產生自訂顏文字
- **雙語介面** — 完整繁體中文與英文支援
- **PWA 支援** — 可安裝、快取優先導航、離線可用
- **響應式設計** — 最佳化桌機、平板與手機體驗
- **RSS 訂閱** — 接收新分類更新
- **管理後台** — 管理顏文字、分類與標籤（GitHub OAuth 保護）

## 快速開始

### 環境需求

- Node.js 20+
- npm

### 安裝

```bash
git clone https://github.com/your-username/kaomoji-lab.git
cd kaomoji-lab
npm install
```

### 開發模式

```bash
npm run dev
```

開啟瀏覽器前往 [http://localhost:3000](http://localhost:3000)。

### 正式環境

```bash
npm run build
npm start
```

> [!TIP]
> 開發模式下，管理員連結會自動顯示在頂部導覽列，無需 GitHub OAuth。

## 專案結構

```
kaomoji-lab/
├── public/
│   ├── data/              # 靜態 JSON 資料檔案
│   │   ├── index.json     # 分類與標籤索引
│   │   └── categories/    # 各分類顏文字檔案
│   ├── icons/             # PWA 圖示
│   └── images/            # Open Graph 圖片
├── src/
│   ├── app/               # Next.js App Router 頁面
│   │   ├── page.tsx       # 首頁（SSG）
│   │   ├── client.tsx     # 首頁客戶端元件
│   │   ├── layout.tsx     # 根佈局（字型與 Provider）
│   │   ├── category/      # 分類列表與詳情頁
│   │   ├── tag/           # 標籤列表與詳情頁
│   │   ├── generator/     # AI 顏文字產生器
│   │   ├── admin/         # 管理後台
│   │   ├── api/           # API 路由（tags、generate、admin）
│   │   ├── rss.xml/       # RSS 訂閱路由
│   │   ├── sitemap.ts     # 動態站點地圖
│   │   └── robots.ts      # Robots 設定
│   ├── components/
│   │   ├── atoms/         # 按鈕、圖示、輸入框、載入
│   │   ├── molecules/     # 列表、模態框、下拉選單、提示
│   │   ├── organisms/     # 頁首、頁尾、分類網格
│   │   └── admin/         # 管理後台專用元件
│   ├── contexts/          # 語言與 Toast Provider
│   ├── hooks/             # 自訂 React Hook
│   ├── lib/               # i18n 與認證工具
│   ├── services/          # 資料讀寫（記憶體快取）
│   ├── types/             # TypeScript 型別定義
│   └── utils/             # 清理、排序、標籤輔助函式
├── scripts/               # CLI 資料管理工具
├── storage/               # 執行期資料（gitignore）
├── kaomoji.csv            # 顏文字匯入來源
├── next.config.ts         # Next.js + PWA 設定
└── package.json
```

## 功能詳解

### 顏文字收藏

收藏以靜態 JSON 檔案儲存在 `public/data/` 下。每個分類為獨立檔案，在建置時於伺服器端載入。`index.json` 作為目錄，提供分類摘要與標籤定義。

> [!NOTE]
> 7,023 個顏文字橫跨 20 個分類，最大分類「action」含 1,652 項，最小分類「tired」含 44 項。

### AI 產生器

產生器使用 Google Gemini 2.0 Flash，根據文字提示建立自訂顏文字。透過 Upstash Redis 限制每個 IP 每 60 秒 1 次請求，結果在 Redis 中快取 1 小時。

### 管理後台

正式環境由 GitHub OAuth 保護。管理後台支援顏文字、分類與標籤的 CRUD 操作，功能包含：

- **分類管理** — 新增、重新命名、排序、合併分類
- **顏文字編輯器** — 新增、編輯文字與標籤，批次選取與搬移
- **標籤管理** — 檢視、重新命名、清理未使用標籤
- **重複偵測** — 尋找與合併重複顏文字
- **跨分類檢視** — 查看標籤在各分類的使用情況

### 搜尋與探索

搜尋介面支援即時過濾，可按顏文字文字內容或標籤名稱篩選。首頁預設顯示隨機顏文字，輸入搜尋關鍵字後切換為篩選結果。

### PWA

使用 `@ducanh2912/next-pwa` 建置，註冊 Service Worker，支援快取優先導航、積極前端快取與上線重新載入偵測。

## 管理員設定

正式部署時，管理員權限由 GitHub OAuth 管控。

### 1. 建立 GitHub OAuth 應用程式

- GitHub：Settings → Developer settings → OAuth Apps → New OAuth App
- Callback URL：`https://your-domain.com/api/auth/github/callback`

### 2. 設定環境變數

```bash
GITHUB_OAUTH_CLIENT_ID=
GITHUB_OAUTH_CLIENT_SECRET=
ADMIN_GITHUB_USERNAME=        # 允許存取管理後台的 GitHub 使用者名稱
ADMIN_AUTH_SECRET=            # 用於 Session 簽章的隨機字串
GITHUB_CONTENTS_TOKEN=        # 用於正式環境提交 JSON 資料變更
GITHUB_CONTENTS_OWNER=        # GitHub repo owner，例如 kir4che
GITHUB_CONTENTS_REPO=         # GitHub repo name，例如 kaomoji-lab
GITHUB_CONTENTS_BRANCH=main   # 可省略，預設 main
GEMINI_API_KEY=               # AI 顏文字產生器用
UPSTASH_REDIS_REST_URL=       # 速率限制與快取用
UPSTASH_REDIS_REST_TOKEN=
```

> [!TIP]
> `ADMIN_AUTH_SECRET` 應為一長串隨機字串（例如 `openssl rand -base64 64`）。開發模式下管理員認證會自動跳過。

> [!NOTE]
> 正式環境的管理後台 CRUD 會透過 GitHub Contents API commit `public/data/` 與 `storage/` JSON 檔案。`GITHUB_CONTENTS_TOKEN` 建議使用 fine-grained personal access token，僅授權目標 repository 的 Contents read/write。若 Vercel 已連接該 branch，commit 後會觸發重新部署，公開頁面才會更新到最新 JSON。

## 指令腳本

| 指令                     | 說明                 |
| ------------------------ | -------------------- |
| `npm run dev`            | 啟動開發伺服器       |
| `npm run build`          | 建置正式版本         |
| `npm start`              | 啟動正式伺服器       |
| `npm run lint`           | 程式碼檢查與自動修正 |
| `npm run format`         | 使用 Prettier 格式化 |
| `npm run add:kaomoji`    | 從 CSV 匯入顏文字    |
| `npm run sort:kaomoji`   | 排序分類內顏文字     |
| `npm run scrape:kaomoji` | 從外部來源爬取顏文字 |

## 使用技術

- [Next.js 16](https://nextjs.org/) — React 框架搭配 App Router
- [TypeScript 5.9](https://www.typescriptlang.org/) — 型別安全
- [Tailwind CSS 4](https://tailwindcss.com/) — 工具優先樣式
- [Google Gemini AI](https://ai.google.dev/) — 顏文字生成
- [Upstash Redis](https://upstash.com/) — 速率限制與快取
- [next-pwa](https://github.com/DuCanhGH/next-pwa) — PWA 支援
