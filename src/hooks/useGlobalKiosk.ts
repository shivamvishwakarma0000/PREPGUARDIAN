import { useState, useEffect, useRef } from "react";

export function useGlobalKiosk(onInfraction: () => void, onComplete: () => void) {
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState(15);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [warningActive, setWarningActive] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && !warningActive && !isCompleted && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleSessionCompletion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, warningActive, isCompleted, timeLeft]);

  // Global Kiosk Mode enforcement
  useEffect(() => {
    if (!isActive || isCompleted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerDistractionProtocol();
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isActive && !isCompleted) {
        triggerDistractionProtocol();
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isActive && !isCompleted) {
        e.preventDefault();
        e.returnValue = "Are you sure you want to break your study session? This will result in a penalty.";
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isActive, isCompleted]);

  const isWarningRef = useRef(false);

  const triggerDistractionProtocol = async () => {
    if (isWarningRef.current) return;
    isWarningRef.current = true;
    setWarningActive(true);
    
    // Play an alarm sound
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
      oscillator.connect(audioCtx.destination);
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
      }, 1200);
    } catch (e) {
      console.error(e);
    }

    // Call serverless endpoint to log the strike
    try {
      await fetch("/api/strikes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Exited Global Kiosk Mode." })
      });
      onInfraction();
    } catch (err) {
      console.error("Failed to log strike", err);
    }
  };

  const startSession = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setIsCompleted(false);
      setTimeLeft(duration * 60);
      setIsActive(true);
    } catch (err) {
      alert("Error attempting to enable fullscreen mode: " + err);
    }
  };

  const handleSessionCompletion = async () => {
    setIsCompleted(true);
    setLoadingComplete(true);

    let xpReward = 20;
    let coinsReward = 10;
    let badgeToUnlock = "";

    if (duration === 30) {
      xpReward = 45;
      coinsReward = 20;
    } else if (duration === 60) {
      xpReward = 100;
      coinsReward = 50;
      badgeToUnlock = "Focus Master";
    } else if (duration === 120) {
      xpReward = 250;
      coinsReward = 120;
      badgeToUnlock = "Zenith Focus";
    }

    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xpReward, coinsReward, badgeToUnlock })
      });
      onComplete();
    } catch (err) {
      console.error("Failed to award session completion rewards", err);
    } finally {
      setLoadingComplete(false);
    }
  };

  const endSession = async () => {
    setIsActive(false);
    setTimeLeft(0);
    setIsCompleted(false);
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    }
  };

  const acknowledgeWarning = () => {
    isWarningRef.current = false;
    setWarningActive(false);
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const abortSessionSafely = async () => {
    setIsActive(false);
    setTimeLeft(0);
    setIsCompleted(false);
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    }
  };

  return {
    isActive,
    duration,
    setDuration,
    timeLeft,
    isCompleted,
    warningActive,
    loadingComplete,
    startSession,
    endSession,
    triggerDistractionProtocol,
    acknowledgeWarning,
    abortSessionSafely,
  };
}
