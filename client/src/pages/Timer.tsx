import { useEffect, useRef, useState } from "react";

export default function Timer() {
  const [totalSeconds, setTotalSeconds] = useState(3600);
  const [remainingSeconds, setRemainingSeconds] = useState(3600);
  const [mode, setMode] = useState<"countdown" | "countup">("countdown");
  const [isRunning, setIsRunning] = useState(false);
  const [minutesInput, setMinutesInput] = useState(60);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const circumference = 2 * Math.PI * 100;

  const formatTime = () => {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const progress =
    mode === "countdown"
      ? remainingSeconds / totalSeconds
      : (remainingSeconds % totalSeconds) / totalSeconds;

  const strokeDashoffset = circumference - progress * circumference;

  const startTimer = () => {
    if (intervalRef.current) return;

    let newTotal = minutesInput * 60;

    if (mode === "countdown") {
      setTotalSeconds(newTotal);
      if (remainingSeconds === totalSeconds) {
        setRemainingSeconds(newTotal);
      }
    }

    if (mode === "countup" && remainingSeconds === 0) {
      setTotalSeconds(newTotal);
    }

    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (mode === "countdown") {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            beep();
            alert("Session Complete 🎸");
            return 0;
          }
          return prev - 1;
        } else {
          return prev + 1;
        }
      });
    }, 1000);
  };

  const pauseTimer = () => {
    clearInterval(intervalRef.current!);
    intervalRef.current = null;
    setIsRunning(false);
  };

  const resetTimer = () => {
    pauseTimer();
    if (mode === "countdown") {
      const newTotal = minutesInput * 60;
      setTotalSeconds(newTotal);
      setRemainingSeconds(newTotal);
    } else {
      setRemainingSeconds(0);
    }
  };

  const toggleMode = () => {
    pauseTimer();

    if (mode === "countdown") {
      setMode("countup");
      setRemainingSeconds(0);
    } else {
      const newTotal = minutesInput * 60;
      setMode("countdown");
      setTotalSeconds(newTotal);
      setRemainingSeconds(newTotal);
    }
  };

  const beep = () => {
    const audio = new Audio("https://www.soundjay.com/buttons/sounds/beep-07.mp3");
    audio.play();
  };

  useEffect(() => {
    return () => pauseTimer();
  }, []);

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <h1>🎸 Practice Timer</h1>

        <div style={styles.timerWrapper}>
          <svg width="220" height="220" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="110" cy="110" r="100" style={styles.bgCircle} />
            <circle
              cx="110"
              cy="110"
              r="100"
              style={{
                ...styles.progressCircle,
                strokeDasharray: circumference,
                strokeDashoffset,
              }}
            />
          </svg>

          <div style={styles.timeDisplay}>{formatTime()}</div>
        </div>

        <input
          type="number"
          value={minutesInput}
          min={1}
          onChange={(e) => setMinutesInput(Number(e.target.value))}
          style={styles.input}
        />

        <div style={styles.buttons}>
          <button onClick={startTimer}>Start</button>
          <button onClick={pauseTimer}>Pause</button>
          <button onClick={resetTimer}>Reset</button>
          <button onClick={toggleMode}>
            Mode: {mode === "countdown" ? "Countdown" : "Count Up"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: any = {
  body: {
    background: "#0f0f14",
    color: "white",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    background: "#181820",
    padding: "40px",
    borderRadius: "20px",
    textAlign: "center",
    width: "350px",
  },
  timerWrapper: {
    position: "relative",
    width: "220px",
    height: "220px",
    margin: "0 auto 30px",
  },
  timeDisplay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: "36px",
  },
  input: {
    width: "80px",
    padding: "8px",
    marginBottom: "20px",
  },
  buttons: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  bgCircle: {
    fill: "none",
    stroke: "#2a2a35",
    strokeWidth: 10,
  },
  progressCircle: {
    fill: "none",
    stroke: "#ff9f1c",
    strokeWidth: 10,
    strokeLinecap: "round",
  },
};