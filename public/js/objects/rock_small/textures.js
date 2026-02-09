export function createRockSmallTextures(scene) {
  const r1 = scene.add.graphics();
  r1.fillStyle(0x8A7A6B, 1);
  r1.fillCircle(8, 8, 6);
  r1.fillStyle(0x000000, 0.3);
  r1.fillEllipse(8, 14, 8, 4);
  r1.generateTexture('rock_small', 16, 16);
  r1.destroy();
}
