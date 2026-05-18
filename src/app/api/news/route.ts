import { NextResponse } from "next/server";

export const revalidate = 3600; // Cache and revalidate every hour

export async function GET() {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "News API key not configured." }, { status: 500 });
    }

    // Fetching India-centric, exam-relevant news
    // Using everything endpoint because top-headlines often returns 0 on free tier
    const url = `https://newsapi.org/v2/everything?q=technology OR education OR india&language=en&sortBy=publishedAt&apiKey=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to fetch from NewsAPI");
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("News API Error:", error.message);
    return NextResponse.json({ error: "Failed to fetch news headers." }, { status: 500 });
  }
}
