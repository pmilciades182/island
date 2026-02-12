import { CONFIG } from './vars.js';

// No preload needed as we are generating procedurally
export function preload(scene) {
  // Empty or for future procedural asset loading
}

// No createAnimations needed as animation will be procedural
export function createAnimations(scene) {
  // Empty or for future procedural animation setup
}

/**
 * Creates a Graphics object to represent procedural fire.
 * The actual drawing and animation will happen in updateProceduralFireGraphic.
 * @param {Phaser.Scene} scene
 * @returns {Phaser.GameObjects.Graphics}
 */
export function createProceduralFireGraphic(scene) {
  const graphic = scene.add.graphics();
  // Store some state for noise generation
  graphic._noiseOffset1 = Math.random() * 1000;
  graphic._noiseOffset2 = Math.random() * 1000;
  return graphic;
}

/**
 * Updates and redraws the procedural fire graphic based on noise.
 * @param {Phaser.GameObjects.Graphics} graphic
 * @param {number} time
 * @param {number} delta
 * @param {number} width
 * @param {number} height
 */
export function updateProceduralFireGraphic(graphic, time, delta, width = 32, height = 48) {
  if (!window.noise) { // Fallback if noise.js is not loaded
    // console.warn('noise.js not loaded, procedural fire will be static.');
    return;
  }

  graphic.clear();

  const noiseScale = 0.05; // How spread out the noise is
  const noiseMagnitude = 8; // How much the noise affects the shape

  // Generate a fluctuating base width for the fire
  const baseNoise = window.noise.perlin2(time * 0.0001, graphic._noiseOffset1) * noiseMagnitude;
  const currentBaseWidth = width * 0.8 + baseNoise;

  // Generate top point fluctuation
  const topNoise = window.noise.perlin2(time * 0.0001, graphic._noiseOffset2) * noiseMagnitude;
  const currentTopY = topNoise * 0.5; // Make top fluctuate less vertically

  // Define points for a more organic fire shape (simplified blob for now)
  // These points will be influenced by noise
  const points = [];
  const segments = 10;
  const segmentHeight = height / segments;

  for (let i = 0; i <= segments; i++) {
    const y = height - (i * segmentHeight);
    let xOffset = 0;
    if (i === 0) { // Base
      xOffset = currentBaseWidth / 2;
    } else {
      // Noise influence on width
      const noiseVal = window.noise.perlin2(i * noiseScale + time * 0.0002, graphic._noiseOffset1);
      xOffset = (width * 0.2 + noiseVal * noiseMagnitude) * (1 - y / height) + (baseNoise * (y / height) * 0.5);
      xOffset = Math.max(0, xOffset); // Ensure positive offset
    }

    // Left side
    points.push(new Phaser.Geom.Point(width / 2 - xOffset, y));
  }

  // Add right side points in reverse order to complete the polygon
  for (let i = segments; i >= 0; i--) {
    const y = height - (i * segmentHeight);
    let xOffset = 0;
    if (i === 0) { // Base
      xOffset = currentBaseWidth / 2;
    } else {
      const noiseVal = window.noise.perlin2(i * noiseScale + time * 0.0002, graphic._noiseOffset1);
      xOffset = (width * 0.2 + noiseVal * noiseMagnitude) * (1 - y / height) + (baseNoise * (y / height) * 0.5);
      xOffset = Math.max(0, xOffset);
    }
    points.push(new Phaser.Geom.Point(width / 2 + xOffset, y));
  }


  // Draw the main fire shape (red-orange)
  graphic.fillStyle(CONFIG.colors[2], 0.9 + Math.sin(time * 0.005) * 0.05); // Fluctuating alpha
  graphic.fillPoints(points);

  // Draw inner, brighter flame (orange-yellow)
  graphic.fillStyle(CONFIG.colors[1], 0.8 + Math.sin(time * 0.007) * 0.05);
  graphic.fillEllipse(width / 2, height * 0.7 + currentTopY * 0.5, currentBaseWidth * 0.6, height * 0.5);

  // Draw core, brightest flame (yellow-white)
  graphic.fillStyle(CONFIG.colors[0], 0.7 + Math.sin(time * 0.009) * 0.05);
  graphic.fillEllipse(width / 2, height * 0.4 + currentTopY * 0.8, currentBaseWidth * 0.3, height * 0.3);

  // Simple overall scale flickering
  const scaleFactor = 1 + Math.sin(time * 0.005) * 0.05;
  graphic.setScale(scaleFactor);
}
