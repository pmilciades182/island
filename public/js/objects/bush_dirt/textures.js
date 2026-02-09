import * as Objects from '../index.js';

export function createBushDirtTextures(scene) {
  const finalDirtPalette = (Objects.CONFIG.BUSH_DIRT && Objects.CONFIG.BUSH_DIRT.colors) || [0x6B7A3A, 0x5C6832, 0x7A8844, 0x4E5B2B];
  finalDirtPalette.forEach((color, i) => {
    const b = scene.add.graphics();
    const dark = Phaser.Display.Color.IntegerToColor(color).darken(25).color;
    const light = Phaser.Display.Color.IntegerToColor(color).brighten(18).color;
    
    // Shadow on ground
    b.fillStyle(0x000000, 0.2);
    b.fillEllipse(16, 26, 26, 5);
    
    // Dark base layer for depth
    b.fillStyle(dark, 1);
    b.fillCircle(10, 13, 7);
    b.fillCircle(22, 14, 6);
    b.fillCircle(16, 10, 8);
    b.fillCircle(14, 16, 6);
    b.fillCircle(18, 16, 6);
    
    // Main body color
    b.fillStyle(color, 1);
    b.fillCircle(12, 11, 6);
    b.fillCircle(20, 12, 5);
    b.fillCircle(16, 8, 6);
    b.fillCircle(10, 16, 5);
    b.fillCircle(22, 16, 5);
    b.fillCircle(16, 14, 4);
    b.fillCircle(12, 18, 4);
    b.fillCircle(20, 18, 4);
    
    // Light highlights
    b.fillStyle(light, 1);
    b.fillCircle(14, 7, 3);
    b.fillCircle(10, 10, 2.5);
    b.fillCircle(20, 10, 2);
    b.fillCircle(16, 12, 3);
    b.fillCircle(12, 14, 2);
    b.fillCircle(20, 14, 2);
    
    // Very light spots
    const vlight = Phaser.Display.Color.IntegerToColor(light).brighten(10).color;
    b.fillStyle(vlight, 0.6);
    b.fillCircle(14, 10, 1.5);
    b.fillCircle(18, 10, 1.5);
    
    b.generateTexture(`bush_dirt_${i}`, 32, 28);
    b.destroy();
  });
}
