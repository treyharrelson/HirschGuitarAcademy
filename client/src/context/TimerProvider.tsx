import React, { createContext, useContext, useState, useEffect, useRef } from "react";

interface TimerContextType {
  remainingSeconds: number;
  isRunning: boolean;
  mode: "countdown" | "countup";
  totalSeconds: number;
  minutesInput: number;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  setMinutesInput: (mins: number) => void;
  setMode: (mode: "countdown" | "countup") => void;
  toggleMode: () => void;
  formatTime: (seconds: number) => string;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider = ({ children }: { children: React.ReactNode }) => {
  const [totalSeconds, setTotalSeconds] = useState(3600);
  const [remainingSeconds, setRemainingSeconds] = useState(3600);
  const [mode, setMode] = useState<"countdown" | "countup">("countdown");
  const [isRunning, setIsRunning] = useState(false);
  const [minutesInput, setMinutesInput] = useState(60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const startTimer = () => {
    if (intervalRef.current) return;
    let newTotal = minutesInput * 60;
    if (mode === "countdown" && remainingSeconds === totalSeconds) {
        setTotalSeconds(newTotal);
        setRemainingSeconds(newTotal);
    }
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (mode === "countdown") {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            new Audio("https://www.soundjay.com/buttons/sounds/beep-07.mp3").play();
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  };

  const resetTimer = () => {
    pauseTimer();
    const newTotal = minutesInput * 60;
    setTotalSeconds(newTotal);
    setRemainingSeconds(mode === "countdown" ? newTotal : 0);
  };

  const toggleMode = () => {
    pauseTimer();
    const newMode = mode === "countdown" ? "countup" : "countdown";
    setMode(newMode);
    setRemainingSeconds(newMode === "countdown" ? minutesInput * 60 : 0);
  };

  return (
    <TimerContext.Provider value={{ 
        remainingSeconds, isRunning, mode, totalSeconds, minutesInput, 
        startTimer, pauseTimer, resetTimer, setMinutesInput, setMode, toggleMode, formatTime 
    }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) throw new Error("useTimer must be used within TimerProvider");
  return context;
};