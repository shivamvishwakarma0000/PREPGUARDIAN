import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({
  apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_BASE_URL || undefined,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topic } = await req.json();

    if (!topic || typeof topic !== "string" || topic.trim() === "") {
      return NextResponse.json({ error: "Invalid topic requested." }, { status: 400 });
    }

    const prompt = `
You are a strict, highly accurate academic test generator.
Generate exactly 10 multiple-choice questions on the topic: "${topic}".
The difficulty should be appropriate for competitive exams (UPSC/SSC CGL level).

You MUST return the output ONLY as a raw JSON array. DO NOT wrap the output in markdown code blocks. DO NOT include any conversational text.

The JSON array must contain exactly 10 objects. Each object must have this exact structure:
{
  "question": "The text of the question?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0 // The zero-based index of the correct option
}
`;

    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL || "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2, // low temperature for structured output
      max_tokens: 1500,
    });

    const reply = completion.choices[0]?.message?.content || "";
    
    // Clean up potential markdown formatting if the model disobeys
    const jsonString = reply.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const questions = JSON.parse(jsonString);

    if (!Array.isArray(questions) || questions.length !== 10) {
      throw new Error("Invalid output format from AI.");
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Test Generation API Error:", error);
    return NextResponse.json({ error: "Failed to generate mock test." }, { status: 500 });
  }
}
