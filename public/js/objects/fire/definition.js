import { CONFIG } from './vars.js';
import { createProceduralFireGraphic, updateProceduralFireGraphic } from './textures.js';

class Fire extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width = 64, height = 96) {
    super(scene, x, y);
    scene.add.existing(this);

    // Create the procedural graphic (draws relative to its own 0,0)
    // We'll pass the scene and the dimensions for the graphic
    this.fireGraphic = createProceduralFireGraphic(scene, width, height);
    this.add(this.fireGraphic);

    // Scale the fire graphic itself
    this.fireGraphic.setScale(CONFIG.baseScale);

    // Position the graphic within the container to simulate the origin
    // If CONFIG.origin is {x: 0.5, y: 0.8}, it means the (x,y) coordinates passed
    // to the Fire constructor should point to the 50% X and 80% Y point of the fire graphic.
    // So, the graphic's top-left (its own 0,0) should be offset negatively.
    this.fireGraphic.x -= width * CONFIG.origin.x;
    this.fireGraphic.y -= height * CONFIG.origin.y;

    // Set the container's world position directly to the x, y passed in
    this.setPosition(x, y);
  }

  update(time, delta) {
    updateProceduralFireGraphic(this.fireGraphic, time, delta, this.width, this.height);
  }
}

export default Fire;
