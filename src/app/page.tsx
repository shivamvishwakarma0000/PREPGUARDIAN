"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Crosshair, BrainCircuit, Activity } from "lucide-react";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[var(--color-obsidian-900)]">
      {/* Background Ornaments */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--color-gold-600)] blur-[150px] opacity-10 rounded-full mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-[var(--color-gold-500)] blur-[150px] opacity-10 rounded-full mix-blend-screen pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 flex flex-col items-center text-center max-w-4xl px-6"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-6 p-4 rounded-full glass-panel"
        >
          <ShieldAlert className="w-16 h-16 text-[var(--color-gold-500)]" />
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 text-glow-gold text-white">
          PREPGUARDIAN
        </h1>
        <h2 className="text-2xl md:text-3xl font-medium text-[var(--color-gold-400)] mb-8 tracking-wide uppercase">
          Digital Subedar
        </h2>
        
        <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl leading-relaxed">
          The ultimate discipline enforcement tool for competitive exam preparation. 
          No distractions. Complete focus. Earn your rank.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mb-12">
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
              className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center border border-[var(--color-gold-500)]/20 hover:border-[var(--color-gold-500)]/50 transition-colors"
            >
              <div className="text-[var(--color-gold-400)] mb-4">{feature.icon}</div>
              <h3 className="text-white font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          disabled={status === "loading"}
          className="relative group px-10 py-4 bg-transparent text-white font-bold text-lg rounded-full overflow-hidden transition-all duration-300 border border-[var(--color-gold-500)] disabled:opacity-50"
        >
          <div className="absolute inset-0 w-full h-full bg-[var(--color-gold-500)] opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
          <div className="relative flex items-center justify-center gap-3">
            {status === "loading" ? "Initializing..." : "AUTHENTICATE VIA GOOGLE"}
            {!status && <div className="w-2 h-2 rounded-full bg-[var(--color-gold-400)] animate-pulse"></div>}
          </div>
        </motion.button>
      </motion.div>
    </main>
  );
}
