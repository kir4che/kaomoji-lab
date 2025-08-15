import { NextResponse, NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { sanitize } from '@/utils/sanitize';

const redis = Redis.fromEnv();

// 速率限制：使用者（以 IP 區分）在 60 秒內，最多只能請求 10 次。
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  analytics: true,
  timeout: 1000,
});

const API_KEY = process.env.GEMINI_API_KEY ?? '';
const genAI = new GoogleGenerativeAI(API_KEY);

const MAX_PROMPT_LENGTH = 100;
const CACHE_TTL_SECONDS = 3600;
const MODEL_NAME = 'gemini-2.0-flash';

function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = (forwarded?.split(',')[0]?.trim() || realIp || '').trim();
  return ip || '127.0.0.1';
}

export async function POST(req: NextRequest) {
  // 取得限流資訊
  const ip = getClientIp(req);
  let rateHeaders: Record<string, string> | undefined;

  try {
    const { success, limit, remaining, reset } = await ratelimit.limit(ip);
    rateHeaders = {
      'X-RateLimit-Limit': String(limit),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(reset),
    };
    if (!success)
      return NextResponse.json(
        { error: 'Too many requests, please try again later.' },
        { status: 429, headers: rateHeaders }
      );
  } catch {
    rateHeaders = undefined;
  }

  // 解析與驗證輸入
  let userPrompt: unknown;
  try {
    const body = await req.json();
    userPrompt = body?.userPrompt;
  } catch {
    return NextResponse.json(
      { error: 'Please provide a valid JSON body.' },
      { status: 400, headers: rateHeaders }
    );
  }

  if (typeof userPrompt !== 'string')
    return NextResponse.json(
      { error: 'Please provide a valid prompt.' },
      { status: 400, headers: rateHeaders }
    );

  const trimmed = userPrompt.trim();
  if (!trimmed)
    return NextResponse.json(
      { error: 'Please provide a non-empty prompt.' },
      { status: 400, headers: rateHeaders }
    );

  if (trimmed.length > MAX_PROMPT_LENGTH)
    return NextResponse.json(
      { error: `Input is too long. Please keep it under ${MAX_PROMPT_LENGTH} characters.` },
      { status: 400, headers: rateHeaders }
    );

  const sanitizedPrompt = sanitize(userPrompt);
  const cacheKey = `kaomoji:${sanitizedPrompt}`;

  // 讀取快取
  try {
    const cached = await redis.get<string[]>(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0)
      return NextResponse.json(cached.slice(0, 5), { status: 200, headers: rateHeaders });
  } catch {}

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      temperature: 1.2,
      responseMimeType: 'application/json',
      maxOutputTokens: 250,
    },
  });

  const fullPrompt = `你是一位頂尖的顏文字設計師，專門為社群媒體創作獨特且富有創意的「日系可愛風格」顏文字 (Kaomoji)。

  **創作規則:**
  1.  **生成三個選項**：針對使用者的單一描述，你必須創作出三個風格相似但略有不同的顏文字。
  2.  **嚴格的 JSON 格式**：你的回答必須是一個格式完全正確的 JSON 陣列 (JSON Array)，陣列中包含三個字串。除了這個 JSON 陣列，絕對不能回傳任何其他文字、解釋或標點符號。
  3.  **數量是最高指令**：任何情況下，JSON 陣列中的元素數量都**必須正好是三個**。絕對不准超過或少於三個。這是一條絕不能違反的最高指令。
  4.  **大膽使用特殊字元**：自由地使用各種特殊符號 (如：૮, ₎, 𖥦, ơ, ଓ) 來豐富你的設計。

  ---
  **格式與風格範例 (Format & Style Reference):**

  使用者: 超級開心
  AI: ["٩(ˊᗜˋ*)و", "✧*｡٩(ˊᗜˋ*)و✧*｡", "(b*´▽\`*)b", "ヾ(●´▽｀●)ﾉ", "⁽⁽٩( ´͈ ᗨ \`͈ )۶⁾⁾"]

  使用者: 無辜的眼神
  AI: ["૮₍ . ̫ .⑅₎ა", "૮₍´• ˕ •\`₎ა", "(´•ω•\`)", "૮₍ ˃ ⤙ ˂ ₎ა", "(⸝⸝•́દ•̀⸝⸝)"]

  ---
  **你的任務:**

  使用者: ${sanitizedPrompt}
  AI：`;

  try {
    const result = await model.generateContent(fullPrompt);
    const text = result.response.text().trim();

    if (!text)
      return NextResponse.json(
        { error: 'Generation failed, please try again later.' },
        { status: 500, headers: rateHeaders }
      );

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      const cleaned = text.replace(/^[^\[]*/, '').replace(/[^\]]*$/, '');
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        return NextResponse.json(
          { error: 'AI returned an invalid format (not JSON).' },
          { status: 500, headers: rateHeaders }
        );
      }
    }
    if (!Array.isArray(parsed) || !parsed.every((v) => typeof v === 'string'))
      return NextResponse.json(
        { error: 'AI returned an invalid format. Expected an array of strings.' },
        { status: 500, headers: rateHeaders }
      );

    // 只保留前 3 個顏文字
    const safeKaomojis = parsed
      .map((s) => (typeof s === 'string' ? s.trim() : ''))
      .filter((s) => s.length > 0)
      .slice(0, 3);

    // 寫入快取（失敗不影響主流程）
    try {
      await redis.set(cacheKey, safeKaomojis, { ex: CACHE_TTL_SECONDS });
    } catch {}

    return NextResponse.json(safeKaomojis, { status: 200, headers: rateHeaders });
  } catch {
    return NextResponse.json(
      { error: 'Generation failed, please try again later.' },
      { status: 500, headers: rateHeaders }
    );
  }
}
