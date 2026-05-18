"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Crosshair, BrainCircuit, Activity, User, Mail, Lock, ArrowRight, ShieldCheck, KeyRound, AlertTriangle, CheckCircle2, Award, Landmark } from "lucide-react";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Authentication mode: 'login' | 'register' | 'forgot'
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot">("login");
  
  // Input fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryCodeInput, setRecoveryCodeInput] = useState("");
  
  // Generated clearance code modal states
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [generatedClearanceCode, setGeneratedClearanceCode] = useState("");
  
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

    try {
      if (authMode === "register") {
        if (!name || !email || !password) {
          setError("Name, email, and password are required for enlistment.");
          setLoading(false);
          return;
        }

        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to enlist cadet.");
        }

        setGeneratedClearanceCode(data.recoveryCode);
        setShowRecoveryModal(true);
        
        setName("");
        setEmail("");
        setPassword("");
      } else if (authMode === "forgot") {
        if (!email || !recoveryCodeInput || !password) {
          setError("Email, recovery key, and new password are required.");
          setLoading(false);
          return;
        }

        const res = await fetch("/api/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, recoveryCode: recoveryCodeInput, newPassword: password }),
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to reset password.");
        }

        setSuccess(data.message || "Password successfully updated! Please log in.");
        setAuthMode("login");
        setRecoveryCodeInput("");
        setPassword("");
      } else {
        if (!email || !password) {
          setError("Email and password are required to access.");
          setLoading(false);
          return;
        }

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
    <main className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden bg-[var(--color-obsidian-900)]">
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--color-gold-600)] blur-[180px] opacity-10 rounded-full mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-[var(--color-gold-500)] blur-[180px] opacity-10 rounded-full mix-blend-screen pointer-events-none"></div>

      {/* Left Column: Branding, UPSC/SSC Context, Motivational Quote & Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-start lg:justify-center px-6 sm:px-12 lg:px-16 py-12 lg:py-8 z-10 overflow-y-auto max-h-screen">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-lg mx-auto lg:mx-0 flex flex-col"
        >
          {/* Logo Brand */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-[var(--color-gold-500)]/10 border border-[var(--color-gold-500)]/30">
              <ShieldAlert className="w-8 h-8 text-[var(--color-gold-500)] text-glow-gold" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-wider text-glow-gold text-white uppercase">
                PREPGUARDIAN
              </h1>
              <p className="text-xs text-[var(--color-gold-400)] tracking-widest font-mono uppercase">
                Digital Subedar Portal
              </p>
            </div>
          </div>

          {/* UPSC & SSC High-Stakes Banner */}
          <div className="glass-panel p-5 rounded-2xl border border-[var(--color-gold-500)]/15 mb-6 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 text-white/5 pointer-events-none">
              <Landmark className="w-16 h-16" />
            </div>
            <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wide flex items-center gap-2">
              <Award className="w-4 h-4 text-[var(--color-gold-400)]" />
              UPSC CSE & SSC CGL Focus Enforcer
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              India's toughest competitive exams demand extreme mental discipline. PrepGuardian actively locks down your environment, monitors focus sessions, and lets you enlist under the Digital Subedar's direct academic guidance to guarantee absolute success.
            </p>
          </div>

          {/* Luxury Quote Panel */}
          <div className="pl-4 border-l-2 border-[var(--color-gold-500)]/50 mb-8 text-left">
            <p className="text-sm italic text-gray-300 leading-relaxed font-medium">
              "The steel frame of India's administration demands absolute temper, not fragile focus. Let discipline carve your path to the academy."
            </p>
            <p className="text-xs text-[var(--color-gold-400)] uppercase font-bold tracking-widest mt-2 font-mono">
              — Sardar Vallabhbhai Patel
            </p>
          </div>

          {/* Authentication Card */}
          <div className="w-full glass-panel p-6 sm:p-8 rounded-3xl border border-[var(--color-gold-500)]/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
            
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              {authMode === "forgot" ? (
                <>
                  <KeyRound className="w-5 h-5 text-[var(--color-gold-400)]" />
                  Cadet Key Reset
                </>
              ) : authMode === "register" ? (
                <>
                  <ShieldCheck className="w-5 h-5 text-[var(--color-gold-400)]" />
                  Cadet Enlistment (Register)
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-[var(--color-gold-400)]" />
                  Military Sign-In (Login)
                </>
              )}
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
              {authMode === "register" && (
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
                      required
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

              {authMode === "forgot" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Clearance Recovery Code</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                      <KeyRound className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={recoveryCodeInput}
                      onChange={(e) => setRecoveryCodeInput(e.target.value)}
                      placeholder="PG-XXXXXX"
                      className="w-full bg-white/5 border border-white/10 hover:border-[var(--color-gold-500)]/30 focus:border-[var(--color-gold-500)] focus:ring-1 focus:ring-[var(--color-gold-500)] text-white placeholder-gray-500 rounded-xl pl-10 pr-4 py-3 outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  {authMode === "forgot" ? "New Access Key (Password)" : "Access Key (Password)"}
                </label>
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
                {loading ? "Processing..." : authMode === "forgot" ? "RESET SECURITY CLEARANCE" : authMode === "register" ? "ENLIST AS CADET" : "ACCESS SECURE PORTAL"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Dynamic Switch Options */}
            <div className="mt-6 space-y-3 text-center">
              {authMode === "login" ? (
                <>
                  <div>
                    <button
                      onClick={() => {
                        setAuthMode("register");
                        setError("");
                        setSuccess("");
                      }}
                      className="text-sm text-[var(--color-gold-400)] hover:text-[var(--color-gold-300)] transition-colors underline decoration-dotted underline-offset-4"
                    >
                      Need credentials? Enlist as a new cadet
                    </button>
                  </div>
                  <div>
                    <button
                      onClick={() => {
                        setAuthMode("forgot");
                        setError("");
                        setSuccess("");
                      }}
                      className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </>
              ) : (
                <div>
                  <button
                    onClick={() => {
                      setAuthMode("login");
                      setError("");
                      setSuccess("");
                    }}
                    className="text-sm text-[var(--color-gold-400)] hover:text-[var(--color-gold-300)] transition-colors underline decoration-dotted underline-offset-4"
                  >
                    Return to Cadet Login Screen
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Column: High-End Determined Aspirant Illustration */}
      <div className="w-full lg:w-1/2 relative min-h-[40vh] lg:min-h-screen flex items-center justify-center p-8 bg-[var(--color-obsidian-950)] border-t lg:border-t-0 lg:border-l border-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-obsidian-900)] to-transparent z-10 hidden lg:block pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-obsidian-900)] to-transparent z-10 lg:hidden pointer-events-none"></div>
        
        {/* Dynamic Glowing Accents behind image */}
        <div className="absolute top-[25%] left-[25%] w-[50%] h-[50%] bg-[var(--color-gold-500)]/15 blur-[120px] rounded-full animate-pulse pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="relative z-0 w-full max-w-md lg:max-w-lg aspect-square rounded-3xl overflow-hidden shadow-2xl border border-[var(--color-gold-500)]/20 hover:border-[var(--color-gold-500)]/40 transition-all group"
        >
          {/* Main Cadet Image */}
          <img
            src="/student.png"
            alt="Determined Cadet studying for UPSC and SSC with holographic screens under PrepGuardian supervision"
            className="w-full h-full object-cover grayscale-[15%] group-hover:scale-105 group-hover:grayscale-0 transition-all duration-700"
          />

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none"></div>

          {/* Floating Badges inside Image */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-2 pointer-events-none">
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-black/75 border border-[var(--color-gold-500)]/30 rounded-full text-[10px] font-bold text-[var(--color-gold-400)] uppercase tracking-wider font-mono">
                UPSC Civil Services
              </span>
              <span className="px-3 py-1 bg-black/75 border border-[var(--color-gold-500)]/30 rounded-full text-[10px] font-bold text-[var(--color-gold-400)] uppercase tracking-wider font-mono">
                SSC CGL
              </span>
            </div>
            <h4 className="text-white font-bold text-lg leading-tight text-shadow">
              Digital Subedar Focus Chamber
            </h4>
            <p className="text-xs text-gray-300">
              Where focus is non-negotiable and success is forged.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Recovery Code Clearance Modal (Undismissable until acknowledged) */}
      <AnimatePresence>
        {showRecoveryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md glass-panel p-8 rounded-3xl border border-[var(--color-gold-500)]/30 text-center relative overflow-hidden"
            >
              <div className="mb-4 flex justify-center text-[var(--color-gold-500)]">
                <AlertTriangle className="w-16 h-16 animate-bounce" />
              </div>
              
              <h2 className="text-2xl font-extrabold text-white mb-2 uppercase tracking-wide">
                Clearance Code Issued!
              </h2>
              <p className="text-xs text-[var(--color-gold-400)] font-semibold mb-6 uppercase tracking-wider">
                ⚠️ HIGH-SECURITY CLEARANCE PROTOCOL ⚠️
              </p>

              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                Your Cadet Account has been enlisted successfully. The following 6-digit military clearance key has been generated for your account recovery:
              </p>

              <div className="bg-white/5 border border-white/10 rounded-2xl py-4 px-6 mb-6 font-mono text-3xl font-bold tracking-widest text-[var(--color-gold-400)] text-glow-gold">
                {generatedClearanceCode}
              </div>

              <p className="text-xs text-red-400 font-medium mb-8 leading-relaxed">
                WARNING: Write this code down immediately! This is your only key to reset your password if you forget it. The system will NOT display this code again.
              </p>

              <button
                onClick={() => {
                  setShowRecoveryModal(false);
                  setAuthMode("login");
                }}
                className="w-full py-4 bg-[var(--color-gold-500)] hover:bg-[var(--color-gold-600)] text-black font-extrabold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-[var(--color-gold-500)]/10"
              >
                <CheckCircle2 className="w-5 h-5" />
                I HAVE WRITTEN THIS DOWN & UNDERSTAND
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
