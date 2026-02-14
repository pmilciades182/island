import { CONFIG } from './vars.js';
import { createProceduralFireGraphic, updateProceduralFireGraphic } from './textures.js';

class Fire extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width = 64, height = 96) {
    super(scene, x, y);
    scene.add.existing(this);
    this.setDepth(10000); // Set a high depth to ensure visibility

    this._width = width; // Store for updateProceduralFireGraphic
    this._height = height; // Store for updateProceduralFireGraphic

    // Debug: Check initial Fire object creation
    console.log(`[FireDef Debug] Creating Fire at world (x,y): (${x},${y}) with dimensions (${width},${height})`);

    // Create the procedural graphic (draws relative to its own 0,0)
    this.fireGraphic = createProceduralFireGraphic(scene);
    this.add(this.fireGraphic);

    // Apply initial scale to the graphic itself, not the container
    this.fireGraphic.setScale(CONFIG.baseScale);

    // Position the graphic within the container to simulate the origin
    const offsetX = width * CONFIG.origin.x;
    const offsetY = height * CONFIG.origin.y;
    this.fireGraphic.x -= offsetX;
    this.fireGraphic.y -= offsetY;

    // Set the container's world position directly to the x, y passed in
    this.setPosition(x, y);

    // Debug: Check final positions after adjustments
    console.log(`[FireDef Debug] Fire Container world (x,y): (${this.x},${this.y})`);
    console.log(`[FireDef Debug] Fire Graphic local (x,y) within container: (${this.fireGraphic.x},${this.fireGraphic.y})`);
  }

  update(time, delta) {
    // Debug: Check Fire container properties
    console.log(`[FireContainer Debug] Visible: ${this.visible}, Alpha: ${this.alpha}, Depth: ${this.depth}, Active: ${this.active}, World (x,y): (${this.x},${this.y})`);

    updateProceduralFireGraphic(this.fireGraphic, time, delta, this._width, this._height);
  }
}

export default Fire;
