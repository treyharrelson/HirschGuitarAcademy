// timer.js

let isRunning = false;

export function startTimer() {
    isRunning = true;
    console.log("Timer started");
}

export function pauseTimer() {
    if (isRunning) {
        isRunning = false;
        console.log("Timer paused");
    }
}

export function resumeTimer() {
    if (!isRunning) {
        isRunning = true;
        console.log("Timer resumed");
    }
}

export function isTimerRunning() {
    return isRunning;
}