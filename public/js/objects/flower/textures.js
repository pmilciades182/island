import * as Objects from '../index.js';

export function createFlowerTextures(scene) {
  const flowerPalette = (Objects.CONFIG.FLOWER && Objects.CONFIG.FLOWER.colors) || [
    0xE74C3C, 0xF39C12, 0xF1C40F, 0xE8DAEF, 0xAF7AC5, 0x5DADE2,
    0x48C9B0, 0x52BE80, 0xF8B88B, 0xEC7063, 0xF7DC6F, 0xBB8FCE,
    0x85C1E2, 0x76D7C4, 0xF5B7B1, 0xFAD7A0
  ];
  flowerPalette.forEach((color, index) => {
    const f = scene.add.graphics();
    f.fillStyle(0x000000, 0.3);
    f.fillEllipse(8, 14, 6, 3);
    f.fillStyle(0x3D6142, 1);
    f.fillRect(7, 8, 2, 6);
    f.fillStyle(color, 1);
    f.fillCircle(8, 5, 2.5);
    f.fillCircle(8, 11, 2.5);
    f.fillCircle(5, 8, 2.5);
    f.fillCircle(11, 8, 2.5);
    f.fillStyle(0xffd700, 1);
    f.fillCircle(8, 8, 2);
    f.generateTexture(`flower_${index}`, 16, 16);
    f.destroy();
  });
}
