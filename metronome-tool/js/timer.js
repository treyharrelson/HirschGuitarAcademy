export class Timer {
  #timer;
  #totalTime;
  #updateEvent;

  constructor(totalTime, updateCallback) {
    this.#totalTime = totalTime;
    this.#updateEvent = updateCallback;
  }

  start() {
    let timer = this.#totalTime / 1000;
    let minutes;
    let seconds;
    let duration;

    const intervalFn = () => {
      minutes = parseInt(timer / 60, 10);
      seconds = parseInt(timer % 60, 10);

      minutes = minutes < 10 ? '0' + minutes : minutes;
      seconds = seconds < 10 ? '0' + seconds : seconds;

      if (!isNaN(timer)) {
        this.#updateEvent({
          stringVal: `${minutes}:${seconds}`,
          secondsRemaining: timer,
        });
      }

      if (--timer < 0) {
        timer = duration;
      }
    };

    // intervalFn();

    this.#timer = setInterval(intervalFn, 1000);
  }

  stop() {
    clearInterval(this.#timer);
  }
}
