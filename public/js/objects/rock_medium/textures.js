export function createRockMediumTextures(scene) {
  const r2 = scene.add.graphics();
  r2.fillStyle(0x8A7A6B, 1);
  r2.fillCircle(16, 16, 12);
  r2.fillStyle(0xA89B8E, 1);
  r2.fillCircle(12, 12, 8);
  r2.fillStyle(0x000000, 0.3);
  r2.fillEllipse(16, 28, 16, 6);
  r2.generateTexture('rock_medium', 32, 32);
  r2.destroy();
}
