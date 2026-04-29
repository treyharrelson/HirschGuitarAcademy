import {
  updateBpmText,
  showStopButton,
  showStartButton,
  updateBpmSlider,
  addEventListener,
  updateDOMControls,
  showCurrentNote,
  showScore,
} from './helpers.js';
import { Metronome } from './metronome.js';

const defaultBpm = 40;
const defaultSpeed = 'two';

const currentNoteElement = document.getElementById('current-note-text');

document.addEventListener('DOMContentLoaded', () => {
  const metronome = new Metronome(
    defaultBpm,
    defaultSpeed,
    20000,
    note => {
      currentNoteElement.innerText = note.toUpperCase();
    },
    timeLeft => {
      document.getElementById('timer').innerText = timeLeft;
    },
    () => {
      const sonar = document.getElementById('sonar');
      sonar.classList.add('sonar-on');

      setTimeout(() => sonar.classList.remove('sonar-on'), 500);
    },
    ({ totalPlayed, totalCorrect }) => {
      new Audio('./sounds/gong.wav').play();
      showScore({ totalPlayed, totalCorrect });
      showStartButton();
    },
  );

  const initialBpm = metronome.getBpm();

  updateBpmText(initialBpm);
  updateBpmSlider(initialBpm);

  addEventListener('bpm-minus', 'click', () => {
    metronome.updateBpm(metronome.getBpm() - 1);
    updateDOMControls(metronome.getBpm());
  });

  addEventListener('bpm-plus', 'click', () => {
    metronome.updateBpm(metronome.getBpm() + 1);
    updateDOMControls(metronome.getBpm());
  });

  addEventListener('bpm-slider', 'input', evt => {
    metronome.updateBpm(evt.target.valueAsNumber);
    updateDOMControls(metronome.getBpm());
  });

  addEventListener('start', 'click', () => {
    metronome.start();
    showCurrentNote();
    showStopButton();
  });

  addEventListener('stop', 'click', () => {
    metronome.stop();
    showStartButton();
    currentNoteElement.innerText = '--';
    document.getElementById('timer').innerText = '00:00';
  });

  addEventListener('radio-two', 'change', () => {
    metronome.updateSpeed('two');
  });

  addEventListener('radio-four', 'change', () => {
    metronome.updateSpeed('four');
  });

  addEventListener('radio-eight', 'change', () => {
    metronome.updateSpeed('eight');
  });

  document.addEventListener('keypress', evt => {
    if (evt.code === 'Space') {
      if (metronome.metronomeIsActive()) {
        metronome.stop();
        showStartButton();
        currentNoteElement.innerText = '--';
        document.getElementById('timer').innerText = '00:00';
      } else {
        setTimeout(() => {
          metronome.start();
          showCurrentNote();
          showStopButton();
        }, 1000);
      }
    }
  });
});
