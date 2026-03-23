// activityDetector.js

export function startActivityDetection(onActivity) {

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];

    events.forEach(event => {
        window.addEventListener(event, () => {
            onActivity();
        });
    });

}