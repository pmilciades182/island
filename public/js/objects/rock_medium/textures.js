export function createRockMediumTextures(scene) {
  const g = scene.add.graphics();
  // subtle shadow under medium rock (moved closer)
  g.fillStyle(0x000000, 0.08);
  g.fillEllipse(16, 26, 12, 1.2);
  // main body
  g.fillStyle(0x7F6F60, 1);
  g.fillTriangle(6, 26, 26, 24, 24, 18);
  g.fillTriangle(6, 26, 24, 18, 8, 18);
  g.fillTriangle(8, 18, 24, 18, 20, 6);
  g.fillTriangle(8, 18, 20, 6, 12, 12);
  g.lineStyle(0.45, 0x4A3A2B, 1);
  g.moveTo(6, 26);
  g.lineTo(26, 24);
  g.lineTo(24, 18);
  g.lineTo(8, 18);
  g.lineTo(6, 26);
  g.fillStyle(0x9A8A7B, 0.25);
  g.fillCircle(16, 10, 0.8);
  g.generateTexture('rock_medium', 32, 32);
  g.destroy();
}
