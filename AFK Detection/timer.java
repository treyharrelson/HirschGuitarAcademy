let timer;
let isRunning = false;
let mode = "down"; // "down" or "up"
let timeLeft = 60 * 60; // seconds
let startTimestamp = null;

// Load saved state
window.onload = () => {
  const saved = JSON.parse(localStorage.getItem("timerState"));
  if (saved) {
    timeLeft = saved.timeLeft;
    mode = saved.mode;
    isRunning = saved.isRunning;
    startTimestamp = saved.startTimestamp;

    if (isRunning) {
      resumeTimer();
    }
  }
  updateDisplay();
};

// Save state
function saveState() {
  localStorage.setItem("timerState", JSON.stringify({
    timeLeft,
    mode,
    isRunning,
    startTimestamp
  }));
}

// Format time
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Update UI
function updateDisplay() {
  document.getElementById("display").innerText = formatTime(timeLeft);
}

// Start
function startTimer() {
  if (isRunning) return;

  const input = document.getElementById("minutes").value;
  if (input && !isRunning) {
    timeLeft = input * 60;
  }

  isRunning = true;
  startTimestamp = Date.now();

  timer = setInterval(tick, 1000);
  saveState();
}

// Resume after reload
function resumeTimer() {
  const now = Date.now();
  const elapsed = Math.floor((now - startTimestamp) / 1000);

  if (mode === "down") {
    timeLeft -= elapsed;
  } else {
    timeLeft += elapsed;
  }

  startTimestamp = now;
  timer = setInterval(tick, 1000);
}

// Tick logic
function tick() {
  if (mode === "down") {
    timeLeft--;

    if (timeLeft <= 0) {
      timeLeft = 0;
      document.getElementById("beep").play();
      alert("Timer Done!");
      pauseTimer();
    }

  } else {
    timeLeft++;
  }

  updateDisplay();
  saveState();
}

// Pause
function pauseTimer() {
  clearInterval(timer);
  isRunning = false;
  saveState();
}

// Reset
function resetTimer() {
  pauseTimer();
  timeLeft = 60 * 60;
  updateDisplay();
  saveState();
}

// Toggle Mode
function toggleMode() {
  mode = (mode === "down") ? "up" : "down";
  document.querySelector("button[onclick='toggleMode()']")
    .innerText = `Mode: ${mode === "down" ? "Down" : "Up"}`;
  saveState();
}

const timerBox = document.getElementById("timer");
const dragHandle = document.getElementById("drag-handle");

let offsetX, offsetY, isDragging = false;

dragHandle.onmousedown = (e) => {
  isDragging = true;
  offsetX = e.clientX - timerBox.offsetLeft;
  offsetY = e.clientY - timerBox.offsetTop;
};

document.onmousemove = (e) => {
  if (isDragging) {
    timerBox.style.left = (e.clientX - offsetX) + "px";
    timerBox.style.top = (e.clientY - offsetY) + "px";
  }
};

document.onmouseup = () => {
  isDragging = false;
};