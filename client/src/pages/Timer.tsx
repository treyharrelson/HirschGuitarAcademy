import { useTimer } from "../context/TimerProvider";

export default function Timer() {
  const {
    remainingSeconds,
    isRunning,
    mode,
    totalSeconds,
    minutesInput,
    startTimer,
    pauseTimer,
    resetTimer,
    setMinutesInput,
    toggleMode,
    formatTime,
  } = useTimer();

  const circumference = 2 * Math.PI * 100;

  // Calculate progress based on global state
  const progress = mode === "countdown"
    ? remainingSeconds / totalSeconds
    : (remainingSeconds % 60) / 60; // Smooth rotation for count-up

  const strokeDashoffset = circumference - (isNaN(progress) ? 0 : progress) * circumference;

  return (
    <div className="min-h-screen bg-[#0f0f14] text-white flex justify-center items-center font-sans p-4">
      <div className="bg-[#181820] p-10 rounded-[20px] text-center w-full max-w-[380px] shadow-2xl border border-white/5">
        <h1 className="text-2xl font-bold mb-8 tracking-tight">🎸 Practice Timer</h1>

        {/* Circular Progress Display */}
        <div className="relative w-[220px] h-[220px] mx-auto mb-10">
          <svg width="220" height="220" className="rotate-[-90deg]">
            {/* Background Circle */}
            <circle
              cx="110"
              cy="110"
              r="100"
              className="fill-none stroke-[#2a2a35] stroke-[10px]" />
            {/* Progress Circle */}
            <circle
              cx="110"
              cy="110"
              r="100"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
              }}
              className="fill-none stroke-[#ff9f1c] stroke-[10px] transition-all duration-1000 ease-linear rounded-full"
              strokeLinecap="round" />
          </svg>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-mono tracking-widest">
            {formatTime(remainingSeconds)}
          </div>
        </div>

        {/* Settings */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/50 uppercase font-bold tracking-tighter">
              Minutes
            </span>
            <input
              type="number"
              value={minutesInput}
              min={1}
              onChange={(e) => setMinutesInput(Number(e.target.value))}
              disabled={isRunning} // Prevent editing while running
              className={`w-20 bg-[#2a2a35] border-none text-white p-2 rounded-lg text-center font-bold outline-none focus:ring-2 focus:ring-[#ff9f1c] ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`} />
          </div>
          <button
            onClick={toggleMode}
            className="text-[10px] uppercase tracking-[0.2em] font-black py-1.5 px-4 rounded-full border border-white/10 hover:bg-white/5 transition-colors">
            Mode: {mode === "countdown" ? "Countdown" : "Count Up"}
          </button>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-3">
          {!isRunning ? (
            <button
              onClick={startTimer}
              className="col-span-2 py-4 bg-[#ff9f1c] text-[#0f0f14] font-black rounded-xl hover:bg-[#ffb551] transition-all active:scale-95 uppercase tracking-widest">
              {/* Logic to determine if we should say 'Resume' or 'Start Session' */}
              {mode === "countdown"
                ? (remainingSeconds < totalSeconds ? "Resume" : "Start Session")
                : (remainingSeconds > 0 ? "Resume" : "Start Session")
              }
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="col-span-2 py-4 bg-white/10 text-white font-black rounded-xl hover:bg-white/20 transition-all active:scale-95 uppercase tracking-widest">
              Pause
            </button>
          )}
          <button
            onClick={resetTimer}
            className="py-3 bg-[#2a2a35] text-white/70 font-bold rounded-xl hover:bg-[#363644] transition-all text-xs uppercase">
            Reset
          </button>
          <button
            className="py-3 bg-[#2a2a35] text-white/70 font-bold rounded-xl hover:bg-[#363644] transition-all text-xs uppercase"
            onClick={resetTimer}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}