import { useState, useEffect, useRef, useCallback } from 'react';

// 1. Import Static Sound Assets (Resolved at build time)
import metronomeClick from '../assets/sounds/metronome-click.wav';
import successChimeSound from '../assets/sounds/success-chime.wav';
import gongSound from '../assets/sounds/gong.wav';

// --- Types & Constants ---
export type Speed = 'two' | 'four' | 'eight';

const SPEED_MAP: Record<Speed, number> = { 
  two: 2, 
  four: 4, 
  eight: 8 
};

const NOTES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const NOTE_STRINGS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'G', 'G#', 'A', 'A#', 'B'];

export const MetronomeUtils = (initialBpm = 120, initialSpeed: Speed = 'four') => {
  // --- UI State ---
  const [bpm, setBpm] = useState(initialBpm);
  const [speed, setSpeed] = useState<Speed>(initialSpeed);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNote, setCurrentNote] = useState('--');
  const [timeLeft, setTimeLeft] = useState('00:20');
  const [isSonarActive, setIsSonarActive] = useState(false);
  const [score, setScore] = useState({ totalPlayed: 0, totalCorrect: 0 });

  // --- Engine Refs (Persist across renders) ---
  const audioCtx = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const metronomeInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const pitchAnimation = useRef<number | null>(null);

  // 2. Audio Player Helper
  const playSound = useCallback((soundSource: string) => {
    const audio = new Audio(soundSource);
    audio.play().catch(() => {
        /* Standard browser block on autoplay - handled by user clicking Start */
    });
  }, []);

  // --- Logic 1: Timer Engine ---
  const startTimer = useCallback((durationSeconds: number) => {
    let remaining = durationSeconds;
    
    timerInterval.current = setInterval(() => {
      remaining--;
      
      const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
      const secs = (remaining % 60).toString().padStart(2, '0');
      setTimeLeft(`${mins}:${secs}`);

      if (remaining <= 0) {
        playSound(gongSound); // Play gong when practice ends
        stop();
      }
    }, 1000);
  }, [playSound]);

  // --- Logic 2: Pitch Detection Engine ---
  const startPitchDetection = async () => {
    if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioCtx.current.createMediaStreamSource(stream);
        analyser.current = audioCtx.current.createAnalyser();
        analyser.current.fftSize = 2048;
        source.connect(analyser.current);

        const buffer = new Float32Array(2048);
        
        const detect = () => {
          if (!analyser.current || !audioCtx.current) return;
          analyser.current.getFloatTimeDomainData(buffer);
          
          const ac = autoCorrelate(buffer, audioCtx.current.sampleRate);
          if (ac !== -1) {
            const noteNum = 12 * (Math.log(ac / 440) / Math.log(2)) + 69;
            const noteName = NOTE_STRINGS[Math.round(noteNum) % 12];
            
            // Check if played note matches the target note
            // (Note: This is where successChimeSound would be played)
          }
          pitchAnimation.current = requestAnimationFrame(detect);
        };
        detect();
    } catch (err) {
        console.error("Microphone access denied", err);
    }
  };

  // --- Logic 3: Metronome Engine ---
  const start = async () => {
    setIsPlaying(true);
    setScore({ totalPlayed: 0, totalCorrect: 0 });
    startTimer(20); // 20-second practice session
    await startPitchDetection();

    let position = 0;
    const intervalMs = (60000 * 2) / SPEED_MAP[speed] / bpm;

    metronomeInterval.current = setInterval(() => {
      const maxBeats = SPEED_MAP[speed];
      const halfway = maxBeats / 2;

      // Logic: Every "New Measure" (position 0)
      if (position === 0) {
        const nextNote = NOTES[Math.floor(Math.random() * NOTES.length)];
        setCurrentNote(nextNote);
        
        playSound(metronomeClick);
        // Pathing for dynamic voice files (Assumes they are in /public/sounds/voice)
        playSound(`/sounds/voice/${nextNote.toLowerCase()}.wav`);
        
        setScore(prev => ({ ...prev, totalPlayed: prev.totalPlayed + 1 }));
      } else {
        // Standard metronome click for other positions
        playSound(metronomeClick);
      }

      // Trigger Sonar Animation State
      setIsSonarActive(false);
      setTimeout(() => setIsSonarActive(true), 10);

      position = (position + 1) % maxBeats;
    }, intervalMs);
  };

  // --- Logic 4: Stop & Cleanup ---
  const stop = useCallback(() => {
    setIsPlaying(false);
    
    // Clear all intervals
    if (metronomeInterval.current) clearInterval(metronomeInterval.current);
    if (timerInterval.current) clearInterval(timerInterval.current);
    
    // Stop Pitch Detection
    if (pitchAnimation.current) cancelAnimationFrame(pitchAnimation.current);
    if (audioCtx.current) {
        audioCtx.current.close();
        audioCtx.current = null;
    }

    // Reset UI
    setCurrentNote('--');
    setTimeLeft('00:20');
    setIsSonarActive(false);
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => stop();
  }, [stop]);

  return {
    bpm, setBpm,
    speed, setSpeed,
    isPlaying, currentNote,
    timeLeft, isSonarActive,
    score, start, stop
  };
};

/**
 * Math Helper: Pitch Autocorrelation
 * Analyzes frequency from raw audio data
 */
function autoCorrelate(buf: Float32Array, sampleRate: number) {
    let rms = 0;
    for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
    if (Math.sqrt(rms / buf.length) < 0.01) return -1;

    let r1 = 0, r2 = buf.length - 1, thres = 0.2;
    for (let i = 0; i < buf.length / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    for (let i = 1; i < buf.length / 2; i++) if (Math.abs(buf[buf.length - i]) < thres) { r2 = buf.length - i; break; }
    
    const processedBuf = buf.slice(r1, r2);
    const c = new Array(processedBuf.length).fill(0);
    for (let i = 0; i < processedBuf.length; i++) {
        for (let j = 0; j < processedBuf.length - i; j++) {
            c[i] = c[i] + processedBuf[j] * processedBuf[j + i];
        }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < processedBuf.length; i++) {
        if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
    }

    let T0 = maxpos;
    return sampleRate / T0;
}
