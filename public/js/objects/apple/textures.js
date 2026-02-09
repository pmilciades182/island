export function createAppleTextures(scene) {
  const g = scene.add.graphics();
  
  // Shadow on ground
  g.fillStyle(0x000000, 0.25);
  g.fillEllipse(16, 26, 14, 5);
  
  // Stem
  g.fillStyle(0x6B4423, 1);
  g.fillRect(15, 4, 2, 8);
  g.fillStyle(0x8B5A3C, 0.8);
  g.fillRect(15, 4, 1, 8); // stem highlight
  
  // Leaf on stem
  g.fillStyle(0x4A7C3B, 1);
  g.fillTriangle(17, 7, 23, 5, 21, 9);
  g.fillStyle(0x5A9C4B, 0.8);
  g.strokeTriangle(17, 7, 23, 5, 21, 9);
  
  // Apple body - oval/rounded shape (not circle)
  // Create an apple-like silhouette
  
  // Dark red base for shape
  g.fillStyle(0xB71C1C, 1);
  g.fillTriangle(10, 14, 22, 12, 20, 24);
  g.fillTriangle(10, 14, 20, 24, 12, 24);
  
  // Main bright red body
  g.fillStyle(0xE53935, 1);
  g.fillTriangle(10, 14, 22, 12, 20, 24);
  g.fillTriangle(10, 14, 20, 24, 12, 24);
  
  // Transition shades
  g.fillStyle(0xD32F2F, 0.7);
  g.fillTriangle(12, 16, 18, 14, 18, 22);
  
  // Mid-tone areas
  g.fillStyle(0xC62828, 0.6);
  g.fillTriangle(10, 18, 14, 16, 14, 24);
  
  // Bright highlight on top
  g.fillStyle(0xFF6B6B, 0.85);
  g.fillTriangle(16, 12, 18, 13, 17, 16);
  
  // Light shine
  g.fillStyle(0xFFCDD2, 0.75);
  g.fillCircle(17, 13, 1.5);
  
  // Small reflection spot
  g.fillStyle(0xFFEBEE, 0.6);
  g.fillCircle(16, 12, 0.8);
  
  // Subtle indentation at top (where stem connects)
  g.lineStyle(0.5, 0xA71C1C, 0.6);
  g.arc(16, 12, 2, Math.PI, Math.PI * 2);
  
  g.generateTexture('apple_spr', 32, 32);
  g.destroy();
}
