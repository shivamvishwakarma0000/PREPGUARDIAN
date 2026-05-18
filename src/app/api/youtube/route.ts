import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "YouTube API key not configured." }, { status: 500 });
    }

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=8&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || "Failed to fetch from YouTube API");
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("YouTube API Error:", error.message);
    return NextResponse.json({ error: "Failed to fetch YouTube videos." }, { status: 500 });
  }
}
