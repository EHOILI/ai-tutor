// src/geminiService.ts
import type { Selection } from "./App";

const API_BASE_URL = '';

export interface Problem {
  question: string;
  options: string[];
  answer: string;
}

export async function generateProblem(selection: Selection): Promise<Problem | null> {
  if (!selection.school || !selection.grade || !selection.semester || !selection.unit) {
    return null;
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
      throw new Error(`Server responded with ${response.status}`);
    }

    const problem: Problem = await response.json();
    return problem;
  } catch (error) {
    console.error("Error generating problem:", error);
    return null;
  }
}

export async function generateExplanationForHomework(problem: string): Promise<string | null> {
  if (!problem.trim()) {
    return null;
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
      throw new Error(`Server responded with ${response.status}`);
    }

    const data: { explanation: string } = await response.json();
    return data.explanation;
  } catch (error) {
    console.error("Error generating explanation for homework:", error);
    return null;
  }
}

