"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Crosshair, BrainCircuit, Activity, User, Mail, Lock, ArrowRight, ShieldCheck, KeyRound, AlertTriangle, CheckCircle2 } from "lucide-react";

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
        // Enlist new cadet
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

        // Show the recovery code clearance modal
        setGeneratedClearanceCode(data.recoveryCode);
        setShowRecoveryModal(true);
        
        // Reset fields
        setName("");
        setEmail("");
        setPassword("");
      } else if (authMode === "forgot") {
        // Reset password using recovery key
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
        // Standard log in
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
            {authMode === "forgot" ? (
              <>
                <KeyRound className="w-5 h-5 text-[var(--color-gold-400)]" />
                "Cadet Key Reset (Forgot Password)"
              </>
            ) : authMode === "register" ? (
              <>
                <ShieldCheck className="w-5 h-5 text-[var(--color-gold-400)]" />
                "Cadet Enlistment (Register)"
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 text-[var(--color-gold-400)]" />
                "Military Sign-In (Login)"
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
