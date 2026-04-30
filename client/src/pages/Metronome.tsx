import React from "react";
import { MetronomeUtils, type Speed } from "../hooks/MetronomeUtils";

export default function Metronome() {
  // 1. Destructure everything from the hook
  const {
    bpm, setBpm,
    speed, setSpeed,
    isPlaying,
    currentNote,
    timeLeft,
    isSonarActive,
    score,
    start,
    stop
  } = MetronomeUtils(120, 'four');

  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-screen bg-[#1c3144] text-white font-sans gap-[40px] p-4">
      
      {/* TIMER DISPLAY */}
      <div className="text-6xl font-mono tracking-tighter opacity-80">
        {timeLeft}
      </div>

      {/* SONAR / NOTE DISPLAY */}
      <div className="relative z-0 overflow-hidden flex justify-center items-center h-[300px] w-[300px]">
        <div className="font-serif text-[#7ea16b] font-black text-[200px] z-10 select-none">
          {currentNote}
        </div>
        <div 
          className={`absolute top-0 left-0 w-full h-full rounded-full bg-[#415e52] pointer-events-none ${
            isSonarActive ? "animate-[sonarWave_0.5s_linear]" : "opacity-0"
          }`}
        />
      </div>

      {/* SPEED / MEASURE SELECTOR */}
      <div className="flex bg-white/10 p-1 rounded-xl gap-2">
        {(['two', 'four', 'eight'] as Speed[]).map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              speed === s ? "bg-[#7ea16b] text-[#1c3144]" : "text-white/60 hover:text-white"
            }`}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      {/* BPM DISPLAY & STEP BUTTONS */}
      <div className="flex gap-[50px] items-center">
        <button 
          className="cursor-pointer p-4 bg-[#596f62] rounded-full h-12 w-12 flex items-center justify-center text-4xl select-none hover:bg-[#4a5c52] transition-colors"
          onClick={() => setBpm((b: any) => Math.max(40, b - 1))}
        >
          -
        </button>
        <div className="text-[32px] w-[120px] text-center font-bold leading-tight">
          {bpm} <span className="text-sm block font-normal opacity-60">BPM</span>
        </div>
        <button 
          className="cursor-pointer p-4 bg-[#596f62] rounded-full h-12 w-12 flex items-center justify-center text-4xl select-none hover:bg-[#4a5c52] transition-colors"
          onClick={() => setBpm((b: any) => Math.min(200, b + 1))}
        >
          +
        </button>
      </div>

      {/* SLIDER CONTAINER */}
      <div className="w-[300px]">
        <input 
          type="range" 
          min="40" 
          max="200" 
          value={bpm} 
          onChange={(e) => setBpm(Number(e.target.value))}
          className="w-full h-[7px] bg-white/60 rounded-lg appearance-none cursor-pointer 
            [&::-webkit-slider-thumb]:appearance-none 
            [&::-webkit-slider-thumb]:w-[25px] 
            [&::-webkit-slider-thumb]:h-[25px] 
            [&::-webkit-slider-thumb]:bg-[#7ea16b] 
            [&::-webkit-slider-thumb]:rounded-full shadow-lg"
        />
      </div>

      {/* START / STOP BUTTON */}
      <div className="flex flex-col items-center gap-4">
        <button 
          onClick={isPlaying ? stop : start}
          className={`px-8 py-4 w-[180px] font-bold rounded-xl cursor-pointer transition-all shadow-xl active:scale-95 ${
            isPlaying ? "bg-red-500 hover:bg-red-600" : "bg-[#c3d898] text-[#1c3144] hover:bg-[#b0c880]"
          }`}
        >
          {isPlaying ? "STOP PRACTICE" : "START PRACTICE"}
        </button>
        
        {/* SCORE DISPLAY (Optional) */}
        {score.totalPlayed > 0 && (
          <p className="text-[#7ea16b] font-bold text-sm">
            Progress: {score.totalPlayed} notes played
          </p>
        )}
      </div>

      <style>{`
        @keyframes sonarWave {
          from { opacity: 0.4; transform: scale(1); }
          to { transform: scale(3); opacity: 0; }
        }
      `}</style>
    </div>
  );
}