// src/geminiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Selection } from "./App";

const API_KEY = "AIzaSyDQEewmxcocA1pTY7CwJ4xHvx7HdGXcJGE";
const genAI = new GoogleGenerativeAI(API_KEY);

export interface Problem {
  question: string;
  answer: string;
  explanation: string;
}

export async function generateProblem(selection: Selection): Promise<Problem | null> {
  if (!selection.school || !selection.grade || !selection.semester || !selection.unit) {
    return null;
  }

  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const prompt = `
    You are a helpful and engaging AI tutor for a South Korean student.
    The student has selected the following curriculum:
    - School Level: ${selection.school}
    - Grade: ${selection.grade}
    - Semester: ${selection.semester}
    - Unit: ${selection.unit}
    ${selection.subUnit ? `- Sub-unit: ${selection.subUnit}` : ''}

    Your task is to generate a single, appropriate math problem based on this unit${selection.subUnit ? ' and sub-unit' : ''}.

    The output MUST be a JSON object with the following structure:
    {
      "question": "The text of the math problem in Korean. Include appropriate formatting like line breaks for readability.",
      "answer": "The numerical or short-form answer. Just the answer itself.",
      "explanation": "A clear, step-by-step explanation of how to solve the problem in Korean."
    }

    Do not include any text, markdown formatting, or code block syntax outside of the JSON object itself.
    The problem should be a typical question that a student of this level would encounter in their textbook or exam.

    IMPORTANT: The mathematical expressions in the "question" and "explanation" must be written in a way that is easy for a young student to understand. Use simple text-based notation (e.g., use 'x * 2' instead of '2x', '6 / x' instead of fractions). Do not use LaTeX or other complex mathematical formatting like '$$...$$'.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    
    // Clean the text in case the model wraps it in markdown ```json ... ```
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsed: Problem = JSON.parse(cleanedText);
    return parsed;
  } catch (error) {
    console.error("Error generating problem:", error);
    return null;
  }
}

export async function generateExplanationForHomework(homeworkProblem: string): Promise<string | null> {
  if (!homeworkProblem.trim()) {
    return null;
  }

  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const prompt = `
    You are a helpful and engaging AI tutor for a South Korean student.
    The student has provided a homework problem and needs a detailed, step-by-step explanation to understand how to solve it.

    Here is the homework problem:
    "${homeworkProblem}"

    Your task is to provide a clear and comprehensive step-by-step explanation of how to solve this problem in Korean.
    The explanation should be easy to follow for a student.

    The output MUST be a JSON object with the following structure:
    {
      "explanation": "A clear, step-by-step explanation of how to solve the homework problem in Korean."
    }

    Do not include any text, markdown formatting, or code block syntax outside of the JSON object itself.

    IMPORTANT: The mathematical expressions in the "explanation" must be written in a way that is easy for a student to understand. Use simple text-based notation (e.g., use 'x * 2' instead of '2x', '6 / x' instead of fractions). Do not use LaTeX or other complex mathematical formatting like '$$...$$'.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    
    // Clean the text in case the model wraps it in markdown ```json ... ```
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsed: { explanation: string } = JSON.parse(cleanedText);
    return parsed.explanation;
  } catch (error) {
    console.error("Error generating explanation for homework:", error);
    return null;
  }
}
