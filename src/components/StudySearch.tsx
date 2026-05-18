"use client";

import { useState } from "react";
import { Search, ShieldAlert, BookOpen, ExternalLink, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleLogo } from "@/components/Icons";

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

interface ReaderContent {
  title: string;
  extract: string;
  description?: string;
  thumbnail?: string;
  originalimage?: string;
  url: string;
}

export default function StudySearch({ onDistractionTriggered }: { onDistractionTriggered: (reason: string) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Reader Mode state
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [readerContent, setReaderContent] = useState<ReaderContent | null>(null);
  const [loadingReader, setLoadingReader] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResults([]);
    setSelectedTitle(null);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      
      if (res.status === 403) {
        const data = await res.json();
        // Distraction protocol breached!
        onDistractionTriggered(data.reason || "Search Query Blacklist Breach.");
        setQuery("");
        setLoading(false);
        return;
      }

      if (!res.ok) throw new Error("Search failed");

      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReader = async (title: string) => {
    setSelectedTitle(title);
    setLoadingReader(true);
    setReaderContent(null);

    try {
      const res = await fetch(`/api/search?title=${encodeURIComponent(title)}`);
      if (!res.ok) throw new Error("Failed to load reader mode");
      const data = await res.json();
      setReaderContent(data);
    } catch (err) {
      console.error("Failed to load reader mode", err);
    } finally {
      setLoadingReader(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-obsidian-900)] text-white p-4">
      
      {/* Search Header */}
      <div className="flex items-center justify-between shrink-0 mb-6 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <GoogleLogo className="w-6 h-6" />
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">Google Study Search</h3>
            <p className="text-[10px] text-gray-500">Filtered educational gateway. Distractions will trigger protocol alarm.</p>
          </div>
        </div>
      </div>

      {/* Main split display: Search list or Reader Mode */}
      <div className="flex-1 flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          {!selectedTitle ? (
            /* Search View */
            <motion.div 
              key="search-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col h-full min-h-0"
            >
              <form onSubmit={handleSearch} className="flex gap-3 mb-6 shrink-0 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Search size={16} className="text-gray-500" />
                </div>
                <input 
                  type="text" 
                  placeholder="Search History, Polity, Geography..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="flex-1 bg-[var(--color-obsidian-800)] text-sm text-white pl-12 pr-4 py-3.5 rounded-full border-2 border-white/10 focus:outline-none focus:border-[var(--color-gold-500)]/50 focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all"
                />
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-[var(--color-gold-600)] hover:bg-[var(--color-gold-500)] text-obsidian-900 px-8 py-3.5 rounded-full font-bold uppercase tracking-wider text-xs flex items-center justify-center transition disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                </button>
              </form>

              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 pr-2">
                {loading && (
                  <div className="text-xs text-gray-500 text-center my-auto flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--color-gold-500)]" />
                    Filtering internet database for secure resources...
                  </div>
                )}

                {!loading && results.length === 0 && (
                  <div className="text-xs text-gray-500 text-center my-auto px-6 italic flex flex-col items-center gap-2">
                    <BookOpen className="w-8 h-8 text-gray-600" />
                    "Type a query to search secure educational articles. Blocked/distracting queries will trigger immediate coin penalties."
                  </div>
                )}

                {!loading && results.map((item, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={idx} 
                    className="glass-panel p-5 rounded-2xl border-2 border-white/5 bg-[var(--color-obsidian-800)]/40 flex flex-col gap-2 hover:border-[var(--color-gold-500)]/30 hover:shadow-[0_0_20px_rgba(0,240,255,0.05)] hover:-translate-y-0.5 transition-all duration-300 group"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="text-xs font-bold text-[var(--color-gold-400)] group-hover:underline cursor-pointer" onClick={() => handleOpenReader(item.title)}>
                        {item.title}
                      </h4>
                      <span className="text-[9px] bg-white/5 border border-white/10 text-gray-400 px-2 py-0.5 rounded uppercase font-bold flex items-center gap-1 shrink-0">
                        Wikipedia Secure
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-normal line-clamp-2">{item.snippet}</p>
                    
                    <div className="flex gap-3 mt-1.5">
                      <button 
                        onClick={() => handleOpenReader(item.title)}
                        className="text-[10px] text-[var(--color-gold-400)] font-bold hover:underline flex items-center gap-1"
                      >
                        <BookOpen size={12} /> Open in Reader Mode
                      </button>
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[10px] text-gray-500 hover:text-white transition flex items-center gap-1"
                      >
                        <ExternalLink size={10} /> External Link
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            /* Reader Mode View */
            <motion.div 
              key="reader-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col min-h-0 bg-[var(--color-obsidian-850)] rounded-xl border border-white/10 overflow-hidden"
            >
              
              {/* Reader Header */}
              <div className="bg-[var(--color-obsidian-800)] p-3 border-b border-white/10 flex items-center justify-between shrink-0">
                <span className="text-[10px] text-[var(--color-gold-500)] font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                  <BookOpen size={12} /> Reader Mode (Encrypted Distraction-Free)
                </span>
                <button 
                  onClick={() => setSelectedTitle(null)}
                  className="text-gray-400 hover:text-white transition p-1 bg-white/5 rounded"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Reader Content Scroll area */}
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar pr-4">
                {loadingReader ? (
                  <div className="text-xs text-gray-500 text-center my-auto py-12 flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--color-gold-500)]" />
                    De-formatting and scanning academic pages...
                  </div>
                ) : readerContent ? (
                  <motion.article 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col gap-4 text-gray-300"
                  >
                    <header className="border-b border-white/5 pb-4">
                      <h1 className="text-lg font-bold text-white leading-tight">{readerContent.title}</h1>
                      {readerContent.description && (
                        <p className="text-xs text-[var(--color-gold-500)] italic mt-1">{readerContent.description}</p>
                      )}
                    </header>

                    {readerContent.originalimage && (
                      <div className="w-full max-h-48 overflow-hidden rounded-lg border border-white/5 mb-2 shrink-0">
                        <img src={readerContent.originalimage} alt={readerContent.title} className="w-full h-full object-cover" />
                      </div>
                    )}

                    <p className="text-xs leading-relaxed text-justify whitespace-pre-line text-gray-200">
                      {readerContent.extract}
                    </p>

                    <footer className="border-t border-white/5 pt-4 mt-4 flex justify-between items-center text-[9px] text-gray-500">
                      <span>Cleaned by PrepGuardian Gateway</span>
                      <a href={readerContent.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                        View original <ExternalLink size={8} />
                      </a>
                    </footer>
                  </motion.article>
                ) : (
                  <div className="text-xs text-red-400 text-center py-12">
                    Failed to load content for this article.
                  </div>
                )}
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
