import * as Objects from '../index.js';

export function createBushSandTextures(scene) {
  const finalSandPalette = (Objects.CONFIG.BUSH_SAND && Objects.CONFIG.BUSH_SAND.colors) || [0xA8B06A, 0xB5A86B, 0x8E9960, 0xC2B87A];
  finalSandPalette.forEach((color, i) => {
    const b = scene.add.graphics();
    b.fillStyle(0x000000, 0.28);
    b.fillEllipse(16, 23, 30, 9);
    b.fillStyle(color, 1);
    b.fillEllipse(16, 16, 24, 16);
    const bright = Phaser.Display.Color.IntegerToColor(color).brighten(20 + (i % 12)).color;
    b.fillStyle(bright, 1);
    b.fillTriangle(16, 6, 10, 14, 22, 14);
    b.fillEllipse(16, 13, 10, 12);
    const mid = Phaser.Display.Color.IntegerToColor(bright).lighten(8).color;
    b.fillStyle(mid, 0.95);
    b.fillTriangle(8 + (i % 3 - 1), 9, 4 + (i % 2), 16, 14 + (i % 3), 15);
    b.fillStyle(Phaser.Display.Color.IntegerToColor(mid).brighten(5).color, 0.92);
    b.fillTriangle(24 - (i % 3 - 1), 9, 18 - (i % 2), 15, 28 - (i % 3), 16);
    b.fillStyle(0xf0e0c0, 0.7);
    b.fillCircle(16, 7, 1.2);
    if (i % 2 === 0) {
      b.fillCircle(9, 10, 1.0);
      b.fillCircle(23, 10, 1.0);
    }
    b.generateTexture(`bush_sand_${i}`, 32, 24);
    b.destroy();
  });
}
