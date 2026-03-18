// main.js

import { startTimer, pauseTimer, resumeTimer } from "./timer.js";
import { startActivityDetection } from "./activityDetector.js";
import { startMicDetection } from "./microphoneDetector.js";

let lastActivityTime = Date.now();

const WARNING_TIME = 1 * 60 * 1000; // 1 minute
const TIMEOUT = 2 * 60 * 1000;      // 2 minutes

let warningShown = false;

function updateActivity() {
    lastActivityTime = Date.now();

    // Reset warning state
    warningShown = false;

    resumeTimer();
}

// Start systems
startTimer();
startActivityDetection(updateActivity);
startMicDetection(updateActivity);

// Watch inactivity
setInterval(() => {
    const now = Date.now();
    const inactivity = now - lastActivityTime;

    // ⚠️ Show warning once
    if (inactivity >= WARNING_TIME && !warningShown) {
        warningShown = true;
        showWarning();
    }

    // ⛔ Pause after full timeout
    if (inactivity >= TIMEOUT) {
        pauseTimer();
    }

}, 1000);