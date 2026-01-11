
import 'dotenv/config';
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import cors from 'cors';

const app = express();

// CORS 설정
const allowedOrigins = [
  'http://localhost:5173', // Vite 개발 서버
  'https://ehoili.github.io', // GitHub Pages 배포
  'https://ai-tutor-sigma.vercel.app', // Vercel frontend deployment
  // Vercel 배포 시에는 process.env.VERCEL_URL이 자동으로 설정됩니다.
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined
].filter(Boolean); // undefined 값을 제거합니다.

app.use(cors({
  origin: function (origin, callback) {
    console.log(`[CORS] Request from origin: ${origin}`);
    // origin이 undefined인 경우 (예: 서버-사이드 요청) 또는 허용된 목록에 있는 경우 허용
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`[CORS] Blocked origin: ${origin}. Not in allowed list:`, allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());

// API 키 확인
const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  // 서버리스 환경에서는 console.error로 기록하고, 에러 응답을 보냅니다.
  console.error("GOOGLE_API_KEY is not set.");
}
const genAI = new GoogleGenerativeAI(apiKey);

// --- Caching and Batch Generation Logic ---
const problemCache = new Map();
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

// POST /api/generate 엔드포인트
app.post('/api/generate', async (req, res) => {
  const { selection } = req.body;

  if (!selection) {
    return res.status(400).json({ error: 'Selection data is required.' });
  }

  const cacheKey = `${selection.school}-${selection.grade}-${selection.semester}-${selection.unit}-${selection.subUnit || ''}`;
  const cachedEntry = problemCache.get(cacheKey);

  // 1. Check for valid cache entry
  if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_DURATION_MS) {
    const problem = cachedEntry.problems.pop();
    if (problem) {
      console.log(`[Cache] Serving problem from cache for key: ${cacheKey}`);
      // If the cache is now empty, remove it.
      if (cachedEntry.problems.length === 0) {
        problemCache.delete(cacheKey);
      }
      return res.json(problem);
    }
  }
  
  // 2. If no valid cache, fetch a new batch from the API
  console.log(`[API] No cache found. Fetching new batch for key: ${cacheKey}`);
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const prompt = `Create 5 unique multiple-choice math problems based on the following topic: ${selection.unit} - ${selection.subUnit || ''}. 
    The output must be a single JSON object with a key "problems", which is an array of 5 problem objects. 
    Each problem object must have keys "question", "options" (an array of 4 strings), and "answer".`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 3. Validate the response
    let batch;
    try {
      const jsonMatch = text.match(/```json([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : text.trim();
      batch = JSON.parse(jsonString);
    } catch (e) {
      throw new Error("Invalid JSON response from AI.");
    }
    
    if (!batch || !Array.isArray(batch.problems) || batch.problems.length === 0) {
      throw new Error("Invalid batch structure from AI.");
    }

    // 4. Serve one problem and cache the rest
    const problemToServe = batch.problems.pop();
    if (batch.problems.length > 0) {
      console.log(`[Cache] Caching ${batch.problems.length} new problems for key: ${cacheKey}`);
      problemCache.set(cacheKey, {
        problems: batch.problems,
        timestamp: Date.now()
      });
    }
    
    res.json(problemToServe);

  } catch (error) {
    console.error('Error generating problem with Google API:', error);

    // Check if this is a rate limit error (status 429)
    if (error.status === 429) {
      res.status(429).json({ 
        error: '현재 많은 사용자가 몰려 답변 생성이 지연되고 있습니다. 잠시 후 다시 시도해주세요.' 
      });
    } else {
      // For all other errors, send a generic 500
      res.status(500).json({ error: '문제 묶음을 생성하는 데 실패했습니다. AI가 응답 형식을 지키지 않았을 수 있습니다. 잠시 후 다시 시도해주세요.' });
    }
  }
});

// POST /api/explain 엔드포인트
app.post('/api/explain', async (req, res) => {
    const { problem } = req.body;

    if (!problem) {
        return res.status(400).json({ error: 'Problem data is required.' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const prompt = `Provide a detailed explanation for the following math problem: "${problem}".`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const explanation = response.text();
        
        res.json({ explanation });

    } catch (error) {
        console.error('Error generating explanation with Google API:', error);
        
        // Check if this is a rate limit error (status 429)
        if (error.status === 429) {
          res.status(429).json({ 
            error: '현재 많은 사용자가 몰려 답변 생성이 지연되고 있습니다. 잠시 후 다시 시도해주세요.' 
          });
        } else {
          // For all other errors, send a generic 500
          res.status(500).json({ error: '해설을 생성하는 데 실패했습니다. 다시 시도해주세요.' });
        }
    }
});

// Vercel 환경에서는 app.listen()이 필요 없습니다.
// module.exports를 통해 express 앱을 내보냅니다.
export default app;
