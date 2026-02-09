import * as Objects from '../index.js';

export function createBushGrassTextures(scene) {
  const finalGrassPalette = (Objects.CONFIG.BUSH_GRASS && Objects.CONFIG.BUSH_GRASS.colors) || [0x4A8C3F, 0x5DA84E, 0x3B7A34, 0x6BB85A];
  finalGrassPalette.forEach((color, i) => {
    const b = scene.add.graphics();
    // Shadow on ground
    b.fillStyle(0x000000, 0.25);
    b.fillEllipse(14, 26, 22, 6);
    
    // Dark base for depth
    const dark = Phaser.Display.Color.IntegerToColor(color).darken(15).color;
    b.fillStyle(dark, 1);
    b.fillCircle(14, 18, 13);
    b.fillCircle(8, 16, 7);
    b.fillCircle(20, 16, 7);
    
    // Main body color
    b.fillStyle(color, 1);
    b.fillCircle(14, 16, 12);
    b.fillCircle(8, 18, 8);
    b.fillCircle(20, 18, 8);
    b.fillCircle(10, 12, 7);
    b.fillCircle(18, 12, 7);
    b.fillCircle(14, 10, 8);
    
    // Bright mid-tone layer
    const bright = Phaser.Display.Color.IntegerToColor(color).brighten(15).color;
    b.fillStyle(bright, 1);
    b.fillCircle(14, 12, 7);
    b.fillCircle(10, 16, 5);
    b.fillCircle(18, 16, 5);
    b.fillCircle(12, 10, 4);
    b.fillCircle(16, 10, 4);
    
    // Light highlights
    const light = Phaser.Display.Color.IntegerToColor(bright).brighten(12).color;
    b.fillStyle(light, 0.8);
    b.fillCircle(14, 8, 3);
    b.fillCircle(10, 12, 2.5);
    b.fillCircle(18, 12, 2.5);
    
    b.generateTexture(`bush_grass_${i}`, 28, 28);
    b.destroy();
  });
}
