export const ID = 'FIRE';

export const CONFIG = {
  // Removed spritesheet and animationKey
  colors: [0xffe0b2, 0xffa000, 0xff4500, 0xd00000], // Warm color palette for fire
  baseScale: 1, // Initial scale for procedural fire
  // Removed frameRate, repeat, origin as they were for spritesheet animation
  scale: 1, // Keep a general scale property for instances
  origin: { x: 0.5, y: 0.8 } // Adjusted origin for procedural effect (bottom-center)
};
