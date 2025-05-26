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
    const image = body.image; // boolean: true to generate image

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (image) {
      // Image generation
      const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash-preview-image-generation" });
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        // No config property here
      });
      const response = await result.response;
      const parts = response.candidates?.[0]?.content?.parts || [];
      let text = "";
      let imageBase64 = "";
      for (const part of parts) {
        if (part.text) text += part.text;
        if (part.inlineData) imageBase64 = part.inlineData.data;
      }
      return NextResponse.json({ text, imageBase64 });
    } else {
      // Text only
      const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ]
      });
      const response = await result.response;
      const text = response.text();
      return NextResponse.json({ text });
    }
  } catch (error) {
    console.error("Gemini error:", error);
    return NextResponse.json({ error: "Gemini API call failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Listing models is not supported by the GoogleGenerativeAI SDK."
  });
}