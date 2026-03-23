// microphoneDetector.js

export async function startMicDetection(onSoundDetected) {

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();

    source.connect(analyser);

    const data = new Uint8Array(analyser.fftSize);

    function checkSound() {
        analyser.getByteTimeDomainData(data);

        let isSound = data.some(v => Math.abs(v - 128) > 10);

        if (isSound) {
            onSoundDetected();
        }

        requestAnimationFrame(checkSound);
    }

    checkSound();
}