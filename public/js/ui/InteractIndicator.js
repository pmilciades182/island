/**
 * InteractIndicator - Firefly-like indicator for interactive objects
 * Shows a pulsing yellow light above the closest interactable object
 */
export class InteractIndicator {
  // Offset Y por tipo de objeto (WorldConfig.OBJECTS)
  static OFFSETS = {
    1: -48,  // TREE - grande
    2: -12,  // ROCK_SMALL
    3: -20,  // ROCK_MEDIUM
    4: -32,  // ROCK_LARGE
    5: -8,   // FLOWER - muy pequeño
    6: -14,  // BUSH_SAND
    7: -14,  // BUSH_GRASS
    8: -14,  // BUSH_DIRT
  };

  constructor(scene) {
    this.scene = scene;
    this._currentInteractiveObject = null;
    this._eventLog = []; // Last 3 events
    this._maxEvents = 3;

    this._createIndicator();
    this._createPulseTween();
  }

  _logEvent(eventType, data) {
    const event = { eventType, data, time: Date.now() };
    this._eventLog.push(event);
    if (this._eventLog.length > this._maxEvents) {
      this._eventLog.shift();
    }
  }

  getDebugInfo() {
    const current = this._currentInteractiveObject;
    return {
      visible: this.container.visible,
      alpha: this.container.alpha.toFixed(2),
      pos: `${this.container.x.toFixed(0)}, ${this.container.y.toFixed(0)}`,
      target: current ? `Type:${current.type} @${current.x.toFixed(0)},${current.y.toFixed(0)}` : 'None',
      events: this._eventLog.map(e => e.eventType).join(' → ')
    };
  }

  _createIndicator() {
    const indicatorColor = 0xF1C40F; // Sunny Yellow

    this.container = this.scene.add.container(0, 0)
      .setDepth(400000)
      .setVisible(false)
      .setAlpha(0);

    // Inner container for float animation
    this.innerContainer = this.scene.add.container(0, 0);

    // Outer soft glow (50% smaller)
    const outerGlow = this.scene.add.graphics();
    outerGlow.fillStyle(indicatorColor, 0.15);
    outerGlow.fillCircle(0, 0, 12);

    // Middle glow
    const midGlow = this.scene.add.graphics();
    midGlow.fillStyle(indicatorColor, 0.35);
    midGlow.fillCircle(0, 0, 8);

    // Inner glow
    const innerGlow = this.scene.add.graphics();
    innerGlow.fillStyle(indicatorColor, 0.6);
    innerGlow.fillCircle(0, 0, 5);

    // Bright core
    const core = this.scene.add.graphics();
    core.fillStyle(0xFFFFFF, 0.95);
    core.fillCircle(0, 0, 3);

    this.innerContainer.add([outerGlow, midGlow, innerGlow, core]);
    this.container.add(this.innerContainer);
  }

  _createPulseTween() {
    // Gentle floating animation
    this.scene.tweens.add({
      targets: this.innerContainer,
      y: -6,
      duration: 600,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1
    });

    // Subtle pulse animation
    this.scene.tweens.add({
      targets: this.innerContainer,
      scale: 1.15,
      duration: 400,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1
    });
  }

  /**
   * Update indicator position based on closest interactable object
   * @param {Object|null} closestInteractable - The closest object or null
   */
  update(closestInteractable) {
    if (closestInteractable) {
      this._showIndicator(closestInteractable);
    } else {
      this._hideIndicator();
    }
  }

  _showIndicator(target) {
    const targetX = target.x;
    const offsetY = InteractIndicator.OFFSETS[target.type] || -16;
    const targetY = target.y + offsetY;

    const isNewTarget = !this._currentInteractiveObject ||
      this._currentInteractiveObject.gridIndex !== target.gridIndex;

    if (isNewTarget) {
      this._logEvent('SHOW', { type: target.type, x: target.x, y: target.y });
      this._currentInteractiveObject = target; // Set immediately
      this.scene.tweens.killTweensOf(this.container, null, ['alpha', 'x', 'y']);

      this.container.setVisible(true);
      this.container.setPosition(targetX, targetY);
      this.scene.tweens.add({
        targets: this.container,
        alpha: 1,
        duration: 200,
        ease: 'Power1'
      });
    } else {
      // Same target - update position
      this.container.setPosition(targetX, targetY);
      if (this.container.alpha < 1) {
        this.scene.tweens.killTweensOf(this.container, null, ['alpha']);
        this.container.setAlpha(1);
      }
    }
  }

  _hideIndicator() {
    // Si ya está oculto, no hacer nada
    if (!this.container.visible) return;

    this._logEvent('HIDE', {});
    this._currentInteractiveObject = null; // Clear immediately
    this.scene.tweens.killTweensOf(this.container, null, ['alpha']);

    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 200,
      ease: 'Power1',
      onComplete: () => {
        this.container.setVisible(false);
      }
    });
  }

  /**
   * Get current tracked object (for debugging)
   */
  get currentObject() {
    return this._currentInteractiveObject;
  }

  destroy() {
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.killTweensOf(this.innerContainer);
    this.container.destroy();
  }
}
