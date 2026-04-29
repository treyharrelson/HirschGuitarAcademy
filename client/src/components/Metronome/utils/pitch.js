const buf = new Float32Array(2048);
const noteStrings = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

export class Pitch {
  #analyser;
  #audioContext;
  #notePlayedEvent;

  constructor(notePlayedCallback) {
    this.#audioContext = new AudioContext();
    this.#notePlayedEvent = notePlayedCallback;
  }

  init() {
    navigator.mediaDevices
      .getUserMedia({
        audio: {
          mandatory: {
            googEchoCancellation: 'false',
            googAutoGainControl: 'false',
            googNoiseSuppression: 'false',
            googHighpassFilter: 'false',
          },
          optional: [],
        },
      })
      .then(stream => {
        const mediaStreamSource =
          this.#audioContext.createMediaStreamSource(stream);
        this.#analyser = this.#audioContext.createAnalyser();
        this.#analyser.fftSize = 2048;

        mediaStreamSource.connect(this.#analyser);

        this.#updatePitch(this.#analyser);
      })
      .catch(err => {
        console.error(`${err.name}: ${err.message}`);
        alert('Stream generation failed.');
      });
  }

  #updatePitch(analyser) {
    analyser.getFloatTimeDomainData(buf);
    const ac = this.#autoCorrelate(buf, this.#audioContext.sampleRate);

    if (ac !== -1) {
      const pitch = ac;
      const note = this.#noteFromPitch(pitch);

      const noteLetter = noteStrings[note % 12];

      this.#notePlayedEvent(noteLetter);
    }

    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = window.webkitRequestAnimationFrame;
    }

    window.requestAnimationFrame(() => this.#updatePitch(analyser));
  }

  #noteFromPitch(frequency) {
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    return Math.round(noteNum) + 69;
  }

  #centsOffFromPitch(frequency, note) {
    return Math.floor(
      (1200 * Math.log(frequency / this.#frequencyFromNoteNumber(note))) /
        Math.log(2),
    );
  }

  #frequencyFromNoteNumber(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  #autoCorrelate(buf, sampleRate) {
    let SIZE = buf.length;
    let rms = 0;

    for (var i = 0; i < SIZE; i++) {
      var val = buf[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1;

    var r1 = 0,
      r2 = SIZE - 1,
      thres = 0.2;
    for (var i = 0; i < SIZE / 2; i++)
      if (Math.abs(buf[i]) < thres) {
        r1 = i;
        break;
      }
    for (var i = 1; i < SIZE / 2; i++)
      if (Math.abs(buf[SIZE - i]) < thres) {
        r2 = SIZE - i;
        break;
      }

    buf = buf.slice(r1, r2);
    SIZE = buf.length;

    var c = new Array(SIZE).fill(0);
    for (var i = 0; i < SIZE; i++)
      for (var j = 0; j < SIZE - i; j++) c[i] = c[i] + buf[j] * buf[j + i];

    var d = 0;
    while (c[d] > c[d + 1]) d++;
    var maxval = -1,
      maxpos = -1;
    for (var i = d; i < SIZE; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
    var T0 = maxpos;

    var x1 = c[T0 - 1],
      x2 = c[T0],
      x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
  }
}
