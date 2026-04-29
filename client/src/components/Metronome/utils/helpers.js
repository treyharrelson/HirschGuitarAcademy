const stopButtonElement = document.getElementById('stop');
const startButtonElement = document.getElementById('start');

export const updateBpmText = bpm => {
  document.getElementById('bpm').innerHTML = bpm;
};

export const updateBpmSlider = bpm => {
  document.getElementById('bpm-slider').value = `${bpm}`;
};

export const updateDOMControls = bpm => {
  updateBpmText(bpm);
  updateBpmSlider(bpm);
};

export const addEventListener = (id, type, callback) => {
  document.getElementById(id).addEventListener(type, callback);
};

export const showStartButton = () => {
  startButtonElement.style.display = 'block';
  stopButtonElement.style.display = 'none';
};

export const showStopButton = () => {
  startButtonElement.style.display = 'none';
  stopButtonElement.style.display = 'block';
};

export const showScore = ({ totalPlayed, totalCorrect }) => {
  const scoreDiv = document.getElementById('score');
  document.getElementById('current-note').style.display = 'none';
  scoreDiv.innerHTML = `Got ${totalCorrect} out of ${totalPlayed}.`;
  scoreDiv.style.display = 'block';
};

export const showCurrentNote = () => {
  document.getElementById('score').style.display = 'none';
  document.getElementById('current-note').style.display = 'block';
};
