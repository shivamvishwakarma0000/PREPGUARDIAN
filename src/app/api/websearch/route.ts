import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Blacklist of distracting terms
const BLACKLIST = [
  "game", "gaming", "play", "netflix", "prime", "hotstar", "facebook", "fb",
  "twitter", "x.com", "instagram", "insta", "tiktok", "porn", "reddit",
  "youtube", "anime", "movies", "movie", "shop", "shopping", "amazon",
  "flipkart", "myntra", "meesho", "pinterest", "snapchat", "games", "xxx"
];

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // 1. Search Query Restrictive Check
    const lowerQuery = query.toLowerCase();
    const hasBlockedWord = BLACKLIST.some(word => lowerQuery.includes(word));

    if (hasBlockedWord) {
      return NextResponse.json({ 
        blocked: true, 
        reason: `Infraction! The query "${query}" contains restricted non-study terms. Distraction Protocol Engaged.`
      }, { status: 403 });
    }

    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!apiKey || !engineId) {
      // Fallback for development if keys are missing
      return NextResponse.json({
        mock: true,
        results: [
          {
            title: `Google API Keys Missing for "${query}"`,
            snippet: "Please add GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID to your .env.local file to fetch real Google results.",
            link: "https://developers.google.com/custom-search/v1/overview"
          }
        ]
      });
    }

    // 2. Fetch from Google Custom Search API
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${engineId}&q=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl);
    const data = await res.json();

    if (!res.ok) {
      console.warn("Google Custom Search API failed. Falling back to DuckDuckGo:", data.error?.message);
      
      try {
        const ddgRes = await fetch("https://lite.duckduckgo.com/lite/", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: `q=${encodeURIComponent(query)}`
        });
        if (ddgRes.ok) {
          const html = await ddgRes.text();
          const results: any[] = [];
          const parts = html.split(/<td valign="top">\s*\d+\.&nbsp;\s*<\/td>/);
          for (let i = 1; i < parts.length; i++) {
            const part = parts[i];
            const linkMatch = part.match(/<a rel="nofollow" href="([^"]+)" class='result-link'>([\s\S]*?)<\/a>/);
            if (!linkMatch) continue;
            
            const link = linkMatch[1];
            const title = linkMatch[2].replace(/<[^>]+>/g, "").trim();
            
            const snippetMatch = part.match(/<td class='result-snippet'>([\s\S]*?)<\/td>/);
            const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, "").trim() : "";
            
            const displayMatch = part.match(/<span class='link-text'>([\s\S]*?)<\/span>/);
            const displayLink = displayMatch ? displayMatch[1].replace(/<[^>]+>/g, "").trim() : new URL(link).hostname;
            
            results.push({ title, snippet, link, displayLink });
          }
          if (results.length > 0) {
            return NextResponse.json({ results }); // Successful web results without key!
          }
        }
      } catch (ddgErr) {
        console.error("DuckDuckGo fallback failed:", ddgErr);
      }

      // Wikipedia fallback as tertiary option
      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
      const wikiRes = await fetch(wikiUrl);
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        const results = wikiData.query?.search?.map((item: any) => ({
          title: item.title,
          snippet: item.snippet.replace(/<span class="searchmatch">/g, '').replace(/<\/span>/g, ''),
          link: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
          displayLink: "en.wikipedia.org"
        })) || [];
        return NextResponse.json({ 
          results, 
          fallback: true,
          fallbackReason: "Google API project lacks Custom Search JSON API access. Falling back to Wikipedia." 
        });
      }
      throw new Error(data.error?.message || "Google API error and secondary fallbacks failed");
    }

    const results = data.items?.map((item: any) => ({
      title: item.title,
      snippet: item.snippet,
      link: item.link,
      displayLink: item.displayLink
    })) || [];

    return NextResponse.json({ results });

  } catch (error: any) {
    console.error("Web Search API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch web search results" }, { status: 500 });
  }
}
