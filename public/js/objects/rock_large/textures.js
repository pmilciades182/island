export function createRockLargeTextures(scene) {
  const r3 = scene.add.graphics();
  
  // Shadow on ground - subtle and very close to base (moved slightly closer)
  r3.fillStyle(0x000000, 0.08);
  r3.fillEllipse(32, 52, 24, 2.2);
  
  // Large irregular boulder - VERY WIDE BASE
  r3.fillStyle(0x8A7A6B, 1);
  // Massive solid base
  r3.fillTriangle(8, 52, 56, 50, 54, 42);
  r3.fillTriangle(8, 52, 54, 42, 10, 42);
  // Mid sections
  r3.fillTriangle(10, 42, 54, 42, 50, 28);
  r3.fillTriangle(10, 42, 50, 28, 16, 30);
  // Upper sections
  r3.fillTriangle(16, 30, 50, 28, 48, 14);
  r3.fillTriangle(16, 30, 48, 14, 20, 20);
  
  // Surface definition - major crack lines
  r3.lineStyle(1.2, 0x5A4D44, 0.9);
  r3.moveTo(8, 52);
  r3.lineTo(56, 50);
  r3.lineTo(54, 42);
  r3.lineTo(50, 28);
  r3.lineTo(48, 14);
  r3.lineTo(20, 20);
  r3.lineTo(10, 42);
  r3.lineTo(8, 52);
  
  // Interior cracks
  r3.moveTo(32, 40);
  r3.lineTo(28, 52);
  r3.moveTo(40, 34);
  r3.lineTo(36, 48);
  
  // Dark shadow areas (interior only)
  r3.fillStyle(0x6B5D54, 0.4);
  r3.fillTriangle(28, 35, 35, 36, 33, 45);
  
  // Light highlights on peaks
  r3.fillStyle(0x9B897D, 0.7);
  r3.fillTriangle(48, 14, 50, 18, 46, 16);
  r3.fillTriangle(16, 20, 18, 24, 20, 22);
  
  // Sparse bright spots
  r3.fillStyle(0xA89B8E, 0.5);
  r3.fillCircle(48, 16, 1.2);
  r3.fillCircle(18, 22, 1.2);
  r3.fillCircle(32, 42, 0.8);
  
  r3.generateTexture('rock_large', 64, 64);
  r3.destroy();
}
