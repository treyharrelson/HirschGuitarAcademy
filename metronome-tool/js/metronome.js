import { Pitch } from './pitch.js';
import { Timer } from './timer.js';

const oneMinute = 60000;

const notes = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
// const notes = ['e'];

const speedIntervalMap = {
  two: 2,
  four: 4,
  eight: 8,
};

const successChime = new Audio('./sounds/success-chime.wav');

export class Metronome {
  #bpm;
  #speed;
  #currentNote;
  #position = 0;
  #noteUpdateEvent;
  #intervalInstance;
  #isPlaying = false;

  #pitchMachine;
  #gotCurrentCorrect = null;
  #halfwayBeat;

  #totalCorrect = 0;
  #totalPlayed = 0;

  #timeToPractice;
  #aboutToEnd = false;
  #timer;
  #timerUpdateEvent;
  #practiceCompleteEvent;
  #correctNoteEvent;

  constructor(
    bpm,
    speed,
    timeToPractice,
    noteUpdateCallback,
    timerUpdateCallback,
    correctNoteCallback,
    practiceCompleteCallback,
  ) {
    this.#bpm = bpm;
    this.#speed = speed;
    this.#noteUpdateEvent = noteUpdateCallback;
    this.#halfwayBeat = speedIntervalMap[speed] / 2;
    this.#timeToPractice = timeToPractice;
    this.#timerUpdateEvent = timerUpdateCallback;
    this.#practiceCompleteEvent = practiceCompleteCallback;
    this.#correctNoteEvent = correctNoteCallback;
  }

  start() {
    this.#timer = new Timer(
      this.#timeToPractice,
      ({ stringVal, secondsRemaining }) => {
        this.#timerUpdateEvent(stringVal);

        if (secondsRemaining === 0) {
          this.#aboutToEnd = true;
        }
      },
    );

    this.#timer.start();

    this.#isPlaying = true;

    this.#totalCorrect = 0;
    this.#totalPlayed = 0;

    this.#pitchMachine = new Pitch(notePlayed => {
      if (
        this.#position - 1 !== this.#halfwayBeat ||
        this.#gotCurrentCorrect === false
      ) {
        return;
      }

      if (notePlayed.toLowerCase() === this.#currentNote.toLowerCase()) {
        if (this.#gotCurrentCorrect) return;

        successChime.pause();
        successChime.currentTime = 0;
        successChime.play();
        this.#gotCurrentCorrect = true;
        this.#totalCorrect += 1;
        this.#correctNoteEvent();
      }
    });

    this.#pitchMachine.init();

    const intervalFn = () => {
      if (this.#position === speedIntervalMap[this.#speed]) {
        this.#position = 0;
      }

      if (this.#position === 0) {
        if (this.#aboutToEnd) {
          this.stop();
          this.#practiceCompleteEvent({
            totalPlayed: this.#totalPlayed,
            totalCorrect: this.#totalCorrect,
          });

          return;
        }

        this.#gotCurrentCorrect = null;
        this.#totalPlayed += 1;
        this.#setRandomNote();
        this.#sayNote();
        this.#playClick();
      } else {
        if (this.#position === this.#halfwayBeat) {
          this.#playNote();
        }

        this.#playClick();
      }

      this.#position += 1;
    };

    // intervalFn();

    this.#intervalInstance = setInterval(
      intervalFn,
      (oneMinute * 2) / speedIntervalMap[this.#speed] / this.#bpm,
    );
  }

  stop() {
    this.#timer.stop();
    this.#isPlaying = false;
    this.#clearInterval();
    this.#aboutToEnd = false;
    this.#currentNote = undefined;
    this.#position = 0;
    this.#gotCurrentCorrect = null;
  }

  getBpm() {
    return this.#bpm;
  }

  updateBpm(bpm) {
    this.#clearInterval();

    this.#bpm = bpm;

    if (this.#isPlaying) {
      this.start();
    }
  }

  updateSpeed(speed) {
    this.#clearInterval();
    this.#position = 0;

    this.#speed = speed;
    this.#halfwayBeat = speedIntervalMap[speed] / 2;

    if (this.#isPlaying) {
      this.start();
    }
  }

  getCurrentNote() {
    return this.#currentNote;
  }

  metronomeIsActive() {
    return this.#isPlaying;
  }

  #clearInterval() {
    clearInterval(this.#intervalInstance);
  }

  #setRandomNote() {
    this.#currentNote = notes[[Math.floor(Math.random() * notes.length)]];
    this.#noteUpdateEvent(this.#currentNote);
  }

  #playClick() {
    new Audio('./sounds/metronome-click.wav').play();
  }

  #playNote() {
    // new Audio(`./sounds/note/${this.#currentNote}.wav`).play();
  }

  #sayNote() {
    new Audio(`./sounds/voice/${this.#currentNote}.wav`).play();
  }
}
