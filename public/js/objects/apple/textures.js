export function createAppleTextures(scene) {
  const g = scene.add.graphics();
  // simple apple: red circle + highlight + small stem
  g.fillStyle(0x000000, 0.25);
  g.fillEllipse(16, 26, 14, 5);
  g.fillStyle(0xA0522D, 1);
  g.fillRect(15, 6, 2, 6); // stem
  g.fillStyle(0xE53935, 1);
  g.fillCircle(16, 14, 8);
  g.fillStyle(0xFFCDD2, 0.7);
  g.fillCircle(13, 11, 2);
  g.generateTexture('apple_spr', 32, 32);
  g.destroy();
}
