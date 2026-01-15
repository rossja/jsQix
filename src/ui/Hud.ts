import * as PIXI from "pixi.js";

type HudState = {
  score: number;
  lives: number;
  level: number;
  percent: number;
  playerX: number;
  playerY: number;
  levelComplete: boolean;
};

export class Hud {
  private readonly text: PIXI.Text;

  constructor(stage: PIXI.Container) {
    this.text = new PIXI.Text({
      text: "Loading...",
      style: {
        fontFamily: "monospace",
        fontSize: 16,
        fill: 0xffffff
      }
    });
    this.text.position.set(12, 8);
    stage.addChild(this.text);
  }

  setPosition(x: number, y: number): void {
    this.text.position.set(x, y);
  }

  update(state: HudState): void {
    const pct = Math.floor(state.percent * 100);
    const status = state.levelComplete ? "LEVEL COMPLETE!" : "";
    this.text.text = `Score ${state.score}  Lives ${state.lives}  Level ${state.level}  ${pct}%  ${status}\nArrows/WASD move, hold Z fast draw or X slow draw`;
  }
}
