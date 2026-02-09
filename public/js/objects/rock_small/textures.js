export function createRockSmallTextures(scene) {
  const g = scene.add.graphics();
  // subtle shadow tightly under the rock (moved closer)
  g.fillStyle(0x000000, 0.08);
  g.fillEllipse(8, 13, 6, 0.9);
  // main body
  g.fillStyle(0x7F6F60, 1);
  g.fillTriangle(3, 13, 13, 12, 11, 8);
  g.fillTriangle(3, 13, 11, 8, 5, 9);
  // small highlight
  g.fillStyle(0x9A8A7B, 0.25);
  g.fillCircle(8, 6, 0.5);
  g.lineStyle(0.35, 0x4A3A2B, 1);
  g.moveTo(3, 13);
  g.lineTo(13, 12);
  g.lineTo(11, 8);
  g.lineTo(5, 9);
  g.lineTo(3, 13);
  g.generateTexture('rock_small', 16, 16);
  g.destroy();
}
