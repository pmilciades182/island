import * as Objects from '../index.js';

export function createBushGrassTextures(scene) {
  const finalGrassPalette = (Objects.CONFIG.BUSH_GRASS && Objects.CONFIG.BUSH_GRASS.colors) || [0x4A8C3F, 0x5DA84E, 0x3B7A34, 0x6BB85A];
  finalGrassPalette.forEach((color, i) => {
    const b = scene.add.graphics();
    b.fillStyle(0x000000, 0.25);
    b.fillEllipse(14, 26, 22, 6);
    b.fillStyle(color, 1);
    b.fillCircle(14, 16, 12);
    b.fillCircle(8, 18, 8);
    b.fillCircle(20, 18, 8);
    b.fillStyle(Phaser.Display.Color.IntegerToColor(color).brighten(20).color, 1);
    b.fillCircle(14, 12, 7);
    b.fillCircle(10, 16, 5);
    b.generateTexture(`bush_grass_${i}`, 28, 28);
    b.destroy();
  });
}
