"use client";

import { useSession } from "next-auth/react";
import StudySession from "@/components/StudySession";
import QuestionStopwatch from "@/components/QuestionStopwatch";
import MockTestHub from "@/components/MockTestHub";
import StudySearch from "@/components/StudySearch";
import WebSearch from "@/components/WebSearch";
import SettingsModal from "@/components/SettingsModal";
import { useGlobalKiosk } from "@/hooks/useGlobalKiosk";
import { useState, useEffect, useRef } from "react";
import { 
  Send, LogOut, Flame, Shield, LayoutDashboard, Search, X, Lock, Menu,
  AlertTriangle, Compass, Coins, Award, Clock, BookOpen, User, BookOpenCheck, ShieldAlert, Activity 
} from "lucide-react";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleLogo, YoutubeLogo, ChromeLogo } from "@/components/Icons";

export default function Dashboard() {
  const { data: session } = useSession();
  
  // Profile & Gamification state
  const [profile, setProfile] = useState<any>(null);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState<number>(0);
  
  // Active Navigation Section
  const [activeSection, setActiveSection] = useState("focus");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [testHistory, setTestHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // AI Chat State
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // News State
  const [news, setNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  // YouTube State
  const [youtubeSearch, setYoutubeSearch] = useState("");
  const [videoId, setVideoId] = useState("jfKfPfyJRdk"); // default lofi
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/profile?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      setProfile(data);
      
      if (data.lockoutUntil) {
        const timeDiff = Math.max(0, Math.floor((new Date(data.lockoutUntil).getTime() - new Date().getTime()) / 1000));
        setLockoutTimeLeft(timeDiff);
      } else {
        setLockoutTimeLeft(0);
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };

  const kiosk = useGlobalKiosk(fetchProfile, fetchProfile);

  useEffect(() => {
    fetchProfile();
    
    // Fetch News
    const fetchNews = async () => {
      try {
        const res = await fetch("/api/news");
        const data = await res.json();
        if (data.articles) {
          setNews(data.articles.slice(0, 10));
        }
      } catch (err) {
        console.error("Failed to fetch news", err);
      } finally {
        setNewsLoading(false);
      }
    };
    fetchNews();

    // Fetch Test History
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/test-history");
        const data = await res.json();
        if (data.history) {
          setTestHistory(data.history);
        }
      } catch (err) {
        console.error("Failed to fetch test history", err);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTimeLeft <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          fetchProfile(); // refresh profile once lockout expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimeLeft]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      console.error("Failed to get AI response", err);
    }
  };

  const handleYoutubeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeSearch.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/youtube?q=${encodeURIComponent(youtubeSearch)}`);
      const data = await res.json();
      if (data.items) {
        setSearchResults(data.items);
      }
    } catch (err) {
      console.error("YouTube search failed", err);
    }
    setIsSearching(false);
  };

  // Called when study search triggers distraction (blacklist query matched)
  const triggerDistractionPenalty = async (reason: string) => {
    try {
      await fetch("/api/strikes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason })
      });
      
      // Play alarm sound
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
        oscillator.connect(audioCtx.destination);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 1200);
      } catch (e) {}

      // Refresh profile
      fetchProfile();
    } catch (err) {
      console.error("Failed to trigger distraction penalty", err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatLockoutTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const parseBadges = (badgesStr: string) => {
    if (!badgesStr) return [];
    return badgesStr.split(",").filter(Boolean);
  };

  // Navigation Items Sidebar config
  const navItems = [
    { id: "focus", label: "Focus Command", icon: Flame, desc: "Locked-in study sessions" },
    { id: "lectures", label: "Lecture Hub", icon: YoutubeLogo, desc: "Secure video workspace" },
    { id: "web", label: "Google Search", icon: GoogleLogo, desc: "Native Google Search" },
    { id: "search", label: "Global Search", icon: ChromeLogo, desc: "Secure Reader Mode" },
    { id: "tests", label: "Mock Practice", icon: BookOpenCheck, desc: "AI syllabus assessments" },
    { id: "rewards", label: "Rewards & History", icon: Award, desc: "Badges & past test records" },
    { id: "ai", label: "Tactical AI", icon: Shield, desc: "Chat with Digital Subedar" },
    { id: "intel", label: "Intel Feed", icon: Search, desc: "Encrypted current affairs" }
  ];

  // 1. Lockout Screen
  if (lockoutTimeLeft > 0) {
    return (
      <div className="fixed inset-0 z-[200] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950 via-neutral-950 to-black flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay"></div>
        <div className="max-w-xl bg-black/60 border border-red-500/30 p-12 rounded-3xl backdrop-blur-xl flex flex-col items-center shadow-[0_0_100px_rgba(239,68,68,0.2)] animate-pulse">
          <Lock className="text-red-500 w-20 h-20 mb-6" />
          <h1 className="text-4xl font-extrabold text-white uppercase tracking-widest mb-2 text-glow-red">
            Tactical Lockout Engaged
          </h1>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 flex items-center gap-2 mb-6">
            <AlertTriangle className="text-red-400 w-4 h-4 shrink-0" />
            <span className="text-xs text-red-400 font-bold uppercase tracking-wider">Coins Exhausted (0 Coins Left)</span>
          </div>
          
          <p className="text-gray-300 leading-relaxed text-sm mb-10">
            Cadet, your discipline has failed. All tactical networks, educational hubs, and Subedar support are severed for 2 hours. Utilize this time to review your goals.
          </p>

          <div className="text-6xl font-mono font-bold text-red-500 tracking-widest bg-red-950/20 border border-red-500/20 px-8 py-4 rounded-2xl shadow-inner mb-8">
            {formatLockoutTime(lockoutTimeLeft)}
          </div>

          <p className="text-[10px] text-gray-500 uppercase tracking-widest">
            Portal will auto-decrypt once countdown completes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#11161a] via-[#080b0e] to-black overflow-hidden text-white font-sans p-4 max-md:p-2 gap-4 max-md:gap-0 relative">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay pointer-events-none z-0"></div>
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* 1. Left Vertical Navigation Sidebar (Floating) */}
      <aside className={`w-72 bg-[#0a0a0c]/90 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col justify-between shrink-0 z-50 shadow-2xl overflow-hidden transition-all duration-300 max-md:fixed max-md:top-4 max-md:bottom-4 max-md:left-4 ${isSidebarOpen ? 'translate-x-0' : 'max-md:-translate-x-[calc(100%+2rem)]'}`}>
        <div className="flex flex-col gap-6 p-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
          
          {/* Logo & Platform Info */}
          <div className="flex items-center justify-between border-b border-white/5 pb-6 shrink-0">
            <div className="flex items-center gap-3">
              <Shield className="text-[var(--color-gold-500)] w-8 h-8 drop-shadow-[0_0_8px_rgba(225,29,72,0.4)]" />
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-widest text-white leading-none mb-1">PrepGuardian</h2>
                <span className="text-[9px] text-[var(--color-gold-500)] font-bold tracking-wider uppercase bg-[var(--color-gold-900)]/50 px-2 py-0.5 rounded border border-[var(--color-gold-500)]/15">
                  SUBEDAR NETWORK
                </span>
              </div>
            </div>
            {/* Mobile Close Button */}
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition">
              <X size={18} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              const isCustomSvg = item.id === "search" || item.id === "lectures" || item.id === "web";
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 text-left group border ${isActive ? 'bg-[var(--color-gold-600)]/10 border-[var(--color-gold-500)]/50 text-white shadow-[0_0_20px_rgba(225,29,72,0.15)] translate-x-1' : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/10'}`}
                >
                  <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? (isCustomSvg ? '' : 'text-[var(--color-gold-500)]') : (isCustomSvg ? 'opacity-80 group-hover:opacity-100' : 'text-gray-500 group-hover:text-gray-300')}`} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold uppercase tracking-wider leading-tight">{item.label}</span>
                    <span className="text-[9px] text-gray-500 truncate leading-normal mt-0.5">{item.desc}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Actions & Sign Out (Bottom Sidebar) */}
        <div className="p-6 border-t border-white/10 bg-black/30 flex flex-col gap-4 shrink-0">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-3 text-left p-2 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition group w-full"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--color-gold-600)]/20 border-2 border-[var(--color-gold-500)]/50 flex items-center justify-center shrink-0 overflow-hidden shadow-[0_0_15px_rgba(225,29,72,0.2)]">
              {session?.user?.image || profile?.image ? (
                <img src={session?.user?.image || profile?.image} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={18} className="text-[var(--color-gold-400)]" />
              )}
            </div>
            <div className="min-w-0 flex flex-col flex-1">
              <span className="text-xs font-extrabold text-white truncate leading-tight group-hover:text-[var(--color-gold-400)] transition-colors">{session?.user?.name || "Cadet"}</span>
              <span className="text-[9px] text-[var(--color-gold-500)] font-mono uppercase tracking-wider mt-0.5">Tactical Settings ⚙</span>
            </div>
          </button>
          <button 
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl transition text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300 shadow-sm"
          >
            <LogOut size={14} /> Exit Station
          </button>
        </div>
      </aside>

      {/* 2. Main Workspace Container (Floating) */}
      <main className="flex-1 flex flex-col min-w-0 h-full bg-[#0a0a0c]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden z-20 max-md:rounded-none max-md:border-none">
        
        {/* 2.1 Pinned Statistics Bar (Floating Top Header) */}
        <header className="h-20 border-b border-white/10 bg-black/20 flex items-center justify-between px-8 max-md:px-4 shrink-0 z-30 gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="md:hidden text-gray-400 hover:text-white p-1.5 hover:bg-white/5 rounded-lg transition mr-1 shrink-0"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-base max-md:text-xs font-extrabold uppercase tracking-widest text-white truncate max-w-[120px] sm:max-w-none">
              {navItems.find(n => n.id === activeSection)?.label}
            </h1>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold-500)] animate-ping shrink-0"></span>
          </div>

          {/* Gamified Stat Showcase Panels */}
          <div className="flex items-center gap-4 max-md:gap-1.5 shrink-0 overflow-x-auto scrollbar-none">
            
            {/* Top-Right Active Kiosk Timer */}
            {kiosk.isActive && !kiosk.isCompleted && (
              <div className="flex items-center gap-3 max-md:gap-1 bg-[var(--color-gold-600)]/10 border border-[var(--color-gold-500)]/30 px-4 py-1.5 max-md:px-2 rounded-xl shadow-[0_0_15px_rgba(251,191,36,0.2)] shrink-0">
                <Activity className="text-[var(--color-gold-500)] w-4 h-4 max-md:w-3.5 max-md:h-3.5 animate-pulse shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[8px] max-md:text-[6px] text-[var(--color-gold-400)] uppercase font-bold leading-none mb-1">Focus Target</span>
                  <span className="text-sm max-md:text-xs font-mono font-extrabold text-white leading-none tracking-widest text-glow-gold">
                    {Math.floor(kiosk.timeLeft / 3600).toString().padStart(2, '0')}:
                    {Math.floor((kiosk.timeLeft % 3600) / 60).toString().padStart(2, '0')}:
                    {(kiosk.timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            )}
            
            {/* Streak */}
            <div className="flex items-center gap-3 max-md:gap-1 bg-white/5 border border-white/10 px-3.5 py-1.5 max-md:px-2 rounded-xl shrink-0">
              <Flame className="text-orange-500 w-4 h-4 max-md:w-3.5 max-md:h-3.5 animate-pulse shrink-0" />
              <div className="flex flex-col">
                <span className="text-[8px] max-md:text-[6px] text-gray-500 uppercase font-bold leading-none mb-1">Active Streak</span>
                <span className="text-xs max-md:text-2xs font-mono font-bold text-white leading-none">{profile?.currentStreak || 0} Days</span>
              </div>
            </div>

            {/* Coins */}
            <div className="flex items-center gap-3 max-md:gap-1 bg-white/5 border border-white/10 px-3.5 py-1.5 max-md:px-2 rounded-xl shadow-sm shrink-0">
              <Coins className="text-[var(--color-gold-500)] w-4 h-4 max-md:w-3.5 max-md:h-3.5 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[8px] max-md:text-[6px] text-gray-500 uppercase font-bold leading-none mb-1">Credit Coins</span>
                <span className="text-xs max-md:text-2xs font-mono font-extrabold text-[var(--color-gold-400)] leading-none">{profile?.coins ?? 100} Coins</span>
              </div>
            </div>

            {/* Rank */}
            <div className="flex items-center gap-3 max-md:gap-1 bg-white/5 border border-white/10 px-3.5 py-1.5 max-md:px-2 rounded-xl shrink-0 max-sm:hidden">
              <Shield className="text-[var(--color-gold-500)] w-4 h-4 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[8px] text-gray-500 uppercase font-bold leading-none mb-1">Rank</span>
                <span className="text-xs font-mono font-bold text-[var(--color-gold-400)] leading-none">{profile?.rankTitle || "Cadet"} (Lvl {profile?.level || 1})</span>
              </div>
            </div>

            {/* Badges */}
            {profile?.badges && (
              <div className="flex items-center gap-2 border-l border-white/10 pl-4 h-6 shrink-0 max-sm:hidden">
                <Award className="text-yellow-500 w-4 h-4 shrink-0" />
                <div className="flex gap-1 overflow-x-auto scrollbar-none max-w-44">
                  {parseBadges(profile.badges).map((badge: string, i: number) => (
                    <span key={i} className="text-[8px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 shadow-sm leading-none">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* XP */}
            <div className="flex flex-col items-end border-l border-white/10 pl-4 h-6 justify-center shrink-0 max-sm:hidden">
               <span className="text-[8px] text-gray-500 uppercase font-bold leading-none mb-1">XP Points</span>
               <span className="text-xs font-mono font-bold text-[var(--color-gold-400)] leading-none">{profile?.xp || 0} XP</span>
            </div>

          </div>
        </header>

        {/* 2.2 Section-Wise Render Area (Fully isolated workspaces) */}
        <div className="flex-1 overflow-y-auto p-8 min-h-0 custom-scrollbar">
          <AnimatePresence mode="wait">
            {/* SECTION A: Focus Command */}
            {activeSection === "focus" && (
              <motion.div 
                key="focus"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="grid grid-cols-1 md:grid-cols-12 gap-8 md:h-full max-md:gap-6 pb-6"
              >
                {/* Kiosk Control */}
                <div className="col-span-1 md:col-span-7 glass-panel rounded-3xl border border-white/5 p-8 max-md:p-5 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#0e1317] to-black shadow-xl">
                  <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay"></div>
                  <div className="flex flex-col gap-2 shrink-0 border-b border-white/5 pb-4 z-10">
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">Tactical Kiosk Enforcer</h3>
                    <p className="text-xs text-gray-400">Start the Global Kiosk to securely lock your browser. You can navigate the portal freely, but egressing full-screen triggers a penalty.</p>
                  </div>
                  <div className="flex-1 flex items-center justify-center py-6 z-10">
                    <StudySession 
                      isActive={kiosk.isActive}
                      duration={kiosk.duration}
                      setDuration={kiosk.setDuration}
                      timeLeft={kiosk.timeLeft}
                      isCompleted={kiosk.isCompleted}
                      loadingComplete={kiosk.loadingComplete}
                      startSession={kiosk.startSession}
                      endSession={kiosk.endSession}
                      triggerDistractionProtocol={kiosk.triggerDistractionProtocol}
                      abortSessionSafely={kiosk.abortSessionSafely}
                    />
                  </div>
                </div>

                {/* Pinned Stopwatch */}
                <div className="col-span-1 md:col-span-5 glass-panel rounded-3xl border border-white/5 p-8 max-md:p-5 flex flex-col justify-between bg-gradient-to-br from-[#0e1317] to-black shadow-xl">
                  <div className="flex flex-col gap-2 shrink-0 border-b border-white/5 pb-4">
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">Question solver timer</h3>
                    <p className="text-xs text-gray-400">Evaluate speeds per problem. Log lap metrics to verify speed growth.</p>
                  </div>
                  <div className="flex-1 flex flex-col justify-center py-4">
                    <QuestionStopwatch />
                  </div>
                </div>
              </motion.div>
            )}

            {/* SECTION B: Lecture Hub */}
            {activeSection === "lectures" && (
              <motion.div 
                key="lectures"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="glass-panel rounded-3xl border border-white/5 overflow-hidden flex flex-col h-[650px] shadow-2xl"
              >
                {/* Hub Header with Search */}
                <div className="bg-[#0a0a0c] p-6 border-b border-white/10 flex items-center justify-between shrink-0 relative z-30">
                  <div className="flex items-center gap-3">
                    <YoutubeLogo className="w-6 h-6" />
                    <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Isolated Lecture Hub</h2>
                  </div>
                  <form onSubmit={handleYoutubeSearch} className="flex gap-2 relative">
                    <input 
                      type="text" 
                      placeholder="Search secure educational lectures..."
                      value={youtubeSearch}
                      onChange={e => setYoutubeSearch(e.target.value)}
                      className="bg-[#050505] text-xs text-white px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[var(--color-gold-500)] w-80 transition"
                    />
                    <button type="submit" disabled={isSearching} className="bg-[var(--color-gold-600)] text-obsidian-900 px-4 py-2 rounded-xl flex items-center justify-center hover:bg-[var(--color-gold-400)] transition-colors">
                      <Search size={14} />
                    </button>
                  </form>
                </div>

                {/* Split Screen Video + Search Results Sidebar */}
                <div className="flex-1 flex min-h-0 bg-black relative">
                  
                  {/* Video Player */}
                  <div className="flex-1 relative bg-black">
                    <iframe 
                      className="w-full h-full pointer-events-auto relative z-20"
                      src={`https://www.youtube-nocookie.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0`} 
                      title="YouTube video player" 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                      allowFullScreen
                    ></iframe>
                  </div>

                  {/* Sidebar Search Results */}
                  <AnimatePresence>
                    {searchResults.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        transition={{ duration: 0.3 }}
                        className="w-[400px] bg-[#0a0a0c] border-l border-[var(--color-gold-500)]/30 p-6 flex flex-col gap-4 overflow-y-auto shrink-0 z-30 custom-scrollbar shadow-[-10px_0_30px_rgba(0,240,255,0.05)]"
                      >
                        <div className="flex justify-between items-center mb-1 pb-3 border-b border-white/10 shrink-0">
                          <span className="text-xs text-[var(--color-gold-500)] font-bold uppercase tracking-wider">Encrypted Results</span>
                          <button onClick={() => setSearchResults([])} className="text-gray-400 hover:text-white transition">
                            <X size={14} />
                          </button>
                        </div>
                        <div className="flex flex-col gap-3 flex-1 overflow-y-auto custom-scrollbar">
                          {searchResults.map((item, idx) => (
                            <motion.button 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              key={item.id.videoId}
                              onClick={() => {
                                setVideoId(item.id.videoId);
                                setSearchResults([]);
                                setYoutubeSearch("");
                              }}
                              className="flex gap-3 text-left hover:bg-white/5 p-2 rounded-xl transition items-start border border-transparent hover:border-white/5 group"
                            >
                              <img src={item.snippet.thumbnails.default.url} alt="thumb" className="w-24 h-16 object-cover rounded-lg shadow-md shrink-0 border border-white/5 group-hover:border-[var(--color-gold-500)]/50 transition-colors" />
                              <div className="flex flex-col min-w-0">
                                <p className="text-[11px] text-white font-bold leading-tight line-clamp-2 mb-1">{item.snippet.title}</p>
                                <p className="text-[9px] text-[var(--color-gold-400)] truncate font-semibold">{item.snippet.channelTitle}</p>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* SECTION WEB: Global Web Search */}
            {activeSection === "web" && (
              <motion.div 
                key="web"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="glass-panel rounded-3xl border border-white/10 overflow-hidden h-[600px] shadow-2xl"
              >
                <WebSearch onDistractionTriggered={triggerDistractionPenalty} />
              </motion.div>
            )}

            {/* SECTION C: Wiki Study Search */}
            {activeSection === "search" && (
              <motion.div 
                key="search"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="glass-panel rounded-3xl border border-white/10 overflow-hidden h-[600px] shadow-2xl"
              >
                <StudySearch onDistractionTriggered={triggerDistractionPenalty} />
              </motion.div>
            )}

            {/* SECTION D: Mock Practice */}
            {activeSection === "tests" && (
              <motion.div 
                key="tests"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="glass-panel rounded-3xl border border-white/10 overflow-hidden h-[600px] shadow-2xl"
              >
                <MockTestHub onRewardClaimed={() => {
                  fetchProfile();
                  // refresh history as well
                  fetch("/api/test-history").then(r => r.json()).then(d => { if(d.history) setTestHistory(d.history); });
                }} />
              </motion.div>
            )}

            {/* SECTION REWARDS: Rewards & History */}
            {activeSection === "rewards" && (
              <motion.div 
                key="rewards"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="glass-panel rounded-3xl border border-white/10 overflow-hidden h-[600px] flex flex-col shadow-2xl bg-gradient-to-br from-[#0e1317] to-black p-8"
              >
                <div className="flex items-center gap-3 border-b border-white/10 pb-6 shrink-0">
                  <Award className="text-[var(--color-gold-500)] w-8 h-8 animate-pulse" />
                  <div>
                    <h2 className="text-xl font-extrabold text-white uppercase tracking-wider">Tactical Rewards & Mission History</h2>
                    <p className="text-xs text-gray-400">Review your earned credentials, badges, and past AI evaluation attempts.</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pt-6 flex flex-col gap-8 pr-2">
                  
                  {/* Top Stats Overview */}
                  <div className="grid grid-cols-3 gap-6 shrink-0">
                    <div className="bg-[#121214] border border-white/10 p-6 rounded-3xl flex flex-col items-center justify-center text-center shadow-lg">
                      <Coins className="text-[var(--color-gold-500)] w-8 h-8 mb-2" />
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Total Credit Coins</span>
                      <span className="text-3xl font-mono font-extrabold text-[var(--color-gold-400)]">{profile?.coins ?? 100}</span>
                    </div>
                    <div className="bg-[#121214] border border-white/10 p-6 rounded-3xl flex flex-col items-center justify-center text-center shadow-lg">
                      <Award className="text-[var(--color-gold-500)] w-8 h-8 mb-2" />
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">XP Experience</span>
                      <span className="text-3xl font-mono font-extrabold text-[var(--color-gold-400)]">{profile?.xp ?? 0} XP</span>
                    </div>
                    <div className="bg-[#121214] border border-white/10 p-6 rounded-3xl flex flex-col items-center justify-center text-center shadow-lg">
                      <Flame className="text-orange-500 w-8 h-8 mb-2" />
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Discipline Streak</span>
                      <span className="text-3xl font-mono font-extrabold text-white">{profile?.currentStreak ?? 0} Days</span>
                    </div>
                  </div>

                  {/* Badges Section */}
                  <div className="flex flex-col gap-4 shrink-0">
                    <h3 className="text-xs text-[var(--color-gold-500)] font-extrabold uppercase tracking-wider">Unlocked Syllabus Badges</h3>
                    <div className="flex flex-wrap gap-3 bg-[#121214]/50 border border-white/5 p-6 rounded-3xl min-h-24 items-center">
                      {!profile?.badges ? (
                        <span className="text-xs text-gray-500 italic">No badges unlocked yet. Score 10/10 on AI Mock Tests to earn badges!</span>
                      ) : (
                        parseBadges(profile.badges).map((badge: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 bg-gradient-to-r from-[var(--color-gold-950)] to-black border border-[var(--color-gold-500)]/40 px-4 py-2.5 rounded-2xl shadow-[0_0_15px_rgba(0,240,255,0.15)] group hover:scale-105 transition-all duration-300">
                            <Award className="text-[var(--color-gold-400)] w-5 h-5 shrink-0" />
                            <span className="text-xs font-extrabold text-white uppercase tracking-wider">{badge}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Test History Section */}
                  <div className="flex flex-col gap-4 flex-1 min-h-0">
                    <h3 className="text-xs text-[var(--color-gold-500)] font-extrabold uppercase tracking-wider">Past AI Evaluation Logs</h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-2">
                      {historyLoading ? (
                        <div className="flex items-center justify-center h-32 text-gray-500 text-xs gap-2">
                          <div className="w-4 h-4 border-2 border-[var(--color-gold-500)] border-t-transparent rounded-full animate-spin"></div>
                          Loading past tactical logs...
                        </div>
                      ) : testHistory.length === 0 ? (
                        <div className="text-xs text-gray-500 p-8 text-center border border-dashed border-white/10 rounded-3xl">
                          No test history recorded. Generate and submit an AI Mock Test to log your performance!
                        </div>
                      ) : (
                        testHistory.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-[#121214] border border-white/5 rounded-2xl shadow-sm hover:border-white/10 transition">
                            <div className="flex flex-col gap-1 min-w-0">
                              <span className="text-sm font-bold text-white truncate">{item.topic}</span>
                              <span className="text-[10px] text-gray-500 font-mono">{new Date(item.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                              <span className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border font-mono ${item.passed ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                                {item.score} / {item.totalQuestions}
                              </span>
                              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg ${item.passed ? 'bg-green-950 text-green-300' : 'bg-red-950 text-red-300'}`}>
                                {item.passed ? "PASSED" : "FAILED"}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* SECTION E: Tactical AI */}
            {activeSection === "ai" && (
              <motion.div 
                key="ai"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="glass-panel rounded-3xl border border-white/5 overflow-hidden h-[600px] flex flex-col shadow-2xl bg-gradient-to-br from-[#0e1317] to-[#080b0e]"
              >
                <div className="bg-[#0a0a0c] p-4 border-b border-white/5 shrink-0 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-[var(--color-gold-500)]" />
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider">Subedar Command AI</h2>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-gold-500)] animate-pulse shadow-[0_0_10px_rgba(0,240,255,0.5)]"></div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar">
                  {messages.length === 0 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      className="text-xs text-gray-500 text-center my-auto px-6 italic max-w-sm mx-auto flex flex-col items-center gap-3"
                    >
                      <Shield size={32} className="text-gray-700" />
                      "I am your Digital Subedar. Ask syllabus-relevant questions only. Casual queries will be penalized."
                    </motion.div>
                  )}
                  {messages.map((msg, i) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      key={i} 
                      className={`max-w-[75%] p-4 rounded-2xl text-xs leading-relaxed border ${msg.role === 'user' ? 'bg-[var(--color-gold-600)]/10 border-[var(--color-gold-500)]/30 text-white self-end rounded-tr-none shadow-sm' : 'bg-[#141b21] border-white/5 text-gray-300 self-start rounded-tl-none shadow-sm'}`}
                    >
                      {msg.content}
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 shrink-0 flex gap-3 bg-black/10">
                  <input 
                    type="text" 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Query syllabus details or legal cases, Cadet..." 
                    className="flex-1 bg-[#050505] text-xs text-white px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-[var(--color-gold-500)]/50 transition-colors"
                  />
                  <button type="submit" className="p-3 bg-[var(--color-gold-600)] text-obsidian-900 rounded-xl hover:bg-[var(--color-gold-400)] transition-colors shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                    <Send size={16} />
                  </button>
                </form>
              </motion.div>
            )}

            {/* SECTION F: Intel Feed */}
            {activeSection === "intel" && (
              <motion.div 
                key="intel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="glass-panel rounded-3xl border border-white/5 overflow-hidden h-[550px] flex flex-col shadow-2xl"
              >
                <div className="bg-[#0a0a0c] p-4 border-b border-white/5 shrink-0 flex items-center gap-2">
                  <BookOpen size={16} className="text-[var(--color-gold-500)]" />
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">Encrypted Current Intel</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gradient-to-br from-[#0e1317] to-[#080b0e]">
                  {newsLoading ? (
                    <div className="text-xs text-gray-500 p-2 text-center mt-12 flex flex-col items-center gap-3">
                      <div className="w-6 h-6 border-2 border-[var(--color-gold-500)] border-t-transparent rounded-full animate-spin"></div>
                      Loading decrypted intel streams...
                    </div>
                  ) : news.length === 0 ? (
                    <div className="text-xs text-gray-500 p-6 text-center mt-12 border border-dashed border-white/10 mx-6 rounded-2xl">
                      No critical intel available currently. Focus on your syllabus.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {news.map((item, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          key={idx} 
                          className="p-4 bg-white/[0.02] border border-white/5 hover:border-[var(--color-gold-500)]/30 rounded-xl transition-all flex flex-col gap-2 shadow-sm group hover:-translate-y-1"
                        >
                          <p className="text-xs text-gray-200 font-bold leading-normal group-hover:text-white transition-colors">{item.title}</p>
                          <div className="flex justify-between items-center text-[9px] text-gray-500 border-t border-white/5 pt-2 mt-1 shrink-0">
                            <span className="font-semibold text-[var(--color-gold-500)]">{item.source?.name || "Global Intel"}</span>
                            <span>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : ""}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        currentName={session?.user?.name || ""} 
        currentImage={session?.user?.image || profile?.image || ""} 
        onUpdate={() => { 
          fetchProfile(); 
          // also refresh history if needed
          fetch("/api/test-history").then(r => r.json()).then(d => { if(d.history) setTestHistory(d.history); });
        }} 
      />

      {/* Global Distraction Warning Modal */}
      <AnimatePresence>
        {kiosk.warningActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center bg-red-950/95 backdrop-blur-lg"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 15, stiffness: 200 }}
              className="bg-[#050505] border-2 border-red-500 p-10 rounded-3xl max-w-lg text-center flex flex-col items-center shadow-[0_0_100px_rgba(255,0,0,0.6)]"
            >
              <motion.div
                initial={{ rotate: -20, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", damping: 10, delay: 0.1 }}
              >
                <ShieldAlert size={80} className="text-red-500 mb-6 animate-pulse" />
              </motion.div>
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-extrabold text-white mb-4 uppercase tracking-widest"
              >
                Protocol Breach
              </motion.h2>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-300 mb-8 text-lg leading-relaxed"
              >
                You exited Kiosk Mode or switched tabs. A distraction strike has been logged. 
                <span className="text-red-400 font-bold"> 20 Coins</span> and <span className="text-red-400 font-bold">20 XP</span> have been deducted from your profile.
              </motion.p>
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={kiosk.acknowledgeWarning}
                className="px-8 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-500 transition-colors shadow-[0_0_20px_rgba(255,0,0,0.4)] tracking-wider"
              >
                ACKNOWLEDGE & RETURN
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
