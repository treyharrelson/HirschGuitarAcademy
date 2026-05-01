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
    <div className="min-h-screen bg-gray-50 text-slate-800 flex justify-center items-center font-sans p-4">
      <div className="bg-white p-10 rounded-[32px] text-center w-full max-w-[380px] shadow-2xl border border-gray-100">
        <h1 className="text-2xl font-bold mb-8 tracking-tight text-slate-800">🎸 Practice Timer</h1>

        {/* Circular Progress Display */}
        <div className="relative w-[220px] h-[220px] mx-auto mb-10">
          <svg width="220" height="220" className="rotate-[-90deg]">
            {/* Background Circle */}
            <circle
              cx="110"
              cy="110"
              r="100"
            {/* Progress Circle */}
              className="fill-none stroke-slate-100 stroke-[10px]" />
            <circle
              cx="110"
              cy="110"
              r="100"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
              }}
              className="fill-none stroke-[#22d3ee] stroke-[10px] transition-all duration-1000 ease-linear rounded-full"
              strokeLinecap="round" />
          </svg>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-mono tracking-widest text-slate-800 font-bold">
            {formatTime(remainingSeconds)}
          </div>
        </div>

        {/* Settings */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400 uppercase font-bold tracking-tighter">
              Minutes
            </span>
            <input
              type="number"
              value={minutesInput}
              min={1}
              onChange={(e) => setMinutesInput(Number(e.target.value))}
              disabled={isRunning}
              // Keep original focus ring color
              className={`w-20 bg-slate-50 border border-slate-200 text-slate-800 p-2 rounded-xl text-center font-bold outline-none focus:ring-2 focus:ring-[#ff9f1c] ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`} />
          </div>
          <button
            onClick={toggleMode}
            className="text-[10px] uppercase tracking-[0.2em] font-black py-1.5 px-4 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
            Mode: {mode === "countdown" ? "Countdown" : "Count Up"}
          </button>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-3">
          {!isRunning ? (
            <button
              onClick={startTimer}
              // Keep original green background
              className="col-span-2 py-4 bg-green-500 text-white font-black rounded-xl hover:bg-green-400 transition-all active:scale-95 uppercase tracking-widest shadow-lg shadow-green-100">
              {mode === "countdown"
                ? (remainingSeconds < totalSeconds ? "Resume" : "Start Session")
                : (remainingSeconds > 0 ? "Resume" : "Start Session")
              }
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="col-span-2 py-4 bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200 transition-all active:scale-95 uppercase tracking-widest">
              Pause
            </button>
          )}
          <button
            onClick={resetTimer}
            className="py-3 bg-slate-50 text-slate-500 font-bold rounded-xl hover:bg-slate-100 transition-all text-xs uppercase border border-slate-200">
            Reset
          </button>
          <button
            className="py-3 bg-slate-50 text-slate-500 font-bold rounded-xl hover:bg-slate-100 transition-all text-xs uppercase border border-slate-200"
            onClick={resetTimer}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}