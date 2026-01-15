export class InputManager {
  private readonly keys = new Set<string>();
  private readonly pressedThisFrame = new Set<string>();

  constructor(target: Window) {
    target.addEventListener("keydown", (event) => {
      if (!this.keys.has(event.key)) {
        this.pressedThisFrame.add(event.key);
      }
      this.keys.add(event.key);
    });
    target.addEventListener("keyup", (event) => {
      this.keys.delete(event.key);
    });
  }

  endFrame(): void {
    this.pressedThisFrame.clear();
  }

  isDown(key: string): boolean {
    return this.keys.has(key);
  }

  wasPressed(key: string): boolean {
    return this.pressedThisFrame.has(key);
  }

  getMoveVector(): { x: number; y: number } {
    const left = this.isDown("ArrowLeft") || this.isDown("a");
    const right = this.isDown("ArrowRight") || this.isDown("d");
    const up = this.isDown("ArrowUp") || this.isDown("w");
    const down = this.isDown("ArrowDown") || this.isDown("s");

    const x = (right ? 1 : 0) - (left ? 1 : 0);
    const y = (down ? 1 : 0) - (up ? 1 : 0);

    if (x !== 0 && y !== 0) {
      return { x: 0, y: 0 };
    }
    return { x, y };
  }

  getDrawMode(): "fast" | "slow" | "none" {
    if (this.isDown("z")) {
      return "fast";
    }
    if (this.isDown("x")) {
      return "slow";
    }
    return "none";
  }
}
