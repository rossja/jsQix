import * as PIXI from "pixi.js";
import { config } from "./config";
import { Game } from "./Game";

const app = new PIXI.Application();

await app.init({
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: config.colors.background,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
  antialias: true
});

if (PIXI.settings) {
  PIXI.settings.ROUND_PIXELS = true;
}
if (app.renderer && "roundPixels" in app.renderer) {
  try {
    (app.renderer as { roundPixels?: boolean }).roundPixels = true;
  } catch {
    // ignore if renderer is read-only
  }
}

const root = document.getElementById("app");
if (!root) {
  throw new Error("Root element #app not found.");
}
root.appendChild(app.canvas);

const game = new Game(app);
game.start();
