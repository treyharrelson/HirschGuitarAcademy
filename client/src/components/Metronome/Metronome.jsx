import { useState, useEffect, useRef } from "react";
import "./metronome.css";

// example sound import (adjust filename if needed)
import clickSound from "./sounds/metronome-click.wav";

export default function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);

  const intervalRef = useRef<number | null>(null);

  // play click sound
  const playClick = () => {
    const audio = new Audio(clickSound);
    audio.currentTime = 0;
    audio.play();
  };

  // start metronome
  const start = () => {
    if (intervalRef.current) return;

    const interval = (60 / bpm) * 1000;

    intervalRef.current = window.setInterval(() => {
      playClick();
    }, interval);

    setIsPlaying(true);
  };

  // stop metronome
  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
  };

  // update interval when BPM changes
  useEffect(() => {
    if (isPlaying) {
      stop();
      start();
    }
  }, [bpm]);

  return (
    <div className="metronome-container">
      <div className="metronome-card">

        {/* TIME DISPLAY */}
        <div className="time-display">00:00</div>

        {/* BPM CONTROLS */}
        <div className="bpm-controls">
          <button onClick={() => setBpm((b) => Math.max(40, b - 1))}>-</button>
          <div className="bpm-value">{bpm}</div>
          <button onClick={() => setBpm((b) => Math.min(200, b + 1))}>+</button>
        </div>

        {/* SLIDER */}
        <input
          type="range"
          min="40"
          max="200"
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
        />

        {/* BEAT OPTIONS */}
        <div className="beat-options">
          <label>
            <input
              type="radio"
              name="beats"
              checked={beatsPerMeasure === 2}
              onChange={() => setBeatsPerMeasure(2)}
            />
            Two
          </label>

          <label>
            <input
              type="radio"
              name="beats"
              checked={beatsPerMeasure === 4}
              onChange={() => setBeatsPerMeasure(4)}
            />
            Four
          </label>

          <label>
            <input
              type="radio"
              name="beats"
              checked={beatsPerMeasure === 8}
              onChange={() => setBeatsPerMeasure(8)}
            />
            Eight
          </label>
        </div>

        {/* START / STOP BUTTON */}
        <button
          className="start-btn"
          onClick={isPlaying ? stop : start}
        >
          {isPlaying ? "Stop" : "Start"}
        </button>

      </div>
    </div>
  );
}