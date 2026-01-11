// src/geminiService.ts
import type { Selection } from "./App";

const API_BASE_URL = '';

export interface Problem {
  question: string;
  options: string[];
  answer: string;
}

export async function generateProblem(selection: Selection): Promise<{ problem?: Problem; error?: string }> {
  if (!selection.school || !selection.grade || !selection.semester || !selection.unit) {
    return { error: '모든 학습 과정을 선택해야 문제를 생성할 수 있습니다.' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ selection }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error from server:", errorData.error);
      return { error: errorData.error || `서버 응답 오류: ${response.status}` };
    }

    const problem: Problem = await response.json();
    return { problem };
  } catch (error) {
    console.error("Error generating problem:", error);
    return { error: '문제 생성 중 예기치 않은 오류가 발생했습니다.' };
  }
}

export async function generateExplanationForHomework(problem: string): Promise<{ explanation?: string; error?: string }> {
  if (!problem.trim()) {
    return { error: '해설을 요청할 숙제 문제를 입력해주세요.' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/explain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ problem }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error from server:", errorData.error);
      return { error: errorData.error || `서버 응답 오류: ${response.status}` };
    }

    const data: { explanation: string } = await response.json();
    return { explanation: data.explanation };
  } catch (error) {
    console.error("Error generating explanation for homework:", error);
    return { error: '숙제 해설 생성 중 예기치 않은 오류가 발생했습니다.' };
  }
}

