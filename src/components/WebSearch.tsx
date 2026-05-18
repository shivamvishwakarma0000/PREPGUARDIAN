"use client";

import { useState } from "react";
import { Search, Loader2, ExternalLink, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleLogo } from "@/components/Icons";

interface WebSearchResult {
  title: string;
  snippet: string;
  link: string;
  displayLink: string;
}

export default function WebSearch({ onDistractionTriggered }: { onDistractionTriggered: (reason: string) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WebSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackActive, setFallbackActive] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setFallbackActive(false);
    setHasSearched(true);
    setResults([]);

    try {
      const res = await fetch(`/api/websearch?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (data.blocked) {
         onDistractionTriggered(data.reason);
         setError("DISTRACTION DETECTED: This search query violated your focus parameters. Strike recorded.");
      } else if (data.error && !data.results) {
         setError(data.error);
      } else {
         if (data.fallback) {
           setFallbackActive(true);
         }
         setResults(data.results || []);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to global search network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] text-white overflow-hidden relative">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay pointer-events-none z-0"></div>

      <AnimatePresence mode="wait">
        {!hasSearched ? (
          // Initial Centered View (Google Homepage style)
          <motion.div 
            key="home"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center justify-center h-full w-full max-w-2xl mx-auto z-10 px-6"
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4 mb-8"
            >
              <GoogleLogo className="w-16 h-16 sm:w-24 sm:h-24 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
              <span className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-white">Search</span>
            </motion.div>
            
            <form onSubmit={handleSearch} className="w-full flex flex-col items-center">
              <div className="relative w-full group mb-8">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Search size={20} className="text-gray-400 group-hover:text-[var(--color-gold-500)] transition-colors" />
                </div>
                <input 
                  type="text" 
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="w-full bg-[#121214] text-lg text-white pl-16 pr-6 py-4 rounded-full border border-white/10 focus:outline-none focus:border-[var(--color-gold-500)]/70 hover:border-white/30 focus:shadow-[0_0_30px_rgba(0,240,255,0.15)] transition-all duration-300"
                  autoFocus
                />
              </div>

              <div className="flex gap-4">
                <button 
                  type="submit" 
                  disabled={!query.trim() || loading}
                  className="bg-[#121214] hover:bg-white/10 border border-transparent hover:border-white/20 text-sm text-gray-300 px-6 py-2.5 rounded-lg transition-all duration-300 disabled:opacity-50 font-medium tracking-wide"
                >
                  Global Search
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setQuery(query + " syllabus");
                    handleSearch();
                  }}
                  disabled={!query.trim() || loading}
                  className="bg-[#121214] hover:bg-white/10 border border-transparent hover:border-white/20 text-sm text-gray-300 px-6 py-2.5 rounded-lg transition-all duration-300 disabled:opacity-50 font-medium tracking-wide"
                >
                  Strict Syllabus
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          // Search Results View
          <motion.div 
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-full z-10 p-6"
          >
            {/* Top Bar */}
            <div className="flex items-center gap-6 mb-8 shrink-0">
              <GoogleLogo 
                className="w-8 h-8 cursor-pointer hover:opacity-80 transition" 
                onClick={() => { setHasSearched(false); setQuery(""); setResults([]); setError(null); }} 
              />
              <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Search size={16} className="text-[var(--color-gold-500)]" />
                </div>
                <input 
                  type="text" 
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="w-full bg-[#121214] text-sm text-white pl-12 pr-4 py-3 rounded-full border border-[var(--color-gold-500)]/30 focus:outline-none focus:border-[var(--color-gold-500)]/70 focus:shadow-[0_0_20px_rgba(0,240,255,0.1)] transition-all duration-300"
                />
              </form>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
              {fallbackActive && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-6 max-w-2xl text-xs text-yellow-400 flex items-start gap-3 shadow-[0_0_15px_rgba(251,191,36,0.05)]">
                  <ShieldAlert className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold uppercase tracking-wider block mb-0.5">Google API Fallback Mode</span>
                    <span>Your Google API project is missing Custom Search JSON API activation. Displaying encrypted Wikipedia academic nodes instead. Please enable it in Google Cloud Console.</span>
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--color-gold-500)]" />
                  <span className="text-sm font-mono tracking-widest uppercase">Fetching encrypted nodes...</span>
                </div>
              )}

              {error && (
                <div className="bg-red-950/30 border border-red-500/50 rounded-2xl p-6 text-center max-w-2xl mx-auto flex flex-col items-center mt-10 shadow-[0_0_30px_rgba(255,0,0,0.1)]">
                  <ShieldAlert className="w-12 h-12 text-red-500 mb-4 animate-pulse" />
                  <p className="text-red-400 font-bold uppercase tracking-wider text-sm">{error}</p>
                </div>
              )}

              {!loading && !error && results.length === 0 && (
                <div className="text-gray-500 text-sm font-mono px-4 mt-8">
                  Your search - <strong className="text-gray-300">{query}</strong> - did not match any documents in the secure perimeter.
                </div>
              )}

              {!loading && !error && results.length > 0 && (
                <div className="flex flex-col gap-8 max-w-3xl pb-10">
                  <p className="text-[11px] text-gray-500 font-mono tracking-wider mb-2">
                    About {results.length} secure {fallbackActive ? "fallback Wikipedia" : "Google"} results
                  </p>
                  
                  {results.map((item, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={idx} 
                      className="flex flex-col gap-1.5 group"
                    >
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono truncate">
                        <span>{item.displayLink}</span>
                      </div>
                      <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-lg font-medium text-[var(--color-gold-400)] group-hover:text-[var(--color-gold-300)] group-hover:underline transition-colors flex items-center gap-2"
                      >
                        {item.title} <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                      <p className="text-sm text-gray-300 leading-relaxed mt-1" dangerouslySetInnerHTML={{ __html: item.snippet }}></p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
