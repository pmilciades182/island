export class TaskDistributor {
  constructor(scene) {
    this.scene = scene;
    this.lastPayload = null;
    this.activeObjects = new Set();
    this.pulsedObjects = new Set();
  }

  dispatch(task) {
    this.lastPayload = task.payload;
    console.log('[TaskDistributor] Dispatching task:', task);

    if (task.type === 'PROXIMITY_UPDATE') {
      const newActiveSet = new Set();
      const vegetation = task.payload.vegetation || [];

      // Pulse sprites that are new or have just been created
      vegetation.forEach(obj => {
        const { gridIndex, sprite } = obj;
        if (gridIndex === undefined) return;

        newActiveSet.add(gridIndex);

        if (sprite && !this.pulsedObjects.has(gridIndex)) {
          this.pulseSprite(sprite);
          this.pulsedObjects.add(gridIndex);
        }
      });
      
      // Clean up pulsed status for objects that have left the radius
      this.activeObjects.forEach(gridIndex => {
        if (!newActiveSet.has(gridIndex)) {
          this.pulsedObjects.delete(gridIndex);
        }
      });

      this.activeObjects = newActiveSet;
    }
  }

  pulseSprite(sprite) {
    if (!sprite || !sprite.scene || sprite.getData('isPulsing')) {
      return;
    }
    sprite.setData('isPulsing', true);

    const color = new Phaser.Display.Color(255, 255, 255);
    const pulseColor = { r: 255, g: 255, b: 204 };

    sprite.scene.tweens.add({
      targets: color,
      r: pulseColor.r,
      g: pulseColor.g,
      b: pulseColor.b,
      duration: 300,
      ease: 'Sine.Out',
      yoyo: true,
      onUpdate: () => {
        if (sprite.scene) { // Check if sprite is still part of the scene
          sprite.setTint(color.color);
        }
      },
      onComplete: () => {
        if (sprite.scene) {
          sprite.clearTint();
          sprite.setData('isPulsing', false);
        }
      }
    });
  }
}
