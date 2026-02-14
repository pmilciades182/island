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
  graphic._noiseOffset3 = Math.random() * 1000; // Add third noise offset
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
  if (!window.noise) {
    console.warn('[FireTexture Debug] window.noise is undefined, procedural fire will not draw.');
    return;
  }

  graphic.clear();
  graphic.setBlendMode(Phaser.BlendModes.ADD); // Apply additive blending for glowing effect

  const baseHue = 0.0001;
  const noiseScale = 0.05;
  const noiseMagnitude = 10; // Adjusted for a good balance of distortion
  const alphaFluctuation = 0.2;

  const baseNoiseVal1 = window.noise.perlin2(time * baseHue * 1.2, graphic._noiseOffset1);
  const baseNoiseVal2 = window.noise.perlin2(time * baseHue * 0.8, graphic._noiseOffset2);
  const baseNoiseVal3 = window.noise.perlin2(time * baseHue * 1.0, graphic._noiseOffset3);
  const baseNoiseVal4 = window.noise.perlin2(time * baseHue * 1.5, graphic._noiseOffset1 + 1000); // Additional noise

  // Dynamic dimensions based on noise
  const currentBaseWidth = width * 0.9 + baseNoiseVal1 * noiseMagnitude * 0.8;
  const currentMidWidth = width * 0.6 + baseNoiseVal2 * noiseMagnitude * 0.6;
  const currentTopWidth = width * 0.2 + baseNoiseVal3 * noiseMagnitude * 0.4;
  const currentFlameHeight = height * 0.9 + baseNoiseVal4 * noiseMagnitude * 0.5;

  // Fluctuating alphas
  const alphaOuter = 0.5 + Math.sin(time * 0.005) * alphaFluctuation;
  const alphaMid = 0.7 + Math.sin(time * 0.007) * alphaFluctuation;
  const alphaInner = 0.9 + Math.sin(time * 0.009) * alphaFluctuation;
  const alphaCore = 1.0 + Math.sin(time * 0.011) * alphaFluctuation;

  // --- Draw main flame body using a dynamic polygon (outermost layer) ---
  graphic.fillStyle(CONFIG.colors[2], alphaOuter); // Red-orange

  const points = [];
  const numPoints = 8; // Number of points on each side for the main flame body
  // const baseOffset = (width - currentBaseWidth) / 2; // Not used currently

  // Bottom points (smoother base)
  // Ensure the base is reasonably wide
  points.push(new Phaser.Geom.Point(width / 2 - currentBaseWidth / 2, height));
  points.push(new Phaser.Geom.Point(width / 2 + currentBaseWidth / 2, height));

  // Right side of flame
  for (let i = 0; i <= numPoints; i++) {
    const y = height - (i / numPoints) * currentFlameHeight;
    // Influence x with noise and tapering
    const x = width / 2 + (currentBaseWidth / 2) * (1 - y / height) - baseNoiseVal1 * noiseMagnitude * 0.1 * (y / height);
    points.push(new Phaser.Geom.Point(x, y));
  }
  // Top point (single, slightly offset and fluctuating)
  points.push(new Phaser.Geom.Point(width / 2 + baseNoiseVal3 * noiseMagnitude * 0.1, height - currentFlameHeight));

  // Left side of flame
  for (let i = numPoints; i >= 0; i--) {
    const y = height - (i / numPoints) * currentFlameHeight;
    // Influence x with noise and tapering
    const x = width / 2 - (currentBaseWidth / 2) * (1 - y / height) + baseNoiseVal2 * noiseMagnitude * 0.1 * (y / height);
    points.push(new Phaser.Geom.Point(x, y));
  }

  graphic.fillPoints(points);

  // --- Layered ellipses for inner glow and core (brighter colors) ---

  // Inner flame (orange-yellow)
  graphic.fillStyle(CONFIG.colors[1], alphaMid);
  graphic.fillEllipse(
    width / 2 + baseNoiseVal2 * noiseMagnitude * 0.08,
    height * 0.7 + baseNoiseVal1 * noiseMagnitude * 0.05,
    currentMidWidth * 0.7,
    currentFlameHeight * 0.6
  );

  // Core, brightest flame (yellow-white)
  graphic.fillStyle(CONFIG.colors[0], alphaInner);
  graphic.fillEllipse(
    width / 2 + baseNoiseVal3 * noiseMagnitude * 0.05,
    height * 0.4 + baseNoiseVal2 * noiseMagnitude * 0.08,
    currentTopWidth * 0.9,
    currentFlameHeight * 0.4
  );

  // Add a very small, bright white center
  graphic.fillStyle(0xFFFFFF, alphaCore);
  graphic.fillEllipse(
    width / 2 + baseNoiseVal1 * noiseMagnitude * 0.03,
    height * 0.2 + baseNoiseVal3 * noiseMagnitude * 0.05,
    width * 0.1,
    height * 0.1
  );

  // Soft glow at the very base
  graphic.fillStyle(0xFFFFFF, 0.1); // White, subtle
  graphic.fillEllipse(width / 2, height * 0.98, width * 0.8, height * 0.1);

  // Simple overall scale flickering
  const scaleFactor = 1 + Math.sin(time * 0.005) * 0.05;
  graphic.setScale(scaleFactor);
}