
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

// POST /api/generate 엔드포인트
// Vercel은 파일 기반 라우팅을 사용하므로, 이 파일은 /api/server 로 접근됩니다.
// vercel.json의 rewrite 설정에 따라 /api/generate 요청이 이리로 전달됩니다.
app.post('/api/generate', async (req, res) => {
  const { selection } = req.body;

  if (!selection) {
    return res.status(400).json({ error: 'Selection data is required.' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const prompt = `Create a multiple-choice math problem based on the following topic: ${selection.unit} - ${selection.subUnit || ''}. The problem should include a question, four options (A, B, C, D), and the correct answer. The output must be a JSON object with keys "question", "options" (an array of strings), and "answer".`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/```json([\s\S]*?)```/);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : text.trim();
    
    const problem = JSON.parse(jsonString);
    res.json(problem);

  } catch (error) {
    console.error('Error generating problem with Google API:', error);
    res.status(500).json({ error: 'Failed to generate problem.' });
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
        res.status(500).json({ error: 'Failed to generate explanation.' });
    }
});

// Vercel 환경에서는 app.listen()이 필요 없습니다.
// module.exports를 통해 express 앱을 내보냅니다.
export default app;
