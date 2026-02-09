export function createRockLargeTextures(scene) {
  const r3 = scene.add.graphics();
  r3.fillStyle(0x6B5D54, 1);
  r3.fillCircle(32, 32, 24);
  r3.fillStyle(0x8A7A6B, 1);
  r3.fillCircle(24, 24, 16);
  r3.fillStyle(0x000000, 0.3);
  r3.fillEllipse(32, 56, 32, 10);
  r3.generateTexture('rock_large', 64, 64);
  r3.destroy();
}
