import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Blacklist of distracting terms
const BLACKLIST = [
  "game", "gaming", "play", "netflix", "prime", "hotstar", "facebook", "fb",
  "twitter", "x.com", "instagram", "insta", "tiktok", "porn", "reddit",
  "youtube", "anime", "movies", "movie", "shop", "shopping", "amazon",
  "flipkart", "myntra", "meesho", "pinterest", "snapchat", "games"
];

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const contentTitle = searchParams.get("title"); // If we want to fetch the full content for Reader Mode

    if (!query && !contentTitle) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // 1. Search Query Restrictive Check
    if (query) {
      const lowerQuery = query.toLowerCase();
      const hasBlockedWord = BLACKLIST.some(word => lowerQuery.includes(word));

      if (hasBlockedWord) {
        return NextResponse.json({ 
          blocked: true, 
          reason: `Infraction! The query "${query}" contains restricted non-study terms. Distraction Protocol Engaged.`
        }, { status: 403 });
      }

      // 2. Fetch from Wikipedia search API
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json`;
      const res = await fetch(searchUrl);
      const data = await res.json();

      if (!res.ok) {
        throw new Error("Wikipedia API error");
      }

      const results = data.query?.search?.map((item: any) => ({
        title: item.title,
        snippet: item.snippet.replace(/<\/?[^>]+(>|$)/g, ""), // Strip HTML tags
        pageid: item.pageid,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`
      })) || [];

      return NextResponse.json({ results });
    }

    // 3. Reader Mode Content Fetching (Wikipedia Summary/Extract)
    if (contentTitle) {
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(contentTitle)}`;
      const res = await fetch(summaryUrl);
      const data = await res.json();

      if (!res.ok) {
        throw new Error("Failed to fetch page content");
      }

      return NextResponse.json({
        title: data.title,
        extract: data.extract,
        description: data.description,
        thumbnail: data.thumbnail?.source || null,
        originalimage: data.originalimage?.source || null,
        url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(contentTitle)}`
      });
    }

  } catch (error) {
    console.error("Study Search API Error:", error);
    return NextResponse.json({ error: "Failed to fetch educational search results" }, { status: 500 });
  }
}
