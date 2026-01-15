export type UpdateFn = (dt: number) => void;
export type RenderFn = (alpha: number) => void;

export class GameLoop {
  private readonly update: UpdateFn;
  private readonly render: RenderFn;
  private readonly fixedDt: number;
  private lastTime = 0;
  private accumulator = 0;
  private running = false;

  constructor(update: UpdateFn, render: RenderFn, fixedDt = 1 / 60) {
    this.update = update;
    this.render = render;
    this.fixedDt = fixedDt;
  }

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
  }

  private tick = (now: number): void => {
    if (!this.running) {
      return;
    }

    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.accumulator += delta;

    let steps = 0;
    const maxSteps = 5;
    while (this.accumulator >= this.fixedDt && steps < maxSteps) {
      this.update(this.fixedDt);
      this.accumulator -= this.fixedDt;
      steps += 1;
    }

    const alpha = this.accumulator / this.fixedDt;
    this.render(alpha);
    requestAnimationFrame(this.tick);
  };
}
