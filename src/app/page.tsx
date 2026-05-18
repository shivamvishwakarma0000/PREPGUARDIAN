"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Crosshair, BrainCircuit, Activity, User, Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Authentication mode states
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Feedback states
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const handleCredentialsAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!email || !password || (isRegister && !name)) {
      setError("Please fill in all required enlistment fields.");
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
        // Enlist new cadet
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to enlist cadet.");
        }

        setSuccess("Cadet successfully enlisted! Enter your credentials below to log in.");
        setIsRegister(false);
        setPassword("");
      } else {
        // Authenticate cadet
        const res = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (res?.error) {
          throw new Error(res.error || "Invalid credential validation.");
        }

        setSuccess("Access Granted. Syncing with Digital Subedar...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 800);
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-y-auto py-12 bg-[var(--color-obsidian-900)]">
      {/* Background Ornaments */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--color-gold-600)] blur-[150px] opacity-10 rounded-full mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-[var(--color-gold-500)] blur-[150px] opacity-10 rounded-full mix-blend-screen pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 flex flex-col items-center text-center max-w-4xl px-6 w-full"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-4 p-4 rounded-full glass-panel"
        >
          <ShieldAlert className="w-12 h-12 text-[var(--color-gold-500)]" />
        </motion.div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-2 text-glow-gold text-white">
          PREPGUARDIAN
        </h1>
        <h2 className="text-xl md:text-2xl font-medium text-[var(--color-gold-400)] mb-8 tracking-wide uppercase">
          Digital Subedar Portal
        </h2>

        {/* Dynamic Authentication Frame */}
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-[var(--color-gold-500)]/20 mb-8 text-left relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
          
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[var(--color-gold-400)]" />
            {isRegister ? "Cadet Enlistment (Register)" : "Military Sign-In (Login)"}
          </h3>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleCredentialsAuth} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-white/5 border border-white/10 hover:border-[var(--color-gold-500)]/30 focus:border-[var(--color-gold-500)] focus:ring-1 focus:ring-[var(--color-gold-500)] text-white placeholder-gray-500 rounded-xl pl-10 pr-4 py-3 outline-none transition-all"
                    required={isRegister}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Cadet Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-white/5 border border-white/10 hover:border-[var(--color-gold-500)]/30 focus:border-[var(--color-gold-500)] focus:ring-1 focus:ring-[var(--color-gold-500)] text-white placeholder-gray-500 rounded-xl pl-10 pr-4 py-3 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Access Key (Password)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-white/5 border border-white/10 hover:border-[var(--color-gold-500)]/30 focus:border-[var(--color-gold-500)] focus:ring-1 focus:ring-[var(--color-gold-500)] text-white placeholder-gray-500 rounded-xl pl-10 pr-4 py-3 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || status === "loading"}
              className="w-full py-4 bg-[var(--color-gold-500)] hover:bg-[var(--color-gold-600)] text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[var(--color-gold-500)]/10 disabled:opacity-55"
            >
              {loading ? "Authenticating..." : isRegister ? "ENLIST AS CADET" : "ACCESS SECURE PORTAL"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Switch Auth Mode */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
                setSuccess("");
              }}
              className="text-sm text-[var(--color-gold-400)] hover:text-[var(--color-gold-300)] transition-colors underline decoration-dotted underline-offset-4"
            >
              {isRegister ? "Already enlisted? Log In instead" : "Need credentials? Enlist as a new cadet"}
            </button>
          </div>

          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-gray-500 text-xs font-bold uppercase tracking-wider">OR</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {/* Quick Google Sign In */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            disabled={loading || status === "loading"}
            className="w-full py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-55"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            QUICK ACCESS VIA GOOGLE
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
          {[
            { icon: <Crosshair />, title: "Focus Kiosk", desc: "Strict fullscreen environment" },
            { icon: <Activity />, title: "Discipline Engine", desc: "Active distraction penalties" },
            { icon: <BrainCircuit />, title: "AI Mentor", desc: "Ruthless academic guidance" },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + idx * 0.1, duration: 0.5 }}
              className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center border border-[var(--color-gold-500)]/20"
            >
              <div className="text-[var(--color-gold-400)] mb-4">{feature.icon}</div>
              <h3 className="text-white font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </main>
  );
}
