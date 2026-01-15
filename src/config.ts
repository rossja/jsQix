export const config = {
  gridWidth: 320,
  gridHeight: 240,
  captureThreshold: 0.75,
  initialLives: 3,
  scoring: {
    fastPerPercent: 100,
    slowPerPercent: 200,
    completionBonusPerPercent: 100
  },
  speeds: {
    boundaryCellsPerSec: 20,
    drawFastCellsPerSec: 48,
    drawSlowCellsPerSec: 16,
    qixCellsPerSec: 12,
    sparxCellsPerSec: 20
  },
  colors: {
    background: 0x000000,
    boundary: 0xffffff,
    claimedFast: 0x3cff8f,
    claimedSlow: 0xff8a00,
    activeLine: 0xffffff,
    marker: 0xffffff,
    qix: 0x7affff,
    sparx: 0xffc700
  }
};
