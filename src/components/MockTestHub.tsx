"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Award, RefreshCw, BookOpen, Search, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

const STATIC_TESTS: Record<string, { title: string, badge: string, questions: Question[] }> = {
  polity: {
    title: "Indian Polity: Constitutional Framework",
    badge: "Polity Scholar",
    questions: [
      { question: "Which of the following Articles deals with the Right to Equality?", options: ["Article 14-18", "Article 19-22", "Article 23-24", "Article 25-28"], correctAnswer: 0, explanation: "Articles 14 to 18 deal with the Right to Equality." },
      { question: "Who is known as the custodian of the Indian Constitution?", options: ["The President", "The Prime Minister", "The Supreme Court", "The Parliament"], correctAnswer: 2, explanation: "The Supreme Court is the ultimate interpreter and custodian." },
      { question: "The idea of 'Directive Principles of State Policy' (DPSP) is borrowed from which country?", options: ["USA", "Ireland", "USSR", "Australia"], correctAnswer: 1, explanation: "Borrowed from the Irish Constitution of 1937." },
      { question: "Which amendment is known as the 'Mini-Constitution' of India?", options: ["42nd Amendment", "44th Amendment", "52nd Amendment", "73rd Amendment"], correctAnswer: 0, explanation: "42nd Amendment (1976) brought massive constitutional changes." },
      { question: "What is the minimum age required to become the President of India?", options: ["25 years", "30 years", "35 years", "40 years"], correctAnswer: 2, explanation: "Under Article 58, a candidate must be at least 35 years old." },
      { question: "Who administers the oath of office to the President of India?", options: ["Chief Justice of India", "Prime Minister", "Vice President", "Speaker of Lok Sabha"], correctAnswer: 0, explanation: "Administered by the Chief Justice of India." },
      { question: "How many Fundamental Duties are currently in the Indian Constitution?", options: ["9", "10", "11", "12"], correctAnswer: 2, explanation: "There are 11 Fundamental Duties (Part IV-A)." },
      { question: "Which Schedule of the Constitution deals with Anti-Defection law?", options: ["8th Schedule", "9th Schedule", "10th Schedule", "11th Schedule"], correctAnswer: 2, explanation: "10th Schedule added by 52nd Amendment Act, 1985." },
      { question: "The power to prorogue the Lok Sabha rests with whom?", options: ["Speaker", "Prime Minister", "Minister of Parliamentary Affairs", "President"], correctAnswer: 3, explanation: "The President has the power to summon and prorogue Parliament." },
      { question: "Which Article deals with the Finance Commission?", options: ["Article 280", "Article 324", "Article 356", "Article 360"], correctAnswer: 0, explanation: "Article 280 provides for a Finance Commission." }
    ]
  },
  history: {
    title: "Modern Indian History: Freedom Struggle",
    badge: "History Scout",
    questions: [
      { question: "In which year did Mahatma Gandhi launch the Non-Cooperation Movement?", options: ["1915", "1920", "1930", "1942"], correctAnswer: 1, explanation: "Launched on September 4, 1920." },
      { question: "Who was the first Governor-General of independent India?", options: ["Lord Mountbatten", "C. Rajagopalachari", "Dr. Rajendra Prasad", "Jawaharlal Nehru"], correctAnswer: 0, explanation: "Lord Mountbatten was the first Governor-General of independent India." },
      { question: "Who founded the 'East India Association' in London in 1866?", options: ["Dadabhai Naoroji", "Surendranath Banerjee", "Gopal Krishna Gokhale", "Bal Gangadhar Tilak"], correctAnswer: 0, explanation: "Founded by Dadabhai Naoroji." },
      { question: "Which incident led Gandhiji to suspend the Non-Cooperation Movement in 1922?", options: ["Jallianwala Bagh", "Chauri Chaura Incident", "Rowlatt Act", "Kakori Conspiracy"], correctAnswer: 1, explanation: "Chauri Chaura incident occurred on February 4, 1922." },
      { question: "The famous 'Quit India Resolution' was passed at which session of the Congress?", options: ["Bombay", "Lahore", "Calcutta", "Karachi"], correctAnswer: 0, explanation: "Passed on August 8, 1942, in Bombay." },
      { question: "Who gave the slogan 'Give me blood and I will give you freedom'?", options: ["Bhagat Singh", "Subhas Chandra Bose", "Chandrashekhar Azad", "Lala Lajpat Rai"], correctAnswer: 1, explanation: "Famous slogan by Netaji Subhas Chandra Bose." },
      { question: "Who was the Viceroy of India during the Jallianwala Bagh massacre?", options: ["Lord Curzon", "Lord Chelmsford", "Lord Irwin", "Lord Willingdon"], correctAnswer: 1, explanation: "Lord Chelmsford was Viceroy from 1916 to 1921." },
      { question: "In which year was the Muslim League founded?", options: ["1905", "1906", "1909", "1916"], correctAnswer: 1, explanation: "Founded in Dhaka in 1906." },
      { question: "Who was the author of the book 'Poverty and Un-British Rule in India'?", options: ["Dadabhai Naoroji", "R.C. Dutt", "G.K. Gokhale", "B.G. Tilak"], correctAnswer: 0, explanation: "Written by Dadabhai Naoroji outlining the Drain of Wealth theory." },
      { question: "The Poona Pact (1932) was an agreement between Gandhiji and whom?", options: ["Lord Irwin", "B.R. Ambedkar", "Jinnah", "Ramsay MacDonald"], correctAnswer: 1, explanation: "Signed between Gandhiji and Dr. B.R. Ambedkar." }
    ]
  }
};

export default function MockTestHub({ onRewardClaimed }: { onRewardClaimed: () => void }) {
  const [topicInput, setTopicInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [activeTest, setActiveTest] = useState<{ title: string, badge: string, questions: Question[] } | null>(null);
  
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittingResult, setSubmittingResult] = useState(false);

  const questions = activeTest ? activeTest.questions : [];

  const handleGenerateAITest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim() || generating) return;

    setGenerating(true);
    try {
      const res = await fetch("/api/generate-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicInput })
      });
      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      if (data.questions && data.questions.length > 0) {
        setActiveTest({
          title: `AI Mission: ${topicInput}`,
          badge: `${topicInput.split(" ")[0]} Master`,
          questions: data.questions
        });
        handleResetState();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate AI Mock Test.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectStaticTest = (key: string) => {
    setActiveTest(STATIC_TESTS[key]);
    handleResetState();
  };

  const handleResetState = () => {
    setCurrentQuestionIdx(0);
    setUserAnswers({});
    setIsSubmitted(false);
    setSubmittingResult(false);
  };

  const handleSelectOption = (optIdx: number) => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIdx]: optIdx
    }));
  };

  const handlePrev = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(prev => prev - 1);
    }
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) score++;
    });
    return score;
  };

  const handleSubmitTest = async () => {
    setIsSubmitted(true);
    setSubmittingResult(true);

    const score = calculateScore();
    const passed = score === questions.length; // 10/10 perfect score required for rewards

    try {
      // 1. Save Test History
      await fetch("/api/test-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: activeTest?.title || "Mock Test",
          score,
          totalQuestions: questions.length,
          passed
        })
      });

      // 2. Automatically grant rewards ONLY if perfect score
      if (passed && activeTest) {
        await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            xpReward: 100,
            coinsReward: 50,
            badgeToUnlock: activeTest.badge
          })
        });
        onRewardClaimed(); // Refresh profile state
      }
    } catch (err) {
      console.error("Failed to submit test results", err);
    } finally {
      setSubmittingResult(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] text-white p-6 overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay pointer-events-none z-0"></div>

      <AnimatePresence mode="wait">
        {!activeTest ? (
          // Category & AI Generation View
          <motion.div 
            key="category-selection"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center my-auto w-full h-full z-10 max-w-xl mx-auto px-4"
          >
            <Sparkles className="text-[var(--color-gold-500)] w-12 h-12 mb-4 animate-pulse" />
            <h3 className="text-2xl font-extrabold uppercase tracking-wider mb-2 text-white">AI Mock Test Command</h3>
            <p className="text-xs text-gray-400 text-center mb-8 leading-relaxed">
              Generate a custom 10-question evaluation on any competitive topic. Score a perfect <strong className="text-[var(--color-gold-400)]">10/10</strong> to automatically claim 50 Coins, 100 XP, and a syllabus Badge!
            </p>
            
            {/* AI Generator Bar */}
            <form onSubmit={handleGenerateAITest} className="w-full flex gap-3 mb-10">
              <div className="relative flex-1 group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Search size={18} className="text-gray-400 group-hover:text-[var(--color-gold-500)] transition-colors" />
                </div>
                <input 
                  type="text" 
                  placeholder="Enter topic..."
                  value={topicInput}
                  onChange={e => setTopicInput(e.target.value)}
                  disabled={generating}
                  className="w-full bg-[#121214] text-sm text-white pl-12 pr-4 py-3.5 rounded-2xl border border-white/10 focus:outline-none focus:border-[var(--color-gold-500)]/70 hover:border-white/30 focus:shadow-[0_0_25px_rgba(251,191,36,0.15)] transition-all duration-300"
                />
              </div>
              <button 
                type="submit" 
                disabled={!topicInput.trim() || generating}
                className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-300 disabled:opacity-50 disabled:bg-gray-700 disabled:text-gray-400 flex items-center gap-2 hover:scale-105 shadow-[0_0_20px_rgba(251,191,36,0.2)] shrink-0"
              >
                {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {generating ? "Encrypting..." : "Generate 10 MCQs"}
              </button>
            </form>

            {/* Static Quick Start Missions */}
            <div className="w-full flex flex-col gap-4">
              <span className="text-xs text-[var(--color-gold-500)] font-bold uppercase tracking-wider text-left">Quick Start Missions</span>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(STATIC_TESTS).map(([key, item], idx) => (
                  <motion.button 
                    key={key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectStaticTest(key)}
                    className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col items-start gap-3 group transition-all duration-300 hover:border-[var(--color-gold-500)]/50 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] text-left bg-gradient-to-br from-[#0e1317] to-black"
                  >
                    <span className="text-sm font-bold group-hover:text-[var(--color-gold-400)] transition leading-snug">{item.title}</span>
                    <span className="text-[10px] bg-[var(--color-gold-950)] text-[var(--color-gold-400)] px-3 py-1 rounded-full font-extrabold uppercase tracking-wider border border-[var(--color-gold-500)]/20">{item.badge}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          // Active Test View
          <motion.div 
            key="active-test"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col h-full justify-between w-full z-10 max-w-3xl mx-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-4 shrink-0">
              <div>
                <h3 className="text-base font-extrabold text-[var(--color-gold-400)] uppercase tracking-wider">{activeTest.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5 font-mono">Question {currentQuestionIdx + 1} of {questions.length}</p>
              </div>
              <button 
                onClick={() => setActiveTest(null)}
                className="text-xs bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl transition border border-white/10 text-gray-400 hover:text-white font-semibold"
              >
                Abort Mission
              </button>
            </div>

            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                /* Question Pane */
                <motion.div 
                  key={`q-${currentQuestionIdx}`}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="my-auto flex flex-col gap-6 py-6"
                >
                  <p className="text-lg font-bold leading-relaxed text-white">
                    {questions[currentQuestionIdx]?.question}
                  </p>
                  
                  <div className="flex flex-col gap-4 mt-2">
                    {questions[currentQuestionIdx]?.options.map((opt, oIdx) => {
                      const isSelected = userAnswers[currentQuestionIdx] === oIdx;
                      return (
                        <button 
                          key={oIdx}
                          onClick={() => handleSelectOption(oIdx)}
                          className={`text-left p-5 rounded-2xl text-sm border-2 transition-all duration-300 flex items-center justify-between group ${isSelected ? 'bg-[var(--color-gold-600)]/20 border-[var(--color-gold-500)] text-white shadow-[0_0_20px_rgba(0,240,255,0.15)] scale-[1.01]' : 'bg-[#121214] border-white/5 hover:border-white/20 hover:bg-white/5 text-gray-300'}`}
                        >
                          <span className="font-medium leading-snug">{opt}</span>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${isSelected ? 'border-[var(--color-gold-500)] bg-[var(--color-gold-500)]' : 'border-gray-500 group-hover:border-gray-400'}`}>
                            {isSelected && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2.5 h-2.5 rounded-full bg-black" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                /* Results & Review Pane */
                <motion.div 
                  key="results"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="my-auto flex flex-col items-center py-6 gap-8 max-h-[70%] overflow-y-auto custom-scrollbar pr-2"
                >
                  <div className="flex flex-col items-center text-center max-w-md bg-[#121214]/60 border border-white/10 p-8 rounded-3xl backdrop-blur-xl shadow-2xl w-full">
                    <motion.div
                      initial={{ scale: 0.5, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    >
                      <Award className="text-[var(--color-gold-500)] w-16 h-16 mb-2 animate-pulse drop-shadow-[0_0_15px_rgba(255,215,0,0.3)]" />
                    </motion.div>
                    <h4 className="text-2xl font-extrabold text-white tracking-wider">EVALUATION COMPLETE</h4>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-mono">Mission Verification Score</p>
                    <span className="text-4xl font-mono font-extrabold text-[var(--color-gold-400)] mt-4 bg-black/40 px-8 py-3 rounded-2xl border border-white/10 shadow-inner">
                      {calculateScore()} / {questions.length}
                    </span>
                    
                    {calculateScore() === questions.length ? (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-green-500/10 border border-green-500/30 text-green-400 px-6 py-3 rounded-2xl mt-6 font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(34,197,94,0.15)]">
                        ★ PERFECT SCORE! Rewards & Badge Automatically Claimed.
                      </motion.div>
                    ) : (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-3 rounded-2xl mt-6 font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                        ⚠️ PERFECT SCORE REQUIRED (10/10) TO UNLOCK REWARDS.
                      </motion.div>
                    )}
                  </div>

                  {/* Explanations Review */}
                  <div className="w-full flex flex-col gap-4">
                    <p className="text-xs text-[var(--color-gold-500)] font-extrabold uppercase tracking-wider pl-1">Detailed Evaluation Breakdown</p>
                    {questions.map((q, idx) => {
                      const uAns = userAnswers[idx];
                      const isCorrect = uAns === q.correctAnswer;
                      return (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 + idx * 0.05 }}
                          key={idx} 
                          className="p-5 bg-[#121214] border border-white/5 rounded-2xl flex flex-col gap-3 shadow-sm"
                        >
                          <div className="flex items-start gap-4 justify-between">
                            <p className="text-sm font-bold text-white leading-snug">{idx + 1}. {q.question}</p>
                            {isCorrect ? (
                              <CheckCircle2 className="text-green-500 w-5 h-5 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="text-red-500 w-5 h-5 shrink-0 mt-0.5" />
                            )}
                          </div>

                          {/* Options List */}
                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                            {q.options.map((o, oI) => (
                              <div key={oI} className={`text-xs p-2.5 rounded-xl border ${oI === q.correctAnswer ? 'bg-green-500/10 border-green-500/30 text-green-300 font-bold' : oI === uAns ? 'bg-red-500/10 border-red-500/30 text-red-300 font-bold' : 'bg-black/20 border-white/5 text-gray-400'}`}>
                                {o}
                              </div>
                            ))}
                          </div>

                          {q.explanation && (
                            <div className="text-xs text-gray-300 bg-black/40 p-3.5 rounded-xl border border-white/5 mt-1 leading-relaxed">
                              <span className="font-extrabold text-[var(--color-gold-500)] uppercase block mb-1 tracking-wider text-[10px]">Subedar Analysis:</span>
                              {q.explanation}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Controls */}
            <div className="flex justify-between items-center border-t border-white/10 pt-4 shrink-0">
              {!isSubmitted ? (
                <>
                  <button 
                    onClick={handlePrev}
                    disabled={currentQuestionIdx === 0}
                    className="bg-[#121214] hover:bg-white/10 border border-white/5 text-xs px-6 py-3 rounded-xl transition disabled:opacity-30 font-semibold tracking-wide"
                  >
                    Previous
                  </button>

                  {currentQuestionIdx === questions.length - 1 ? (
                    <button 
                      onClick={handleSubmitTest}
                      disabled={Object.keys(userAnswers).length < questions.length || submittingResult}
                      className="bg-green-600 hover:bg-green-500 text-black text-xs font-extrabold px-8 py-3 rounded-xl transition disabled:opacity-50 uppercase tracking-wider shadow-[0_0_20px_rgba(22,163,74,0.3)] flex items-center gap-2"
                    >
                      {submittingResult && <Loader2 size={14} className="animate-spin" />}
                      {submittingResult ? "Verifying..." : "Submit Mission"}
                    </button>
                  ) : (
                    <button 
                      onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                      className="bg-[var(--color-gold-600)] hover:bg-[var(--color-gold-400)] text-obsidian-900 text-xs font-extrabold px-8 py-3 rounded-xl transition uppercase tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.2)]"
                    >
                      Next
                    </button>
                  )}
                </>
              ) : (
                <div className="w-full flex justify-center">
                  <button 
                    onClick={() => setActiveTest(null)}
                    className="bg-[var(--color-gold-600)] hover:bg-[var(--color-gold-400)] text-obsidian-900 font-extrabold text-xs px-8 py-3.5 rounded-2xl transition flex items-center justify-center gap-2 uppercase tracking-wider shadow-[0_0_25px_rgba(0,240,255,0.2)] hover:scale-105 duration-300"
                  >
                    <RefreshCw size={14} /> Return to Command Center
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
