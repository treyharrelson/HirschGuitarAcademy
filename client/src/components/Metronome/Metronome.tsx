import { useState, useEffect } from "react";
import "./style.css";

export default function Metronome() {
  const [time, setTime] = useState(0);
  const [bpm, setBpm] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState("two");
  const [note, setNote] = useState("--");
  const [score, setScore] = useState(0);

  // Timer logic
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Format time
  const formatTime = () => {
    const mins = String(Math.floor(time / 60)).padStart(2, "0");
    const secs = String(time % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <div className="main">
      <div id="timer">{formatTime()}</div>

      <div id="score">{score}</div>

      <div id="current-note">
        <span id="current-note-text">{note}</span>
        <div id="sonar"></div>
      </div>

      <div className="bpm-container">
        <button onClick={() => setBpm(bpm - 1)}>-</button>
        <div className="bpm-display">{bpm}</div>
        <button onClick={() => setBpm(bpm + 1)}>+</button>
      </div>

      <div className="bpm-slider-container">
        <input
          type="range"
          min="20"
          max="200"
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
        />
      </div>

      <div className="bpm-speed">
        <label>
          <input
            type="radio"
            value="two"
            checked={speed === "two"}
            onChange={(e) => setSpeed(e.target.value)}
          />
          Two
        </label>

        <label>
          <input
            type="radio"
            value="four"
            checked={speed === "four"}
            onChange={(e) => setSpeed(e.target.value)}
          />
          Four
        </label>

        <label>
          <input
            type="radio"
            value="eight"
            checked={speed === "eight"}
            onChange={(e) => setSpeed(e.target.value)}
          />
          Eight
        </label>
      </div>

      <button onClick={() => setIsRunning(true)}>Start</button>
      <button onClick={() => setIsRunning(false)}>Stop</button>
    </div>
  );
}