import * as Objects from '../index.js';

export function createBushSandTextures(scene) {
  const finalSandPalette = (Objects.CONFIG.BUSH_SAND && Objects.CONFIG.BUSH_SAND.colors) || [0xA8B06A, 0xB5A86B, 0x8E9960, 0xC2B87A];
  finalSandPalette.forEach((color, i) => {
    const b = scene.add.graphics();
    // Shadow on ground
    b.fillStyle(0x000000, 0.28);
    b.fillEllipse(16, 23, 30, 9);
    
    // Dark base layer for depth
    const dark = Phaser.Display.Color.IntegerToColor(color).darken(20).color;
    b.fillStyle(dark, 1);
    b.fillEllipse(10, 15, 14, 12);
    b.fillEllipse(22, 16, 12, 10);
    b.fillCircle(16, 10, 8);
    
    // Main body base color
    b.fillStyle(color, 1);
    b.fillEllipse(16, 16, 24, 14);
    b.fillCircle(8, 14, 9);
    b.fillCircle(24, 14, 9);
    b.fillCircle(16, 8, 10);
    
    // Mid-tone highlights
    const bright = Phaser.Display.Color.IntegerToColor(color).brighten(15).color;
    b.fillStyle(bright, 1);
    b.fillCircle(12, 10, 6);
    b.fillCircle(20, 10, 7);
    b.fillCircle(14, 14, 5);
    b.fillCircle(18, 14, 5);
    
    // Light highlights for detail
    const light = Phaser.Display.Color.IntegerToColor(bright).brighten(12).color;
    b.fillStyle(light, 0.8);
    b.fillCircle(16, 6, 4);
    b.fillCircle(10, 12, 3);
    b.fillCircle(22, 12, 3);
    
    // Very light spots for realism
    b.fillStyle(0xf0e0c0, 0.6);
    b.fillCircle(14, 10, 2);
    b.fillCircle(18, 10, 2);
    
    b.generateTexture(`bush_sand_${i}`, 32, 24);
    b.destroy();
  });
}
