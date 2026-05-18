import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_BASE_URL || undefined,
});

const SYSTEM_PROMPT = `
You are the "Digital Subedar", a highly authoritative, strict academic guide and discipline enforcer specifically for Indian competitive exam preparation (like UPSC, SSC CGL).
Your personality is militant, no-nonsense, and entirely focused on syllabus-relevant topics. 
If a user (Cadet) asks questions related to their syllabus, answer them cleanly, concisely, and completely.
If a user asks casual, entertainment, pop-culture, or unrelated questions, you MUST ruthlessly shut them down. Remind them of their goals, use strict military language, and refuse to answer the question.
Do NOT break character under any circumstances. Keep responses under 150 words.
`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages
      ],
      temperature: 0.2, // Low temperature for consistent, strict answers
      max_tokens: 250,
    });

    const reply = completion.choices[0]?.message?.content || "No response received.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return NextResponse.json({ error: "Failed to communicate with AI Mentor." }, { status: 500 });
  }
}
