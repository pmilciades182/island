import * as Objects from '../index.js';

export function createTreeTextures(scene) {
  const treeG = scene.add.graphics();
  
  // Shadow on ground
  treeG.fillStyle(0x000000, 0.4);
  treeG.fillEllipse(32, 58, 24, 10);
  
  // Trunk with shading
  treeG.fillStyle(0x5C3D2E, 1);
  treeG.fillRect(26, 40, 12, 18);
  treeG.fillStyle(0x6B4E3C, 0.8);
  treeG.fillRect(26, 40, 6, 18);  // left shadow
  treeG.fillStyle(0x8B6F47, 0.6);
  treeG.fillRect(32, 40, 6, 18);  // right highlight
  
  // Main foliage layers (base, dark green)
  treeG.fillStyle(0x1B4620, 1);   // darkest base shadow
  treeG.fillCircle(32, 32, 18);
  treeG.fillCircle(20, 40, 12);
  treeG.fillCircle(44, 40, 12);
  
  // Mid-tone foliage
  treeG.fillStyle(0x2D6238, 1);
  treeG.fillCircle(32, 30, 16);
  treeG.fillCircle(20, 38, 11);
  treeG.fillCircle(44, 38, 11);
  treeG.fillCircle(28, 26, 10);
  treeG.fillCircle(36, 26, 10);
  
  // Highlight foliage layer
  treeG.fillStyle(0x346640, 1);
  treeG.fillCircle(32, 28, 14);
  treeG.fillCircle(22, 34, 9);
  treeG.fillCircle(42, 34, 9);
  treeG.fillCircle(30, 22, 8);
  treeG.fillCircle(34, 22, 8);
  
  // Bright top foliage (light green highlights)
  treeG.fillStyle(0x58A460, 1);
  treeG.fillCircle(32, 20, 8);
  treeG.fillCircle(28, 18, 5);
  treeG.fillCircle(36, 18, 5);
  
  // Very bright highlights for realism
  treeG.fillStyle(0x6FB874, 0.9);
  treeG.fillCircle(30, 16, 3);
  treeG.fillCircle(34, 16, 3);
  
  treeG.generateTexture('tree', 64, 64);
  treeG.destroy();

  const treeDG = scene.add.graphics();
  
  // Shadow on ground
  treeDG.fillStyle(0x000000, 0.4);
  treeDG.fillEllipse(32, 58, 24, 10);
  
  // Trunk with shading (same as normal tree)
  treeDG.fillStyle(0x5C3D2E, 1);
  treeDG.fillRect(26, 40, 12, 18);
  treeDG.fillStyle(0x6B4E3C, 0.8);
  treeDG.fillRect(26, 40, 6, 18);  // left shadow
  treeDG.fillStyle(0x8B6F47, 0.6);
  treeDG.fillRect(32, 40, 6, 18);  // right highlight
  
  // Main foliage layers (base, olive-yellow)
  treeDG.fillStyle(0x5A6B1F, 1);   // dark olive base shadow
  treeDG.fillCircle(32, 32, 18);
  treeDG.fillCircle(20, 40, 12);
  treeDG.fillCircle(44, 40, 12);
  
  // Mid-tone foliage (autumn olive)
  treeDG.fillStyle(0x7A8C32, 1);
  treeDG.fillCircle(32, 30, 16);
  treeDG.fillCircle(20, 38, 11);
  treeDG.fillCircle(44, 38, 11);
  treeDG.fillCircle(28, 26, 10);
  treeDG.fillCircle(36, 26, 10);
  
  // Highlight foliage layer (yellow-green)
  treeDG.fillStyle(0x9AA840, 1);
  treeDG.fillCircle(32, 28, 14);
  treeDG.fillCircle(22, 34, 9);
  treeDG.fillCircle(42, 34, 9);
  treeDG.fillCircle(30, 22, 8);
  treeDG.fillCircle(34, 22, 8);
  
  // Bright top foliage (golden-yellow highlights)
  treeDG.fillStyle(0xBBC24A, 1);
  treeDG.fillCircle(32, 20, 8);
  treeDG.fillCircle(28, 18, 5);
  treeDG.fillCircle(36, 18, 5);
  
  // Very bright highlights for realism
  treeDG.fillStyle(0xD4E157, 0.9);
  treeDG.fillCircle(30, 16, 3);
  treeDG.fillCircle(34, 16, 3);
  
  treeDG.generateTexture('tree_dark', 64, 64);
  treeDG.destroy();
}
