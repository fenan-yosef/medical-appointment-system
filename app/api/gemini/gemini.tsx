// This file should be a Next.js API route, not a React component.
// Rename to gemini.ts (not .tsx) and move to /pages/api/gemini.ts or /app/api/gemini/route.ts for Next.js 13+ app router.
// Here is the TypeScript version for an API route:

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body.prompt;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Gemini error:", error);
    return NextResponse.json({ error: "Gemini API call failed" }, { status: 500 });
  }
}